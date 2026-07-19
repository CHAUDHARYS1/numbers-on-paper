import { useEffect, useState, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  CaretLeft, Plus, FileText, MagnifyingGlass, Eye, PencilSimple
} from '@phosphor-icons/react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import Badge from '@/components/ui/Badge'
import styles from './ClientInvoicesPage.module.css'

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

const _today = new Date(); _today.setHours(0, 0, 0, 0)
function effStatus(inv) {
  if (inv.status === 'unpaid' && inv.due_date && new Date(inv.due_date + 'T00:00:00') < _today) return 'overdue'
  return inv.status
}

function Avatar({ name }) {
  const initials = (name || '?').split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
  const colors = ['#2563EB','#15803d','#7c3aed','#c2410c','#be185d','#0f766e']
  const color = colors[(name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length]
  return <div className={styles.avatar} style={{ background: color }}>{initials}</div>
}

export default function ClientInvoicesPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [client,   setClient]   = useState(null)
  const [invoices, setInvoices] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')

  useEffect(() => {
    if (!user) return
    Promise.all([
      supabase.from('clients').select('*').eq('id', id).eq('user_id', user.id).single(),
      supabase.from('invoices').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    ]).then(([cliRes, invRes]) => {
      const c = cliRes.data
      setClient(c)
      const all = invRes.data || []
      setInvoices(c ? all.filter(i => i.client_id === c.id || i.bill_to?.name === c.name) : [])
      setLoading(false)
    })
  }, [id, user])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return invoices
    return invoices.filter(i =>
      (i.invoice_number || '').toLowerCase().includes(q) ||
      (i.status || '').toLowerCase().includes(q)
    )
  }, [invoices, search])

  const totalBilled      = invoices.filter(i => effStatus(i) !== 'draft').reduce((s, i) => s + (i.total || 0), 0)
  const totalOutstanding = invoices.filter(i => ['unpaid', 'overdue'].includes(effStatus(i))).reduce((s, i) => s + (i.total || 0), 0)

  if (loading) return <div className={styles.loading}>Loading…</div>
  if (!client) return <div className={styles.loading}>Client not found.</div>

  const newInvoiceUrl = `/invoices/new?client=${id}`

  return (
    <div>
      {/* ── Mobile ── */}
      <div className="m-only">
        <div className="m-head">
          <button className="m-back" onClick={() => navigate('/clients')}>
            <CaretLeft size={16} weight="bold" /> Clients
          </button>
          <div className="m-head-top" style={{ marginTop: 6 }}>
            <div>
              <h1 className="m-title">{client.name}</h1>
              {(client.contact || client.city) && (
                <p className="m-sub">{[client.contact, client.city].filter(Boolean).join(' · ')}</p>
              )}
            </div>
            <Link to={newInvoiceUrl} className="m-iconbtn m-iconbtn--accent" aria-label="New invoice">
              <Plus size={22} weight="bold" />
            </Link>
          </div>
        </div>

        <div className="m-body">
          {/* Stats strip */}
          <div className="m-stats">
            <div className="m-stat">
              <div className="m-stat-val">{fmt(totalBilled)}</div>
              <div className="m-stat-lbl">Total billed</div>
            </div>
            <div className="m-stat">
              <div className="m-stat-val">{fmt(totalOutstanding)}</div>
              <div className="m-stat-lbl">Outstanding</div>
            </div>
            <div className="m-stat">
              <div className="m-stat-val">{invoices.length}</div>
              <div className="m-stat-lbl">Invoices</div>
            </div>
          </div>

          {/* Search */}
          {invoices.length > 3 && (
            <div className={styles.mSearch}>
              <MagnifyingGlass size={16} className={styles.mSearchIcon} />
              <input
                className={styles.mSearchInput}
                placeholder="Search invoices…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                aria-label="Search invoices"
              />
            </div>
          )}

          {/* Invoice list */}
          {filtered.length === 0 ? (
            <div className="m-card m-card--pad">
              <div className="m-empty">
                <FileText size={36} style={{ color: 'var(--ink-4)' }} />
                <div className="m-empty-t">
                  {invoices.length === 0 ? 'No invoices yet' : 'No results'}
                </div>
                <div className="m-empty-s">
                  {invoices.length === 0
                    ? `Start billing ${client.name}.`
                    : 'Try a different search.'}
                </div>
                {invoices.length === 0 && (
                  <Link to={newInvoiceUrl} className="m-btn m-btn--primary" style={{ maxWidth: 200, margin: '0 auto' }}>
                    <Plus size={18} weight="bold" /> New invoice
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="m-list m-card">
              {filtered.map(inv => {
                const es = effStatus(inv)
                const dateLabel = inv.due_date && ['unpaid', 'overdue'].includes(es)
                  ? `Due ${fmtDateShort(inv.due_date)}`
                  : fmtDateShort(inv.issue_date)
                return (
                  <Link key={inv.id} to={`/invoices/${inv.id}/edit?from=/clients/${id}/invoices`} className="m-row">
                    <div className="m-row-main">
                      <div className="m-row-title">{inv.invoice_number || '—'}</div>
                      <div className="m-row-meta">{dateLabel}</div>
                    </div>
                    <div className="m-row-end">
                      <span className="m-row-amt">{fmt(inv.total)}</span>
                      <Badge variant={es} />
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Desktop ── */}
      <div className="d-only">
        {/* Top bar */}
        <div className={styles.topbar}>
          <button className={styles.back} onClick={() => navigate('/clients')}>
            <CaretLeft size={16} weight="bold" /> Clients
          </button>
          <Link to={newInvoiceUrl} className={styles.newBtn}>
            <Plus size={15} /> New invoice
          </Link>
        </div>

        {/* Client header */}
        <div className={styles.clientHead}>
          <Avatar name={client.name} />
          <div>
            <h1 className={styles.clientName}>{client.name}</h1>
            {(client.contact || client.email || client.city) && (
              <p className={styles.clientMeta}>
                {[client.contact, client.email, client.city].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
          <div className={styles.statsStrip}>
            <div className={styles.stat}>
              <span className={styles.statV}>{fmt(totalBilled)}</span>
              <span className={styles.statL}>Total billed</span>
            </div>
            <div className={styles.statDiv} />
            <div className={styles.stat}>
              <span className={[styles.statV, totalOutstanding ? styles.statDue : ''].join(' ')}>{fmt(totalOutstanding)}</span>
              <span className={styles.statL}>Outstanding</span>
            </div>
            <div className={styles.statDiv} />
            <div className={styles.stat}>
              <span className={styles.statV}>{invoices.length}</span>
              <span className={styles.statL}>Invoices</span>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className={styles.filterbar}>
          <div className={styles.searchWrap}>
            <MagnifyingGlass size={15} className={styles.searchIcon} />
            <input
              className={styles.searchInput}
              placeholder="Search by invoice # or status…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              aria-label="Search invoices"
            />
          </div>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div className={styles.empty}>
            <FileText size={36} className={styles.emptyIcon} />
            <p className={styles.emptyTitle}>{invoices.length === 0 ? 'No invoices yet' : 'No results'}</p>
            <p className={styles.emptySub}>
              {invoices.length === 0
                ? `Start billing ${client.name} by creating an invoice.`
                : 'Try a different search term.'}
            </p>
            {invoices.length === 0 && (
              <Link to={newInvoiceUrl} className={styles.emptyBtn}><Plus size={15} /> New invoice</Link>
            )}
          </div>
        ) : (
          <div className={styles.tblWrap}>
            <table className={styles.tbl}>
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Issued</th>
                  <th>Due</th>
                  <th>Status</th>
                  <th className={styles.tRight}>Amount</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(inv => (
                  <tr key={inv.id}>
                    <td>
                      <Link to={`/invoices/${inv.id}/edit?from=/clients/${id}/invoices`} className={styles.tNum}>
                        {inv.invoice_number}
                      </Link>
                    </td>
                    <td className={styles.tDate}>{fmtDate(inv.issue_date)}</td>
                    <td className={styles.tDate}>{fmtDate(inv.due_date)}</td>
                    <td><Badge variant={effStatus(inv)} /></td>
                    <td className={[styles.tAmt, styles.tRight].join(' ')}>{fmt(inv.total)}</td>
                    <td>
                      <div className={styles.rowActs}>
                        <Link to={`/invoices/${inv.id}/edit?from=/clients/${id}/invoices`} className={styles.actLink}>
                          <PencilSimple size={13} /> Edit
                        </Link>
                        <Link to={`/invoices/${inv.id}/preview?from=/clients/${id}/invoices`} className={styles.actLink}>
                          <Eye size={13} /> Preview
                        </Link>
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
  )
}
