import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import styles from './ToastContext.module.css'

const ToastContext = createContext(null)

let nextId = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef({})

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current[id])
    delete timers.current[id]
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const addToast = useCallback((message, variant = 'info', duration = 4000) => {
    const id = ++nextId
    setToasts(prev => [...prev, { id, message, variant }])
    timers.current[id] = setTimeout(() => dismiss(id), duration)
  }, [dismiss])

  const toast = {
    success: (msg, duration) => addToast(msg, 'success', duration),
    error:   (msg, duration) => addToast(msg, 'error',   duration),
    info:    (msg, duration) => addToast(msg, 'info',    duration),
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {createPortal(
        <div className={styles.container} aria-live="polite" aria-atomic="false">
          {toasts.map(t => (
            <div key={t.id} className={[styles.toast, styles[t.variant]].join(' ')} role="status">
              <span className={styles.message}>{t.message}</span>
              <button
                className={styles.close}
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss notification"
              >
                ✕
              </button>
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
