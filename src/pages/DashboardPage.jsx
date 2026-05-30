import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, FileText, DollarSign, Clock, TrendingUp } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import PageHeader from '@/components/layout/PageHeader'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import styles from './DashboardPage.module.css'

function fmt(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0)
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
      .limit(5)
      .then(({ data }) => { setInvoices(data || []); setLoading(false) })
  }, [user])

  const totalPaid    = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + (i.total || 0), 0)
  const totalUnpaid  = invoices.filter(i => i.status === 'unpaid').reduce((s, i) => s + (i.total || 0), 0)
  const totalDraft   = invoices.filter(i => i.status === 'draft').length
  const totalAll     = invoices.reduce((s, i) => s + (i.total || 0), 0)

  const STATS = [
    { label: 'Total invoiced',   value: fmt(totalAll),    icon: TrendingUp,  color: 'brand' },
    { label: 'Collected',        value: fmt(totalPaid),   icon: DollarSign,  color: 'success' },
    { label: 'Outstanding',      value: fmt(totalUnpaid), icon: Clock,       color: 'warning' },
    { label: 'Drafts',           value: totalDraft,       icon: FileText,    color: 'neutral' },
  ]

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Overview of your invoicing activity"
        action={
          <Button variant="primary" size="md" icon={<Plus size={16} />} as={Link} to="/invoices/new">
            <Link to="/invoices/new" style={{ color: 'inherit', textDecoration: 'none' }}>New invoice</Link>
          </Button>
        }
      />

      {/* Stats */}
      <div className={styles.statsGrid}>
        {STATS.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className={[styles.statCard, styles[`stat_${color}`]].join(' ')}>
            <div className={styles.statIcon}><Icon size={18} /></div>
            <div className={styles.statVal}>{value}</div>
            <div className={styles.statLabel}>{label}</div>
          </div>
        ))}
      </div>

      {/* Recent invoices */}
      <Card>
        <CardHeader
          title="Recent invoices"
          action={<Link to="/invoices" className={styles.viewAll}>View all</Link>}
        />
        <CardBody style={{ padding: 0 }}>
          {loading ? (
            <div className={styles.skeletonWrap}>
              {[1,2,3].map(n => <div key={n} className={styles.skeleton} />)}
            </div>
          ) : invoices.length === 0 ? (
            <div className={styles.empty}>
              <FileText size={36} className={styles.emptyIcon} />
              <p className={styles.emptyTitle}>No invoices yet</p>
              <p className={styles.emptySub}>Create your first invoice to get started.</p>
              <Link to="/invoices/new">
                <Button variant="primary" size="md" icon={<Plus size={15} />}>New invoice</Button>
              </Link>
            </div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Client</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map(inv => (
                    <tr key={inv.id} className={styles.tableRow}>
                      <td>
                        <Link to={`/invoices/${inv.id}/edit`} className={styles.invNum}>
                          {inv.invoice_number}
                        </Link>
                      </td>
                      <td className={styles.clientName}>{inv.bill_to?.name || '—'}</td>
                      <td className={styles.dateCell}>{inv.issue_date || '—'}</td>
                      <td><Badge variant={inv.status} /></td>
                      <td style={{ textAlign: 'right' }} className={styles.amountCell}>{fmt(inv.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
