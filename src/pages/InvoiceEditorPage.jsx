import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus, Trash2, Eye, Save, ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import InvoicePreview from '@/components/invoice/InvoicePreview'
import styles from './InvoiceEditorPage.module.css'

const DEFAULT_ITEM = () => ({
  id: crypto.randomUUID(),
  item: '',
  description: '',
  date: '',
  hours: '',
  rate: 50,
  amount: 0,
  type: 'hourly',
})

function calcItem(item) {
  const hours = parseFloat(item.hours) || 0
  const rate  = parseFloat(item.rate)  || 0
  return item.type === 'hourly' ? hours * rate : rate
}

function calcTotals(lineItems, discountType, discountValue, taxRate) {
  const subtotal       = lineItems.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0)
  const discountAmount = discountType === 'percent'
    ? subtotal * ((parseFloat(discountValue) || 0) / 100)
    : parseFloat(discountValue) || 0
  const taxable   = subtotal - discountAmount
  const taxAmount = taxable * ((parseFloat(taxRate) || 0) / 100)
  const total     = taxable + taxAmount
  return { subtotal, discountAmount, taxAmount, total }
}

export default function InvoiceEditorPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate  = useNavigate()
  const isNew     = !id

  const [profile, setProfile] = useState(null)
  const [saving,  setSaving]  = useState(false)
  const [tab,     setTab]     = useState('edit') // 'edit' | 'preview' (mobile)

  // Form state
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [issueDate,     setIssueDate]     = useState(new Date().toISOString().slice(0, 10))
  const [dueDate,       setDueDate]       = useState('')
  const [status,        setStatus]        = useState('draft')
  const [billTo,        setBillTo]        = useState({ name: '', organization: '', address: '', city: '', state: '', zip: '' })
  const [lineItems,     setLineItems]     = useState([DEFAULT_ITEM()])
  const [discountType,  setDiscountType]  = useState('fixed')
  const [discountValue, setDiscountValue] = useState(0)
  const [taxRate,       setTaxRate]       = useState(0)
  const [notes,         setNotes]         = useState('')
  const [showDiscount,  setShowDiscount]  = useState(false)
  const [showTax,       setShowTax]       = useState(false)
  const [showNotes,     setShowNotes]     = useState(true)

  // Load profile + invoice
  useEffect(() => {
    if (!user) return
    supabase.from('profiles').select('*').eq('id', user.id).single()
      .then(({ data }) => {
        if (data) {
          setProfile(data)
          setShowDiscount(data.show_discount)
          setShowTax(data.show_tax)
          setShowNotes(data.show_notes)
          setTaxRate(data.tax_rate || 0)
        }
      })

    if (isNew) {
      supabase.rpc('next_invoice_number', { p_user_id: user.id })
        .then(({ data }) => setInvoiceNumber(data || 'INV-000001'))
    } else {
      supabase.from('invoices').select('*').eq('id', id).single()
        .then(({ data }) => {
          if (!data) return
          setInvoiceNumber(data.invoice_number)
          setIssueDate(data.issue_date || '')
          setDueDate(data.due_date || '')
          setStatus(data.status)
          setBillTo(data.bill_to || {})
          setLineItems(data.line_items?.length ? data.line_items : [DEFAULT_ITEM()])
          setDiscountType(data.discount_type || 'fixed')
          setDiscountValue(data.discount_value || 0)
          setTaxRate(data.tax_rate || 0)
          setNotes(data.notes || '')
          setShowDiscount(data.show_discount)
          setShowTax(data.show_tax)
          setShowNotes(data.show_notes)
        })
    }
  }, [user, id, isNew])

  // Recalc amounts when line items change
  const updateItem = (idx, field, value) => {
    setLineItems(prev => {
      const next = [...prev]
      next[idx] = { ...next[idx], [field]: value }
      next[idx].amount = calcItem(next[idx])
      return next
    })
  }

  const addItem    = () => setLineItems(p => [...p, DEFAULT_ITEM()])
  const removeItem = (idx) => setLineItems(p => p.filter((_, i) => i !== idx))

  const { subtotal, discountAmount, taxAmount, total } = calcTotals(lineItems, discountType, discountValue, taxRate)

  const invoiceData = {
    invoice_number: invoiceNumber,
    issue_date: issueDate,
    due_date: dueDate,
    status,
    bill_from: profile ? {
      name: profile.full_name,
      business: profile.business_name,
      address: `${profile.address_line1 || ''}${profile.address_line2 ? ', ' + profile.address_line2 : ''}`,
      city: profile.city, state: profile.state, zip: profile.zip,
      phone: profile.phone, email: profile.email,
    } : {},
    bill_to: billTo,
    line_items: lineItems,
    subtotal, discount_type: discountType, discount_value: discountValue,
    discount_amount: discountAmount, tax_rate: taxRate, tax_amount: taxAmount, total,
    notes, show_discount: showDiscount, show_tax: showTax, show_notes: showNotes,
  }

  const handleSave = async () => {
    setSaving(true)
    const payload = { ...invoiceData, user_id: user.id }
    let error
    if (isNew) {
      ({ error } = await supabase.from('invoices').insert(payload))
    } else {
      ({ error } = await supabase.from('invoices').update(payload).eq('id', id))
    }
    setSaving(false)
    if (!error) navigate('/invoices')
  }

  const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0)

  return (
    <div className={styles.page}>
      {/* Page top bar */}
      <div className={styles.topBar}>
        <button className={styles.back} onClick={() => navigate('/invoices')}>
          <ArrowLeft size={16} /> Invoices
        </button>
        <div className={styles.topActions}>
          {/* Mobile tab toggle */}
          <div className={styles.mobileTabs}>
            <button className={[styles.mobileTab, tab === 'edit' ? styles.mobileTabActive : ''].join(' ')} onClick={() => setTab('edit')}>Edit</button>
            <button className={[styles.mobileTab, tab === 'preview' ? styles.mobileTabActive : ''].join(' ')} onClick={() => setTab('preview')}>Preview</button>
          </div>
          <select
            className={styles.statusSelect}
            value={status}
            onChange={e => setStatus(e.target.value)}
          >
            <option value="draft">Draft</option>
            <option value="unpaid">Unpaid</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
          <Button variant="primary" size="md" icon={<Save size={15} />} loading={saving} onClick={handleSave}>
            {isNew ? 'Save invoice' : 'Save changes'}
          </Button>
        </div>
      </div>

      {/* Split layout */}
      <div className={styles.split}>
        {/* Form — left */}
        <div className={[styles.formCol, tab === 'preview' ? styles.hideMobile : ''].join(' ')}>

          {/* Meta */}
          <Card className={styles.section}>
            <CardHeader title="Invoice details" />
            <CardBody>
              <div className={styles.row2}>
                <Input label="Invoice number" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} />
                <div className={styles.field}>
                  <label className={styles.label}>Status</label>
                  <select className={styles.selectField} value={status} onChange={e => setStatus(e.target.value)}>
                    <option value="draft">Draft</option>
                    <option value="unpaid">Unpaid</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
              </div>
              <div className={styles.row2}>
                <Input label="Issue date" type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} />
                <Input label="Due date" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
              </div>
            </CardBody>
          </Card>

          {/* Bill To */}
          <Card className={styles.section}>
            <CardHeader title="Bill to" />
            <CardBody>
              <div className={styles.stack}>
                <Input label="Client name" placeholder="DePaul University" value={billTo.name} onChange={e => setBillTo(p => ({...p, name: e.target.value}))} />
                <Input label="Organization" placeholder="The Illinois Coalition…" value={billTo.organization} onChange={e => setBillTo(p => ({...p, organization: e.target.value}))} />
                <Input label="Address" placeholder="123 Main St" value={billTo.address} onChange={e => setBillTo(p => ({...p, address: e.target.value}))} />
                <div className={styles.row3}>
                  <Input label="City" value={billTo.city} onChange={e => setBillTo(p => ({...p, city: e.target.value}))} />
                  <Input label="State" value={billTo.state} onChange={e => setBillTo(p => ({...p, state: e.target.value}))} />
                  <Input label="ZIP" value={billTo.zip} onChange={e => setBillTo(p => ({...p, zip: e.target.value}))} />
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Line Items */}
          <Card className={styles.section}>
            <CardHeader title="Line items" action={
              <Button variant="secondary" size="sm" icon={<Plus size={14} />} onClick={addItem}>Add item</Button>
            } />
            <CardBody style={{ padding: 0 }}>
              <div className={styles.lineItemsTable}>
                <div className={styles.lineItemHead}>
                  <span>Item</span>
                  <span>Description</span>
                  <span>Date</span>
                  <span>Hrs</span>
                  <span>Rate</span>
                  <span style={{ textAlign: 'right' }}>Amount</span>
                  <span></span>
                </div>
                {lineItems.map((item, idx) => (
                  <div key={item.id} className={styles.lineItemRow}>
                    <input className={styles.cellInput} placeholder="e.g. Redesign" value={item.item} onChange={e => updateItem(idx, 'item', e.target.value)} />
                    <input className={styles.cellInput} placeholder="Description" value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} />
                    <input className={styles.cellInput} type="date" value={item.date} onChange={e => updateItem(idx, 'date', e.target.value)} />
                    <input className={[styles.cellInput, styles.cellNum].join(' ')} type="number" min="0" placeholder="0" value={item.hours} onChange={e => updateItem(idx, 'hours', e.target.value)} />
                    <input className={[styles.cellInput, styles.cellNum].join(' ')} type="number" min="0" placeholder="50" value={item.rate} onChange={e => updateItem(idx, 'rate', e.target.value)} />
                    <span className={styles.cellAmount}>{fmt(item.amount)}</span>
                    <button className={styles.removeBtn} onClick={() => removeItem(idx)} disabled={lineItems.length === 1} aria-label="Remove item">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Totals + toggles */}
          <Card className={styles.section}>
            <CardHeader title="Totals & options" />
            <CardBody>
              <div className={styles.togglesRow}>
                <label className={styles.toggle}>
                  <input type="checkbox" checked={showDiscount} onChange={e => setShowDiscount(e.target.checked)} />
                  <span>Discount</span>
                </label>
                <label className={styles.toggle}>
                  <input type="checkbox" checked={showTax} onChange={e => setShowTax(e.target.checked)} />
                  <span>Tax</span>
                </label>
                <label className={styles.toggle}>
                  <input type="checkbox" checked={showNotes} onChange={e => setShowNotes(e.target.checked)} />
                  <span>Notes / terms</span>
                </label>
              </div>

              {showDiscount && (
                <div className={styles.row2} style={{ marginTop: 'var(--space-4)' }}>
                  <div className={styles.field}>
                    <label className={styles.label}>Discount type</label>
                    <select className={styles.selectField} value={discountType} onChange={e => setDiscountType(e.target.value)}>
                      <option value="fixed">Fixed ($)</option>
                      <option value="percent">Percent (%)</option>
                    </select>
                  </div>
                  <Input label="Discount value" type="number" min="0" value={discountValue} onChange={e => setDiscountValue(e.target.value)} />
                </div>
              )}

              {showTax && (
                <div style={{ marginTop: 'var(--space-4)', maxWidth: 200 }}>
                  <Input label="Tax rate (%)" type="number" min="0" max="100" step="0.01" value={taxRate} onChange={e => setTaxRate(e.target.value)} />
                </div>
              )}

              {/* Totals summary */}
              <div className={styles.totalsSummary}>
                <div className={styles.totalRow}><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
                {showDiscount && <div className={styles.totalRow}><span>Discount</span><span>-{fmt(discountAmount)}</span></div>}
                {showTax && <div className={styles.totalRow}><span>Tax ({taxRate}%)</span><span>{fmt(taxAmount)}</span></div>}
                <div className={[styles.totalRow, styles.grandTotal].join(' ')}><span>Grand total</span><span>{fmt(total)}</span></div>
              </div>
            </CardBody>
          </Card>

          {/* Notes */}
          {showNotes && (
            <Card className={styles.section}>
              <CardHeader title="Notes & terms" />
              <CardBody>
                <textarea
                  className={styles.notesArea}
                  rows={4}
                  placeholder="Payment terms, thank you note, or any additional information…"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </CardBody>
            </Card>
          )}
        </div>

        {/* Preview — right */}
        <div className={[styles.previewCol, tab === 'edit' ? styles.hideMobile : ''].join(' ')}>
          <div className={styles.previewSticky}>
            <div className={styles.previewLabel}>Live preview</div>
            <InvoicePreview data={invoiceData} />
          </div>
        </div>
      </div>
    </div>
  )
}
