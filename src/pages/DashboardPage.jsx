import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, TrendUp, CurrencyDollar, Hourglass, FileDashed } from '@phosphor-icons/react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import Badge from '@/components/ui/Badge'
import RevenueChart from '@/components/dashboard/RevenueChart'
import styles from './DashboardPage.module.css'

function fmt(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0)
}
function fmtDate(d) {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

function MiniAvatar({ name }) {
  const initials = (name || '?').split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
  const colors = ['#2563EB','#15803d','#7c3aed','#c2410c','#be185d','#0f766e']
  const color = colors[(name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length]
  return (
    <div className="m-row-ava" style={{ background: color }}>{initials}</div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    if (!user) return
    supabase
      .from('invoices')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setInvoices(data || []); setLoading(false) })
  }, [user])

  const totalPaid   = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + (i.total || 0), 0)
  const totalUnpaid = invoices.filter(i => ['unpaid','overdue'].includes(i.status)).reduce((s, i) => s + (i.total || 0), 0)
  const draftCount  = invoices.filter(i => i.status === 'draft').length
  const totalAll    = invoices.reduce((s, i) => s + (i.total || 0), 0)
  const overdueCount = invoices.filter(i => i.status === 'overdue').length

  const outstanding = invoices.filter(i => ['unpaid','overdue'].includes(i.status)).slice(0, 4)

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'there'
  const firstName   = displayName.split(' ')[0]

  const STATS = [
    { label: 'Total invoiced',  value: fmt(totalAll),    Icon: TrendUp,        color: 'brand'   },
    { label: 'Collected',       value: fmt(totalPaid),   Icon: CurrencyDollar, color: 'green'   },
    { label: 'Outstanding',     value: fmt(totalUnpaid), Icon: Hourglass,      color: 'amber'   },
    { label: 'Drafts',          value: draftCount,       Icon: FileDashed,     color: 'neutral' },
  ]

  return (
    <div>
      {/* ── Mobile layout ─────────────────────────────────────── */}
      <div className="m-only">
        <div className="m-head">
          <div className="m-head-top">
            <div>
              <div className="m-eyebrow">{greeting()}</div>
              <h1 className="m-title">{firstName}</h1>
            </div>
            <Link to="/invoices/new" className="m-iconbtn m-iconbtn--accent" aria-label="New invoice">
              <Plus size={22} weight="bold" />
            </Link>
          </div>
        </div>

        <div className="m-body">
          {/* Hero card */}
          <div className="m-hero">
            <div className="m-hero-label">Outstanding balance</div>
            <div className="m-hero-val">{fmt(totalUnpaid)}</div>
            <div className="m-hero-row">
              {overdueCount > 0 && (
                <span className="m-hero-chip m-hero-chip--warn">
                  {overdueCount} overdue
                </span>
              )}
              {draftCount > 0 && (
                <span className="m-hero-chip">
                  {draftCount} draft{draftCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          {/* Stat tiles */}
          <div className="m-stats" style={{ marginTop: 12 }}>
            <div className="m-stat">
              <div className="m-stat-val">{fmt(totalPaid)}</div>
              <div className="m-stat-lbl">Collected</div>
            </div>
            <div className="m-stat">
              <div className="m-stat-val">{fmt(totalAll)}</div>
              <div className="m-stat-lbl">Total invoiced</div>
            </div>
          </div>

          {/* Revenue chart — scrollable so axis labels stay legible */}
          <div className="m-card" style={{ marginTop: 12, overflow: 'hidden' }}>
            <div style={{ padding: '18px 18px 10px' }}>
              <h2 className="m-card-title">Revenue</h2>
            </div>
            <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
              <div style={{ minWidth: 520, padding: '0 18px 18px' }}>
                <RevenueChart invoices={invoices} />
              </div>
            </div>
          </div>

          {/* Outstanding list */}
          {outstanding.length > 0 && (
            <div style={{ marginTop: 18 }}>
              <div className="m-card-h" style={{ padding: '0 0 10px' }}>
                <h2 className="m-card-title">Outstanding</h2>
                <Link to="/invoices" className="m-card-link">View all</Link>
              </div>
              <div className="m-list m-card">
                {outstanding.map(inv => (
                  <Link key={inv.id} to={`/invoices/${inv.id}/edit`} className="m-row">
                    <MiniAvatar name={inv.bill_to?.name} />
                    <div className="m-row-main">
                      <div className="m-row-title">{inv.bill_to?.name || '—'}</div>
                      <div className="m-row-meta">{inv.invoice_number} · {fmtDate(inv.due_date)}</div>
                    </div>
                    <div className="m-row-end">
                      <span className="m-row-amt">{fmt(inv.total)}</span>
                      <Badge variant={inv.status} />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Recent invoices */}
          {invoices.length > 0 && (
            <div style={{ marginTop: 18 }}>
              <div className="m-card-h" style={{ padding: '0 0 10px' }}>
                <h2 className="m-card-title">Recent invoices</h2>
                <Link to="/invoices" className="m-card-link">View all</Link>
              </div>
              <div className="m-list m-card">
                {invoices.slice(0, 5).map(inv => (
                  <Link key={inv.id} to={`/invoices/${inv.id}/edit`} className="m-row">
                    <MiniAvatar name={inv.bill_to?.name} />
                    <div className="m-row-main">
                      <div className="m-row-title">{inv.bill_to?.name || '—'}</div>
                      <div className="m-row-meta">{inv.invoice_number} · {fmtDate(inv.issue_date)}</div>
                    </div>
                    <div className="m-row-end">
                      <span className="m-row-amt">{fmt(inv.total)}</span>
                      <Badge variant={inv.status} />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {invoices.length === 0 && !loading && (
            <div className="m-card m-card--pad" style={{ marginTop: 18, textAlign: 'center' }}>
              <div className="m-empty">
                <FileDashed size={36} style={{ color: 'var(--ink-4)' }} />
                <div className="m-empty-t">No invoices yet</div>
                <div className="m-empty-s">Create your first invoice to get started.</div>
                <Link to="/invoices/new" className="m-btn m-btn--primary" style={{ marginTop: 0 }}>
                  <Plus size={18} weight="bold" /> New invoice
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Desktop layout ─────────────────────────────────────── */}
      <div className="d-only">
        {/* Stats */}
        <div className={styles.statsGrid}>
          {STATS.map(({ label, value, Icon, color }) => (
            <div key={label} className={[styles.statCard, styles[`stat_${color}`]].join(' ')}>
              <div className={styles.statIcon}><Icon size={18} weight="duotone" /></div>
              <div className={styles.statVal}>{value}</div>
              <div className={styles.statLabel}>{label}</div>
            </div>
          ))}
        </div>

        <div className={styles.grid}>
          {/* Revenue chart */}
          <div className={styles.card}>
            <div className={styles.cardHead}>
              <h2 className={styles.cardTitle}>Revenue</h2>
            </div>
            <div className={styles.cardBody}>
              <RevenueChart invoices={invoices} />
            </div>
          </div>

          {/* Outstanding */}
          {outstanding.length > 0 && (
            <div className={styles.card}>
              <div className={styles.cardHead}>
                <h2 className={styles.cardTitle}>Outstanding</h2>
                <Link to="/invoices?status=unpaid" className={styles.cardLink}>View all</Link>
              </div>
              <div className={styles.outstandingList}>
                {outstanding.map(inv => (
                  <Link key={inv.id} to={`/invoices/${inv.id}/edit`} className={styles.outRow}>
                    <div>
                      <div className={styles.outNum}>{inv.invoice_number}</div>
                      <div className={styles.outClient}>{inv.bill_to?.name || '—'}</div>
                    </div>
                    <div className={styles.outRight}>
                      <div className={styles.outAmt}>{fmt(inv.total)}</div>
                      <Badge variant={inv.status} />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Recent invoices */}
        <div className={[styles.card, styles.cardFull].join(' ')}>
          <div className={styles.cardHead}>
            <h2 className={styles.cardTitle}>Recent invoices</h2>
            <Link to="/invoices" className={styles.cardLink}>View all</Link>
          </div>
          <div className={styles.tableWrap}>
            {loading ? (
              <div className={styles.skeletonWrap}>
                {[1,2,3].map(n => <div key={n} className={styles.skeleton} />)}
              </div>
            ) : invoices.length === 0 ? (
              <div className={styles.empty}>
                <FileDashed size={36} className={styles.emptyIcon} />
                <p className={styles.emptyTitle}>No invoices yet</p>
                <p className={styles.emptySub}>Create your first invoice to get started.</p>
                <Link to="/invoices/new" className={styles.emptyBtn}>
                  <Plus size={15} />
                  New invoice
                </Link>
              </div>
            ) : (
              <table className={styles.tbl}>
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Client</th>
                    <th className={styles.hideSmall}>Issued</th>
                    <th>Status</th>
                    <th className={styles.tRight}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.slice(0, 6).map(inv => (
                    <tr key={inv.id}>
                      <td>
                        <Link to={`/invoices/${inv.id}/edit`} className={styles.tNum}>
                          {inv.invoice_number}
                        </Link>
                      </td>
                      <td className={styles.tClient}>{inv.bill_to?.name || '—'}</td>
                      <td className={[styles.tDate, styles.hideSmall].join(' ')}>{fmtDate(inv.issue_date)}</td>
                      <td><Badge variant={inv.status} /></td>
                      <td className={[styles.tAmt, styles.tRight].join(' ')}>{fmt(inv.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
