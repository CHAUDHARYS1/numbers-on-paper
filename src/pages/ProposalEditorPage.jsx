import { useEffect, useState, useCallback, useMemo, useRef, useLayoutEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, ArrowsOut, FilePdf, FloppyDisk, Check,
  Plus, Trash, Eye, X, DotsSixVertical, UploadSimple,
} from '@phosphor-icons/react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { getProposal, createProposal, updateProposal } from '@/lib/proposals'
import { supabase } from '@/lib/supabase'
import Button from '@/components/ui/Button'
import Switch from '@/components/ui/Switch'
import ProposalDoc, { MobileProposalDoc } from '@/components/proposal/ProposalPreview'

const DEFAULT_BUSINESS = {
  name: '', tagline: '', line1: '', line2: '', logoUrl: '',
}

const TERMS_SNIPPETS = [
  { label: '50% deposit',
    text: 'A 50% deposit is required to reserve the project start date; the remaining balance is due upon final delivery. This proposal is valid for 30 days from the date above.' },
  { label: 'Milestones',
    text: 'Payment is split across three milestones: 40% at kickoff, 30% at design sign-off, and 30% on launch. Invoices are due within 14 days of issue.' },
  { label: 'Net 30',
    text: 'All invoices are payable within 30 days. Work begins upon written approval of this proposal. Scope changes are billed separately at the agreed hourly rate.' },
]

const SECTION_DEFS = [
  { key: 'intro',        name: 'Introduction',       hint: 'Opening note to the client' },
  { key: 'scope',        name: 'Scope of work',      hint: 'Overview & objectives' },
  { key: 'deliverables', name: 'Deliverables',       hint: 'What they receive' },
  { key: 'investment',   name: 'Investment',         hint: 'Pricing & line items' },
  { key: 'timeline',     name: 'Timeline',           hint: 'Phases & milestones' },
  { key: 'terms',        name: 'Terms & conditions', hint: 'Payment & legal terms' },
  { key: 'acceptance',   name: 'Acceptance',         hint: 'Signature block' },
]

const today = new Date().toISOString().split('T')[0]
const thirtyDaysOut = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
const uid = () => Math.random().toString(36).slice(2, 9)

const DEFAULT_SECTIONS = {
  intro: true, scope: true, deliverables: true, investment: true,
  timeline: true, terms: true, acceptance: true,
}

// Best-effort migration from old proposal data shape to the new shape
function migrateData(raw) {
  if (!raw) return null
  if (raw.sections) return raw  // already new format

  // Old format: title, date, clientName, clientEmail, overview, items[{desc,sub,qty,rate}], terms[]
  return {
    title: raw.title || '',
    status: 'draft',
    issue_date: raw.date || today,
    valid_until: thirtyDaysOut,
    client: { name: raw.clientName || '', contact: '', email: raw.clientEmail || '', city: raw.clientCompany || '' },
    sections: { ...DEFAULT_SECTIONS },
    introText: raw.overview || '',
    scopeText: '',
    objectives: [],
    deliverables: [],
    items: (raw.items || []).map(it => ({
      id: uid(), description: it.desc || '', note: it.sub || '', qty: it.qty ?? 1, rate: it.rate ?? 0,
    })),
    showTax: raw.taxOn ?? false,
    taxRate: raw.taxRate ?? 7,
    timeline: [],
    termsText: Array.isArray(raw.terms) ? raw.terms.join('\n\n') : '',
  }
}

// ── Scaled live-preview paper ────────────────────────────────────
function ScaledPaper({ children, designWidth = 760 }) {
  const frame = useRef(null)
  const inner = useRef(null)
  const [scale, setScale] = useState(1)
  const [height, setHeight] = useState(0)

  useLayoutEffect(() => {
    const recompute = () => {
      if (!frame.current || !inner.current) return
      const avail = frame.current.clientWidth - 42  // frame padding (20×2) + border (2)
      const s = Math.min(1, avail / designWidth)
      setScale(s)
      setHeight(inner.current.offsetHeight * s)
    }
    recompute()
    const roFrame = new ResizeObserver(recompute)
    const roInner = new ResizeObserver(recompute)
    if (frame.current) roFrame.observe(frame.current)
    if (inner.current) roInner.observe(inner.current)
    return () => { roFrame.disconnect(); roInner.disconnect() }
  }, [designWidth])

  return (
    <div className="pe-paper-frame" ref={frame} style={height ? { height: height + 40 } : {}}>
      <div
        className="pe-paper-scale"
        ref={inner}
        style={{ width: designWidth, transform: `scale(${scale})` }}
      >
        {children}
      </div>
    </div>
  )
}

// ── Field wrapper ─────────────────────────────────────────────────
function Field({ label, hint, children }) {
  return (
    <div className="fld">
      <label className="fld-label">{label}</label>
      {children}
      {hint && <span className="fld-hint">{hint}</span>}
    </div>
  )
}

// ── Repeatable list editor (objectives / deliverables) ────────────
function ListEditor({ items, onChange, placeholder, addLabel }) {
  const set  = (i, v) => onChange(items.map((it, idx) => idx === i ? v : it))
  const add  = () => onChange([...items, ''])
  const del  = (i) => onChange(items.length > 1 ? items.filter((_, idx) => idx !== i) : [''])
  return (
    <div className="stack" style={{ gap: 'var(--space-3)' }}>
      <div className="listed">
        {items.map((it, i) => (
          <div className="listed-row" key={i}>
            <DotsSixVertical size={16} className="li-handle" aria-hidden="true" />
            <input
              className="fld-input"
              value={it}
              placeholder={placeholder}
              onChange={e => set(i, e.target.value)}
            />
            <button className="li-del" onClick={() => del(i)} aria-label="Remove" type="button">
              <Trash size={13} />
            </button>
          </div>
        ))}
      </div>
      <Button variant="ghost" size="sm" onClick={add} type="button">
        <Plus size={13} /> {addLabel}
      </Button>
    </div>
  )
}

// ── Section card (dims + hides body when toggled off) ─────────────
function SectionCard({ sk, title, action, children, sections, onToggle }) {
  const on = sections[sk]
  return (
    <section className={`card${on ? '' : ' card--off'}`}>
      <div className="card-head">
        <h2 className="card-title">{title}</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          {on ? action : <span className="card-head-flag">Hidden</span>}
          <Switch checked={on} onChange={() => onToggle(sk)} />
        </div>
      </div>
      <div className="card-body">{children}</div>
    </section>
  )
}

// ── Main editor ───────────────────────────────────────────────────
export default function ProposalEditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const toast = useToast()

  // Proposal meta
  const [proposalNo, setProposalNo] = useState(null)
  const [title, setTitle]   = useState('Website redesign & brand refresh')
  const [status, setStatus] = useState('draft')
  const [issue, setIssue]   = useState(today)
  const [valid, setValid]   = useState(thirtyDaysOut)

  // Client
  const [clients, setClients]   = useState([])
  const [clientId, setClientId] = useState('')
  const [client, setClient]     = useState({ name: '', contact: '', email: '', city: '' })
  const setClientField = (field, value) => setClient(c => ({ ...c, [field]: value }))

  // Section toggles
  const [sections, setSections] = useState({ ...DEFAULT_SECTIONS })
  const toggleSection = useCallback(k => setSections(s => ({ ...s, [k]: !s[k] })), [])

  // Section content
  const [introText, setIntroText]   = useState(
    'Thank you for the opportunity to partner on this project. This proposal outlines our recommended approach, deliverables, and investment — designed to deliver exceptional results that reflect your brand and grow your business.'
  )
  const [scopeText, setScopeText]   = useState(
    "We'll redesign your marketing site end-to-end: a clear messaging hierarchy, a modern responsive design system, and a fast, accessible build organized into discovery, design, and development phases."
  )
  const [objectives, setObjectives] = useState([
    'Clarify the brand story and visual identity',
    'Increase qualified inbound leads from the site',
    'Establish a reusable design system for future pages',
  ])
  const [deliverables, setDeliverables] = useState([
    'Brand & messaging guidelines (PDF)',
    'Responsive design system in Figma',
    'Fully built marketing site — up to 8 pages',
    'CMS setup with editor training',
    '30 days of post-launch support',
  ])

  // Investment
  const [items, setItems] = useState([
    { id: uid(), description: 'Discovery & strategy workshop', note: 'Stakeholder interviews, audit, roadmap', qty: 1, rate: 2400 },
    { id: uid(), description: 'UX/UI design system',          note: 'Wireframes, hi-fi design, components',  qty: 1, rate: 5600 },
    { id: uid(), description: 'Frontend build & CMS',         note: 'Responsive build, CMS, QA',             qty: 1, rate: 6800 },
  ])
  const [showTax, setShowTax] = useState(false)
  const [taxRate, setTaxRate] = useState(7)

  // Timeline
  const [timeline, setTimeline] = useState([
    { phase: 'Discovery & strategy', duration: 'Week 1–2' },
    { phase: 'Design & sign-off',    duration: 'Week 3–5' },
    { phase: 'Build & QA',           duration: 'Week 6–8' },
    { phase: 'Launch & handoff',     duration: 'Week 9'   },
  ])

  // Terms
  const [termsText, setTermsText] = useState(TERMS_SNIPPETS[1].text)

  // Prepared by (business branding)
  const [prepBy, setPrepBy] = useState(DEFAULT_BUSINESS)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  // UI
  const [previewOpen, setPreviewOpen] = useState(false)
  const [savedFlash, setSavedFlash]   = useState(false)
  const [saving, setSaving]           = useState(false)
  const [loaded, setLoaded]           = useState(!id)

  const proposalIdRef = useRef(id || null)
  const isNewRef      = useRef(!id)
  const saveTimerRef  = useRef(null)

  // ── Fetch saved clients ───────────────────────────────────────
  useEffect(() => {
    if (!user) return
    supabase.from('clients').select('*').eq('user_id', user.id).order('name')
      .then(({ data }) => setClients(data || []))
  }, [user])

  // ── Load business profile defaults (new proposals only) ──────
  useEffect(() => {
    if (!user || id) return   // existing proposals load from saved data
    supabase.from('profiles').select('business_name,tagline,logo_url,full_name').eq('id', user.id).single()
      .then(({ data }) => {
        if (!data) return
        setPrepBy(p => ({
          ...p,
          name:    data.business_name || data.full_name || '',
          tagline: data.tagline       || '',
          logoUrl: data.logo_url      || '',
        }))
      })
  }, [user, id])

  // ── Client select autofill ────────────────────────────────────
  const handleClientSelect = (id) => {
    setClientId(id)
    if (!id) return
    const c = clients.find(cl => cl.id === id)
    if (!c) return
    setClient({
      name:    c.organization || c.name || '',
      contact: c.contact_name  || c.name || '',
      email:   c.contact_email || '',
      city:    c.city          || '',
    })
  }

  // ── Load existing proposal ────────────────────────────────────
  useEffect(() => {
    if (!id) return
    getProposal(id).then(({ data: row, error }) => {
      if (error || !row) { navigate('/proposals'); return }
      proposalIdRef.current = row.id
      isNewRef.current = false
      setProposalNo(row.proposal_no)

      const d = migrateData(row.data) || {}
      if (d.title !== undefined)       setTitle(d.title)
      if (d.status)                    setStatus(d.status)
      if (d.issue_date)                setIssue(d.issue_date)
      if (d.valid_until)               setValid(d.valid_until)
      if (d.client)                    setClient(d.client)
      if (d.sections)                  setSections({ ...DEFAULT_SECTIONS, ...d.sections })
      if (d.introText !== undefined)   setIntroText(d.introText)
      if (d.scopeText !== undefined)   setScopeText(d.scopeText)
      if (d.objectives)                setObjectives(d.objectives)
      if (d.deliverables)              setDeliverables(d.deliverables)
      if (d.items)                     setItems(d.items.map(it => ({ id: uid(), ...it })))
      if (d.showTax !== undefined)     setShowTax(d.showTax)
      if (d.taxRate !== undefined)     setTaxRate(d.taxRate)
      if (d.timeline)                  setTimeline(d.timeline)
      if (d.termsText !== undefined)   setTermsText(d.termsText)
      if (d.preparedBy)                setPrepBy({ ...DEFAULT_BUSINESS, ...d.preparedBy })
      else {
        // Existing proposal without branding — pull from profile
        supabase.from('profiles').select('business_name,tagline,logo_url,full_name').eq('id', user.id).single()
          .then(({ data: prof }) => {
            if (!prof) return
            setPrepBy({ name: prof.business_name || prof.full_name || '', tagline: prof.tagline || '', logoUrl: prof.logo_url || '', line1: '', line2: '' })
          })
      }
      setLoaded(true)
    })
  }, [id, navigate])

  // ── Escape key closes preview ─────────────────────────────────
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') setPreviewOpen(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  // ── Computed values ───────────────────────────────────────────
  const lineItems = useMemo(() =>
    items.map(it => ({
      ...it,
      qty: +it.qty || 0,
      rate: +it.rate || 0,
      amount: (+it.qty || 0) * (+it.rate || 0),
    }))
  , [items])

  const subtotal = useMemo(() => lineItems.reduce((s, it) => s + it.amount, 0), [lineItems])
  const taxAmt   = useMemo(() => showTax ? +(subtotal * (taxRate / 100)).toFixed(2) : 0, [showTax, subtotal, taxRate])
  const total    = useMemo(() => +(subtotal + taxAmt).toFixed(2), [subtotal, taxAmt])

  // ── Logo upload ───────────────────────────────────────────────
  const handleLogoUpload = async (file) => {
    if (!file || !user) return
    setUploadingLogo(true)
    const ext = file.name.split('.').pop().toLowerCase()
    const path = `${user.id}/logo.${ext}`
    const { error } = await supabase.storage.from('logos').upload(path, file, { upsert: true })
    if (error) {
      toast.error('Failed to upload logo')
      setUploadingLogo(false)
      return
    }
    const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(path)
    const logoUrl = `${publicUrl}?t=${Date.now()}`
    setPrepBy(p => ({ ...p, logoUrl }))
    await supabase.from('profiles').update({ logo_url: logoUrl }).eq('id', user.id)
    setUploadingLogo(false)
  }

  const docData = useMemo(() => ({
    number:      proposalNo ? `PROP-${String(proposalNo).padStart(4, '0')}` : 'PROP-0000',
    title, status, issue_date: issue, valid_until: valid,
    preparedBy:  prepBy,
    preparedFor: client,
    sections,
    introText, scopeText, objectives, deliverables,
    items: lineItems, subtotal, taxRate: taxRate / 100, taxAmt, total, showTax,
    timeline, termsText,
  }), [proposalNo, title, status, issue, valid, prepBy, client, sections, introText, scopeText,
       objectives, deliverables, lineItems, subtotal, taxRate, taxAmt, total, showTax,
       timeline, termsText])

  // ── Auto-save ─────────────────────────────────────────────────
  const persist = useCallback(async (snapshot) => {
    if (!user) return
    setSaving(true)
    if (isNewRef.current) {
      const { data: row, error } = await createProposal(user.id, snapshot)
      if (error) {
        toast.error('Failed to save proposal')
      } else {
        isNewRef.current = false
        proposalIdRef.current = row.id
        setProposalNo(row.proposal_no)
        navigate(`/proposals/${row.id}/edit`, { replace: true })
      }
    } else if (proposalIdRef.current) {
      const { error } = await updateProposal(proposalIdRef.current, snapshot)
      if (error) toast.error('Failed to save proposal')
    }
    setSaving(false)
  }, [user, navigate, toast])

  useEffect(() => {
    if (!loaded) return
    const saveData = {
      title, status, issue_date: issue, valid_until: valid, client, sections,
      introText, scopeText, objectives, deliverables,
      items: lineItems, showTax, taxRate, subtotal, taxAmt, total,
      timeline, termsText,
    }
    clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => persist(saveData), 1500)
    return () => clearTimeout(saveTimerRef.current)
  }, [docData, loaded, persist])  // docData as proxy for all state changes

  // ── Manual save with flash ────────────────────────────────────
  const handleSave = () => {
    clearTimeout(saveTimerRef.current)
    const saveData = {
      title, status, issue_date: issue, valid_until: valid, client, sections,
      introText, scopeText, objectives, deliverables,
      items: lineItems, showTax, taxRate, subtotal, taxAmt, total,
      timeline, termsText,
    }
    persist(saveData).then(() => {
      setSavedFlash(true)
      setTimeout(() => setSavedFlash(false), 1600)
    })
  }

  // ── PDF export via print ──────────────────────────────────────
  const handlePrint = () => {
    document.body.classList.add('proposal-print')
    window.print()
    window.addEventListener('afterprint', () => {
      document.body.classList.remove('proposal-print')
    }, { once: true })
  }

  // ── Item helpers ──────────────────────────────────────────────
  const addItem = () => setItems(its => [...its, { id: uid(), description: '', note: '', qty: 1, rate: 0 }])
  const delItem = id => setItems(its => its.length > 1 ? its.filter(it => it.id !== id) : its)
  const setItem = (id, field, val) => setItems(its => its.map(it => it.id === id ? { ...it, [field]: val } : it))

  // ── Timeline helpers ──────────────────────────────────────────
  const addMile = () => setTimeline(t => [...t, { phase: '', duration: '' }])
  const delMile = i  => setTimeline(t => t.length > 1 ? t.filter((_, idx) => idx !== i) : t)
  const setMile = (i, field, val) => setTimeline(t => t.map((m, idx) => idx === i ? { ...m, [field]: val } : m))

  if (!loaded) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <span className="spinner" />
      </div>
    )
  }

  return (
    <>
      {/* ── Page topbar ─────────────────────────────────────────── */}
      <div className="pe-topbar">
        <button
          className="pe-back"
          onClick={() => navigate('/proposals')}
          type="button"
          aria-label="Back to proposals"
        >
          <ArrowLeft size={14} /> Back
        </button>
        {/* Mobile-only title block */}
        <div className="pe-mob-head">
          <h1 className="pe-mob-title">New proposal</h1>
          <p className="pe-mob-desc">Fill in the details, toggle sections, preview.</p>
        </div>
        <div className="pe-topbar-actions">
          <Button variant="ghost" size="sm" onClick={() => setPreviewOpen(true)}>
            <ArrowsOut size={15} /> Preview
          </Button>
          <Button variant="ghost" size="sm" onClick={handlePrint}>
            <FilePdf size={15} /> Export PDF
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
            {savedFlash ? <Check size={15} /> : <FloppyDisk size={15} />}
            {savedFlash ? 'Saved' : saving ? 'Saving…' : 'Save proposal'}
          </Button>
        </div>
      </div>

      <div className="pe-grid">

        {/* ── FORM ───────────────────────────────────────────── */}
        <div className="pe-form">

          {/* 1 · Prepared by (your branding) */}
          <section className="card">
            <div className="card-head"><h2 className="card-title">Prepared by</h2></div>
            <div className="card-body">
              <div className="stack">
                {/* Logo */}
                <div className="pb-logo-row">
                  <div className="pb-logo-preview">
                    {prepBy.logoUrl
                      ? <img src={prepBy.logoUrl} alt="Business logo" className="pb-logo-img" />
                      : <span className="pb-logo-placeholder">No logo</span>
                    }
                  </div>
                  <div className="stack" style={{ gap: 'var(--space-2)', flex: 1 }}>
                    <label className="pb-upload-btn" htmlFor="pb-logo-input">
                      <UploadSimple size={14} />
                      {uploadingLogo ? 'Uploading…' : prepBy.logoUrl ? 'Change logo' : 'Upload logo'}
                    </label>
                    <input
                      id="pb-logo-input"
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={e => e.target.files?.[0] && handleLogoUpload(e.target.files[0])}
                    />
                    {prepBy.logoUrl && (
                      <button
                        className="pb-remove-logo"
                        type="button"
                        onClick={() => setPrepBy(p => ({ ...p, logoUrl: '' }))}
                      >
                        Remove logo
                      </button>
                    )}
                    <span className="fld-hint" style={{ margin: 0 }}>PNG, SVG, or JPG · shown in proposal header</span>
                  </div>
                </div>

                <Field label="Business name">
                  <input
                    className="fld-input"
                    placeholder="e.g. SC Design & Consultation"
                    value={prepBy.name}
                    onChange={e => setPrepBy(p => ({ ...p, name: e.target.value }))}
                  />
                </Field>
                <Field label="Tagline">
                  <input
                    className="fld-input"
                    placeholder="e.g. Web Design & Consultation"
                    value={prepBy.tagline}
                    onChange={e => setPrepBy(p => ({ ...p, tagline: e.target.value }))}
                  />
                </Field>
                <div className="row2">
                  <Field label="Address line 1">
                    <input
                      className="fld-input"
                      placeholder="Street address"
                      value={prepBy.line1}
                      onChange={e => setPrepBy(p => ({ ...p, line1: e.target.value }))}
                    />
                  </Field>
                  <Field label="Address line 2">
                    <input
                      className="fld-input"
                      placeholder="City, State ZIP"
                      value={prepBy.line2}
                      onChange={e => setPrepBy(p => ({ ...p, line2: e.target.value }))}
                    />
                  </Field>
                </div>
              </div>
            </div>
          </section>

          {/* 2 · Proposal details */}
          <section className="card">
            <div className="card-head"><h2 className="card-title">Proposal details</h2></div>
            <div className="card-body">
              <div className="stack">
                <Field label="Proposal title">
                  <input
                    className="fld-input"
                    value={title}
                    placeholder="e.g. Website redesign & brand refresh"
                    onChange={e => setTitle(e.target.value)}
                  />
                </Field>
                <div className="row2">
                  <Field label="Proposal number">
                    <input
                      className="fld-input fld-mono"
                      value={proposalNo ? `PROP-${String(proposalNo).padStart(4, '0')}` : 'Unsaved'}
                      readOnly
                    />
                  </Field>
                  <Field label="Status">
                    <select className="fld-select" value={status} onChange={e => setStatus(e.target.value)}>
                      <option value="draft">Draft</option>
                      <option value="sent">Sent</option>
                      <option value="accepted">Accepted</option>
                      <option value="declined">Declined</option>
                    </select>
                  </Field>
                </div>
                <div className="row2">
                  <Field label="Date">
                    <input className="fld-input fld-mono" type="date" value={issue} onChange={e => setIssue(e.target.value)} />
                  </Field>
                  <Field label="Valid until">
                    <input className="fld-input fld-mono" type="date" value={valid} onChange={e => setValid(e.target.value)} />
                  </Field>
                </div>
              </div>
            </div>
          </section>

          {/* 3 · Prepared for */}
          <section className="card">
            <div className="card-head"><h2 className="card-title">Prepared for</h2></div>
            <div className="card-body">
              <div className="stack">
                {clients.length > 0 && (
                  <Field label="Autofill from saved clients">
                    <select
                      className="fld-select"
                      value={clientId}
                      onChange={e => handleClientSelect(e.target.value)}
                    >
                      <option value="">— Select a client —</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.organization ? `${c.name} — ${c.organization}` : c.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                )}
                <div className="row2">
                  <Field label="Client name">
                    <input
                      className="fld-input"
                      placeholder="Company or person"
                      value={client.name}
                      onChange={e => setClientField('name', e.target.value)}
                    />
                  </Field>
                  <Field label="Contact">
                    <input
                      className="fld-input"
                      placeholder="Jane Smith"
                      value={client.contact}
                      onChange={e => setClientField('contact', e.target.value)}
                    />
                  </Field>
                </div>
                <div className="row2">
                  <Field label="Email">
                    <input
                      className="fld-input"
                      type="email"
                      placeholder="jane@company.com"
                      value={client.email}
                      onChange={e => setClientField('email', e.target.value)}
                    />
                  </Field>
                  <Field label="City">
                    <input
                      className="fld-input"
                      placeholder="City, ST"
                      value={client.city}
                      onChange={e => setClientField('city', e.target.value)}
                    />
                  </Field>
                </div>
              </div>
            </div>
          </section>

          {/* 4 · Sections toggle panel */}
          <section className="card">
            <div className="card-head">
              <h2 className="card-title">Sections</h2>
              <span className="card-sub">Toggle what appears in the proposal</span>
            </div>
            <div className="card-body">
              <div className="sectoggles">
                {SECTION_DEFS.map(s => (
                  <label
                    key={s.key}
                    className={`sectoggle${sections[s.key] ? '' : ' sectoggle--off'}`}
                  >
                    <Switch checked={sections[s.key]} onChange={() => toggleSection(s.key)} />
                    <div className="sectoggle-txt">
                      <div className="sectoggle-name">{s.name}</div>
                      <div className="sectoggle-hint">{s.hint}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </section>

          {/* 4 · Introduction */}
          <SectionCard sk="intro" title="Introduction" sections={sections} onToggle={toggleSection}>
            <textarea
              className="fld-textarea"
              value={introText}
              onChange={e => setIntroText(e.target.value)}
              placeholder="Open with a warm note about the project and your approach…"
              rows={5}
            />
          </SectionCard>

          {/* 5 · Scope of work */}
          <SectionCard sk="scope" title="Scope of work" sections={sections} onToggle={toggleSection}>
            <div className="stack">
              <Field label="Overview">
                <textarea
                  className="fld-textarea"
                  value={scopeText}
                  onChange={e => setScopeText(e.target.value)}
                  placeholder="Describe the work at a high level…"
                  rows={3}
                />
              </Field>
              <Field label="Objectives">
                <ListEditor
                  items={objectives}
                  onChange={setObjectives}
                  placeholder="e.g. Increase qualified leads"
                  addLabel="Add objective"
                />
              </Field>
            </div>
          </SectionCard>

          {/* 6 · Deliverables */}
          <SectionCard sk="deliverables" title="Deliverables" sections={sections} onToggle={toggleSection}>
            <ListEditor
              items={deliverables}
              onChange={setDeliverables}
              placeholder="e.g. Responsive design system in Figma"
              addLabel="Add deliverable"
            />
          </SectionCard>

          {/* 7 · Investment */}
          <SectionCard
            sk="investment"
            title="Investment"
            sections={sections}
            onToggle={toggleSection}
            action={
              <Button variant="ghost" size="sm" onClick={addItem} type="button">
                <Plus size={13} /> Add item
              </Button>
            }
          >
            {/* Desktop: table layout */}
            <div className="m-desktop-only" style={{ margin: '0 calc(-1 * var(--space-5))' }}>
              <div className="li-table">
                <div className="li-head">
                  <span>Description</span>
                  <span>Notes</span>
                  <span>Qty</span>
                  <span>Rate</span>
                  <span>Amount</span>
                  <span />
                </div>
                {lineItems.map(it => (
                  <div className="li-row" key={it.id}>
                    <input className="li-cell" placeholder="e.g. UX/UI design system" value={it.description} onChange={e => setItem(it.id, 'description', e.target.value)} />
                    <input className="li-cell" placeholder="Optional detail" value={it.note || ''} onChange={e => setItem(it.id, 'note', e.target.value)} />
                    <input className="li-cell li-num" type="number" min="0" value={it.qty} onChange={e => setItem(it.id, 'qty', e.target.value)} />
                    <input className="li-cell li-num" type="number" min="0" value={it.rate} onChange={e => setItem(it.id, 'rate', e.target.value)} />
                    <span className="li-amount">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(it.amount)}</span>
                    <button className="li-del" onClick={() => delItem(it.id)} disabled={items.length === 1} aria-label="Remove item" type="button"><Trash size={13} /></button>
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile: stacked item cards */}
            <div className="m-mobile-only">
              {lineItems.map((it, idx) => (
                <div className="m-li" key={it.id}>
                  <div className="m-li-top">
                    <span className="m-li-tag">Item {idx + 1}</span>
                    <button className="m-li-x" onClick={() => delItem(it.id)} disabled={items.length === 1} aria-label="Remove item" type="button"><X size={14} /></button>
                  </div>
                  <div className="stack" style={{ gap: 'var(--space-3)' }}>
                    <input className="fld-input" placeholder="e.g. UX/UI design system" value={it.description} onChange={e => setItem(it.id, 'description', e.target.value)} />
                    <div className="row2">
                      <Field label="Qty"><input className="fld-input fld-mono" type="number" min="0" value={it.qty} onChange={e => setItem(it.id, 'qty', e.target.value)} /></Field>
                      <Field label="Rate"><input className="fld-input fld-mono" type="number" min="0" value={it.rate} onChange={e => setItem(it.id, 'rate', e.target.value)} /></Field>
                    </div>
                    <div className="m-li-foot">
                      <span className="fld-hint" style={{ margin: 0 }}>Amount</span>
                      <span className="m-li-amt">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(it.amount)}</span>
                    </div>
                  </div>
                </div>
              ))}
              <Button variant="ghost" size="sm" onClick={addItem} type="button" style={{ width: '100%', justifyContent: 'center' }}>
                <Plus size={14} /> Add item
              </Button>
            </div>

            <div className="opt-toggles">
              <label className="opt-toggle">
                <Switch checked={showTax} onChange={setShowTax} />
                <div>
                  <div style={{ fontWeight: 500 }}>Add tax</div>
                  <div className="fld-hint" style={{ margin: 0 }}>Apply a tax rate to the subtotal</div>
                </div>
              </label>
              {showTax && (
                <div style={{ maxWidth: 160 }}>
                  <Field label="Tax rate (%)">
                    <input className="fld-input fld-mono" type="number" min="0" max="100" step="0.1" value={taxRate} onChange={e => setTaxRate(+e.target.value || 0)} />
                  </Field>
                </div>
              )}
            </div>
            <div className="totals">
              <div className="total-row"><span>Subtotal</span><span>{new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(subtotal)}</span></div>
              {showTax && <div className="total-row"><span>Tax ({taxRate}%)</span><span>{new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(taxAmt)}</span></div>}
              <div className="total-row total-grand"><span>Total</span><span>{new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(total)}</span></div>
            </div>
          </SectionCard>

          {/* 8 · Timeline */}
          <SectionCard
            sk="timeline"
            title="Timeline"
            sections={sections}
            onToggle={toggleSection}
            action={
              <Button variant="ghost" size="sm" onClick={addMile} type="button">
                <Plus size={13} /> Add phase
              </Button>
            }
          >
            <div className="stack" style={{ gap: 'var(--space-3)' }}>
              {timeline.map((m, i) => (
                <div className="mile-row" key={i}>
                  <input
                    className="fld-input"
                    placeholder="Phase name"
                    value={m.phase}
                    onChange={e => setMile(i, 'phase', e.target.value)}
                  />
                  <input
                    className="fld-input fld-mono"
                    placeholder="e.g. Week 1–2"
                    value={m.duration}
                    onChange={e => setMile(i, 'duration', e.target.value)}
                  />
                  <button
                    className="li-del"
                    onClick={() => delMile(i)}
                    disabled={timeline.length === 1}
                    aria-label="Remove phase"
                    type="button"
                  >
                    <Trash size={13} />
                  </button>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* 9 · Terms & conditions */}
          <SectionCard sk="terms" title="Terms & conditions" sections={sections} onToggle={toggleSection}>
            <textarea
              className="fld-textarea"
              value={termsText}
              onChange={e => setTermsText(e.target.value)}
              placeholder="Payment terms, validity, scope-change policy…"
              rows={5}
            />
            <div className="snips">
              <span className="snips-label">Quick fill:</span>
              {TERMS_SNIPPETS.map(s => (
                <button key={s.label} className="snip" onClick={() => setTermsText(s.text)} type="button">
                  {s.label}
                </button>
              ))}
            </div>
          </SectionCard>

          {/* 10 · Acceptance */}
          <SectionCard sk="acceptance" title="Acceptance" sections={sections} onToggle={toggleSection}>
            <p className="fld-hint" style={{ margin: 0 }}>
              A signature block for the client and date is added to the proposal. No fields to fill — it prints as signing lines.
            </p>
          </SectionCard>

        </div>

        {/* ── LIVE PREVIEW ───────────────────────────────────── */}
        <aside className="pe-preview">
          <div className="pe-prev-bar">
            <span className="pe-prev-lbl">
              <Eye size={13} aria-hidden="true" /> Live preview
            </span>
            <button className="pe-expand" onClick={() => setPreviewOpen(true)} type="button">
              <ArrowsOut size={13} /> Fullscreen
            </button>
          </div>
          <ScaledPaper>
            <ProposalDoc data={docData} />
          </ScaledPaper>
        </aside>

      </div>

      {/* ── Preview overlay (fullscreen desktop / bottom sheet mobile) ── */}
      {previewOpen && (
        <div
          className="pv-overlay"
          onClick={() => setPreviewOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Proposal preview"
        >
          <div className="pv-modal" onClick={e => e.stopPropagation()}>
            <div className="pv-modal-bar">
              <span className="ttl">Preview</span>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                {/* Desktop: export PDF + close */}
                <button className="pv-close m-desktop-only" onClick={handlePrint} aria-label="Export PDF" title="Export PDF">
                  <FilePdf size={18} />
                </button>
                <button className="pv-close" onClick={() => setPreviewOpen(false)} aria-label="Close preview">
                  <X size={18} />
                </button>
              </div>
            </div>
            {/* Desktop: scaled paper */}
            <div className="pv-body m-desktop-only">
              <ProposalDoc data={docData} />
            </div>
            {/* Mobile: flowing document */}
            <div className="pv-body m-mobile-only">
              <MobileProposalDoc data={docData} />
            </div>
            {/* Mobile: Export PDF footer */}
            <div className="pv-foot m-mobile-only">
              <Button variant="primary" onClick={handlePrint} style={{ width: '100%', height: 48, justifyContent: 'center' }}>
                <FilePdf size={16} /> Export PDF
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile bottom action bar ────────────────────────────── */}
      <div className="m-actionbar">
        <button className="m-action-preview" onClick={() => setPreviewOpen(true)} type="button">
          <Eye size={18} /> Preview
        </button>
        <button
          className={`m-action-save${savedFlash ? ' m-action-save--done' : ''}`}
          onClick={handleSave}
          disabled={saving}
          type="button"
        >
          {savedFlash ? <Check size={18} /> : <FloppyDisk size={18} />}
          {savedFlash ? 'Saved' : saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </>
  )
}
