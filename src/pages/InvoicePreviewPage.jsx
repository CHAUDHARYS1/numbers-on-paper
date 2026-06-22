import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, DownloadSimple, PencilSimple, Printer, PaperPlaneTilt, EnvelopeSimple,
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

const STATUS_CFG = {
  paid:    { cls: 'bn-green', Icon: CheckCircle, label: 'Paid',    sub: 'Paid in full' },
  unpaid:  { cls: 'bn-amber', Icon: Clock,       label: 'Unpaid',  sub: 'Payment due' },
  draft:   { cls: 'bn-gray',  Icon: FileText,    label: 'Draft',   sub: 'Not yet sent' },
  overdue: { cls: 'bn-red',   Icon: Warning,     label: 'Overdue', sub: 'Past due date' },
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

  return (
    <>
      {/* ── Mobile ─────────────────────────────────────────────── */}
      <div className="m-only">
        <div className="m-head">
          <div className="m-head-top">
            <button className="m-back" onClick={() => navigate('/invoices')}>
              <ArrowLeft size={19} /> Back
            </button>
            <button
              className="m-iconbtn"
              onClick={() => setActionsOpen(true)}
              aria-label="More actions"
            >
              <DotsThree size={22} weight="bold" />
            </button>
          </div>
          <h1 className="m-title" style={{ marginTop: 6 }}>{invoice.invoice_number}</h1>
          {invoice.bill_to?.name && (
            <p className="m-sub">Issued to {invoice.bill_to.name}</p>
          )}
        </div>

        <div className={`m-body ${styles.mobileBody}`}>
          {/* Status banner */}
          <div className={`m-banner ${statusCfg.cls} ${styles.statusBanner}`}>
            <StatusIcon size={22} weight="fill" />
            <div>
              <div className="m-banner-t">{statusCfg.label} · {fmt(invoice.total)}</div>
              <div className="m-banner-s">{statusCfg.sub}</div>
            </div>
          </div>

          {/* Invoice document */}
          <div className={styles.mobileDoc}>
            <InvoicePreview data={invoice} />
          </div>
        </div>

        {/* Bottom action bar */}
        <div className={styles.mobileActionbar}>
          <button className="m-btn m-btn--ghost" onClick={() => navigate(`/invoices/${id}/edit`)}>
            <PencilSimple size={18} /> Edit
          </button>
          <button className="m-btn m-btn--primary" onClick={() => setShowSend(true)}>
            <PaperPlaneTilt size={18} /> Send
          </button>
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
                  <span className={styles.actRowIc}><LinkIcon size={20} /></span>
                  Copy share link
                </button>
                <button className={styles.actRow} onClick={() => { setActionsOpen(false); handlePrint() }}>
                  <span className={styles.actRowIc}><Printer size={20} /></span>
                  Print / Save PDF
                </button>
                <button className={styles.actRow} onClick={handleDuplicate}>
                  <span className={styles.actRowIc}><Files size={20} /></span>
                  Duplicate
                </button>
                <button
                  className={`${styles.actRow} ${styles.actRowDanger}`}
                  onClick={() => { setActionsOpen(false); setDeleteConfirm(true) }}
                >
                  <span className={`${styles.actRowIc} ${styles.actRowIcDanger}`}><Trash size={20} /></span>
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
            <ArrowLeft size={16} /> Invoices
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
