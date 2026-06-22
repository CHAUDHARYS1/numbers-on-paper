import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Plus, MagnifyingGlass, Trash, Copy, CheckCircle,
  Eye, ArrowUp, ArrowDown, ArrowsDownUp
} from '@phosphor-icons/react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import Badge from '@/components/ui/Badge'
import ConfirmModal from '@/components/ui/ConfirmModal'
import styles from './InvoicesPage.module.css'

const TABS = ['all', 'draft', 'unpaid', 'overdue', 'paid']
const TAB_LABELS = { all: 'All', draft: 'Drafts', unpaid: 'Due', overdue: 'Overdue', paid: 'Paid' }
const STATUS_ORDER = { draft: 0, unpaid: 1, overdue: 2, paid: 3 }

const _today = new Date(); _today.setHours(0, 0, 0, 0)
function effStatus(inv) {
  if (inv.status === 'unpaid' && inv.due_date && new Date(inv.due_date + 'T00:00:00') < _today) return 'overdue'
  return inv.status
}

function fmt(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0)
}
function fmtDate(d) {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
function fmtDateShort(d) {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function MiniAvatar({ name }) {
  const initials = (name || '?').split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
  const colors = ['#2563EB','#15803d','#7c3aed','#c2410c','#be185d','#0f766e']
  const color = colors[(name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length]
  return <div className="m-row-ava" style={{ background: color }}>{initials}</div>
}

export default function InvoicesPage() {
  const { user } = useAuth()
  const toast    = useToast()
  const navigate = useNavigate()

  const [invoices,      setInvoices]      = useState([])
  const [loading,       setLoading]       = useState(true)
  const [search,        setSearch]        = useState('')
  const [tab,           setTab]           = useState('all')
  const [sortBy,        setSortBy]        = useState('created_at')
  const [sortDir,       setSortDir]       = useState('desc')
  const [toDelete,      setToDelete]      = useState(null)
  const [deleting,      setDeleting]      = useState(false)
  const [markingPaidId, setMarkingPaidId] = useState(null)

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
    if (error) { toast.error('Failed to update invoice.') }
    else {
      setInvoices(prev => prev.map(i => i.id === inv.id ? { ...i, status: 'paid' } : i))
      toast.success(`${inv.invoice_number} marked as paid!`)
    }
  }

  const handleDuplicate = (inv) => navigate('/invoices/new', { state: { duplicate: inv } })

  const handleDelete = async () => {
    if (!toDelete) return
    setDeleting(true)
    const { error } = await supabase.from('invoices').delete().eq('id', toDelete.id)
    setDeleting(false)
    setToDelete(null)
    if (error) { toast.error('Failed to delete invoice.') }
    else {
      setInvoices(prev => prev.filter(i => i.id !== toDelete.id))
      toast.success('Invoice deleted.')
    }
  }

  const toggleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(col); setSortDir('asc') }
  }

  const counts = TABS.reduce((acc, t) => {
    acc[t] = t === 'all' ? invoices.length : invoices.filter(i => effStatus(i) === t).length
    return acc
  }, {})

  const filtered = invoices.filter(inv => {
    const es = effStatus(inv)
    const matchTab = tab === 'all' || es === tab
    const q = search.toLowerCase()
    const matchSearch = !q ||
      (inv.invoice_number || '').toLowerCase().includes(q) ||
      (inv.bill_to?.name || '').toLowerCase().includes(q)
    return matchTab && matchSearch
  })

  const sorted = [...filtered].sort((a, b) => {
    let av, bv
    switch (sortBy) {
      case 'invoice_number': av = a.invoice_number || ''; bv = b.invoice_number || ''; break
      case 'client':         av = a.bill_to?.name || '';  bv = b.bill_to?.name || '';  break
      case 'issue_date':     av = a.issue_date || '';     bv = b.issue_date || '';     break
      case 'due_date':       av = a.due_date || '';       bv = b.due_date || '';       break
      case 'status':         av = STATUS_ORDER[effStatus(a)] ?? 0; bv = STATUS_ORDER[effStatus(b)] ?? 0; break
      case 'total':          av = Number(a.total) || 0;   bv = Number(b.total) || 0;  break
      default:               av = a.created_at || '';     bv = b.created_at || '';     break
    }
    if (av < bv) return sortDir === 'asc' ? -1 : 1
    if (av > bv) return sortDir === 'asc' ? 1 : -1
    return 0
  })

  const SortIcon = ({ col }) => {
    if (sortBy !== col) return <ArrowsDownUp size={11} className={styles.sortIcon} />
    return sortDir === 'asc'
      ? <ArrowUp size={11} className={styles.sortIconOn} />
      : <ArrowDown size={11} className={styles.sortIconOn} />
  }

  return (
    <div>
      <ConfirmModal
        isOpen={!!toDelete}
        title="Delete invoice?"
        message={`${toDelete?.invoice_number}${toDelete?.bill_to?.name ? ` · ${toDelete.bill_to.name}` : ''} will be permanently deleted. This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
        loading={deleting}
      />

      {/* ── Mobile layout ───────────────────────────────────────── */}
      <div className="m-only">
        {/* Mobile header */}
        <div className="m-head">
          <div className="m-head-top">
            <div>
              <div className="m-eyebrow">Invoices</div>
              <h1 className="m-title">Invoices</h1>
              <p className="m-sub">Create, manage, and track every invoice.</p>
            </div>
            <Link to="/invoices/new" className="m-iconbtn m-iconbtn--accent" aria-label="New invoice">
              <Plus size={22} weight="bold" />
            </Link>
          </div>

          {/* Search */}
          <div className="m-search" style={{ marginTop: 14 }}>
            <MagnifyingGlass size={18} />
            <input
              placeholder="Search invoice # or client…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              aria-label="Search invoices"
            />
          </div>

          {/* Filter chips */}
          <div className="m-chips" style={{ marginTop: 12 }}>
            {TABS.map(t => (
              <button
                key={t}
                className={['m-chip', tab === t ? 'm-chip--on' : ''].join(' ')}
                onClick={() => setTab(t)}
              >
                {TAB_LABELS[t]}
                <span className="m-chip-ct">{counts[t]}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="m-body">
          {loading ? (
            <div className={styles.mSkeleton}>
              {[1,2,3,4].map(n => <div key={n} className={styles.mSkeletonRow} />)}
            </div>
          ) : sorted.length === 0 ? (
            <div className="m-card m-card--pad">
              <div className="m-empty">
                <MagnifyingGlass size={36} style={{ color: 'var(--ink-4)' }} />
                <div className="m-empty-t">No invoices found</div>
                <div className="m-empty-s">
                  {search || tab !== 'all' ? 'Try adjusting your filters.' : 'Create your first invoice.'}
                </div>
                {search || tab !== 'all'
                  ? <button className="m-btn m-btn--ghost" style={{ maxWidth: 200, margin: '0 auto' }}
                      onClick={() => { setSearch(''); setTab('all') }}>
                      Clear filters
                    </button>
                  : <Link to="/invoices/new" className="m-btn m-btn--primary" style={{ maxWidth: 200, margin: '0 auto' }}>
                      <Plus size={18} weight="bold" /> New invoice
                    </Link>
                }
              </div>
            </div>
          ) : (
            <div className="m-list m-card">
              {sorted.map(inv => {
                const clientName = inv.bill_to?.name || '—'
                const dateLabel = inv.due_date && ['unpaid','overdue'].includes(effStatus(inv))
                  ? `Due ${fmtDateShort(inv.due_date)}`
                  : fmtDateShort(inv.issue_date)
                return (
                  <Link key={inv.id} to={`/invoices/${inv.id}/edit`} className="m-row">
                    <MiniAvatar name={clientName} />
                    <div className="m-row-main">
                      <div className="m-row-title">{clientName}</div>
                      <div className="m-row-meta">{inv.invoice_number} · {dateLabel}</div>
                    </div>
                    <div className="m-row-end">
                      <span className="m-row-amt">{fmt(inv.total)}</span>
                      <Badge variant={effStatus(inv)} />
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Desktop layout ──────────────────────────────────────── */}
      <div className="d-only">
        <div className="page-header">
          <div className="page-header__left">
            <h1 className="page-header__title">Invoices</h1>
            <p className="page-header__desc">Create, manage, and track every invoice in one place.</p>
          </div>
          <div className="page-header__right">
            <Link to="/invoices/new" className="app-btn-primary">
              <Plus size={15} /> New invoice
            </Link>
          </div>
        </div>

        {/* Filter bar */}
        <div className={styles.filterbar}>
          <div className={styles.searchWrap}>
            <MagnifyingGlass size={16} className={styles.searchIcon} />
            <input
              className={styles.searchInput}
              placeholder="Search by invoice # or client…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              aria-label="Search invoices"
            />
          </div>
          <div className={styles.tabs} role="tablist">
            {TABS.map(t => (
              <button
                key={t}
                role="tab"
                aria-selected={tab === t}
                className={[styles.tab, tab === t ? styles.tabOn : ''].join(' ')}
                onClick={() => setTab(t)}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
                <span className={styles.tabCount}>{counts[t]}</span>
              </button>
            ))}
          </div>
          <Link to="/invoices/new" className={styles.newBtn}>
            <Plus size={15} /> New invoice
          </Link>
        </div>

        {/* Table card */}
        <div className={styles.card}>
          {loading ? (
            <div className={styles.skeletonWrap}>
              {[1,2,3,4].map(n => <div key={n} className={styles.skeleton} />)}
            </div>
          ) : sorted.length === 0 ? (
            <div className={styles.empty}>
              <p className={styles.emptyTitle}>No invoices found</p>
              <p className={styles.emptySub}>
                {search || tab !== 'all' ? 'Try adjusting your filters.' : 'Create your first invoice to get started.'}
              </p>
              {search || tab !== 'all'
                ? <button className={styles.clearBtn} onClick={() => { setSearch(''); setTab('all') }}>Clear filters</button>
                : <Link to="/invoices/new" className={styles.newBtn}><Plus size={15} /> New invoice</Link>
              }
            </div>
          ) : (
            <div className={styles.tblWrap}>
              <table className={styles.tbl}>
                <thead>
                  <tr>
                    <th><button className={styles.thSort} onClick={() => toggleSort('invoice_number')}>Invoice # <SortIcon col="invoice_number" /></button></th>
                    <th><button className={styles.thSort} onClick={() => toggleSort('client')}>Client <SortIcon col="client" /></button></th>
                    <th className={styles.hideSmall}><button className={styles.thSort} onClick={() => toggleSort('issue_date')}>Issued <SortIcon col="issue_date" /></button></th>
                    <th className={styles.hideSmall}><button className={styles.thSort} onClick={() => toggleSort('due_date')}>Due <SortIcon col="due_date" /></button></th>
                    <th><button className={styles.thSort} onClick={() => toggleSort('status')}>Status <SortIcon col="status" /></button></th>
                    <th className={styles.tRight}><button className={[styles.thSort, styles.thSortRight].join(' ')} onClick={() => toggleSort('total')}>Amount <SortIcon col="total" /></button></th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map(inv => (
                    <tr key={inv.id}>
                      <td>
                        <Link to={`/invoices/${inv.id}/edit`} className={styles.tNum}>
                          {inv.invoice_number}
                        </Link>
                      </td>
                      <td className={styles.tClient}>{inv.bill_to?.name || '—'}</td>
                      <td className={[styles.tDate, styles.hideSmall].join(' ')}>{fmtDate(inv.issue_date)}</td>
                      <td className={[styles.tDate, styles.hideSmall].join(' ')}>{fmtDate(inv.due_date)}</td>
                      <td><Badge variant={effStatus(inv)} /></td>
                      <td className={[styles.tAmt, styles.tRight].join(' ')}>{fmt(inv.total)}</td>
                      <td>
                        <div className={styles.rowActs}>
                          {['unpaid','overdue'].includes(effStatus(inv)) && (
                            <button
                              className={styles.actPaid}
                              onClick={() => handleMarkPaid(inv)}
                              disabled={markingPaidId === inv.id}
                              title="Mark as paid"
                            >
                              <CheckCircle size={13} />
                              {markingPaidId === inv.id ? 'Saving…' : 'Mark paid'}
                            </button>
                          )}
                          <Link to={`/invoices/${inv.id}/edit`} className={styles.actLink}>Edit</Link>
                          <Link to={`/invoices/${inv.id}/preview`} className={styles.actIcon} title="Preview" aria-label="Preview">
                            <Eye size={14} />
                          </Link>
                          <button className={styles.actIcon} onClick={() => handleDuplicate(inv)} title="Duplicate" aria-label="Duplicate">
                            <Copy size={14} />
                          </button>
                          <button className={[styles.actIcon, styles.actDanger].join(' ')} onClick={() => setToDelete(inv)} title="Delete" aria-label="Delete">
                            <Trash size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
