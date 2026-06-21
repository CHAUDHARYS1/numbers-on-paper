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
  const dim = size === 'lg' ? 44 : 32
  return (
    <div className={styles.avatar} style={{ width: dim, height: dim, background: color, fontSize: dim * 0.38 }}>
      {initials}
    </div>
  )
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

export default function ClientsPage() {
  const { user } = useAuth()
  const toast    = useToast()
  const [invoices,  setInvoices]  = useState([])
  const [clients,   setClients]   = useState([])
  const [search,    setSearch]    = useState('')
  const [addOpen,   setAddOpen]   = useState(false)
  const [loading,   setLoading]   = useState(true)

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
      {addOpen && <AddClientModal onClose={() => setAddOpen(false)} onSave={handleSave} />}

      {/* Summary bar */}
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

      {/* Filter row */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <MagnifyingGlass size={16} className={styles.searchIcon} />
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
                {c.contact && <div className={styles.contactRow}><User size={13} className={styles.contactIcon} />{c.contact}</div>}
                {c.email   && <div className={styles.contactRow}><EnvelopeSimple size={13} className={styles.contactIcon} />{c.email}</div>}
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
                <Link to={`/invoices?client=${c.id}`} className={styles.cardBtn}>View invoices</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
