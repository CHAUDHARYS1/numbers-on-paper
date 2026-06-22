import { useMemo, useState } from 'react'
import styles from './RevenueChart.module.css'

function fmtShort(n) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}k`
  return `$${n.toFixed(0)}`
}

function buildMonths(invoices, count) {
  const now = new Date()
  return Array.from({ length: count }, (_, i) => {
    const d  = new Date(now.getFullYear(), now.getMonth() - (count - 1) + i, 1)
    const yr = d.getFullYear()
    const mo = d.getMonth()
    const label = d.toLocaleString('default', { month: 'short' })
    const paid = invoices
      .filter(inv => {
        const dt = new Date(inv.issue_date || inv.created_at)
        return inv.status === 'paid' && dt.getFullYear() === yr && dt.getMonth() === mo
      })
      .reduce((s, inv) => s + (inv.total || 0), 0)
    return { key: `${yr}-${mo}`, label, paid, isCurrent: i === count - 1 }
  })
}

export default function RevenueChart({ invoices }) {
  const [range, setRange] = useState(12)

  const data   = useMemo(() => buildMonths(invoices, range), [invoices, range])
  const maxVal = Math.max(...data.map(d => d.paid), 1)
  const total  = data.reduce((s, d) => s + d.paid, 0)

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div className={styles.totalLine}>
          <span className={styles.totalAmt}>{fmtShort(total)}</span>
          <span className={styles.totalLabel}>collected</span>
        </div>
        <div className={styles.toggle} role="group" aria-label="Range">
          {[6, 12].map(r => (
            <button
              key={r}
              className={[styles.toggleBtn, range === r ? styles.toggleActive : ''].join(' ')}
              onClick={() => setRange(r)}
              aria-pressed={range === r}
            >
              {r}M
            </button>
          ))}
        </div>
      </div>

      <div className={styles.bars} data-count={range}>
        {data.map(d => {
          const pct = maxVal > 0 ? (d.paid / maxVal) * 100 : 0
          return (
            <div key={d.key} className={styles.barCol}>
              <div className={styles.barAmt}>
                {d.paid > 0 ? fmtShort(d.paid) : ''}
              </div>
              <div className={styles.barTrack}>
                <div
                  className={[styles.barFill, d.isCurrent ? styles.barCurrent : ''].join(' ')}
                  style={{ height: `${pct}%` }}
                  title={`${d.label}: ${fmtShort(d.paid)}`}
                />
              </div>
              <div className={[styles.barLabel, d.isCurrent ? styles.barLabelCurrent : ''].join(' ')}>
                {d.label}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
