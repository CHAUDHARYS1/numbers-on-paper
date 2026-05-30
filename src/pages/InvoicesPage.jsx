import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import PageHeader from '@/components/layout/PageHeader'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { Card, CardBody } from '@/components/ui/Card'
import styles from './InvoicesPage.module.css'

const STATUS_FILTERS = ['all', 'draft', 'unpaid', 'paid', 'overdue']

function fmt(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0)
}

export default function InvoicesPage() {
  const { user } = useAuth()
  const toast = useToast()
  const [invoices,   setInvoices]   = useState([])
  const [loading,    setLoading]    = useState(true)
  const [search,     setSearch]     = useState('')
  const [status,     setStatus]     = useState('all')
  const [confirmId,  setConfirmId]  = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    if (!user) return
    supabase
      .from('invoices')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setInvoices(data || []); setLoading(false) })
  }, [user])

  const handleDelete = async (id) => {
    setDeletingId(id)
    const { error } = await supabase.from('invoices').delete().eq('id', id)
    setDeletingId(null)
    setConfirmId(null)
    if (error) {
      toast.error('Failed to delete invoice.')
    } else {
      setInvoices(prev => prev.filter(inv => inv.id !== id))
      toast.success('Invoice deleted.')
    }
  }

  const filtered = invoices.filter(inv => {
    const matchStatus = status === 'all' || inv.status === status
    const q = search.toLowerCase()
    const matchSearch = !q ||
      inv.invoice_number?.toLowerCase().includes(q) ||
      inv.bill_to?.name?.toLowerCase().includes(q) ||
      inv.bill_to?.organization?.toLowerCase().includes(q)
    return matchStatus && matchSearch
  })

  return (
    <div>
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
              <p className={styles.emptySub}>{search || status !== 'all' ? 'Try adjusting your filters.' : 'Create your first invoice to get started.'}</p>
              {!search && status === 'all' && (
                <Link to="/invoices/new">
                  <Button variant="primary" size="md" icon={<Plus size={15} />}>New invoice</Button>
                </Link>
              )}
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Client</th>
                  <th>Issue date</th>
                  <th>Due date</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(inv => (
                  <tr key={inv.id} className={styles.tableRow}>
                    <td>
                      <span className={styles.invNum}>{inv.invoice_number}</span>
                    </td>
                    <td>
                      <div className={styles.clientName}>{inv.bill_to?.name || '—'}</div>
                      {inv.bill_to?.organization && (
                        <div className={styles.clientOrg}>{inv.bill_to.organization}</div>
                      )}
                    </td>
                    <td className={styles.dateCell}>{inv.issue_date || '—'}</td>
                    <td className={styles.dateCell}>{inv.due_date || '—'}</td>
                    <td><Badge variant={inv.status} /></td>
                    <td style={{ textAlign: 'right' }} className={styles.amountCell}>{fmt(inv.total)}</td>
                    <td className={styles.actions}>
                      {confirmId === inv.id ? (
                        <>
                          <span className={styles.confirmText}>Delete?</span>
                          <button
                            className={styles.confirmBtn}
                            onClick={() => handleDelete(inv.id)}
                            disabled={deletingId === inv.id}
                          >
                            {deletingId === inv.id ? 'Deleting…' : 'Yes'}
                          </button>
                          <button className={styles.cancelBtn} onClick={() => setConfirmId(null)}>
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <Link to={`/invoices/${inv.id}/edit`} className={styles.actionLink}>Edit</Link>
                          <Link to={`/invoices/${inv.id}/preview`} className={styles.actionLink}>Preview</Link>
                          <button
                            className={styles.deleteBtn}
                            onClick={() => setConfirmId(inv.id)}
                            aria-label="Delete invoice"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
