import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Send, X } from 'lucide-react'
import styles from './SendInvoiceModal.module.css'

export default function SendInvoiceModal({ invoice, profile, onClose }) {
  const defaultEmail = invoice?.bill_to?.contact_email || ''
  const [to,       setTo]       = useState(defaultEmail)
  const [message,  setMessage]  = useState(`Hi ${invoice?.bill_to?.contact_name || invoice?.bill_to?.name || 'there'},\n\nPlease find your invoice ${invoice?.invoice_number} attached. Let me know if you have any questions.\n\nThank you!`)
  const [sending,  setSending]  = useState(false)
  const [error,    setError]    = useState('')
  const [sent,     setSent]     = useState(false)

  const handleSend = async (e) => {
    e.preventDefault()
    if (!to.trim()) { setError('Recipient email is required.'); return }
    setError('')
    setSending(true)

    try {
      const res = await fetch('/.netlify/functions/send-invoice', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoice,
          to: to.trim(),
          senderName:  profile?.business_name || profile?.full_name || 'Numbers on Paper',
          senderEmail: profile?.email || '',
          message: message.trim(),
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send.')
      setSent(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  return createPortal(
    <div className={styles.backdrop} onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="send-title">
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title} id="send-title">
            Send {invoice?.invoice_number}
          </h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {sent ? (
          <div className={styles.successState}>
            <div className={styles.successIcon}>✓</div>
            <p className={styles.successMsg}>Invoice sent to <strong>{to}</strong></p>
            <button className={styles.doneBtn} onClick={onClose}>Done</button>
          </div>
        ) : (
          <form className={styles.form} onSubmit={handleSend} noValidate>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="send-to">To</label>
              <input
                id="send-to"
                type="email"
                className={styles.input}
                value={to}
                onChange={e => setTo(e.target.value)}
                placeholder="client@email.com"
                required
                autoFocus
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="send-message">Message <span className={styles.optional}>(optional)</span></label>
              <textarea
                id="send-message"
                className={styles.textarea}
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={5}
              />
            </div>

            {error && <p className={styles.error} role="alert">{error}</p>}

            <div className={styles.actions}>
              <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={sending}>
                Cancel
              </button>
              <button type="submit" className={styles.sendBtn} disabled={sending}>
                <Send size={15} />
                {sending ? 'Sending…' : 'Send invoice'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  )
}
