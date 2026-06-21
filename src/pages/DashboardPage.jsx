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

  const outstanding = invoices.filter(i => ['unpaid','overdue'].includes(i.status)).slice(0, 4)

  const STATS = [
    { label: 'Total invoiced',  value: fmt(totalAll),    Icon: TrendUp,        color: 'brand'   },
    { label: 'Collected',       value: fmt(totalPaid),   Icon: CurrencyDollar, color: 'green'   },
    { label: 'Outstanding',     value: fmt(totalUnpaid), Icon: Hourglass,      color: 'amber'   },
    { label: 'Drafts',          value: draftCount,       Icon: FileDashed,     color: 'neutral' },
  ]

  return (
    <div>
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
  )
}
