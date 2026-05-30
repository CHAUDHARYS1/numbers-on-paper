import styles from './Card.module.css'

export function Card({ children, className = '', ...props }) {
  return <div className={[styles.card, className].join(' ')} {...props}>{children}</div>
}

export function CardHeader({ title, description, action }) {
  return (
    <div className={styles.header}>
      <div>
        <h3 className={styles.title}>{title}</h3>
        {description && <p className={styles.description}>{description}</p>}
      </div>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  )
}

export function CardBody({ children, className = '' }) {
  return <div className={[styles.body, className].join(' ')}>{children}</div>
}
