import styles from './Badge.module.css'

const LABELS = {
  paid: 'Paid',
  unpaid: 'Unpaid',
  draft: 'Draft',
  overdue: 'Overdue',
}

export default function Badge({ variant = 'draft', label }) {
  return (
    <span className={[styles.badge, styles[variant]].join(' ')}>
      {label || LABELS[variant] || variant}
    </span>
  )
}
