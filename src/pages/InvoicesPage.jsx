import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Search, Trash2, Copy, CheckCircle, Printer } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import PageHeader from '@/components/layout/PageHeader'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { Card, CardBody } from '@/components/ui/Card'
import ConfirmModal from '@/components/ui/ConfirmModal'
import styles from './InvoicesPage.module.css'

const STATUS_FILTERS = ['all', 'draft', 'unpaid', 'paid', 'overdue']

function fmt(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0)
}

export default function InvoicesPage() {
  const { user } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [invoices,   setInvoices]   = useState([])
  const [loading,    setLoading]    = useState(true)
  const [search,     setSearch]     = useState('')
  const [status,     setStatus]     = useState('all')
  const [client,     setClient]     = useState('all')
  const [invoiceToDelete, setInvoiceToDelete] = useState(null)
  const [deleting,        setDeleting]        = useState(false)
  const [markingPaidId,   setMarkingPaidId]   = useState(null)

  useEffect(() => {
    if (!user) return
    supabase
      .from('invoices')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setInvoices(data || []); setLoading(false) })
  }, [user])

  const handleMarkPaid = async (inv) => {
    setMarkingPaidId(inv.id)
    const { error } = await supabase
      .from('invoices')
      .update({ status: 'paid' })
      .eq('id', inv.id)
    setMarkingPaidId(null)
    if (error) {
      toast.error('Failed to update invoice.')
    } else {
      setInvoices(prev => prev.map(i => i.id === inv.id ? { ...i, status: 'paid' } : i))
      toast.success(`${inv.invoice_number} marked as paid!`)
    }
  }

  const handleDuplicate = (inv) => {
    navigate('/invoices/new', { state: { duplicate: inv } })
  }

  const handleDelete = async () => {
    if (!invoiceToDelete) return
    setDeleting(true)
    const { error } = await supabase.from('invoices').delete().eq('id', invoiceToDelete.id)
    setDeleting(false)
    setInvoiceToDelete(null)
    if (error) {
      toast.error('Failed to delete invoice.')
    } else {
      setInvoices(prev => prev.filter(inv => inv.id !== invoiceToDelete.id))
      toast.success('Invoice deleted.')
    }
  }

  const clients = [...new Map(
    invoices
      .filter(inv => inv.bill_to?.name)
      .map(inv => [inv.bill_to.name, inv.bill_to.name])
  ).values()].sort()

  const filtered = invoices.filter(inv => {
    const matchStatus = status === 'all' || inv.status === status
    const matchClient = client === 'all' || inv.bill_to?.name === client
    const q = search.toLowerCase()
    const matchSearch = !q ||
      inv.invoice_number?.toLowerCase().includes(q) ||
      inv.bill_to?.name?.toLowerCase().includes(q) ||
      inv.bill_to?.organization?.toLowerCase().includes(q)
    return matchStatus && matchClient && matchSearch
  })

  return (
    <div>
      <ConfirmModal
        isOpen={!!invoiceToDelete}
        title="Delete invoice?"
        message={`${invoiceToDelete?.invoice_number}${invoiceToDelete?.bill_to?.name ? ` · ${invoiceToDelete.bill_to.name}` : ''} will be permanently deleted. This cannot be undone.`}
        confirmLabel="Delete invoice"
        onConfirm={handleDelete}
        onCancel={() => setInvoiceToDelete(null)}
        loading={deleting}
      />
      <PageHeader
        title="Invoices"
        description="Create, manage, and track all your invoices"
        action={
          <Link to="/invoices/new">
            <Button variant="primary" size="md" icon={<Plus size={16} />}>New invoice</Button>
          </Link>
        }
      />

      {/* Filter bar */}
      <div className={styles.filterBar}>
        <div className={styles.searchWrap}>
          <Search size={15} className={styles.searchIcon} aria-hidden="true" />
          <input
            className={styles.searchInput}
            placeholder="Search by invoice # or client…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {clients.length > 0 && (
          <select
            className={styles.clientSelect}
            value={client}
            onChange={e => setClient(e.target.value)}
            aria-label="Filter by client"
          >
            <option value="all">All clients</option>
            {clients.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}
        <div className={styles.statusTabs} role="tablist" aria-label="Filter by status">
          {STATUS_FILTERS.map(s => (
            <button
              key={s}
              role="tab"
              aria-selected={status === s}
              className={[styles.statusTab, status === s ? styles.statusTabActive : ''].join(' ')}
              onClick={() => setStatus(s)}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <CardBody style={{ padding: 0 }}>
          {loading ? (
            <div className={styles.skeletonWrap}>
              {[1,2,3,4].map(n => <div key={n} className={styles.skeleton} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className={styles.empty}>
              <p className={styles.emptyTitle}>No invoices found</p>
              <p className={styles.emptySub}>{search || status !== 'all' || client !== 'all' ? 'Try adjusting your filters.' : 'Create your first invoice to get started.'}</p>
              {!search && status === 'all' && client === 'all' && (
                <Link to="/invoices/new">
                  <Button variant="primary" size="md" icon={<Plus size={15} />}>New invoice</Button>
                </Link>
              )}
            </div>
          ) : (
            <>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Client</th>
                  <th className={styles.hideSmall}>Issue date</th>
                  <th className={styles.hideSmall}>Due date</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(inv => (
                  <tr key={inv.id} className={styles.tableRow}>
                    <td><span className={styles.invNum}>{inv.invoice_number}</span></td>
                    <td>
                      <div className={styles.clientName}>{inv.bill_to?.name || '—'}</div>
                      {inv.bill_to?.organization && <div className={styles.clientOrg}>{inv.bill_to.organization}</div>}
                    </td>
                    <td className={[styles.dateCell, styles.hideSmall].join(' ')}>{inv.issue_date || '—'}</td>
                    <td className={[styles.dateCell, styles.hideSmall].join(' ')}>{inv.due_date || '—'}</td>
                    <td><Badge variant={inv.status} /></td>
                    <td style={{ textAlign: 'right' }} className={styles.amountCell}>{fmt(inv.total)}</td>
                    <td className={styles.actions}>
                      {['unpaid', 'overdue'].includes(inv.status) && (
                        <button
                          className={styles.markPaidBtn}
                          onClick={() => handleMarkPaid(inv)}
                          disabled={markingPaidId === inv.id}
                          aria-label="Mark as paid"
                          title="Mark as paid"
                        >
                          <CheckCircle size={14} />
                          {markingPaidId === inv.id ? 'Saving…' : 'Mark paid'}
                        </button>
                      )}
                      <Link to={`/invoices/${inv.id}/edit`} className={styles.actionLink}>Edit</Link>
                      <Link to={`/invoices/${inv.id}/preview`} className={styles.actionLink}>Preview</Link>
                      <Link to={`/invoices/${inv.id}/preview`} className={styles.iconBtn} aria-label="Print invoice" title="Print">
                        <Printer size={14} />
                      </Link>
                      <button className={styles.iconBtn} onClick={() => handleDuplicate(inv)} aria-label="Duplicate invoice" title="Duplicate">
                        <Copy size={14} />
                      </button>
                      <button className={styles.deleteBtn} onClick={() => setInvoiceToDelete(inv)} aria-label="Delete invoice" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile cards */}
            <div className={styles.mobileCards}>
              {filtered.map(inv => (
                <div key={inv.id} className={styles.mobileCard}>
                  <div className={styles.mobileCardTop}>
                    <span className={styles.invNum}>{inv.invoice_number}</span>
                    <Badge variant={inv.status} />
                  </div>
                  <div className={styles.mobileCardClient}>{inv.bill_to?.name || '—'}</div>
                  {inv.bill_to?.organization && <div className={styles.clientOrg}>{inv.bill_to.organization}</div>}
                  <div className={styles.mobileCardMeta}>
                    {inv.due_date && <span>Due {inv.due_date}</span>}
                    <span className={styles.mobileCardAmount}>{fmt(inv.total)}</span>
                  </div>
                  {['unpaid', 'overdue'].includes(inv.status) && (
                    <button
                      className={styles.mobileMarkPaidBtn}
                      onClick={() => handleMarkPaid(inv)}
                      disabled={markingPaidId === inv.id}
                    >
                      <CheckCircle size={15} />
                      {markingPaidId === inv.id ? 'Saving…' : 'Mark as paid'}
                    </button>
                  )}
                  <div className={styles.mobileCardActions}>
                    <Link to={`/invoices/${inv.id}/edit`} className={styles.actionLink}>Edit</Link>
                    <Link to={`/invoices/${inv.id}/preview`} className={styles.actionLink}>Preview</Link>
                    <button className={styles.iconBtn} onClick={() => handleDuplicate(inv)} aria-label="Duplicate invoice" title="Duplicate">
                      <Copy size={14} />
                    </button>
                    <button className={styles.deleteBtn} onClick={() => setInvoiceToDelete(inv)} aria-label="Delete invoice" title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            </>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
