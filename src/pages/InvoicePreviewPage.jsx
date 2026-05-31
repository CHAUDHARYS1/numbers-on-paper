import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, Edit2, Printer, Send } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import Button from '@/components/ui/Button'
import InvoicePreview from '@/components/invoice/InvoicePreview'
import SendInvoiceModal from '@/components/invoice/SendInvoiceModal'
import styles from './InvoicePreviewPage.module.css'

export default function InvoicePreviewPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [invoice,     setInvoice]     = useState(null)
  const [profile,     setProfile]     = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [showSend,    setShowSend]    = useState(false)

  useEffect(() => {
    supabase.from('invoices').select('*').eq('id', id).single()
      .then(({ data }) => { setInvoice(data); setLoading(false) })
  }, [id])

  useEffect(() => {
    if (!user) return
    supabase.from('profiles').select('*').eq('id', user.id).single()
      .then(({ data }) => { if (data) setProfile(data) })
  }, [user])

  const handlePrint = () => window.print()

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const { default: html2pdf } = await import('html2pdf.js')
      const el = document.getElementById('invoice-print')
      await html2pdf().set({
        margin:      [10, 10, 10, 10],
        filename:    `${invoice?.invoice_number || 'invoice'}.pdf`,
        image:       { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF:       { unit: 'mm', format: 'a4', orientation: 'portrait' },
      }).from(el).save()
      toast.success('PDF downloaded!')
    } catch {
      toast.error('Failed to generate PDF. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  if (loading) return <div className={styles.loading}>Loading…</div>
  if (!invoice) return <div className={styles.loading}>Invoice not found.</div>

  return (
    <div className={styles.page}>
      {showSend && (
        <SendInvoiceModal
          invoice={invoice}
          profile={profile}
          onClose={() => setShowSend(false)}
        />
      )}
      <div className={styles.toolbar}>
        <button className={styles.back} onClick={() => navigate('/invoices')}>
          <ArrowLeft size={16} /> Invoices
        </button>
        <div className={styles.actions}>
          <Link to={`/invoices/${id}/edit`}>
            <Button variant="secondary" size="md" icon={<Edit2 size={15} />}>Edit</Button>
          </Link>
          <Button variant="secondary" size="md" icon={<Printer size={15} />} onClick={handlePrint}>
            Print
          </Button>
          <Button variant="secondary" size="md" icon={<Download size={15} />} loading={downloading} onClick={handleDownload}>
            Download PDF
          </Button>
          <Button variant="primary" size="md" icon={<Send size={15} />} onClick={() => setShowSend(true)}>
            Send to client
          </Button>
        </div>
      </div>

      <div className={styles.previewWrap}>
        <InvoicePreview data={invoice} id="invoice-print" />
      </div>
    </div>
  )
}
