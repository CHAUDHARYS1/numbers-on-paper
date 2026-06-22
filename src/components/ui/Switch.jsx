export default function Switch({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={`sw${checked ? ' sw--on' : ''}`}
      onClick={() => onChange(!checked)}
    />
  )
}
