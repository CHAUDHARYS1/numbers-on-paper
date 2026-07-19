import { useEffect, useState, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Plus, Trash, FloppyDisk, ArrowLeft, UserCheck, Copy, Eye, X } from '@phosphor-icons/react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import InvoicePreview from '@/components/invoice/InvoicePreview'
import ClientSelect from '@/components/invoice/ClientSelect'
import styles from './InvoiceEditorPage.module.css'

// ── State sales-tax rates (base rate, %) ──────────────────────────
const STATE_TAX_RATES = {
  AL: 4, AK: 0, AZ: 5.6, AR: 6.5, CA: 7.25, CO: 2.9, CT: 6.35, DE: 0,
  FL: 6, GA: 4, HI: 4, ID: 6, IL: 6.25, IN: 7, IA: 6, KS: 6.5,
  KY: 6, LA: 4.45, ME: 5.5, MD: 6, MA: 6.25, MI: 6, MN: 6.875, MS: 7,
  MO: 4.225, MT: 0, NE: 5.5, NV: 6.85, NH: 0, NJ: 6.625, NM: 5, NY: 4,
  NC: 4.75, ND: 5, OH: 5.75, OK: 4.5, OR: 0, PA: 6, RI: 7, SC: 6,
  SD: 4.5, TN: 7, TX: 6.25, UT: 5.95, VT: 6, VA: 5.3, WA: 6.5,
  WV: 6, WI: 5, WY: 4, DC: 6,
}

// ── Notes quick-fill templates ────────────────────────────────────
const NOTE_SNIPPETS = [
  { label: 'Net 30',         text: 'Payment is due within 30 days of the invoice date. Thank you for your business!' },
  { label: 'Net 15',         text: 'Payment is due within 15 days. A 1.5% monthly fee applies to balances past due.' },
  { label: 'Due on receipt', text: 'Payment is due upon receipt of this invoice.' },
  { label: '50% deposit',    text: 'A 50% deposit is required before work begins. The remaining balance is due upon project completion.' },
  { label: 'IP transfer',    text: 'All intellectual property and deliverables transfer to the client upon receipt of full payment. Additional revisions beyond the agreed scope are billed at the standard hourly rate.' },
]

// ── Auto-growing textarea ─────────────────────────────────────────
function AutoTextarea({ className, value, onChange, placeholder }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }, [value])
  return (
    <textarea
      ref={ref}
      className={className}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={1}
    />
  )
}

// ── Hours input with 0.5 step + scroll-wheel support ─────────────
function HoursInput({ value, onChange, className }) {
  const ref = useRef(null)
  const cbRef = useRef(onChange)
  cbRef.current = onChange

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const handler = (e) => {
      e.preventDefault()
      const delta = e.deltaY < 0 ? 0.5 : -0.5
      const next = Math.max(0, Math.round(((parseFloat(el.value) || 0) + delta) * 2) / 2)
      cbRef.current(String(next))
    }
    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  }, [])

  return (
    <input
      ref={ref}
      type="number"
      min="0"
      step="0.5"
      placeholder="0"
      value={value}
      onChange={e => onChange(e.target.value)}
      className={className}
    />
  )
}

// ── Helpers ───────────────────────────────────────────────────────
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

// ── Page ──────────────────────────────────────────────────────────
export default function InvoiceEditorPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const toast     = useToast()
  const isNew     = !id
  const duplicate = location.state?.duplicate ?? null
  const searchParams = new URLSearchParams(location.search)
  const presetClientId = isNew && !duplicate ? searchParams.get('client') : null
  const backTo = searchParams.get('from') || '/invoices'

  const [profile,  setProfile]  = useState(null)
  const [clients,  setClients]  = useState([])
  const [clientId, setClientId] = useState('')
  const [saving,   setSaving]   = useState(false)
  const [savingClient, setSavingClient] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [isDirty,  setIsDirty]  = useState(false)

  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [issueDate,     setIssueDate]     = useState(new Date().toISOString().slice(0, 10))
  const [dueDate,       setDueDate]       = useState('')
  const dueDateTouchedRef = useRef(false)
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

    supabase.from('clients').select('*').eq('user_id', user.id).order('name')
      .then(({ data }) => setClients(data || []))

    if (isNew) {
      supabase.rpc('next_invoice_number', { p_user_id: user.id })
        .then(({ data }) => setInvoiceNumber(data || 'INV-000001'))

      if (duplicate) {
        setBillTo(duplicate.bill_to || {})
        setClientId(duplicate.client_id || '')
        setLineItems(duplicate.line_items?.length ? duplicate.line_items.map(i => ({ ...i, id: crypto.randomUUID() })) : [DEFAULT_ITEM()])
        setDiscountType(duplicate.discount_type || 'fixed')
        setDiscountValue(duplicate.discount_value || 0)
        setTaxRate(duplicate.tax_rate || 0)
        setNotes(duplicate.notes || '')
        setShowDiscount(duplicate.show_discount ?? false)
        setShowTax(duplicate.show_tax ?? false)
        setShowNotes(duplicate.show_notes ?? true)
      }
    } else {
      supabase.from('invoices').select('*').eq('id', id).single()
        .then(({ data }) => {
          if (!data) return
          setInvoiceNumber(data.invoice_number)
          setIssueDate(data.issue_date || '')
          if (data.due_date) { dueDateTouchedRef.current = true; setDueDate(data.due_date) }
          setStatus(data.status)
          setBillTo(data.bill_to || {})
          setClientId(data.client_id || '')
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

  useEffect(() => {
    if (!previewOpen) return
    const handle = (e) => { if (e.key === 'Escape') setPreviewOpen(false) }
    document.addEventListener('keydown', handle)
    return () => document.removeEventListener('keydown', handle)
  }, [previewOpen])

  // Auto-set due date to +30 days when issue date changes (if not manually set)
  useEffect(() => {
    if (!issueDate || dueDateTouchedRef.current) return
    const d = new Date(issueDate + 'T00:00:00')
    d.setDate(d.getDate() + 30)
    setDueDate(d.toISOString().slice(0, 10))
  }, [issueDate])

  // Ctrl+S / Cmd+S to save
  const handleSaveRef = useRef(null)
  useEffect(() => {
    const handle = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSaveRef.current?.()
      }
    }
    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [])

  // ── Line item helpers ─────────────────────────────────────────

  const updateItem = (idx, field, value) => {
    setIsDirty(true)
    setLineItems(prev => {
      const next = [...prev]
      next[idx] = { ...next[idx], [field]: value }
      next[idx].amount = calcItem(next[idx])
      return next
    })
  }

  const addItem       = () => { setLineItems(p => [...p, DEFAULT_ITEM()]); setIsDirty(true) }
  const removeItem    = (idx) => { setLineItems(p => p.filter((_, i) => i !== idx)); setIsDirty(true) }
  const duplicateItem = (idx) => setLineItems(prev => {
    const copy = { ...prev[idx], id: crypto.randomUUID() }
    const next = [...prev]
    next.splice(idx + 1, 0, copy)
    return next
  })
  const copyDateToAll = (date) => {
    setLineItems(prev => prev.map(item => {
      const updated = { ...item, date }
      updated.amount = calcItem(updated)
      return updated
    }))
  }

  useEffect(() => {
    if (!presetClientId || !clients.length) return
    const c = clients.find(cl => cl.id === presetClientId)
    if (!c) return
    setClientId(c.id)
    setBillTo({
      name:          c.name,
      organization:  c.organization || '',
      address:       c.address_line1 || '',
      city:          c.city || '',
      state:         c.state || '',
      zip:           c.zip || '',
      contact_name:  c.contact_name || '',
      contact_title: c.contact_title || '',
      contact_email: c.contact_email || '',
    })
  }, [presetClientId, clients])

  // ── Client helpers ────────────────────────────────────────────

  const handleClientSelect = (id) => {
    setClientId(id)
    if (!id) {
      setBillTo({ name: '', organization: '', address: '', city: '', state: '', zip: '', contact_name: '', contact_title: '', contact_email: '' })
      return
    }
    const client = clients.find(c => c.id === id)
    if (!client) return
    setBillTo({
      name:          client.name,
      organization:  client.organization || '',
      address:       client.address_line1 || '',
      city:          client.city || '',
      state:         client.state || '',
      zip:           client.zip || '',
      contact_name:  client.contact_name || '',
      contact_title: client.contact_title || '',
      contact_email: client.contact_email || '',
    })
  }

  const handleSaveClient = async () => {
    if (!billTo.name?.trim()) return
    setSavingClient(true)
    const payload = {
      user_id: user.id, name: billTo.name.trim(),
      organization: billTo.organization || null, address_line1: billTo.address || null,
      city: billTo.city || null, state: billTo.state || null, zip: billTo.zip || null,
      contact_name: billTo.contact_name || null, contact_title: billTo.contact_title || null,
      contact_email: billTo.contact_email || null,
    }
    if (clientId) payload.id = clientId
    const { data, error } = await supabase.from('clients').upsert(payload).select().single()
    setSavingClient(false)
    if (error) {
      toast.error('Failed to save client.')
    } else {
      setClients(prev => {
        const exists = prev.find(c => c.id === data.id)
        return exists ? prev.map(c => c.id === data.id ? data : c) : [...prev, data].sort((a, b) => a.name.localeCompare(b.name))
      })
      setClientId(data.id)
      toast.success(`${data.name} saved to clients!`)
    }
  }

  // ── Tax state hint ────────────────────────────────────────────

  const stateKey       = billTo.state?.trim().toUpperCase().slice(0, 2)
  const suggestedRate  = stateKey in STATE_TAX_RATES ? STATE_TAX_RATES[stateKey] : undefined

  // ── Totals ────────────────────────────────────────────────────

  const { subtotal, discountAmount, taxAmount, total } = calcTotals(lineItems, discountType, discountValue, taxRate)

  const invoiceData = {
    invoice_number: invoiceNumber,
    issue_date: issueDate || null,
    due_date: dueDate || null,
    status,
    bill_from: profile ? {
      name: profile.full_name, business: profile.business_name,
      address: `${profile.address_line1 || ''}${profile.address_line2 ? ', ' + profile.address_line2 : ''}`,
      city: profile.city, state: profile.state, zip: profile.zip,
      phone: profile.phone, email: profile.email, logo_url: profile.logo_url || null,
    } : {},
    bill_to: billTo,
    line_items: lineItems,
    subtotal, discount_type: discountType, discount_value: discountValue,
    discount_amount: discountAmount, tax_rate: taxRate, tax_amount: taxAmount, total,
    notes, show_discount: showDiscount, show_tax: showTax, show_notes: showNotes,
  }

  const handleSave = async () => {
    setSaving(true)
    const payload = { ...invoiceData, user_id: user.id, client_id: clientId || null }
    let error
    if (isNew) {
      ({ error } = await supabase.from('invoices').insert(payload))
    } else {
      ({ error } = await supabase.from('invoices').update(payload).eq('id', id))
    }
    setSaving(false)
    if (error) {
      toast.error('Failed to save invoice. Please try again.')
    } else {
      setIsDirty(false)
      toast.success(isNew ? 'Invoice created!' : 'Invoice updated!')
      navigate(backTo)
    }
  }
  handleSaveRef.current = handleSave

  const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0)

  return (
    <div className={styles.page}>

      {/* ── Mobile header ── */}
      <div className={styles.mobileHead}>
        <div className="m-head">
          <div className="m-head-top">
            <button className="m-back" onClick={() => navigate('/invoices')}>
              <ArrowLeft size={19} /> Invoices
            </button>
            <Badge variant={status} />
          </div>
          <h1 className="m-title" style={{ marginTop: 6 }}>
            {invoiceNumber || 'New invoice'}
          </h1>
          {isDirty && <p className={`m-sub ${styles.unsavedHint}`}>Unsaved changes</p>}
        </div>
      </div>

      {duplicate && (
        <div className={styles.duplicateBanner}>
          Duplicated from <strong>{duplicate.invoice_number}</strong> — review and save when ready.
        </div>
      )}

      {/* ── Top bar (desktop) ── */}
      <div className={styles.topBar}>
        <button className={styles.back} onClick={() => navigate('/invoices')}>
          <ArrowLeft size={16} /> Invoices
        </button>
        <div className={styles.topActions}>
          <button
            className={styles.previewToggle}
            onClick={() => setPreviewOpen(true)}
            aria-label="Preview invoice"
          >
            <Eye size={14} />
            Preview
          </button>
          {isDirty && <span className={styles.unsavedBadge}>Unsaved</span>}
          <Button variant="primary" size="md" icon={<FloppyDisk size={15} />} loading={saving} onClick={handleSave}>
            {isNew ? 'Save invoice' : 'Save changes'}
          </Button>
        </div>
      </div>

      {/* ── Form ── */}
      <div className={styles.formCol}>

          {/* Invoice details */}
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
                <Input label="Issue date" type="date" value={issueDate} onChange={e => { setIssueDate(e.target.value); setIsDirty(true) }} />
                <Input label="Due date"   type="date" value={dueDate}   onChange={e => { dueDateTouchedRef.current = true; setDueDate(e.target.value); setIsDirty(true) }} />
              </div>
            </CardBody>
          </Card>

          {/* Bill To */}
          <Card className={styles.section}>
            <CardHeader title="Bill to" />
            <CardBody>
              <div className={styles.stack}>
                <ClientSelect clients={clients} value={clientId} onChange={handleClientSelect} />
                <Input label="Client name"   placeholder="Full name"              value={billTo.name}         onChange={e => setBillTo(p => ({...p, name: e.target.value}))} />
                <Input label="Organization"  placeholder="Company or organization" value={billTo.organization}  onChange={e => setBillTo(p => ({...p, organization: e.target.value}))} />
                <Input label="Address"       placeholder="Street address"          value={billTo.address}       onChange={e => setBillTo(p => ({...p, address: e.target.value}))} />
                <div className={styles.row3}>
                  <Input label="City"  value={billTo.city}  onChange={e => setBillTo(p => ({...p, city: e.target.value}))} />
                  <Input label="State" value={billTo.state} onChange={e => setBillTo(p => ({...p, state: e.target.value}))} />
                  <Input label="ZIP"   value={billTo.zip}   onChange={e => setBillTo(p => ({...p, zip: e.target.value}))} />
                </div>
                <div className={styles.row2}>
                  <Input label="Contact name"  placeholder="Jane Smith"        value={billTo.contact_name  || ''} onChange={e => setBillTo(p => ({...p, contact_name: e.target.value}))} />
                  <Input label="Contact title" placeholder="Project Manager"   value={billTo.contact_title || ''} onChange={e => setBillTo(p => ({...p, contact_title: e.target.value}))} />
                </div>
                <Input label="Contact email" type="email" placeholder="jane@company.com" value={billTo.contact_email || ''} onChange={e => setBillTo(p => ({...p, contact_email: e.target.value}))} />
                {billTo.name?.trim() && (
                  <Button variant="secondary" size="sm" icon={<UserCheck size={14} />} loading={savingClient} onClick={handleSaveClient}>
                    {clientId ? 'Update client' : 'Save as client'}
                  </Button>
                )}
              </div>
            </CardBody>
          </Card>

          {/* Line Items */}
          <Card className={styles.section}>
            <CardHeader title="Line items" action={
              <Button variant="secondary" size="sm" icon={<Plus size={14} />} onClick={addItem}>Add item</Button>
            } />
            <CardBody style={{ padding: 0 }}>

              {/* Desktop table */}
              <div className={styles.lineItemsTable}>
                <div className={styles.lineItemHead}>
                  <span>Item</span>
                  <span>Description</span>
                  <span>Date</span>
                  <span style={{ textAlign: 'right' }}>Hrs</span>
                  <span style={{ textAlign: 'right' }}>Rate</span>
                  <span style={{ textAlign: 'right' }}>Amount</span>
                  <span></span>
                </div>

                {lineItems.map((item, idx) => (
                  <div key={item.id} className={styles.lineItemRow}>

                    <AutoTextarea
                      className={styles.cellTextarea}
                      placeholder="e.g. Redesign"
                      value={item.item}
                      onChange={e => updateItem(idx, 'item', e.target.value)}
                    />

                    <AutoTextarea
                      className={styles.cellTextarea}
                      placeholder="Description (optional)"
                      value={item.description}
                      onChange={e => updateItem(idx, 'description', e.target.value)}
                    />

                    <div className={styles.dateCell}>
                      <input
                        className={styles.cellInput}
                        type="date"
                        value={item.date}
                        onChange={e => updateItem(idx, 'date', e.target.value)}
                      />
                      {item.date && (
                        <button
                          className={styles.dateCopyBtn}
                          onClick={() => copyDateToAll(item.date)}
                          title="Copy this date to all rows"
                        >
                          <Copy size={10} /> copy to all
                        </button>
                      )}
                    </div>

                    <HoursInput
                      value={item.hours}
                      onChange={val => updateItem(idx, 'hours', val)}
                      className={[styles.cellInput, styles.cellNum].join(' ')}
                    />

                    <input
                      className={[styles.cellInput, styles.cellNum].join(' ')}
                      type="number"
                      min="0"
                      placeholder="50"
                      value={item.rate}
                      onChange={e => updateItem(idx, 'rate', e.target.value)}
                    />

                    <span className={styles.cellAmount}>{fmt(item.amount)}</span>

                    <div className={styles.itemActions}>
                      <button
                        className={styles.dupBtn}
                        onClick={() => duplicateItem(idx)}
                        title="Duplicate row"
                        aria-label="Duplicate item"
                      >
                        <Copy size={13} />
                      </button>
                      <button
                        className={styles.removeBtn}
                        onClick={() => removeItem(idx)}
                        disabled={lineItems.length === 1}
                        aria-label="Remove item"
                      >
                        <Trash size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Mobile cards */}
              <div className={styles.lineItemsMobile}>
                {lineItems.map((item, idx) => (
                  <div key={item.id} className={styles.lineItemCard}>
                    <div className={styles.lineItemCardHeader}>
                      <input
                        className={styles.lineItemCardTitle}
                        placeholder="Item name"
                        value={item.item}
                        onChange={e => updateItem(idx, 'item', e.target.value)}
                      />
                      <button className={styles.dupBtn} onClick={() => duplicateItem(idx)} aria-label="Duplicate item" title="Duplicate">
                        <Copy size={14} />
                      </button>
                      <button className={styles.removeBtn} onClick={() => removeItem(idx)} disabled={lineItems.length === 1} aria-label="Remove item">
                        <Trash size={14} />
                      </button>
                    </div>
                    <textarea
                      className={styles.lineItemCardDesc}
                      placeholder="Description (optional)"
                      value={item.description}
                      onChange={e => updateItem(idx, 'description', e.target.value)}
                      rows={2}
                    />
                    <div className={styles.lineItemCardMeta}>
                      <div className={styles.lineItemCardField}>
                        <label className={styles.lineItemCardLabel}>Date</label>
                        <input className={styles.lineItemCardInput} type="date" value={item.date} onChange={e => updateItem(idx, 'date', e.target.value)} />
                      </div>
                      <div className={styles.lineItemCardField}>
                        <label className={styles.lineItemCardLabel}>Hours</label>
                        <input className={styles.lineItemCardInput} type="number" min="0" step="0.5" placeholder="0" value={item.hours} onChange={e => updateItem(idx, 'hours', e.target.value)} />
                      </div>
                      <div className={styles.lineItemCardField}>
                        <label className={styles.lineItemCardLabel}>Rate ($)</label>
                        <input className={styles.lineItemCardInput} type="number" min="0" placeholder="50" value={item.rate} onChange={e => updateItem(idx, 'rate', e.target.value)} />
                      </div>
                      <div className={styles.lineItemCardField}>
                        <label className={styles.lineItemCardLabel}>Amount</label>
                        <span className={styles.lineItemCardAmount}>{fmt(item.amount)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Totals & options */}
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
                <div className={styles.taxWrap}>
                  <Input label="Tax rate (%)" type="number" min="0" max="100" step="0.01" value={taxRate} onChange={e => setTaxRate(e.target.value)} />
                  {suggestedRate !== undefined && suggestedRate !== parseFloat(taxRate) && (
                    <button
                      className={styles.stateTaxHint}
                      onClick={() => setTaxRate(suggestedRate)}
                    >
                      Use {stateKey} state rate: {suggestedRate}%
                    </button>
                  )}
                </div>
              )}

              <div className={styles.totalsSummary}>
                <div className={styles.totalRow}><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
                {showDiscount && <div className={styles.totalRow}><span>Discount</span><span>-{fmt(discountAmount)}</span></div>}
                {showTax && <div className={styles.totalRow}><span>Tax ({taxRate}%)</span><span>{fmt(taxAmount)}</span></div>}
                <div className={[styles.totalRow, styles.grandTotal].join(' ')}><span>Grand total</span><span>{fmt(total)}</span></div>
              </div>
            </CardBody>
          </Card>

          {/* Notes & terms */}
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
                <div className={styles.notesSnippets}>
                  <span className={styles.notesSnippetsLabel}>Quick fill:</span>
                  <div className={styles.notesSnippetList}>
                    {NOTE_SNIPPETS.map(s => (
                      <button
                        key={s.label}
                        className={styles.notesSnippet}
                        onClick={() => setNotes(s.text)}
                        title={s.text}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </CardBody>
            </Card>
          )}
        </div>

      {/* ── Mobile bottom action bar ── */}
      <div className={styles.mobileActionbar}>
        <button
          className={`${styles.mActBtn} ${styles.mActGhost}`}
          onClick={() => setPreviewOpen(true)}
        >
          <Eye size={18} /> Preview
        </button>
        <button
          className={`${styles.mActBtn} ${styles.mActPrimary}`}
          onClick={handleSave}
          disabled={saving}
        >
          <FloppyDisk size={18} /> {saving ? 'Saving…' : isNew ? 'Save invoice' : 'Save changes'}
        </button>
      </div>

      {previewOpen && createPortal(
        <div
          className={styles.previewBackdrop}
          onClick={() => setPreviewOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Invoice preview"
        >
          <div className={styles.previewModal} onClick={e => e.stopPropagation()}>
            <div className={styles.previewModalHeader}>
              <span className={styles.previewModalTitle}>Preview</span>
              <button
                className={styles.previewModalClose}
                onClick={() => setPreviewOpen(false)}
                aria-label="Close preview"
              >
                <X size={18} />
              </button>
            </div>
            <div className={styles.previewModalBody}>
              <InvoicePreview data={invoiceData} />
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
