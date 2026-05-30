import { Link } from 'react-router-dom'
import styles from './NotFoundPage.module.css'

export default function NotFoundPage() {
  return (
    <div className={styles.page}>
      <div className={styles.code}>404</div>
      <h1 className={styles.title}>Page not found</h1>
      <p className={styles.sub}>The page you're looking for doesn't exist or has been moved.</p>
      <Link to="/" className={styles.back}>Go back home</Link>
    </div>
  )
}
