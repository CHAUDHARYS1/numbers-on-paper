import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Search, Trash2, Copy, CheckCircle, Printer, X, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'
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
const STATUS_ORDER   = { draft: 0, unpaid: 1, overdue: 2, paid: 3 }

function fmt(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0)
}

export default function InvoicesPage() {
  const { user } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [invoices,        setInvoices]        = useState([])
  const [loading,         setLoading]         = useState(true)
  const [search,          setSearch]          = useState('')
  const [status,          setStatus]          = useState('all')
  const [client,          setClient]          = useState('all')
  const [issueDateFilter, setIssueDateFilter] = useState('')
  const [dueDateFilter,   setDueDateFilter]   = useState('')
  const [amountFilter,    setAmountFilter]    = useState(null)
  const [sortBy,          setSortBy]          = useState('created_at')
  const [sortDir,         setSortDir]         = useState('desc')
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
    const { error } = await supabase.from('invoices').update({ status: 'paid' }).eq('id', inv.id)
    setMarkingPaidId(null)
    if (error) {
      toast.error('Failed to update invoice.')
    } else {
      setInvoices(prev => prev.map(i => i.id === inv.id ? { ...i, status: 'paid' } : i))
      toast.success(`${inv.invoice_number} marked as paid!`)
    }
  }

  const handleDuplicate = (inv) => navigate('/invoices/new', { state: { duplicate: inv } })

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

  const clearAllFilters = () => {
    setSearch('')
    setStatus('all')
    setClient('all')
    setIssueDateFilter('')
    setDueDateFilter('')
    setAmountFilter(null)
  }

  const hasActiveFilters = search || status !== 'all' || client !== 'all' || issueDateFilter || dueDateFilter || amountFilter !== null

  const toggleStatus    = (s) => setStatus(prev => prev === s ? 'all' : s)
  const toggleClient    = (c) => setClient(prev => prev === c ? 'all' : c)
  const toggleIssueDate = (d) => setIssueDateFilter(prev => prev === d ? '' : d)
  const toggleDueDate   = (d) => setDueDateFilter(prev => prev === d ? '' : d)
  const toggleAmount    = (a) => setAmountFilter(prev => prev === Number(a) ? null : Number(a))

  const toggleSort = (col) => {
    if (sortBy === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(col)
      setSortDir('asc')
    }
  }

  const SortIcon = ({ col }) => {
    if (sortBy !== col) return <ArrowUpDown size={12} className={styles.sortIcon} />
    return sortDir === 'asc'
      ? <ArrowUp size={12} className={styles.sortIconActive} />
      : <ArrowDown size={12} className={styles.sortIconActive} />
  }

  const clients = [...new Map(
    invoices.filter(inv => inv.bill_to?.name).map(inv => [inv.bill_to.name, inv.bill_to.name])
  ).values()].sort()

  const filtered = invoices.filter(inv => {
    const matchStatus    = status === 'all' || inv.status === status
    const matchClient    = client === 'all' || inv.bill_to?.name === client
    const matchIssueDate = !issueDateFilter || inv.issue_date === issueDateFilter
    const matchDueDate   = !dueDateFilter   || inv.due_date   === dueDateFilter
    const matchAmount    = amountFilter === null || Number(inv.total) === amountFilter
    const q = search.toLowerCase()
    const matchSearch = !q ||
      inv.invoice_number?.toLowerCase().includes(q) ||
      inv.bill_to?.name?.toLowerCase().includes(q) ||
      inv.bill_to?.organization?.toLowerCase().includes(q)
    return matchStatus && matchClient && matchSearch && matchIssueDate && matchDueDate && matchAmount
  })

  const sorted = [...filtered].sort((a, b) => {
    let av, bv
    switch (sortBy) {
      case 'invoice_number': av = a.invoice_number || ''; bv = b.invoice_number || ''; break
      case 'client':         av = a.bill_to?.name || ''; bv = b.bill_to?.name || ''; break
      case 'issue_date':     av = a.issue_date || '';    bv = b.issue_date || '';    break
      case 'due_date':       av = a.due_date || '';      bv = b.due_date || '';      break
      case 'status':         av = STATUS_ORDER[a.status] ?? 0; bv = STATUS_ORDER[b.status] ?? 0; break
      case 'total':          av = Number(a.total) || 0;  bv = Number(b.total) || 0;  break
      default:               av = a.created_at || '';    bv = b.created_at || '';    break
    }
    if (av < bv) return sortDir === 'asc' ? -1 : 1
    if (av > bv) return sortDir === 'asc' ? 1 : -1
    return 0
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
            {clients.map(c => <option key={c} value={c}>{c}</option>)}
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

      {/* Active filter chips for date / amount filters */}
      {(issueDateFilter || dueDateFilter || amountFilter !== null) && (
        <div className={styles.activeFilters}>
          {issueDateFilter && (
            <button className={styles.filterChip} onClick={() => setIssueDateFilter('')}>
              Issue: {issueDateFilter} <X size={11} />
            </button>
          )}
          {dueDateFilter && (
            <button className={styles.filterChip} onClick={() => setDueDateFilter('')}>
              Due: {dueDateFilter} <X size={11} />
            </button>
          )}
          {amountFilter !== null && (
            <button className={styles.filterChip} onClick={() => setAmountFilter(null)}>
              Amount: {fmt(amountFilter)} <X size={11} />
            </button>
          )}
          <button className={styles.clearAllBtn} onClick={clearAllFilters}>Clear all</button>
        </div>
      )}

      <Card>
        <CardBody style={{ padding: 0 }}>
          {loading ? (
            <div className={styles.skeletonWrap}>
              {[1,2,3,4].map(n => <div key={n} className={styles.skeleton} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className={styles.empty}>
              <p className={styles.emptyTitle}>No invoices found</p>
              <p className={styles.emptySub}>
                {hasActiveFilters ? 'Try adjusting your filters.' : 'Create your first invoice to get started.'}
              </p>
              {hasActiveFilters
                ? <Button variant="secondary" size="md" onClick={clearAllFilters}>Clear filters</Button>
                : <Link to="/invoices/new"><Button variant="primary" size="md" icon={<Plus size={15} />}>New invoice</Button></Link>
              }
            </div>
          ) : (
            <>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>
                    <button className={styles.sortBtn} onClick={() => toggleSort('invoice_number')}>
                      Invoice # <SortIcon col="invoice_number" />
                    </button>
                  </th>
                  <th>
                    <button className={styles.sortBtn} onClick={() => toggleSort('client')}>
                      Client <SortIcon col="client" />
                    </button>
                  </th>
                  <th className={styles.hideSmall}>
                    <button className={styles.sortBtn} onClick={() => toggleSort('issue_date')}>
                      Issue date <SortIcon col="issue_date" />
                    </button>
                  </th>
                  <th className={styles.hideSmall}>
                    <button className={styles.sortBtn} onClick={() => toggleSort('due_date')}>
                      Due date <SortIcon col="due_date" />
                    </button>
                  </th>
                  <th>
                    <button className={styles.sortBtn} onClick={() => toggleSort('status')}>
                      Status <SortIcon col="status" />
                    </button>
                  </th>
                  <th style={{ textAlign: 'right' }}>
                    <button className={[styles.sortBtn, styles.sortBtnRight].join(' ')} onClick={() => toggleSort('total')}>
                      Amount <SortIcon col="total" />
                    </button>
                  </th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sorted.map(inv => (
                  <tr key={inv.id} className={styles.tableRow}>

                    <td><span className={styles.invNum}>{inv.invoice_number}</span></td>

                    <td>
                      {inv.bill_to?.name ? (
                        <button
                          className={styles.filterCell}
                          onClick={() => toggleClient(inv.bill_to.name)}
                          title="Filter by this client"
                        >
                          <div className={[styles.clientName, client === inv.bill_to.name ? styles.activeCell : ''].join(' ')}>
                            {inv.bill_to.name}
                          </div>
                          {inv.bill_to.organization && <div className={styles.clientOrg}>{inv.bill_to.organization}</div>}
                        </button>
                      ) : <span>—</span>}
                    </td>

                    <td className={styles.hideSmall}>
                      {inv.issue_date ? (
                        <button
                          className={[styles.filterCell, styles.dateCell, issueDateFilter === inv.issue_date ? styles.activeCell : ''].join(' ')}
                          onClick={() => toggleIssueDate(inv.issue_date)}
                          title="Filter by this date"
                        >
                          {inv.issue_date}
                        </button>
                      ) : <span className={styles.dateCell}>—</span>}
                    </td>

                    <td className={styles.hideSmall}>
                      {inv.due_date ? (
                        <button
                          className={[styles.filterCell, styles.dateCell, dueDateFilter === inv.due_date ? styles.activeCell : ''].join(' ')}
                          onClick={() => toggleDueDate(inv.due_date)}
                          title="Filter by this date"
                        >
                          {inv.due_date}
                        </button>
                      ) : <span className={styles.dateCell}>—</span>}
                    </td>

                    <td>
                      <button
                        className={styles.filterCell}
                        onClick={() => toggleStatus(inv.status)}
                        title="Filter by this status"
                      >
                        <Badge variant={inv.status} />
                      </button>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <button
                        className={[styles.filterCell, styles.amountCell, amountFilter === Number(inv.total) ? styles.activeCell : ''].join(' ')}
                        style={{ textAlign: 'right' }}
                        onClick={() => toggleAmount(inv.total)}
                        title="Filter by this amount"
                      >
                        {fmt(inv.total)}
                      </button>
                    </td>

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
                    <button className={styles.filterCell} onClick={() => toggleStatus(inv.status)} title="Filter by this status">
                      <Badge variant={inv.status} />
                    </button>
                  </div>
                  {inv.bill_to?.name
                    ? <button className={[styles.filterCell, styles.mobileCardClient].join(' ')} onClick={() => toggleClient(inv.bill_to.name)}>{inv.bill_to.name}</button>
                    : <div className={styles.mobileCardClient}>—</div>
                  }
                  {inv.bill_to?.organization && <div className={styles.clientOrg}>{inv.bill_to.organization}</div>}
                  <div className={styles.mobileCardMeta}>
                    {inv.due_date
                      ? <button className={styles.filterCell} onClick={() => toggleDueDate(inv.due_date)}>Due {inv.due_date}</button>
                      : <span />
                    }
                    <button className={[styles.filterCell, styles.mobileCardAmount].join(' ')} onClick={() => toggleAmount(inv.total)}>
                      {fmt(inv.total)}
                    </button>
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
