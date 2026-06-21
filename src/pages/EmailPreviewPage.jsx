import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowClockwise } from '@phosphor-icons/react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { buildEmailHtml } from '@/lib/emailTemplate'
import styles from './EmailPreviewPage.module.css'

export default function EmailPreviewPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [invoice, setInvoice] = useState(null)
  const [profile, setProfile] = useState(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    Promise.all([
      supabase.from('invoices').select('*').eq('id', id).single(),
      supabase.from('profiles').select('*').eq('id', user.id).single(),
    ]).then(([{ data: inv }, { data: prof }]) => {
      setInvoice(inv)
      setProfile(prof)
      if (inv) {
        setMessage(`Hi ${inv.bill_to?.contact_name || inv.bill_to?.name || 'there'},\n\nPlease find your invoice ${inv.invoice_number} below. Let me know if you have any questions.\n\nThank you!`)
      }
      setLoading(false)
    })
  }, [user, id])

  const html = invoice ? buildEmailHtml({
    invoice,
    senderName:  profile?.business_name || profile?.full_name || 'Numbers on Paper',
    senderEmail: profile?.email || '',
    message,
  }) : ''

  if (loading) return <div className={styles.loading}>Loading preview…</div>
  if (!invoice) return <div className={styles.loading}>Invoice not found.</div>

  return (
    <div className={styles.page}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <button className={styles.back} onClick={() => navigate(`/invoices/${id}/preview`)}>
          <ArrowLeft size={16} /> Back to invoice
        </button>
        <div className={styles.toolbarCenter}>
          <span className={styles.label}>Email preview — {invoice.invoice_number}</span>
        </div>
        <span className={styles.hint}>This is exactly what your client will receive</span>
      </div>

      <div className={styles.layout}>
        {/* Message editor */}
        <div className={styles.sidebar}>
          <label className={styles.sidebarLabel}>Personal message</label>
          <textarea
            className={styles.messageInput}
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={8}
            placeholder="Optional message to your client…"
          />
          <p className={styles.sidebarHint}>Edit the message and the preview updates live.</p>
        </div>

        {/* Email preview */}
        <div className={styles.previewWrap}>
          <iframe
            className={styles.frame}
            srcDoc={html}
            title="Email preview"
            sandbox="allow-same-origin"
          />
        </div>
      </div>
    </div>
  )
}
