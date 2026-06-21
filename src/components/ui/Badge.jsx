import styles from './Badge.module.css'

const CONFIG = {
  paid:    { label: 'Paid',    cls: 'paid'    },
  unpaid:  { label: 'Due',     cls: 'unpaid'  },
  overdue: { label: 'Overdue', cls: 'overdue' },
  draft:   { label: 'Draft',   cls: 'draft'   },
}

export default function Badge({ variant = 'draft', label }) {
  const { label: defaultLabel, cls } = CONFIG[variant] || { label: variant, cls: 'draft' }
  return (
    <span className={[styles.badge, styles[cls]].join(' ')}>
      {label || defaultLabel}
    </span>
  )
}
