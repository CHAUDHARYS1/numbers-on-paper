import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash, Clock, FileText, X } from '@phosphor-icons/react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import PageHeader from '@/components/layout/PageHeader'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Card, CardBody } from '@/components/ui/Card'
import ConfirmModal from '@/components/ui/ConfirmModal'
import styles from './TimeTrackerPage.module.css'

const todayStr = () => new Date().toISOString().slice(0, 10)
const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0)
const fmtDate = (d) => d
  ? new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  : '—'

const blankForm = (rate = 50) => ({
  description: '',
  date: todayStr(),
  hours: '',
  rate,
  client_id: '',
})

export default function TimeTrackerPage() {
  const { user } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const [entries,    setEntries]    = useState([])
  const [clients,    setClients]    = useState([])
  const [defaultRate, setDefaultRate] = useState(50)
  const [loading,    setLoading]    = useState(true)
  const [showForm,   setShowForm]   = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [converting, setConverting] = useState(false)
  const [selected,   setSelected]   = useState(new Set())
  const [filterStatus, setFilterStatus] = useState('uninvoiced') // 'all' | 'uninvoiced'
  const [filterClient, setFilterClient] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [form, setForm] = useState(blankForm())
  const setField = f => e => setForm(p => ({ ...p, [f]: e.target.value }))

  const load = useCallback(async () => {
    if (!user) return
    const [{ data: entriesData }, { data: clientsData }, { data: profileData }] = await Promise.all([
      supabase
        .from('time_entries')
        .select('*, clients(name)')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false }),
      supabase.from('clients').select('id, name').eq('user_id', user.id).order('name'),
      supabase.from('profiles').select('default_rate').eq('id', user.id).single(),
    ])
    setEntries(entriesData || [])
    setClients(clientsData || [])
    if (profileData?.default_rate) {
      setDefaultRate(profileData.default_rate)
      setForm(blankForm(profileData.default_rate))
    }
    setLoading(false)
  }, [user])

  useEffect(() => { load() }, [load])

  // ── Derived values ─────────────────────────────────────────────

  const filtered = entries.filter(e => {
    if (filterStatus === 'uninvoiced' && e.invoiced) return false
    if (filterClient && e.client_id !== filterClient) return false
    return true
  })

  const uninvoiced     = entries.filter(e => !e.invoiced)
  const totalHours     = entries.reduce((s, e) => s + Number(e.hours), 0)
  const uninvHours     = uninvoiced.reduce((s, e) => s + Number(e.hours), 0)
  const uninvValue     = uninvoiced.reduce((s, e) => s + Number(e.hours) * Number(e.rate), 0)

  const selectedEntries = entries.filter(e => selected.has(e.id))
  const selectedHours   = selectedEntries.reduce((s, e) => s + Number(e.hours), 0)
  const selectedAmount  = selectedEntries.reduce((s, e) => s + Number(e.hours) * Number(e.rate), 0)

  // ── Selection helpers ──────────────────────────────────────────

  const toggleSelect = (id) => setSelected(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  const toggleAll = () => {
    const selectables = filtered.filter(e => !e.invoiced)
    const allSelected = selectables.length > 0 && selectables.every(e => selected.has(e.id))
    setSelected(allSelected ? new Set() : new Set(selectables.map(e => e.id)))
  }

  // ── Handlers ──────────────────────────────────────────────────

  const handleLog = async (e) => {
    e.preventDefault()
    if (!form.description.trim()) { toast.error('Description is required.'); return }
    if (!form.hours || Number(form.hours) <= 0) { toast.error('Hours must be greater than 0.'); return }
    setSaving(true)
    const { error } = await supabase.from('time_entries').insert({
      user_id:     user.id,
      description: form.description.trim(),
      date:        form.date,
      hours:       Number(form.hours),
      rate:        Number(form.rate) || defaultRate,
      client_id:   form.client_id || null,
      invoiced:    false,
    })
    setSaving(false)
    if (error) { toast.error('Failed to log entry.'); return }
    toast.success('Time logged!')
    setForm(blankForm(defaultRate))
    setShowForm(false)
    await load()
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    const { error } = await supabase.from('time_entries').delete().eq('id', deleteTarget)
    if (error) { toast.error('Failed to delete entry.'); setDeleteTarget(null); return }
    setEntries(p => p.filter(e => e.id !== deleteTarget))
    setSelected(prev => { const next = new Set(prev); next.delete(deleteTarget); return next })
    setDeleteTarget(null)
  }

  const handleAddToInvoice = async () => {
    if (selected.size === 0) return
    setConverting(true)

    // Detect shared client
    const clientIds = [...new Set(selectedEntries.map(e => e.client_id).filter(Boolean))]
    const sharedClientId = clientIds.length === 1 ? clientIds[0] : null

    // Get next invoice number
    const { data: invoiceNumber } = await supabase.rpc('next_invoice_number', { p_user_id: user.id })

    // Build line items from selected entries (sorted by date asc)
    const sorted = [...selectedEntries].sort((a, b) => a.date.localeCompare(b.date))
    const lineItems = sorted.map(entry => ({
      id:          crypto.randomUUID(),
      item:        entry.description,
      description: '',
      date:        entry.date,
      hours:       String(entry.hours),
      rate:        Number(entry.rate),
      amount:      Number(entry.hours) * Number(entry.rate),
      type:        'hourly',
    }))
    const subtotal = lineItems.reduce((s, i) => s + i.amount, 0)

    // Resolve bill_to from shared client
    let billTo = { name: '', organization: '', address: '', city: '', state: '', zip: '' }
    if (sharedClientId) {
      const { data: c } = await supabase.from('clients').select('*').eq('id', sharedClientId).single()
      if (c) billTo = {
        name:          c.name,
        organization:  c.organization || '',
        address:       c.address_line1 || '',
        city:          c.city || '',
        state:         c.state || '',
        zip:           c.zip || '',
        contact_name:  c.contact_name || '',
        contact_title: c.contact_title || '',
        contact_email: c.contact_email || '',
      }
    }

    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

    const { data: invoice, error } = await supabase.from('invoices').insert({
      user_id:         user.id,
      client_id:       sharedClientId || null,
      invoice_number:  invoiceNumber || 'INV-000001',
      issue_date:      todayStr(),
      due_date:        dueDate,
      status:          'draft',
      bill_to:         billTo,
      line_items:      lineItems,
      subtotal,
      discount_type:   'fixed',
      discount_value:  0,
      discount_amount: 0,
      tax_rate:        0,
      tax_amount:      0,
      total:           subtotal,
      show_discount:   false,
      show_tax:        false,
      show_notes:      true,
      notes:           '',
    }).select().single()

    if (error || !invoice) {
      toast.error('Failed to create invoice.')
      setConverting(false)
      return
    }

    // Mark entries as invoiced
    await supabase
      .from('time_entries')
      .update({ invoiced: true, invoice_id: invoice.id })
      .in('id', [...selected])

    setConverting(false)
    setSelected(new Set())
    toast.success('Draft invoice created — review and save when ready.')
    navigate(`/invoices/${invoice.id}/edit`)
  }

  // ── Render ─────────────────────────────────────────────────────

  const selectables = filtered.filter(e => !e.invoiced)
  const allChecked  = selectables.length > 0 && selectables.every(e => selected.has(e.id))
  const someChecked = selectables.some(e => selected.has(e.id)) && !allChecked

  return (
    <div className={styles.page}>

      {/* ── Mobile ── */}
      <div className="m-only">
        <div className="m-head">
          <div className="m-head-top">
            <div>
              <div className="m-eyebrow">Time tracker</div>
              <h1 className="m-title">Time</h1>
            </div>
            <button className="m-iconbtn m-iconbtn--accent" onClick={() => setShowForm(true)} aria-label="Log time">
              <Plus size={22} weight="bold" />
            </button>
          </div>
        </div>
        <div className="m-body">
          {!loading && entries.length > 0 && (
            <div className="m-stats">
              <div className="m-stat"><div className="m-stat-val">{uninvHours.toFixed(1)}h</div><div className="m-stat-lbl">Uninvoiced</div></div>
              <div className="m-stat"><div className="m-stat-val">{fmt(uninvValue)}</div><div className="m-stat-lbl">Value</div></div>
              <div className="m-stat"><div className="m-stat-val">{totalHours.toFixed(1)}h</div><div className="m-stat-lbl">Total</div></div>
            </div>
          )}
          {!loading && entries.length > 0 && (
            <div style={{ display: 'flex', gap: 8, padding: '12px 0 4px' }}>
              <button className={`m-chip${filterStatus === 'uninvoiced' ? ' m-chip--on' : ''}`} onClick={() => setFilterStatus('uninvoiced')}>Uninvoiced</button>
              <button className={`m-chip${filterStatus === 'all' ? ' m-chip--on' : ''}`} onClick={() => setFilterStatus('all')}>All entries</button>
            </div>
          )}
          {loading ? (
            <div style={{ padding: '40px 0', textAlign: 'center' }}><span className="spinner" /></div>
          ) : filtered.length === 0 ? (
            <div className="m-card m-card--pad">
              <div className="m-empty">
                <Clock size={36} style={{ color: 'var(--ink-4)' }} />
                <div className="m-empty-t">{entries.length === 0 ? 'No time logged yet' : 'No entries match'}</div>
                <div className="m-empty-s">{entries.length === 0 ? 'Tap + to log your first entry.' : 'Try "All entries".'}</div>
              </div>
            </div>
          ) : (
            <div className="m-list m-card">
              {filtered.map(entry => {
                const amount = Number(entry.hours) * Number(entry.rate)
                return (
                  <div key={entry.id} className="m-row" style={{ alignItems: 'flex-start', paddingTop: 14, paddingBottom: 14 }}>
                    <div style={{ paddingTop: 2, marginRight: 4 }}>
                      <input type="checkbox" checked={selected.has(entry.id)} onChange={() => { if (!entry.invoiced) toggleSelect(entry.id) }} disabled={entry.invoiced} aria-label={`Select ${entry.description}`} />
                    </div>
                    <div className="m-row-main">
                      <div className="m-row-title">{entry.description}</div>
                      <div className="m-row-meta">{[entry.clients?.name, fmtDate(entry.date), `${Number(entry.hours).toFixed(2)}h`].filter(Boolean).join(' · ')}</div>
                    </div>
                    <div className="m-row-end" style={{ flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                      <span className="m-row-amt">{fmt(amount)}</span>
                      {entry.invoiced
                        ? <span style={{ fontSize: 11, color: 'var(--ink-4)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Invoiced</span>
                        : <button onClick={() => setDeleteTarget(entry.id)} aria-label="Delete entry" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger, #dc2626)', padding: '2px 4px', display: 'flex', alignItems: 'center' }}><Trash size={14} /></button>
                      }
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Desktop ── */}
      <div className="d-only">
        <PageHeader
          title="Time"
          description="Log hours worked and convert them to invoice line items"
          action={
            <Button variant="primary" size="md" icon={<Plus size={15} />} onClick={() => setShowForm(v => !v)}>
              Log time
            </Button>
          }
        />

        {/* ── Log form ── */}
        {showForm && (
          <Card className={styles.formCard}>
            <CardBody>
              <form onSubmit={handleLog} className={styles.logForm} noValidate>
                <div className={styles.formMain}>
                  <div className={styles.formDesc}>
                    <Input
                      label="What did you work on?"
                      placeholder="e.g. Redesign — Home page hero"
                      value={form.description}
                      onChange={setField('description')}
                      required
                      autoFocus
                    />
                  </div>
                  <div className={styles.formMeta}>
                    <Input
                      label="Date"
                      type="date"
                      value={form.date}
                      onChange={setField('date')}
                      required
                    />
                    <Input
                      label="Hours"
                      type="number"
                      min="0.25"
                      step="0.25"
                      placeholder="1.5"
                      value={form.hours}
                      onChange={setField('hours')}
                      required
                    />
                    <Input
                      label="Rate ($/hr)"
                      type="number"
                      min="0"
                      step="1"
                      placeholder="50"
                      value={form.rate}
                      onChange={setField('rate')}
                    />
                    <div className={styles.formField}>
                      <label className={styles.formLabel}>Client</label>
                      <select className={styles.formSelect} value={form.client_id} onChange={setField('client_id')}>
                        <option value="">— No client —</option>
                        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
                <div className={styles.formActions}>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
                  <Button type="submit" variant="primary" size="sm" loading={saving}>Save entry</Button>
                </div>
              </form>
            </CardBody>
          </Card>
        )}

        {/* ── Stats ── */}
        {!loading && entries.length > 0 && (
          <div className={styles.stats}>
            <div className={styles.stat}>
              <div className={styles.statValue}>{totalHours.toFixed(1)}</div>
              <div className={styles.statLabel}>Total hours</div>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.stat}>
              <div className={styles.statValue}>{uninvHours.toFixed(1)}</div>
              <div className={styles.statLabel}>Uninvoiced hrs</div>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.stat}>
              <div className={[styles.statValue, styles.statValueAccent].join(' ')}>{fmt(uninvValue)}</div>
              <div className={styles.statLabel}>Uninvoiced value</div>
            </div>
          </div>
        )}

        {/* ── Filters ── */}
        {!loading && entries.length > 0 && (
          <div className={styles.filterRow}>
            <div className={styles.filterTabs}>
              <button
                className={[styles.filterTab, filterStatus === 'uninvoiced' ? styles.filterTabActive : ''].join(' ')}
                onClick={() => setFilterStatus('uninvoiced')}
              >
                Uninvoiced
              </button>
              <button
                className={[styles.filterTab, filterStatus === 'all' ? styles.filterTabActive : ''].join(' ')}
                onClick={() => setFilterStatus('all')}
              >
                All entries
              </button>
            </div>
            {clients.length > 0 && (
              <select
                className={styles.filterSelect}
                value={filterClient}
                onChange={e => setFilterClient(e.target.value)}
                aria-label="Filter by client"
              >
                <option value="">All clients</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}
          </div>
        )}

        {/* ── Entries table ── */}
        {loading ? (
          <div className={styles.empty}>
            <span className={styles.spinner} aria-label="Loading" />
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>
            <Clock size={36} className={styles.emptyIcon} aria-hidden="true" />
            <p className={styles.emptyTitle}>
              {entries.length === 0 ? 'No time logged yet' : 'No entries match this filter'}
            </p>
            <p className={styles.emptySub}>
              {entries.length === 0
                ? 'Click "Log time" to record your first entry.'
                : 'Try "All entries" or a different client.'}
            </p>
            {entries.length === 0 && (
              <Button variant="secondary" size="sm" icon={<Plus size={14} />} onClick={() => setShowForm(true)}>
                Log your first entry
              </Button>
            )}
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.thCheck}>
                    <input
                      type="checkbox"
                      checked={allChecked}
                      ref={el => { if (el) el.indeterminate = someChecked }}
                      onChange={toggleAll}
                      aria-label="Select all uninvoiced entries"
                    />
                  </th>
                  <th className={styles.thDesc}>Description</th>
                  <th className={styles.thClient}>Client</th>
                  <th>Date</th>
                  <th className={styles.thNum}>Hours</th>
                  <th className={styles.thNum}>Rate</th>
                  <th className={styles.thNum}>Amount</th>
                  <th>Status</th>
                  <th className={styles.thActions}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(entry => {
                  const amount = Number(entry.hours) * Number(entry.rate)
                  return (
                    <tr
                      key={entry.id}
                      className={[styles.row, selected.has(entry.id) ? styles.rowSelected : ''].join(' ')}
                    >
                      <td className={styles.tdCheck}>
                        <input
                          type="checkbox"
                          checked={selected.has(entry.id)}
                          onChange={() => { if (!entry.invoiced) toggleSelect(entry.id) }}
                          disabled={entry.invoiced}
                          aria-label={`Select ${entry.description}`}
                        />
                      </td>
                      <td className={styles.tdDesc}>{entry.description}</td>
                      <td className={styles.tdClient}>
                        {entry.clients?.name ?? <span className={styles.na}>—</span>}
                      </td>
                      <td className={styles.tdDate}>{fmtDate(entry.date)}</td>
                      <td className={styles.tdNum}>{Number(entry.hours).toFixed(2)}</td>
                      <td className={styles.tdNum}>{fmt(entry.rate)}</td>
                      <td className={styles.tdNum}>{fmt(amount)}</td>
                      <td>
                        {entry.invoiced
                          ? <span className={styles.badgeInvoiced}>Invoiced</span>
                          : <span className={styles.badgeOpen}>Uninvoiced</span>}
                      </td>
                      <td className={styles.tdActions}>
                        {!entry.invoiced && (
                          <button
                            className={styles.deleteBtn}
                            onClick={() => setDeleteTarget(entry.id)}
                            aria-label={`Delete ${entry.description}`}
                          >
                            <Trash size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Selection action bar (desktop + mobile) ── */}
      {selected.size > 0 && (
        <div className={styles.selBar} role="status" aria-live="polite">
          <p className={styles.selInfo}>
            <strong>{selected.size} {selected.size === 1 ? 'entry' : 'entries'}</strong>
            &nbsp;·&nbsp;{selectedHours.toFixed(2)} hrs&nbsp;·&nbsp;{fmt(selectedAmount)}
          </p>
          <div className={styles.selActions}>
            <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
              Clear
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<FileText size={14} />}
              loading={converting}
              onClick={handleAddToInvoice}
            >
              Add to invoice
            </Button>
          </div>
        </div>
      )}

      {/* Mobile log sheet */}
      {showForm && (
        <div className="m-scrim m-only" onClick={() => setShowForm(false)}>
          <div className="m-sheet" onClick={e => e.stopPropagation()}>
            <div className="m-sheet-grip" />
            <div className="m-sheet-h">
              <h3>Log time</h3>
              <button className="m-iconbtn m-iconbtn--ghost" onClick={() => setShowForm(false)} aria-label="Close"><X size={20} /></button>
            </div>
            <div className="m-sheet-body">
              <form onSubmit={handleLog} style={{ display: 'flex', flexDirection: 'column', gap: 16 }} noValidate>
                <div className="m-field"><label className="m-label">What did you work on?</label><input className="m-input" placeholder="e.g. Redesign — Home page" value={form.description} onChange={setField('description')} required /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="m-field"><label className="m-label">Date</label><input className="m-input" type="date" value={form.date} onChange={setField('date')} required /></div>
                  <div className="m-field"><label className="m-label">Hours</label><input className="m-input" type="number" min="0.25" step="0.25" placeholder="1.5" value={form.hours} onChange={setField('hours')} required /></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="m-field"><label className="m-label">Rate ($/hr)</label><input className="m-input" type="number" min="0" value={form.rate} onChange={setField('rate')} /></div>
                  <div className="m-field"><label className="m-label">Client</label><select className="m-input" value={form.client_id} onChange={setField('client_id')} style={{ height: 44 }}><option value="">— No client —</option>{clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                </div>
                <button type="submit" className="m-btn m-btn--primary" disabled={saving}>{saving ? 'Saving…' : 'Log time'}</button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirmation ── */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete time entry?"
        message="This time entry will be permanently deleted."
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
