import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus, MagnifyingGlass, EnvelopeSimple, MapPin, User, X,
  PencilSimple, TrashSimple, Phone, Globe, Buildings, Note, Receipt,
  IdentificationBadge,
} from '@phosphor-icons/react'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import styles from './ClientsPage.module.css'

function fmt0(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0)
}

const CLIENT_COLORS = ['#2563EB','#15803d','#7c3aed','#c2410c','#be185d','#0f766e']
function getClientColor(name) {
  return CLIENT_COLORS[(name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % CLIENT_COLORS.length]
}

const BLANK_DRAFT = {
  name: '', industry: '', contact_name: '', contact_title: '',
  phone: '', email: '', website: '',
  address_line1: '', city: '', state: '', zip: '',
  payment_terms: 'Net 30', tax_id: '', notes: '',
}
function draftFromClient(c) {
  return {
    name:          c.name || '',
    industry:      c.industry || '',
    contact_name:  c.contact_name || c.contact || '',
    contact_title: c.contact_title || '',
    phone:         c.phone || '',
    email:         c.email || '',
    website:       c.website || '',
    address_line1: c.address_line1 || '',
    city:          c.city || '',
    state:         c.state || '',
    zip:           c.zip || '',
    payment_terms: c.payment_terms || 'Net 30',
    tax_id:        c.tax_id || '',
    notes:         c.notes || '',
  }
}
function payloadFromDraft(draft) {
  return {
    name:          draft.name.trim(),
    industry:      draft.industry      || null,
    contact_name:  draft.contact_name  || null,
    contact_title: draft.contact_title || null,
    phone:         draft.phone         || null,
    email:         draft.email         || null,
    website:       draft.website       || null,
    address_line1: draft.address_line1 || null,
    city:          draft.city          || null,
    state:         draft.state         || null,
    zip:           draft.zip           || null,
    payment_terms: draft.payment_terms || null,
    tax_id:        draft.tax_id        || null,
    notes:         draft.notes         || null,
  }
}

function Avatar({ name, size = 'lg' }) {
  const initials = (name || '?').split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
  const dim = size === 'lg' ? 44 : size === 'md' ? 40 : 32
  return (
    <div className={styles.avatar} style={{ width: dim, height: dim, background: getClientColor(name), fontSize: dim * 0.38 }}>
      {initials}
    </div>
  )
}

function MiniAvatar({ name }) {
  const initials = (name || '?').split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
  return <div className="m-row-ava" style={{ background: getClientColor(name) }}>{initials}</div>
}

/* ── Shared client form (desktop modal + mobile sheet body) ── */
function ClientForm({ draft, set }) {
  return (
    <>
      <p className={styles.fldSection}>Client</p>
      <div className={styles.fld}>
        <label className={styles.fldLabel}>Name *</label>
        <input className={styles.fldInput} placeholder="Company or person" value={draft.name} onChange={set('name')} autoFocus required />
      </div>
      <div className={styles.fld}>
        <label className={styles.fldLabel}>Industry</label>
        <input className={styles.fldInput} placeholder="e.g. SaaS, Healthcare" value={draft.industry} onChange={set('industry')} />
      </div>

      <p className={styles.fldSection}>Primary contact</p>
      <div className={styles.row2}>
        <div className={styles.fld}>
          <label className={styles.fldLabel}>Name</label>
          <input className={styles.fldInput} placeholder="Jane Smith" value={draft.contact_name} onChange={set('contact_name')} />
        </div>
        <div className={styles.fld}>
          <label className={styles.fldLabel}>Title</label>
          <input className={styles.fldInput} placeholder="CEO" value={draft.contact_title} onChange={set('contact_title')} />
        </div>
      </div>
      <div className={styles.row2}>
        <div className={styles.fld}>
          <label className={styles.fldLabel}>Email</label>
          <input className={styles.fldInput} type="email" placeholder="jane@company.com" value={draft.email} onChange={set('email')} />
        </div>
        <div className={styles.fld}>
          <label className={styles.fldLabel}>Phone</label>
          <input className={styles.fldInput} type="tel" placeholder="+1 (555) 000-0000" value={draft.phone} onChange={set('phone')} />
        </div>
      </div>
      <div className={styles.fld}>
        <label className={styles.fldLabel}>Website</label>
        <input className={styles.fldInput} placeholder="https://acmecorp.com" value={draft.website} onChange={set('website')} />
      </div>

      <p className={styles.fldSection}>Address</p>
      <div className={styles.fld}>
        <label className={styles.fldLabel}>Street</label>
        <input className={styles.fldInput} placeholder="123 Main St" value={draft.address_line1} onChange={set('address_line1')} />
      </div>
      <div className={styles.row3}>
        <div className={styles.fld}>
          <label className={styles.fldLabel}>City</label>
          <input className={styles.fldInput} placeholder="Chicago" value={draft.city} onChange={set('city')} />
        </div>
        <div className={styles.fld}>
          <label className={styles.fldLabel}>State</label>
          <input className={styles.fldInput} placeholder="IL" value={draft.state} onChange={set('state')} />
        </div>
        <div className={styles.fld}>
          <label className={styles.fldLabel}>ZIP</label>
          <input className={styles.fldInput} placeholder="60601" value={draft.zip} onChange={set('zip')} />
        </div>
      </div>

      <p className={styles.fldSection}>Billing</p>
      <div className={styles.row2}>
        <div className={styles.fld}>
          <label className={styles.fldLabel}>Payment terms</label>
          <select className={styles.fldSelect} value={draft.payment_terms} onChange={set('payment_terms')}>
            <option value="">— None —</option>
            <option value="Due on receipt">Due on receipt</option>
            <option value="Net 15">Net 15</option>
            <option value="Net 30">Net 30</option>
            <option value="Net 60">Net 60</option>
            <option value="Net 90">Net 90</option>
          </select>
        </div>
        <div className={styles.fld}>
          <label className={styles.fldLabel}>Tax / VAT ID</label>
          <input className={styles.fldInput} placeholder="EIN or VAT" value={draft.tax_id} onChange={set('tax_id')} />
        </div>
      </div>

      <p className={styles.fldSection}>Notes</p>
      <div className={styles.fld}>
        <label className={styles.fldLabel}>Internal notes</label>
        <textarea
          className={styles.fldTextarea}
          placeholder="Anything useful about working with this client…"
          value={draft.notes}
          onChange={set('notes')}
        />
      </div>
    </>
  )
}

/* ── Desktop add / edit modal ───────────────────────────────── */
function AddClientModal({ onClose, onSave, initialData = null }) {
  const editing = initialData != null
  const [draft, setDraft] = useState(editing ? draftFromClient(initialData) : { ...BLANK_DRAFT })
  const set = k => e => setDraft(d => ({ ...d, [k]: e.target.value }))

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={editing ? 'Edit client' : 'Add client'}>
        <div className={styles.modalHead}>
          <h3 className={styles.modalTitle}>{editing ? 'Edit client' : 'Add client'}</h3>
          <button className={styles.modalClose} onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        <form onSubmit={e => { e.preventDefault(); if (!draft.name.trim()) return; onSave(draft) }}>
          <div className={styles.modalScroll}>
            <ClientForm draft={draft} set={set} />
          </div>
          <div className={styles.modalFooter}>
            <button type="button" className={styles.btnGhost} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.btnPrimary}>{editing ? 'Save changes' : 'Save client'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── Mobile client detail bottom sheet ─────────────────────── */
function ClientDetailSheet({ client, onClose, onEdit, onDelete }) {
  const color    = getClientColor(client.name)
  const initials = (client.name || '?').split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
  const contactName  = client.contact_name  || client.contact  || ''
  const contactEmail = client.contact_email || client.email    || ''
  const location     = [client.city, client.state, client.zip].filter(Boolean).join(', ')

  return (
    <>
      <div className="m-scrim" onClick={onClose} />
      <div className="m-sheet" role="dialog" aria-modal="true" aria-label={client.name}>
        <div className="m-sheet-grip" />

        <div className="m-cdet-head">
          <div className="m-cdet-ava" style={{ background: color }}>{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="m-cdet-name">{client.name}</div>
            {client.industry && <div className="m-cdet-city">{client.industry}</div>}
          </div>
          <button className="m-iconbtn m-iconbtn--ghost" onClick={onEdit} aria-label="Edit client">
            <PencilSimple size={20} />
          </button>
          <button className="m-iconbtn m-iconbtn--ghost" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="m-cdet-stats">
          <div className="m-stat" style={{ padding: '12px 10px', textAlign: 'center' }}>
            <div className="m-stat-val" style={{ fontSize: 18 }}>{client.count}</div>
            <div className="m-stat-lbl">Invoices</div>
          </div>
          <div className="m-stat" style={{ padding: '12px 10px', textAlign: 'center' }}>
            <div className="m-stat-val" style={{ fontSize: 18 }}>{fmt0(client.billed)}</div>
            <div className="m-stat-lbl">Billed</div>
          </div>
          <div className="m-stat" style={{ padding: '12px 10px', textAlign: 'center' }}>
            <div className="m-stat-val" style={{ fontSize: 18, color: client.outstanding ? 'var(--amber)' : 'var(--ink)' }}>
              {fmt0(client.outstanding)}
            </div>
            <div className="m-stat-lbl">Due</div>
          </div>
        </div>

        <div className="m-cdet-rows">
          {contactName && (
            <div className="m-cdet-row">
              <div className="m-cdet-row-ic"><User size={17} /></div>
              <div>
                <div className="m-cdet-row-v">{contactName}{client.contact_title ? `, ${client.contact_title}` : ''}</div>
                <div className="m-cdet-row-l">Primary contact</div>
              </div>
            </div>
          )}
          {contactEmail && (
            <a href={`mailto:${contactEmail}`} className="m-cdet-row m-cdet-row--link">
              <div className="m-cdet-row-ic"><EnvelopeSimple size={17} /></div>
              <div style={{ minWidth: 0 }}>
                <div className="m-cdet-row-v" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{contactEmail}</div>
                <div className="m-cdet-row-l">Email</div>
              </div>
            </a>
          )}
          {client.phone && (
            <a href={`tel:${client.phone}`} className="m-cdet-row m-cdet-row--link">
              <div className="m-cdet-row-ic"><Phone size={17} /></div>
              <div>
                <div className="m-cdet-row-v">{client.phone}</div>
                <div className="m-cdet-row-l">Phone</div>
              </div>
            </a>
          )}
          {client.website && (
            <a href={client.website} target="_blank" rel="noopener noreferrer" className="m-cdet-row m-cdet-row--link">
              <div className="m-cdet-row-ic"><Globe size={17} /></div>
              <div style={{ minWidth: 0 }}>
                <div className="m-cdet-row-v" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{client.website.replace(/^https?:\/\//, '')}</div>
                <div className="m-cdet-row-l">Website</div>
              </div>
            </a>
          )}
          {location && (
            <div className="m-cdet-row">
              <div className="m-cdet-row-ic"><MapPin size={17} /></div>
              <div>
                <div className="m-cdet-row-v">{location}</div>
                <div className="m-cdet-row-l">Location</div>
              </div>
            </div>
          )}
          {client.payment_terms && (
            <div className="m-cdet-row">
              <div className="m-cdet-row-ic"><Receipt size={17} /></div>
              <div>
                <div className="m-cdet-row-v">{client.payment_terms}</div>
                <div className="m-cdet-row-l">Payment terms</div>
              </div>
            </div>
          )}
          {client.tax_id && (
            <div className="m-cdet-row">
              <div className="m-cdet-row-ic"><IdentificationBadge size={17} /></div>
              <div>
                <div className="m-cdet-row-v">{client.tax_id}</div>
                <div className="m-cdet-row-l">Tax / VAT ID</div>
              </div>
            </div>
          )}
          {client.notes && (
            <div className="m-cdet-row">
              <div className="m-cdet-row-ic" style={{ marginTop: 2 }}><Note size={17} /></div>
              <div>
                <div className="m-cdet-row-v" style={{ whiteSpace: 'pre-wrap' }}>{client.notes}</div>
                <div className="m-cdet-row-l">Notes</div>
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: '0 18px 10px', display: 'flex', gap: 10 }}>
          <Link to={`/clients/${client.id}/invoices`} className="m-btn m-btn--ghost" style={{ flex: 1 }}>
            View invoices
          </Link>
          <Link to={`/invoices/new?client=${client.id}`} className="m-btn m-btn--primary" style={{ flex: 1 }}>
            <Plus size={16} weight="bold" /> New invoice
          </Link>
        </div>
        <div style={{ padding: '0 18px 28px' }}>
          <button className="m-btn m-btn--ghost" style={{ width: '100%', color: 'var(--color-danger-text)' }} onClick={onDelete}>
            <TrashSimple size={16} /> Delete client
          </button>
        </div>
      </div>
    </>
  )
}

/* ── Mobile add / edit client sheet ─────────────────────────── */
function MobileAddSheet({ onClose, onSave, initialData = null }) {
  const editing = initialData != null
  const [draft, setDraft] = useState(editing ? draftFromClient(initialData) : { ...BLANK_DRAFT })
  const set = k => e => setDraft(d => ({ ...d, [k]: e.target.value }))

  return (
    <>
      <div className="m-scrim" onClick={onClose} />
      <div className="m-sheet" role="dialog" aria-modal="true">
        <div className="m-sheet-grip" />
        <div className="m-sheet-h">
          <h3>{editing ? 'Edit client' : 'Add client'}</h3>
          <button className="m-iconbtn m-iconbtn--ghost" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="m-sheet-body">
          <div className="m-stack">
            <ClientForm draft={draft} set={set} />
          </div>
        </div>
        <div className="m-sheet-foot">
          <button className="m-btn m-btn--ghost" onClick={onClose}>Cancel</button>
          <button
            className="m-btn m-btn--primary"
            onClick={() => { if (!draft.name.trim()) return; onSave(draft) }}
          >
            {editing ? 'Save changes' : 'Save client'}
          </button>
        </div>
      </div>
    </>
  )
}

export default function ClientsPage() {
  const { user } = useAuth()
  const toast    = useToast()
  const [invoices,       setInvoices]       = useState([])
  const [clients,        setClients]        = useState([])
  const [search,         setSearch]         = useState('')
  const [addOpen,        setAddOpen]        = useState(false)
  const [selectedClient, setSelectedClient] = useState(null)
  const [editClient,     setEditClient]     = useState(null)
  const [deleteClient,   setDeleteClient]   = useState(null)
  const [loading,        setLoading]        = useState(true)

  useEffect(() => {
    if (!user) return
    Promise.all([
      supabase.from('invoices').select('*').eq('user_id', user.id),
      supabase.from('clients').select('*').eq('user_id', user.id).order('name'),
    ]).then(([invRes, cliRes]) => {
      setInvoices(invRes.data || [])
      setClients(cliRes.data || [])
      setLoading(false)
    })
  }, [user])

  const enriched = useMemo(() => {
    return clients.map(c => {
      const inv = invoices.filter(i => i.client_id === c.id || i.bill_to?.name === c.name)
      const billed      = inv.filter(i => i.status !== 'draft').reduce((s, i) => s + (i.total || 0), 0)
      const outstanding = inv.filter(i => ['unpaid','overdue'].includes(i.status)).reduce((s, i) => s + (i.total || 0), 0)
      return { ...c, count: inv.length, billed, outstanding }
    }).sort((a, b) => b.billed - a.billed)
  }, [clients, invoices])

  const view = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return enriched
    return enriched.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.contact_name || c.contact || '').toLowerCase().includes(q) ||
      (c.city || '').toLowerCase().includes(q) ||
      (c.industry || '').toLowerCase().includes(q)
    )
  }, [enriched, search])

  const totalBilled = enriched.reduce((s, c) => s + c.billed, 0)
  const totalOut    = enriched.reduce((s, c) => s + c.outstanding, 0)

  const handleSave = async (draft) => {
    const payload = { user_id: user.id, ...payloadFromDraft(draft) }
    const { data, error } = await supabase.from('clients').insert(payload).select().single()
    if (error) { toast.error('Failed to add client.'); return }
    setClients(cs => [...cs, data])
    setAddOpen(false)
    toast.success(`${data.name} added.`)
  }

  const handleUndo = async (client) => {
    const { count, billed, outstanding, ...row } = client
    const { data, error } = await supabase.from('clients').insert(row).select().single()
    if (error) { toast.error('Could not restore client.'); return }
    setClients(cs => [...cs, data])
    toast.success(`${client.name} restored.`)
  }

  const handleDeleteConfirm = async () => {
    const client = deleteClient
    setDeleteClient(null)
    setClients(cs => cs.filter(c => c.id !== client.id))
    const { error } = await supabase.from('clients').delete().eq('id', client.id).eq('user_id', user.id)
    if (error) {
      setClients(cs => [...cs, client])
      toast.error('Failed to delete client.')
      return
    }
    toast.success(`${client.name} deleted.`, {
      duration: 6000,
      action: { label: 'Undo', onClick: () => handleUndo(client) },
    })
  }

  const handleUpdate = async (draft) => {
    const { data, error } = await supabase
      .from('clients')
      .update(payloadFromDraft(draft))
      .eq('id', editClient.id)
      .eq('user_id', user.id)
      .select()
      .single()
    if (error) { toast.error('Failed to update client.'); return }
    setClients(cs => cs.map(c => c.id === data.id ? { ...c, ...data } : c))
    setEditClient(null)
    toast.success(`${data.name} updated.`)
  }

  return (
    <div>
      {/* ── Mobile layout ────────────────────────────────────────── */}
      <div className="m-only">
        <div className="m-head">
          <div className="m-head-top">
            <div>
              <div className="m-eyebrow">Clients</div>
              <h1 className="m-title">Clients</h1>
              <p className="m-sub">Everyone you bill, with their history at a glance.</p>
            </div>
            <button className="m-iconbtn m-iconbtn--accent" onClick={() => setAddOpen(true)} aria-label="Add client">
              <Plus size={22} weight="bold" />
            </button>
          </div>

          <div className="m-stats" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginTop: 16 }}>
            <div className="m-stat" style={{ padding: '13px 12px' }}>
              <div className="m-stat-val" style={{ fontSize: 20 }}>{enriched.length}</div>
              <div className="m-stat-lbl" style={{ marginTop: 3 }}>Clients</div>
            </div>
            <div className="m-stat" style={{ padding: '13px 12px' }}>
              <div className="m-stat-val" style={{ fontSize: 20 }}>{fmt0(totalBilled)}</div>
              <div className="m-stat-lbl" style={{ marginTop: 3 }}>Billed</div>
            </div>
            <div className="m-stat" style={{ padding: '13px 12px' }}>
              <div className="m-stat-val" style={{ fontSize: 20, color: totalOut ? 'var(--amber)' : 'var(--ink)' }}>{fmt0(totalOut)}</div>
              <div className="m-stat-lbl" style={{ marginTop: 3 }}>Due</div>
            </div>
          </div>

          <div className="m-search" style={{ marginTop: 14 }}>
            <MagnifyingGlass size={18} />
            <input
              placeholder="Search clients…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              aria-label="Search clients"
            />
          </div>
        </div>

        <div className="m-body">
          {loading ? (
            <div className="m-list m-card">
              {[1,2,3].map(n => <div key={n} className={styles.mSkeletonRow} />)}
            </div>
          ) : view.length === 0 ? (
            <div className="m-card m-card--pad">
              <div className="m-empty">
                <User size={36} style={{ color: 'var(--ink-4)' }} />
                <div className="m-empty-t">No clients found</div>
                <div className="m-empty-s">{search ? 'Try a different search.' : 'Add your first client.'}</div>
                {!search && (
                  <button className="m-btn m-btn--primary" style={{ maxWidth: 200, margin: '0 auto' }} onClick={() => setAddOpen(true)}>
                    <Plus size={18} weight="bold" /> Add client
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="m-list m-card">
              {view.map(c => (
                <div key={c.id} className="m-row" onClick={() => setSelectedClient(c)} style={{ cursor: 'pointer' }}>
                  <MiniAvatar name={c.name} />
                  <div className="m-row-main">
                    <div className="m-row-title">{c.name}</div>
                    <div className="m-row-meta">{c.city || '—'} · {c.count} invoice{c.count === 1 ? '' : 's'}</div>
                  </div>
                  <div className="m-row-end">
                    <span className="m-row-amt">{fmt0(c.billed)}</span>
                    {c.outstanding
                      ? <span className="m-row-num" style={{ color: 'var(--amber)' }}>{fmt0(c.outstanding)} due</span>
                      : <span className="m-row-num" style={{ color: 'var(--ink-4)' }}>paid up</span>
                    }
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {addOpen && <MobileAddSheet onClose={() => setAddOpen(false)} onSave={handleSave} />}
        {editClient && <MobileAddSheet onClose={() => setEditClient(null)} onSave={handleUpdate} initialData={editClient} />}
        {selectedClient && (
          <ClientDetailSheet
            client={selectedClient}
            onClose={() => setSelectedClient(null)}
            onEdit={() => { setEditClient(selectedClient); setSelectedClient(null) }}
            onDelete={() => { setDeleteClient(selectedClient); setSelectedClient(null) }}
          />
        )}
      </div>

      <ConfirmModal
        isOpen={deleteClient !== null}
        title={`Delete ${deleteClient?.name}?`}
        message="This will permanently remove this client. You can undo right after."
        confirmLabel="Delete client"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteClient(null)}
      />

      {/* ── Desktop layout ──────────────────────────────────────── */}
      <div className="d-only">
        {addOpen    && <AddClientModal onClose={() => setAddOpen(false)}    onSave={handleSave} />}
        {editClient && <AddClientModal onClose={() => setEditClient(null)}  onSave={handleUpdate} initialData={editClient} />}

        <div className="page-header">
          <div className="page-header__left">
            <h1 className="page-header__title">Clients</h1>
            <p className="page-header__desc">Everyone you bill, with their history at a glance.</p>
          </div>
          <div className="page-header__right">
            <div className={styles.searchWrap}>
              <MagnifyingGlass size={15} className={styles.searchIcon} />
              <input
                className={styles.searchInput}
                placeholder="Search clients…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                aria-label="Search clients"
              />
            </div>
            <button className={styles.btnPrimary} onClick={() => setAddOpen(true)}>
              <Plus size={15} /> Add client
            </button>
          </div>
        </div>

        <div className={styles.summary}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryVal}>{enriched.length}</span>
            <span className={styles.summaryLbl}>Clients</span>
          </div>
          <div className={styles.summaryDiv} />
          <div className={styles.summaryItem}>
            <span className={styles.summaryVal}>{fmt0(totalBilled)}</span>
            <span className={styles.summaryLbl}>Total billed</span>
          </div>
          <div className={styles.summaryDiv} />
          <div className={styles.summaryItem}>
            <span className={styles.summaryVal} style={{ color: totalOut ? 'var(--amber)' : 'var(--ink)' }}>{fmt0(totalOut)}</span>
            <span className={styles.summaryLbl}>Outstanding</span>
          </div>
        </div>

        {loading ? (
          <div className={styles.grid}>
            {[1,2,3,4,5,6].map(n => (
              <div key={n} className={[styles.card, styles.skeleton].join(' ')}>
                <div className={styles.cardSpine} />
                <div className={styles.cardBody} />
              </div>
            ))}
          </div>
        ) : view.length === 0 ? (
          <div className={styles.emptyCard}>
            <p className={styles.emptyTitle}>No clients found</p>
            <p className={styles.emptySub}>{search ? 'Try a different search.' : 'Add your first client to get started.'}</p>
            {search
              ? <button className={styles.btnGhost} onClick={() => setSearch('')}>Clear search</button>
              : <button className={styles.btnPrimary} onClick={() => setAddOpen(true)}><Plus size={15} /> Add client</button>
            }
          </div>
        ) : (
          <div className={styles.grid}>
            {view.map(c => (
              <div className={styles.card} key={c.id}>
                <div className={styles.cardSpine} style={{ background: getClientColor(c.name) }}>
                  <span className={styles.spineName}>{c.name}</span>
                </div>
                <div className={styles.cardBody}>
                  <div className={styles.cardHead}>
                    <Avatar name={c.name} />
                    <div className={styles.cardHeadInfo}>
                      <div className={styles.clientCity}>{c.city || '—'}</div>
                      {c.industry && <div className={styles.clientIndustry}>{c.industry}</div>}
                    </div>
                    <button className={styles.editBtn} onClick={() => setEditClient(c)} aria-label={`Edit ${c.name}`}>
                      <PencilSimple size={15} />
                    </button>
                    <button className={styles.deleteBtn} onClick={() => setDeleteClient(c)} aria-label={`Delete ${c.name}`}>
                      <TrashSimple size={15} />
                    </button>
                  </div>
                  <div className={styles.contact}>
                    {(c.contact_name || c.contact) && (
                      <div className={styles.contactRow}>
                        <User size={13} className={styles.contactIcon} />
                        {c.contact_name || c.contact}
                        {c.contact_title && <span className={styles.contactMeta}>{c.contact_title}</span>}
                      </div>
                    )}
                    {(c.contact_email || c.email) && (
                      <div className={styles.contactRow}>
                        <EnvelopeSimple size={13} className={styles.contactIcon} />
                        {c.contact_email || c.email}
                      </div>
                    )}
                    {c.phone && (
                      <div className={styles.contactRow}>
                        <Phone size={13} className={styles.contactIcon} />
                        {c.phone}
                      </div>
                    )}
                    {c.website && (
                      <a
                        href={c.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={[styles.contactRow, styles.contactLink].join(' ')}
                        onClick={e => e.stopPropagation()}
                      >
                        <Globe size={13} className={styles.contactIcon} />
                        {c.website.replace(/^https?:\/\//, '')}
                      </a>
                    )}
                  </div>
                  <div className={styles.stats}>
                    <div className={styles.stat}>
                      <span className={[styles.statV, !c.count ? styles.statZero : ''].join(' ')}>{c.count}</span>
                      <span className={styles.statL}>Invoices</span>
                    </div>
                    <div className={styles.stat}>
                      <span className={[styles.statV, !c.billed ? styles.statZero : ''].join(' ')}>{fmt0(c.billed)}</span>
                      <span className={styles.statL}>Billed</span>
                    </div>
                    <div className={styles.stat}>
                      <span className={[styles.statV, c.outstanding ? styles.statDue : styles.statZero].join(' ')}>{fmt0(c.outstanding)}</span>
                      <span className={styles.statL}>Due</span>
                    </div>
                  </div>
                  <div className={styles.cardActions}>
                    <Link to={`/invoices/new?client=${c.id}`} className={styles.cardBtn}><Plus size={13} /> Invoice</Link>
                    <Link to={`/clients/${c.id}/invoices`} className={styles.cardBtn}>View invoices</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
