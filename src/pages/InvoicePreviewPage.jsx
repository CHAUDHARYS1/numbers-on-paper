import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  CaretLeft, DownloadSimple, PencilSimple, Printer, PaperPlaneTilt, EnvelopeSimple,
  DotsThree, Link as LinkIcon, Files, Trash, X, CheckCircle, Clock, FileText, Warning,
} from '@phosphor-icons/react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import Button from '@/components/ui/Button'
import InvoicePreview from '@/components/invoice/InvoicePreview'
import SendInvoiceModal from '@/components/invoice/SendInvoiceModal'
import ConfirmModal from '@/components/ui/ConfirmModal'
import styles from './InvoicePreviewPage.module.css'

const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0)
const fmtDate = (d) => !d ? '—' : new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

const STATUS_CFG = {
  paid:    { cls: 'bn-green', Icon: CheckCircle, label: 'Paid'    },
  unpaid:  { cls: 'bn-amber', Icon: Clock,       label: 'Unpaid'  },
  draft:   { cls: 'bn-gray',  Icon: FileText,    label: 'Draft'   },
  overdue: { cls: 'bn-red',   Icon: Warning,     label: 'Overdue' },
}

function MobileInvoiceDoc({ invoice }) {
  const bf = invoice.bill_from || {}
  const bt = invoice.bill_to || {}
  const items = invoice.line_items || []
  const showTax = invoice.show_tax && (invoice.tax_rate || 0) > 0
  const bizName = bf.business || bf.name || 'Your Business'
  const initial = bizName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div className="m-paper">
      <div className="m-paper-top">
        <div className="m-paper-brand">
          <div className="m-paper-logo">
            {bf.logo_url
              ? <img src={bf.logo_url} alt="" style={{ width: 24, height: 24, objectFit: 'contain' }} />
              : <span style={{ color: '#fff', fontWeight: 700, fontSize: 15, fontFamily: 'var(--font-mono)' }}>{initial}</span>
            }
          </div>
          <div>
            <div className="m-paper-biz">{bizName}</div>
            {bf.city
              ? <div className="m-paper-tag">{[bf.address, bf.city, bf.state].filter(Boolean).join(' · ')}</div>
              : bf.address
                ? <div className="m-paper-tag">{bf.address}</div>
                : null
            }
          </div>
        </div>
        <div className="m-paper-docrow">
          <div>
            <div className="m-paper-word">Invoice</div>
            <div className="m-paper-num">{invoice.invoice_number || 'INV-0000'}</div>
          </div>
        </div>
      </div>

      <div className="m-paper-body">
        <div className="m-paper-meta">
          <div>
            <div className="lab">Bill to</div>
            <div className="val">
              <strong>{bt.name || '—'}</strong>
              {bt.contact_name && <><br />{bt.contact_name}</>}
              {bt.city && <><br />{bt.city}</>}
            </div>
          </div>
          <div>
            <div className="lab">From</div>
            <div className="val">
              <strong>{bizName}</strong>
              {bf.address && <><br />{bf.address}</>}
              {(bf.city || bf.state) && <><br />{[bf.city, bf.state].filter(Boolean).join(', ')}</>}
            </div>
          </div>
          <div>
            <div className="lab">Issued</div>
            <div className="val"><strong>{fmtDate(invoice.issue_date)}</strong></div>
          </div>
          <div>
            <div className="lab">Due</div>
            <div className="val"><strong>{fmtDate(invoice.due_date)}</strong></div>
          </div>
        </div>

        <div className="m-paper-hr" />

        {items.length === 0 ? (
          <div style={{ color: 'var(--ink-4)', fontSize: 13, padding: '6px 0' }}>No line items yet.</div>
        ) : items.map((it, i) => (
          <div className="m-paper-li" key={i}>
            <div style={{ minWidth: 0 }}>
              <div className="m-paper-li-desc">{it.item || '—'}</div>
              {(it.hours || it.rate) && (
                <div className="m-paper-li-qty">{it.hours} × {fmt(it.rate)}</div>
              )}
            </div>
            <div className="m-paper-li-amt">{fmt(it.amount)}</div>
          </div>
        ))}

        <div style={{ marginTop: 16 }}>
          <div className="m-paper-tot"><span>Subtotal</span><span className="v">{fmt(invoice.subtotal)}</span></div>
          {showTax && (
            <div className="m-paper-tot">
              <span>Tax ({invoice.tax_rate}%)</span>
              <span className="v">{fmt(invoice.tax_amount)}</span>
            </div>
          )}
          <div className="m-paper-tot grand"><span>Total due</span><span className="v">{fmt(invoice.total)}</span></div>
        </div>

        {invoice.show_notes && invoice.notes && (
          <div className="m-paper-notes">
            <div className="lab">Notes &amp; terms</div>
            <p>{invoice.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function InvoicePreviewPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const [invoice,      setInvoice]      = useState(null)
  const [profile,      setProfile]      = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [downloading,  setDownloading]  = useState(false)
  const [showSend,     setShowSend]     = useState(false)
  const [actionsOpen,  setActionsOpen]  = useState(false)
  const [deleteConfirm,setDeleteConfirm]= useState(false)
  const [deleting,     setDeleting]     = useState(false)
  const [markingPaid,  setMarkingPaid]  = useState(false)

  useEffect(() => {
    supabase.from('invoices').select('*').eq('id', id).single()
      .then(({ data }) => { setInvoice(data); setLoading(false) })
  }, [id])

  useEffect(() => {
    if (!user) return
    supabase.from('profiles').select('*').eq('id', user.id).single()
      .then(({ data }) => { if (data) setProfile(data) })
  }, [user])

  const handlePrint = () => window.print()

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const { default: html2pdf } = await import('html2pdf.js')
      const el = document.getElementById('invoice-print')
      await html2pdf().set({
        margin:      [10, 10, 10, 10],
        filename:    `${invoice?.invoice_number || 'invoice'}.pdf`,
        image:       { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF:       { unit: 'mm', format: 'a4', orientation: 'portrait' },
      }).from(el).save()
      toast.success('PDF downloaded!')
    } catch {
      toast.error('Failed to generate PDF. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  const handleDuplicate = () => {
    setActionsOpen(false)
    navigate('/invoices/new', { state: { duplicate: invoice } })
  }

  const handleDelete = async () => {
    setDeleting(true)
    const { error } = await supabase.from('invoices').delete().eq('id', id)
    if (error) {
      toast.error('Failed to delete invoice.')
    } else {
      toast.success('Invoice deleted.')
      navigate('/invoices')
    }
    setDeleting(false)
    setDeleteConfirm(false)
  }

  const handleMarkPaid = async () => {
    setMarkingPaid(true)
    const { error } = await supabase.from('invoices').update({ status: 'paid' }).eq('id', id)
    if (error) {
      toast.error('Failed to update invoice.')
    } else {
      setInvoice(prev => ({ ...prev, status: 'paid' }))
      toast.success('Invoice marked as paid!')
    }
    setMarkingPaid(false)
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied!')
    } catch {
      toast.error('Could not copy link.')
    }
    setActionsOpen(false)
  }

  if (loading) return <div className={styles.loading}>Loading…</div>
  if (!invoice) return <div className={styles.loading}>Invoice not found.</div>

  const statusCfg = STATUS_CFG[invoice.status] || STATUS_CFG.draft
  const StatusIcon = statusCfg.Icon
  const canPay = ['unpaid', 'overdue'].includes(invoice.status)

  const daysUntil = invoice.due_date
    ? Math.round((new Date(invoice.due_date + 'T00:00:00') - new Date()) / 86400000)
    : null

  const bannerSub = invoice.status === 'paid'
    ? 'Paid in full'
    : invoice.status === 'overdue'
      ? `${Math.abs(daysUntil ?? 0)} days past due`
      : invoice.status === 'unpaid' && daysUntil !== null
        ? `Due in ${daysUntil} day${daysUntil !== 1 ? 's' : ''} · ${fmtDate(invoice.due_date)}`
        : 'Not yet sent'

  return (
    <>
      {/* ── Mobile ─────────────────────────────────────────────── */}
      <div className="m-only">
        <div className="m-head">
          <button className="m-back" onClick={() => navigate('/invoices')}>
            <CaretLeft size={19} /> Back
          </button>
          <div className="m-head-top" style={{ marginTop: 4 }}>
            <div style={{ minWidth: 0 }}>
              <h1 className="m-title">{invoice.invoice_number}</h1>
            </div>
            <button
              className="m-iconbtn"
              onClick={() => setActionsOpen(true)}
              aria-label="More actions"
            >
              <DotsThree size={22} weight="bold" />
            </button>
          </div>
          {invoice.bill_to?.name && (
            <p className="m-sub">Issued to {invoice.bill_to.name}</p>
          )}
        </div>

        <div className={`m-body ${styles.mobileBody}`}>
          {/* Status banner */}
          <div className={`m-banner ${statusCfg.cls}`}>
            <StatusIcon size={22} weight="fill" />
            <div style={{ flex: 1 }}>
              <div className="m-banner-t">{statusCfg.label} · {fmt(invoice.total)}</div>
              <div className="m-banner-s">{bannerSub}</div>
            </div>
          </div>

          {/* Mobile invoice document */}
          <MobileInvoiceDoc invoice={invoice} />
        </div>

        {/* Bottom action bar */}
        <div className={styles.mobileActionbar}>
          <button className="m-btn m-btn--ghost" onClick={() => navigate(`/invoices/${id}/edit`)}>
            <PencilSimple size={18} /> Edit
          </button>
          {canPay
            ? <button className="m-btn m-btn--primary" onClick={handleMarkPaid} disabled={markingPaid}>
                <CheckCircle size={18} /> {markingPaid ? 'Saving…' : 'Mark paid'}
              </button>
            : <button className="m-btn m-btn--primary" onClick={() => setShowSend(true)}>
                <PaperPlaneTilt size={18} /> Send
              </button>
          }
        </div>

        {/* Actions bottom sheet */}
        {actionsOpen && (
          <>
            <div className="m-scrim" onClick={() => setActionsOpen(false)} />
            <div className="m-sheet">
              <div className="m-sheet-grip" />
              <div className="m-sheet-h">
                <h3>Invoice actions</h3>
                <button
                  className="m-iconbtn m-iconbtn--ghost"
                  onClick={() => setActionsOpen(false)}
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>
              <div className={`m-sheet-body ${styles.actList}`}>
                <button className={styles.actRow} onClick={handleCopyLink}>
                  <span className={styles.actRowIc}><LinkIcon size={22} /></span>
                  Copy share link
                </button>
                <button className={styles.actRow} onClick={() => { setActionsOpen(false); handlePrint() }}>
                  <span className={styles.actRowIc}><Printer size={22} /></span>
                  Print / Save PDF
                </button>
                <button className={styles.actRow} onClick={handleDuplicate}>
                  <span className={styles.actRowIc}><Files size={22} /></span>
                  Duplicate
                </button>
                <button
                  className={`${styles.actRow} ${styles.actRowDanger}`}
                  onClick={() => { setActionsOpen(false); setDeleteConfirm(true) }}
                >
                  <span className={`${styles.actRowIc} ${styles.actRowIcDanger}`}><Trash size={22} /></span>
                  Delete invoice
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Desktop ─────────────────────────────────────────────── */}
      <div className={`d-only ${styles.page}`}>
        <div className={styles.toolbar}>
          <button className={styles.back} onClick={() => navigate('/invoices')}>
            <CaretLeft size={16} /> Invoices
          </button>
          <div className={styles.actions}>
            <Link to={`/invoices/${id}/edit`}>
              <Button variant="secondary" size="md" icon={<PencilSimple size={15} />}>Edit</Button>
            </Link>
            <Link to={`/invoices/${id}/email-preview`}>
              <Button variant="secondary" size="md" icon={<EnvelopeSimple size={15} />}>Preview email</Button>
            </Link>
            <Button variant="secondary" size="md" icon={<Printer size={15} />} onClick={handlePrint}>
              Print
            </Button>
            <Button variant="secondary" size="md" icon={<DownloadSimple size={15} />} loading={downloading} onClick={handleDownload}>
              Download PDF
            </Button>
            <Button variant="primary" size="md" icon={<PaperPlaneTilt size={15} />} onClick={() => setShowSend(true)}>
              Send to client
            </Button>
          </div>
        </div>
        <div className={styles.previewWrap}>
          <InvoicePreview data={invoice} id="invoice-print" />
        </div>
      </div>

      {/* ── Shared modals ───────────────────────────────────────── */}
      {showSend && (
        <SendInvoiceModal
          invoice={invoice}
          profile={profile}
          onClose={() => setShowSend(false)}
        />
      )}
      {deleteConfirm && (
        <ConfirmModal
          isOpen
          title="Delete Invoice"
          message={`Delete "${invoice.invoice_number}"? This cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setDeleteConfirm(false)}
          loading={deleting}
        />
      )}
    </>
  )
}
