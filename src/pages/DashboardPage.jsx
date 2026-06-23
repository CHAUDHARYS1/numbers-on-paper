import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, TrendUp, CurrencyDollar, Hourglass, FileDashed, MagnifyingGlass, Scroll, CaretRight } from '@phosphor-icons/react'
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

const _today = new Date(); _today.setHours(0, 0, 0, 0)
function effStatus(inv) {
  if (inv.status === 'unpaid' && inv.due_date && new Date(inv.due_date + 'T00:00:00') < _today) return 'overdue'
  return inv.status
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

  const totalPaid    = invoices.filter(i => effStatus(i) === 'paid').reduce((s, i) => s + (i.total || 0), 0)
  const totalUnpaid  = invoices.filter(i => ['unpaid','overdue'].includes(effStatus(i))).reduce((s, i) => s + (i.total || 0), 0)
  const draftCount   = invoices.filter(i => effStatus(i) === 'draft').length
  const totalAll     = invoices.reduce((s, i) => s + (i.total || 0), 0)
  const overdueCount = invoices.filter(i => effStatus(i) === 'overdue').length
  const sentCount    = invoices.filter(i => effStatus(i) !== 'draft').length
  const openCount    = invoices.filter(i => ['unpaid','overdue'].includes(effStatus(i))).length
  const thisYear     = new Date().getFullYear().toString()
  const paidThisYear = invoices.filter(i => effStatus(i) === 'paid' && (i.issue_date || '').startsWith(thisYear)).reduce((s, i) => s + (i.total || 0), 0)

  const outstanding = invoices.filter(i => ['unpaid','overdue'].includes(effStatus(i))).slice(0, 4)

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'there'
  const firstName   = displayName.split(' ')[0]

  const STATS = [
    { label: 'Total invoiced',  value: fmt(totalAll),    Icon: TrendUp,        color: 'brand',   sub: `${sentCount} sent`                                   },
    { label: 'Collected',       value: fmt(totalPaid),   Icon: CurrencyDollar, color: 'green',   sub: `${fmt(paidThisYear)} this year`                      },
    { label: 'Outstanding',     value: fmt(totalUnpaid), Icon: Hourglass,      color: 'amber',   sub: `${openCount} open`                                   },
    { label: 'Drafts',          value: draftCount,       Icon: FileDashed,     color: 'neutral', sub: overdueCount > 0 ? `${overdueCount} overdue` : 'none overdue' },
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
              <p className="m-sub">Overview of your invoicing activity.</p>
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
                      <Badge variant={effStatus(inv)} />
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
                      <Badge variant={effStatus(inv)} />
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

          {/* ── Proposals quick-link card ── */}
          <div className={`m-card ${styles.mCatCard}`}>
            <div className={styles.mCatWrap}>
            <svg
              viewBox="0 0 160 176"
              aria-hidden="true"
              focusable="false"
              className={styles.mCatSvg}
            >
              {/* shadow */}
              <ellipse cx="80" cy="171" rx="36" ry="5" fill="var(--ink)" opacity=".06" />

              {/* tail */}
              <path d="M 40 148 C 16 138 10 112 28 100 C 38 94 48 106 40 118" stroke="var(--ink)" strokeWidth="6" strokeLinecap="round" fill="none" />

              {/* body */}
              <ellipse cx="80" cy="138" rx="44" ry="30" fill="var(--card)" stroke="var(--ink)" strokeWidth="2.5" />

              {/* left front paw */}
              <ellipse cx="60" cy="162" rx="13" ry="7" fill="var(--card)" stroke="var(--ink)" strokeWidth="2" />
              <path d="M 52 159 Q 54 155 56 159" stroke="var(--ink)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
              <path d="M 57 157 Q 59.5 153 62 157" stroke="var(--ink)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
              <path d="M 63 159 Q 65 155 67 159" stroke="var(--ink)" strokeWidth="1.5" strokeLinecap="round" fill="none" />

              {/* right arm raised */}
              <path d="M 110 126 C 130 108 132 88 124 74" stroke="var(--ink)" strokeWidth="6" strokeLinecap="round" fill="none" />

              {/* head */}
              <circle cx="80" cy="78" r="36" fill="var(--card)" stroke="var(--ink)" strokeWidth="2.5" />

              {/* left ear outer */}
              <polygon points="56,56 46,24 74,52" fill="var(--card)" stroke="var(--ink)" strokeWidth="2" strokeLinejoin="round" />
              {/* left ear inner */}
              <polygon points="59,53 51,30 71,50" fill="var(--accent)" opacity=".15" />

              {/* right ear outer */}
              <polygon points="104,56 114,24 86,52" fill="var(--card)" stroke="var(--ink)" strokeWidth="2" strokeLinejoin="round" />
              {/* right ear inner */}
              <polygon points="101,53 109,30 89,50" fill="var(--accent)" opacity=".15" />

              {/* eyes — happy squint arches */}
              <path d="M 62 74 Q 70.5 66 79 74" stroke="var(--ink)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              <path d="M 81 74 Q 89.5 66 98 74" stroke="var(--ink)" strokeWidth="2.5" strokeLinecap="round" fill="none" />

              {/* nose */}
              <path d="M 77 87 L 80 91 L 83 87 Z" fill="var(--ink)" />

              {/* mouth */}
              <path d="M 80 91 Q 73 96 71 94" stroke="var(--ink)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
              <path d="M 80 91 Q 87 96 89 94" stroke="var(--ink)" strokeWidth="1.5" strokeLinecap="round" fill="none" />

              {/* whiskers left */}
              <line x1="18" y1="81" x2="58" y2="84" stroke="var(--ink)" strokeWidth="1.2" opacity=".3" strokeLinecap="round" />
              <line x1="18" y1="87" x2="58" y2="87" stroke="var(--ink)" strokeWidth="1.2" opacity=".3" strokeLinecap="round" />
              <line x1="18" y1="93" x2="58" y2="91" stroke="var(--ink)" strokeWidth="1.2" opacity=".3" strokeLinecap="round" />

              {/* whiskers right — shorter, arm is raised */}
              <line x1="102" y1="84" x2="118" y2="81" stroke="var(--ink)" strokeWidth="1.2" opacity=".3" strokeLinecap="round" />
              <line x1="102" y1="88" x2="116" y2="86" stroke="var(--ink)" strokeWidth="1.2" opacity=".3" strokeLinecap="round" />

              {/* right paw at face — drawn last so it sits in front */}
              <ellipse cx="118" cy="70" rx="13" ry="8" fill="var(--card)" stroke="var(--ink)" strokeWidth="2" transform="rotate(-35 118 70)" />
              <path d="M 110 65 Q 112 60 115 65" stroke="var(--ink)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
              <path d="M 116 63 Q 118.5 58 121 63" stroke="var(--ink)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
              <path d="M 122 66 Q 124 61 127 66" stroke="var(--ink)" strokeWidth="1.5" strokeLinecap="round" fill="none" />

              {/* tongue */}
              <ellipse cx="94" cy="83" rx="6.5" ry="4.5" fill="#EC4899" opacity=".9" transform="rotate(-20 94 83)" />
            </svg>
            <p className={styles.mCatLabel}>Your books are in good paws.</p>
            </div>
            <div className={styles.mCatDivider} />
            <Link to="/proposals" className={styles.mCatAction}>
              <span className={styles.mCatActionIcon}>
                <Scroll size={16} weight="bold" />
              </span>
              <span className={styles.mCatActionLabel}>Proposals</span>
              <CaretRight size={14} weight="bold" style={{ color: 'var(--ink-4)' }} />
            </Link>
          </div>
        </div>
      </div>

      {/* ── Desktop layout ─────────────────────────────────────── */}
      <div className="d-only">
        <div className="page-header">
          <div className="page-header__left">
            <h1 className="page-header__title">Dashboard</h1>
            <p className="page-header__desc">Overview of your invoicing activity.</p>
          </div>
          <div className="page-header__right">
            <div className="topbar-search">
              <MagnifyingGlass size={15} className="topbar-search__icon" />
              <input type="search" placeholder="Search…" aria-label="Search" className="topbar-search__input" />
            </div>
            <Link to="/invoices/new" className="app-btn-primary">
              <Plus size={15} /> New invoice
            </Link>
          </div>
        </div>
        {/* Stats */}
        <div className={styles.statsGrid}>
          {STATS.map(({ label, value, Icon, color, sub }) => (
            <div key={label} className={[styles.statCard, styles[`stat_${color}`]].join(' ')}>
              <div className={styles.statIconRow}>
                <div className={styles.statIcon}><Icon size={18} weight="duotone" /></div>
                {sub && <span className={styles.statSub}>{sub}</span>}
              </div>
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
          <div className={styles.card}>
            <div className={styles.cardHead}>
              <h2 className={styles.cardTitle}>Outstanding</h2>
              {outstanding.length > 0 && (
                <Link to="/invoices?status=unpaid" className={styles.cardLink}>View all</Link>
              )}
            </div>
            {outstanding.length > 0 ? (
              <div className={styles.outstandingList}>
                {outstanding.map(inv => (
                  <Link key={inv.id} to={`/invoices/${inv.id}/edit`} className={styles.outRow}>
                    <div>
                      <div className={styles.outNum}>{inv.invoice_number}</div>
                      <div className={styles.outClient}>{inv.bill_to?.name || '—'}</div>
                    </div>
                    <div className={styles.outRight}>
                      <div className={styles.outAmt}>{fmt(inv.total)}</div>
                      <Badge variant={effStatus(inv)} />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className={styles.caughtUp}>
                <svg className={styles.catSvg} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  {/* Tail */}
                  <path d="M72 98 Q90 108 86 90 Q82 76 72 82" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
                  {/* Body */}
                  <ellipse cx="58" cy="88" rx="26" ry="20" fill="currentColor" opacity=".12"/>
                  <ellipse cx="58" cy="88" rx="26" ry="20" stroke="currentColor" strokeWidth="3"/>
                  {/* Head */}
                  <circle cx="58" cy="58" r="26" fill="currentColor" opacity=".12"/>
                  <circle cx="58" cy="58" r="26" stroke="currentColor" strokeWidth="3"/>
                  {/* Left ear */}
                  <path d="M38 38 L32 22 L48 32Z" fill="currentColor" opacity=".12" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round"/>
                  {/* Right ear */}
                  <path d="M78 38 L84 22 L68 32Z" fill="currentColor" opacity=".12" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round"/>
                  {/* Inner ears */}
                  <path d="M39 36 L35 26 L46 33Z" fill="currentColor" opacity=".25"/>
                  <path d="M77 36 L81 26 L70 33Z" fill="currentColor" opacity=".25"/>
                  {/* Eyes — happy squint */}
                  <path d="M47 55 Q50 51 53 55" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                  <path d="M63 55 Q66 51 69 55" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                  {/* Nose */}
                  <path d="M56 62 L58 60 L60 62 L58 64Z" fill="currentColor" opacity=".6"/>
                  {/* Mouth */}
                  <path d="M58 64 Q54 68 52 66" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M58 64 Q62 68 64 66" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  {/* Whiskers left */}
                  <line x1="34" y1="61" x2="50" y2="63" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity=".5"/>
                  <line x1="34" y1="65" x2="50" y2="65" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity=".5"/>
                  {/* Whiskers right */}
                  <line x1="82" y1="61" x2="66" y2="63" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity=".5"/>
                  <line x1="82" y1="65" x2="66" y2="65" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity=".5"/>
                </svg>
                <p className={styles.caughtUpTitle}>You're all caught up!</p>
                <p className={styles.caughtUpSub}>No outstanding invoices.</p>
              </div>
            )}
          </div>
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
                      <td><Badge variant={effStatus(inv)} /></td>
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
