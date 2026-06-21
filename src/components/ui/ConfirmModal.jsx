import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Warning } from '@phosphor-icons/react'
import styles from './ConfirmModal.module.css'

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel  = 'Cancel',
  onConfirm,
  onCancel,
  loading = false,
}) {
  const confirmRef = useRef(null)

  // Focus confirm button when modal opens
  useEffect(() => {
    if (isOpen) confirmRef.current?.focus()
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const handle = (e) => { if (e.key === 'Escape') onCancel() }
    document.addEventListener('keydown', handle)
    return () => document.removeEventListener('keydown', handle)
  }, [isOpen, onCancel])

  if (!isOpen) return null

  return createPortal(
    <div
      className={styles.backdrop}
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.iconWrap}>
          <Warning size={22} />
        </div>
        <h2 className={styles.title} id="confirm-title">{title}</h2>
        {message && <p className={styles.message}>{message}</p>}
        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            className={styles.confirmBtn}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Deleting…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
