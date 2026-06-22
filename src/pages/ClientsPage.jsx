import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Plus, MagnifyingGlass, EnvelopeSimple, MapPin, User, X } from '@phosphor-icons/react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import styles from './ClientsPage.module.css'

function fmt0(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0)
}

function Avatar({ name, size = 'lg' }) {
  const initials = (name || '?').split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
  const colors = ['#2563EB','#15803d','#7c3aed','#c2410c','#be185d','#0f766e']
  const color = colors[(name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length]
  const dim = size === 'lg' ? 44 : size === 'md' ? 40 : 32
  return (
    <div className={styles.avatar} style={{ width: dim, height: dim, background: color, fontSize: dim * 0.38 }}>
      {initials}
    </div>
  )
}

function MiniAvatar({ name }) {
  const initials = (name || '?').split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
  const colors = ['#2563EB','#15803d','#7c3aed','#c2410c','#be185d','#0f766e']
  const color = colors[(name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length]
  return <div className="m-row-ava" style={{ background: color }}>{initials}</div>
}

function AddClientModal({ onClose, onSave }) {
  const [draft, setDraft] = useState({ name: '', contact: '', email: '', city: '' })
  const set = k => e => setDraft(d => ({ ...d, [k]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!draft.name.trim()) return
    onSave(draft)
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Add client">
        <div className={styles.modalHead}>
          <h3 className={styles.modalTitle}>Add client</h3>
          <button className={styles.modalClose} onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        <form className={styles.modalBody} onSubmit={handleSubmit}>
          <div className={styles.fld}>
            <label className={styles.fldLabel}>Client name *</label>
            <input className={styles.fldInput} placeholder="Company or person" value={draft.name} onChange={set('name')} autoFocus required />
          </div>
          <div className={styles.row2}>
            <div className={styles.fld}>
              <label className={styles.fldLabel}>Contact person</label>
              <input className={styles.fldInput} placeholder="Jane Smith" value={draft.contact} onChange={set('contact')} />
            </div>
            <div className={styles.fld}>
              <label className={styles.fldLabel}>City</label>
              <input className={styles.fldInput} placeholder="Chicago, IL" value={draft.city} onChange={set('city')} />
            </div>
          </div>
          <div className={styles.fld}>
            <label className={styles.fldLabel}>Email</label>
            <input className={styles.fldInput} type="email" placeholder="jane@company.com" value={draft.email} onChange={set('email')} />
          </div>
          <div className={styles.modalFooter}>
            <button type="button" className={styles.btnGhost} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.btnPrimary}>Save client</button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* Mobile client detail bottom sheet */
function ClientDetailSheet({ client, onClose }) {
  const colors = ['#2563EB','#15803d','#7c3aed','#c2410c','#be185d','#0f766e']
  const color = colors[(client.name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length]
  const initials = (client.name || '?').split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()

  // Handle both column naming conventions in the clients table
  const contactName  = client.contact_name  || client.contact  || ''
  const contactEmail = client.contact_email || client.email    || ''

  return (
    <>
      <div className="m-scrim" onClick={onClose} />
      <div className="m-sheet" role="dialog" aria-modal="true" aria-label={client.name}>
        <div className="m-sheet-grip" />

        {/* Header */}
        <div className="m-cdet-head">
          <div className="m-cdet-ava" style={{ background: color }}>{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="m-cdet-name">{client.name}</div>
            {client.city && <div className="m-cdet-city">{client.city}</div>}
          </div>
          <button className="m-iconbtn m-iconbtn--ghost" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* Stats */}
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

        {/* Contact rows */}
        <div className="m-cdet-rows">
          {contactName && (
            <div className="m-cdet-row">
              <div className="m-cdet-row-ic"><User size={17} /></div>
              <div>
                <div className="m-cdet-row-v">{contactName}</div>
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
          {client.city && (
            <div className="m-cdet-row">
              <div className="m-cdet-row-ic"><MapPin size={17} /></div>
              <div>
                <div className="m-cdet-row-v">{client.city}</div>
                <div className="m-cdet-row-l">Location</div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ padding: '0 18px 28px', display: 'flex', gap: 10 }}>
          <Link
            to={`/clients/${client.id}/invoices`}
            className="m-btn m-btn--ghost"
            style={{ flex: 1 }}
          >
            View invoices
          </Link>
          <Link
            to={`/invoices/new?client=${client.id}`}
            className="m-btn m-btn--primary"
            style={{ flex: 1 }}
          >
            <Plus size={16} weight="bold" /> New invoice
          </Link>
        </div>
      </div>
    </>
  )
}

/* Mobile add-client bottom sheet */
function MobileAddSheet({ onClose, onSave }) {
  const [draft, setDraft] = useState({ name: '', contact: '', email: '', city: '' })
  const set = k => e => setDraft(d => ({ ...d, [k]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!draft.name.trim()) return
    onSave(draft)
  }

  return (
    <>
      <div className="m-scrim" onClick={onClose} />
      <div className="m-sheet" role="dialog" aria-modal="true">
        <div className="m-sheet-grip" />
        <div className="m-sheet-h">
          <h3>Add client</h3>
          <button className="m-iconbtn m-iconbtn--ghost" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <form className="m-sheet-body" onSubmit={handleSubmit}>
          <div className="m-stack">
            <div className="m-field">
              <label className="m-label">Client name *</label>
              <input className="m-input" placeholder="Company or person" value={draft.name} onChange={set('name')} autoFocus required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="m-field">
                <label className="m-label">Contact</label>
                <input className="m-input" placeholder="Jane Smith" value={draft.contact} onChange={set('contact')} />
              </div>
              <div className="m-field">
                <label className="m-label">City</label>
                <input className="m-input" placeholder="City, ST" value={draft.city} onChange={set('city')} />
              </div>
            </div>
            <div className="m-field">
              <label className="m-label">Email</label>
              <input className="m-input" type="email" placeholder="jane@company.com" value={draft.email} onChange={set('email')} />
            </div>
          </div>
        </form>
        <div className="m-sheet-foot">
          <button className="m-btn m-btn--ghost" onClick={onClose}>Cancel</button>
          <button className="m-btn m-btn--primary" onClick={e => { e.preventDefault(); if (!draft.name.trim()) return; onSave(draft) }}>Save client</button>
        </div>
      </div>
    </>
  )
}

export default function ClientsPage() {
  const { user } = useAuth()
  const toast    = useToast()
  const [invoices,  setInvoices]  = useState([])
  const [clients,   setClients]   = useState([])
  const [search,          setSearch]          = useState('')
  const [addOpen,         setAddOpen]         = useState(false)
  const [selectedClient,  setSelectedClient]  = useState(null)
  const [loading,         setLoading]         = useState(true)

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
      (c.contact || '').toLowerCase().includes(q) ||
      (c.city || '').toLowerCase().includes(q)
    )
  }, [enriched, search])

  const totalBilled = enriched.reduce((s, c) => s + c.billed, 0)
  const totalOut    = enriched.reduce((s, c) => s + c.outstanding, 0)

  const handleSave = async (draft) => {
    const payload = { user_id: user.id, name: draft.name.trim(), contact: draft.contact, email: draft.email, city: draft.city }
    const { data, error } = await supabase.from('clients').insert(payload).select().single()
    if (error) { toast.error('Failed to add client.'); return }
    setClients(cs => [...cs, data])
    setAddOpen(false)
    toast.success(`${data.name} added.`)
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

          {/* 3-stat row */}
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

          {/* Search */}
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
        {selectedClient && <ClientDetailSheet client={selectedClient} onClose={() => setSelectedClient(null)} />}
      </div>

      {/* ── Desktop layout ──────────────────────────────────────── */}
      <div className="d-only">
        {addOpen && <AddClientModal onClose={() => setAddOpen(false)} onSave={handleSave} />}

        {/* Sticky header */}
        <div className={styles.deskHeader}>
          <div className={styles.deskHeaderLeft}>
            <h1 className={styles.deskTitle}>Clients</h1>
            <p className={styles.deskDesc}>Everyone you bill, with their history at a glance.</p>
          </div>
          <div className={styles.deskHeaderRight}>
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

        {/* Summary row */}
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
            {[1,2,3,4,5,6].map(n => <div key={n} className={[styles.card, styles.skeleton].join(' ')} />)}
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
                <div className={styles.cardHead}>
                  <Avatar name={c.name} />
                  <div className={styles.cardHeadInfo}>
                    <div className={styles.clientName}>{c.name}</div>
                    <div className={styles.clientCity}>{c.city || '—'}</div>
                  </div>
                </div>
                <div className={styles.contact}>
                  {(c.contact_name || c.contact) && <div className={styles.contactRow}><User size={13} className={styles.contactIcon} />{c.contact_name || c.contact}</div>}
                  {(c.contact_email || c.email)  && <div className={styles.contactRow}><EnvelopeSimple size={13} className={styles.contactIcon} />{c.contact_email || c.email}</div>}
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
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
