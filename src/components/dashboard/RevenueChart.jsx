import { useMemo, useState } from 'react'
import styles from './RevenueChart.module.css'

const W = 560
const H = 180
const PAD = { top: 20, right: 8, bottom: 36, left: 52 }
const CW = W - PAD.left - PAD.right
const CH = H - PAD.top - PAD.bottom

function fmtShort(n) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}k`
  return `$${n.toFixed(0)}`
}

function niceMax(n) {
  if (n <= 0) return 500
  const mag = Math.pow(10, Math.floor(Math.log10(n)))
  const norm = n / mag
  const nice = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10
  return nice * mag
}

function buildMonthly(invoices) {
  const now = new Date()
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1)
    const yr = d.getFullYear()
    const mo = d.getMonth()
    const label = d.toLocaleString('default', { month: 'short' })
    const bucket = invoices.filter(inv => {
      const dt = new Date(inv.issue_date || inv.created_at)
      return dt.getFullYear() === yr && dt.getMonth() === mo
    })
    return {
      key:         `${yr}-${mo}`,
      label:       i === 11 ? `${label} ↑` : label,
      isCurrent:   i === 11,
      paid:        bucket.filter(i => i.status === 'paid').reduce((s, i) => s + (i.total || 0), 0),
      outstanding: bucket.filter(i => ['unpaid','overdue'].includes(i.status)).reduce((s, i) => s + (i.total || 0), 0),
    }
  })
}

function buildYearly(invoices) {
  const now = new Date()
  const cur = now.getFullYear()
  return Array.from({ length: 5 }, (_, i) => {
    const yr = cur - 4 + i
    const bucket = invoices.filter(inv => new Date(inv.issue_date || inv.created_at).getFullYear() === yr)
    return {
      key:         String(yr),
      label:       String(yr),
      isCurrent:   yr === cur,
      paid:        bucket.filter(i => i.status === 'paid').reduce((s, i) => s + (i.total || 0), 0),
      outstanding: bucket.filter(i => ['unpaid','overdue'].includes(i.status)).reduce((s, i) => s + (i.total || 0), 0),
    }
  })
}

export default function RevenueChart({ invoices }) {
  const [period, setPeriod] = useState('monthly')

  const data = useMemo(
    () => period === 'monthly' ? buildMonthly(invoices) : buildYearly(invoices),
    [invoices, period]
  )

  const maxVal  = niceMax(Math.max(...data.map(d => d.paid + d.outstanding), 1))
  const barGrpW = CW / data.length
  const barW    = Math.min(barGrpW * 0.6, 36)
  const yTicks  = [0, 0.25, 0.5, 0.75, 1]

  const totalPaid = data.reduce((s, d) => s + d.paid, 0)
  const totalOut  = data.reduce((s, d) => s + d.outstanding, 0)

  return (
    <div className={styles.wrap}>
      {/* Header row */}
      <div className={styles.header}>
        <div className={styles.totals}>
          <span className={styles.totalPaid}>
            <span className={styles.dot} data-color="paid" />
            {fmtShort(totalPaid)} collected
          </span>
          {totalOut > 0 && (
            <span className={styles.totalOut}>
              <span className={styles.dot} data-color="out" />
              {fmtShort(totalOut)} outstanding
            </span>
          )}
        </div>
        <div className={styles.toggle} role="group" aria-label="Chart period">
          <button
            className={[styles.toggleBtn, period === 'monthly' ? styles.toggleActive : ''].join(' ')}
            onClick={() => setPeriod('monthly')}
          >Monthly</button>
          <button
            className={[styles.toggleBtn, period === 'yearly' ? styles.toggleActive : ''].join(' ')}
            onClick={() => setPeriod('yearly')}
          >Yearly</button>
        </div>
      </div>

      {/* SVG chart */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className={styles.chart}
        aria-label={`Revenue chart — ${period}`}
        role="img"
      >
        <g transform={`translate(${PAD.left},${PAD.top})`}>
          {/* Gridlines + Y labels */}
          {yTicks.map(t => {
            const y = CH - t * CH
            return (
              <g key={t}>
                <line x1={0} y1={y} x2={CW} y2={y} stroke="var(--color-border-default)" strokeWidth={1} />
                {t > 0 && (
                  <text x={-6} y={y} textAnchor="end" dominantBaseline="middle" fontSize={10} fill="var(--color-text-muted)">
                    {fmtShort(t * maxVal)}
                  </text>
                )}
              </g>
            )
          })}

          {/* Bars */}
          {data.map((d, i) => {
            const paidH = (d.paid / maxVal) * CH
            const outH  = (d.outstanding / maxVal) * CH
            const x     = i * barGrpW + (barGrpW - barW) / 2

            return (
              <g key={d.key}>
                <title>{`${d.label}: $${(d.paid + d.outstanding).toFixed(2)} (${fmtShort(d.paid)} collected)`}</title>

                {/* Outstanding segment */}
                {outH > 0.5 && (
                  <rect
                    x={x} y={CH - paidH - outH}
                    width={barW} height={outH}
                    rx={3} ry={3}
                    fill="var(--color-warning-text)"
                    opacity={0.35}
                  />
                )}

                {/* Paid segment */}
                {paidH > 0.5 && (
                  <rect
                    x={x} y={CH - paidH}
                    width={barW} height={paidH}
                    rx={3} ry={3}
                    fill="var(--color-brand-600)"
                    opacity={d.isCurrent ? 1 : 0.75}
                  />
                )}

                {/* Empty placeholder */}
                {d.paid + d.outstanding === 0 && (
                  <rect x={x} y={CH - 3} width={barW} height={3} rx={2} fill="var(--color-border-default)" />
                )}

                {/* X label */}
                <text
                  x={x + barW / 2} y={CH + 16}
                  textAnchor="middle"
                  fontSize={10}
                  fill={d.isCurrent ? 'var(--color-text-primary)' : 'var(--color-text-muted)'}
                  fontWeight={d.isCurrent ? 600 : 400}
                >
                  {d.label}
                </text>
              </g>
            )
          })}
        </g>
      </svg>
    </div>
  )
}
