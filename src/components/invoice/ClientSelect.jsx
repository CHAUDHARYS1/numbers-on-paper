import styles from './ClientSelect.module.css'

export default function ClientSelect({ clients, value, onChange }) {
  return (
    <div className={styles.wrap}>
      <select
        className={styles.select}
        value={value}
        onChange={e => onChange(e.target.value)}
        aria-label="Select a saved client"
      >
        <option value="">— Select a saved client —</option>
        {clients.map(c => (
          <option key={c.id} value={c.id}>
            {c.name}{c.organization ? ` — ${c.organization}` : ''}
          </option>
        ))}
      </select>
    </div>
  )
}
