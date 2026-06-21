import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import html2pdf from 'html2pdf.js'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Eye, EyeOff, Printer, RotateCcw, ChevronRight,
  Plus, Trash2, ArrowLeft,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { getProposal, createProposal, updateProposal } from '@/lib/proposals'
import ProposalPreview from '@/components/proposal/ProposalPreview'
import styles from './ProposalEditorPage.module.css'

// ── Default template ──────────────────────────────────────────────
const DEFAULT_DATA = {
  title: 'Website Design & Development',
  kicker: 'Web Design Proposal',
  proposalNo: null,
  date: new Date().toISOString().split('T')[0],
  validDays: 30,
  timeline: '8–10 weeks',
  clientName: '',
  clientCompany: '',
  clientEmail: '',
  fromName: 'SC Design & Consultation',
  fromContact: 'Shital Chaudhary',
  fromEmail: 'hello@scdesign.co',
  fromPhone: '',
  overview:
    "We're excited to partner with you on this project. SC Design & Consultation will deliver a custom website experience — from initial design concepts through final development — that reflects your brand, engages your audience, and drives results.\n\nOur process is collaborative and transparent: you'll be involved at every key milestone, and we won't move forward without your approval.",
  scope: [
    {
      title: 'Website Design',
      items: ['Custom UI/UX design', 'Brand style guide', 'Responsive layouts', 'Figma design system'],
    },
    {
      title: 'Website Development',
      items: ['React / Next.js build', 'CMS integration', 'Performance optimization', 'Cross-browser testing'],
    },
  ],
  items: [
    { desc: 'Website Design', sub: 'Custom UI/UX, wireframes, visual design & style guide', qty: 1, rate: 3500 },
    { desc: 'Website Development', sub: 'Full-stack build, CMS integration & QA', qty: 1, rate: 5000 },
    { desc: 'Maintenance Retainer', sub: 'Monthly updates, backups & support', qty: 3, rate: 500 },
  ],
  taxOn: false,
  taxRate: 0,
  discount: 0,
  payment: [
    { label: 'Project Kickoff', pct: 50 },
    { label: 'Mid-Project Milestone', pct: 25 },
    { label: 'Final Delivery', pct: 25 },
  ],
  payNote: 'Payments are due within 5 business days of each milestone.',
  terms: [
    'Client is responsible for providing all content (text, images, assets) within 5 business days of project kickoff.',
    'Revisions are limited to two rounds per design phase. Additional revisions are billed at $150/hour.',
    'All intellectual property transfers to the client upon receipt of final payment.',
    'SC Design reserves the right to showcase completed work in its portfolio unless otherwise agreed in writing.',
    'A late fee of 1.5% per month applies to overdue balances.',
  ],
}

// ── Collapsible section ───────────────────────────────────────────
function Section({ num, title, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <details className={styles.grp} open={open} onToggle={e => setOpen(e.target.open)}>
      <summary className={styles.grpSummary}>
        <span className={styles.grpNum}>{num}</span>
        <span className={styles.grpTitle}>{title}</span>
        <ChevronRight size={14} className={[styles.chev, open ? styles.chevOpen : ''].join(' ')} aria-hidden="true" />
      </summary>
      <div className={styles.grpBody}>{children}</div>
    </details>
  )
}

// ── Field wrapper ─────────────────────────────────────────────────
function Field({ label, optional, children }) {
  return (
    <div className={styles.field}>
      <label className={styles.fieldLabel}>
        {label}
        {optional && <span className={styles.fieldOpt}> (optional)</span>}
      </label>
      {children}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────
export default function ProposalEditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const toast = useToast()

  const [data, setData] = useState(DEFAULT_DATA)
  const [soloMode, setSoloMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [printing, setPrinting] = useState(false)
  const [loaded, setLoaded] = useState(!id) // new proposals are immediately "loaded"

  const proposalIdRef = useRef(id || null)
  const saveTimerRef  = useRef(null)
  const isNewRef      = useRef(!id)

  // ── Load existing proposal ──────────────────────────────────────
  useEffect(() => {
    if (!id) return
    getProposal(id).then(({ data: row, error }) => {
      if (error || !row) { navigate('/proposals'); return }
      proposalIdRef.current = row.id
      isNewRef.current = false
      setData({ ...DEFAULT_DATA, ...row.data, proposalNo: row.proposal_no })
      setLoaded(true)
    })
  }, [id, navigate])

  // ── Computed values ─────────────────────────────────────────────
  const computed = useMemo(() => {
    const subtotal = data.items.reduce((s, it) => s + (it.qty || 0) * (it.rate || 0), 0)
    const afterDiscount = Math.max(0, subtotal - (data.discount || 0))
    const tax = data.taxOn ? afterDiscount * (data.taxRate || 0) / 100 : 0
    const total = afterDiscount + tax
    const stageTotal = data.payment.reduce((s, p) => s + (p.pct || 0), 0)
    return { subtotal, afterDiscount, tax, total, stageTotal }
  }, [data])

  // ── Auto-save ───────────────────────────────────────────────────
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
        setData(prev => ({ ...prev, proposalNo: row.proposal_no }))
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
    clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => persist(data), 1500)
    return () => clearTimeout(saveTimerRef.current)
  }, [data, loaded, persist])

  // ── Field helpers ───────────────────────────────────────────────
  const set = useCallback((key, value) => {
    setData(prev => ({ ...prev, [key]: value }))
  }, [])

  const handleSavePdf = async () => {
    const element = document.getElementById('proposal-paper')
    if (!element) return
    setPrinting(true)
    const filename = `SC-Design-Proposal-${data.proposalNo ? `PRO-${String(data.proposalNo).padStart(4, '0')}` : 'Draft'}.pdf`
    await html2pdf()
      .set({
        margin: 0,
        filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
      })
      .from(element)
      .save()
    setPrinting(false)
  }

  const reset = () => {
    if (window.confirm('Reset to default template? All unsaved changes will be lost.')) {
      setData({ ...DEFAULT_DATA, proposalNo: data.proposalNo, date: data.date })
    }
  }

  // ── Scope helpers ───────────────────────────────────────────────
  const addScopeGroup = () =>
    set('scope', [...data.scope, { title: 'New Section', items: [''] }])

  const removeScopeGroup = (gi) =>
    set('scope', data.scope.filter((_, i) => i !== gi))

  const updateScopeGroup = (gi, field, value) =>
    set('scope', data.scope.map((g, i) => i === gi ? { ...g, [field]: value } : g))

  const addScopeItem = (gi) =>
    set('scope', data.scope.map((g, i) => i === gi ? { ...g, items: [...g.items, ''] } : g))

  const removeScopeItem = (gi, ii) =>
    set('scope', data.scope.map((g, i) =>
      i === gi ? { ...g, items: g.items.filter((_, j) => j !== ii) } : g
    ))

  const updateScopeItem = (gi, ii, value) =>
    set('scope', data.scope.map((g, i) =>
      i === gi ? { ...g, items: g.items.map((it, j) => j === ii ? value : it) } : g
    ))

  // ── Line item helpers ───────────────────────────────────────────
  const addItem = () =>
    set('items', [...data.items, { desc: '', sub: '', qty: 1, rate: 0 }])

  const removeItem = (i) =>
    set('items', data.items.filter((_, j) => j !== i))

  const updateItem = (i, field, value) =>
    set('items', data.items.map((it, j) => j === i ? { ...it, [field]: value } : it))

  // ── Payment helpers ─────────────────────────────────────────────
  const addStage = () =>
    set('payment', [...data.payment, { label: '', pct: 0 }])

  const removeStage = (i) =>
    set('payment', data.payment.filter((_, j) => j !== i))

  const updateStage = (i, field, value) =>
    set('payment', data.payment.map((s, j) => j === i ? { ...s, [field]: value } : s))

  // ── Terms helpers ───────────────────────────────────────────────
  const addTerm  = () => set('terms', [...data.terms, ''])
  const removeTerm = (i) => set('terms', data.terms.filter((_, j) => j !== i))
  const updateTerm = (i, value) =>
    set('terms', data.terms.map((t, j) => j === i ? value : t))

  if (!loaded) {
    return (
      <div className={styles.loadingPage}>
        <span className="spinner" />
      </div>
    )
  }

  return (
    <div className={[styles.page, soloMode ? styles.solo : ''].join(' ')}>
      {/* ── Topbar ─────────────────────────────────────────────── */}
      <div className={styles.topbar}>
        <div className={styles.topbarLeft}>
          <button
            className={styles.backBtn}
            onClick={() => navigate('/proposals')}
            aria-label="Back to proposals"
          >
            <ArrowLeft size={16} />
          </button>
          <img src="/sc-design/logo.svg" alt="SC Design" className={styles.topbarLogo} />
          <span className={styles.topbarTag}>Proposal Builder</span>
        </div>
        {saving && <span className={styles.savingTag}>Saving…</span>}
        <div className={styles.topbarActions}>
          <button className={styles.tbtnGhost} onClick={reset} title="Reset to default template">
            <RotateCcw size={13} />
            Reset
          </button>
          <button className={styles.tbtn} onClick={() => setSoloMode(v => !v)}>
            {soloMode ? <EyeOff size={13} /> : <Eye size={13} />}
            {soloMode ? 'Edit' : 'Preview'}
          </button>
          <button className={`${styles.tbtn} ${styles.tbtnPrimary}`} onClick={handleSavePdf} disabled={printing}>
            <Printer size={13} />
            {printing ? 'Generating…' : 'Save PDF'}
          </button>
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────────── */}
      <div className={styles.body}>
        {/* ── Editor panel ─────────────────────────────────────── */}
        <aside className={styles.editor} aria-label="Proposal editor">
          <div className={styles.editorInner}>

            {/* 01 Proposal Details */}
            <Section num="01" title="Proposal Details">
              <Field label="Project Title">
                <input
                  className={styles.input}
                  value={data.title}
                  onChange={e => set('title', e.target.value)}
                  placeholder="e.g. Website Redesign"
                />
              </Field>
              <Field label="Label / Kicker" optional>
                <input
                  className={styles.input}
                  value={data.kicker}
                  onChange={e => set('kicker', e.target.value)}
                  placeholder="e.g. Web Design Proposal"
                />
              </Field>
              <div className={styles.twoCol}>
                <Field label="Date">
                  <input
                    className={styles.input}
                    type="date"
                    value={data.date}
                    onChange={e => set('date', e.target.value)}
                  />
                </Field>
                <Field label="Valid for (days)">
                  <input
                    className={styles.input}
                    type="number"
                    min="1"
                    value={data.validDays}
                    onChange={e => set('validDays', parseInt(e.target.value) || 0)}
                  />
                </Field>
              </div>
              <Field label="Estimated Timeline" optional>
                <input
                  className={styles.input}
                  value={data.timeline}
                  onChange={e => set('timeline', e.target.value)}
                  placeholder="e.g. 8–10 weeks"
                />
              </Field>
            </Section>

            {/* 02 Client & Sender */}
            <Section num="02" title="Client & Sender">
              <p className={styles.sectionHint}>Client</p>
              <Field label="Name">
                <input
                  className={styles.input}
                  value={data.clientName}
                  onChange={e => set('clientName', e.target.value)}
                  placeholder="Jane Smith"
                />
              </Field>
              <Field label="Company" optional>
                <input
                  className={styles.input}
                  value={data.clientCompany}
                  onChange={e => set('clientCompany', e.target.value)}
                  placeholder="Acme Corp"
                />
              </Field>
              <Field label="Email" optional>
                <input
                  className={styles.input}
                  type="email"
                  value={data.clientEmail}
                  onChange={e => set('clientEmail', e.target.value)}
                  placeholder="jane@acme.com"
                />
              </Field>
              <p className={styles.sectionHint}>Sender</p>
              <Field label="Studio Name">
                <input
                  className={styles.input}
                  value={data.fromName}
                  onChange={e => set('fromName', e.target.value)}
                />
              </Field>
              <Field label="Contact Name" optional>
                <input
                  className={styles.input}
                  value={data.fromContact}
                  onChange={e => set('fromContact', e.target.value)}
                />
              </Field>
              <div className={styles.twoCol}>
                <Field label="Email" optional>
                  <input
                    className={styles.input}
                    type="email"
                    value={data.fromEmail}
                    onChange={e => set('fromEmail', e.target.value)}
                  />
                </Field>
                <Field label="Phone" optional>
                  <input
                    className={styles.input}
                    value={data.fromPhone}
                    onChange={e => set('fromPhone', e.target.value)}
                  />
                </Field>
              </div>
            </Section>

            {/* 03 Project Overview */}
            <Section num="03" title="Project Overview">
              <Field label="Narrative">
                <textarea
                  className={styles.textarea}
                  rows={6}
                  value={data.overview}
                  onChange={e => set('overview', e.target.value)}
                  placeholder="Describe the project goals, context, and your approach…"
                />
              </Field>
            </Section>

            {/* 04 Scope of Work */}
            <Section num="04" title="Scope of Work">
              <div className={styles.rows}>
                {data.scope.map((grp, gi) => (
                  <div key={gi} className={styles.scopeBlock}>
                    <div className={styles.scopeBlockHead}>
                      <input
                        className={`${styles.input} ${styles.scopeTitleInput}`}
                        value={grp.title}
                        onChange={e => updateScopeGroup(gi, 'title', e.target.value)}
                        placeholder="Section title"
                      />
                      <button
                        className={styles.deleteBtn}
                        onClick={() => removeScopeGroup(gi)}
                        aria-label="Remove scope group"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    {grp.items.map((item, ii) => (
                      <div key={ii} className={styles.itemRow}>
                        <input
                          className={styles.input}
                          value={item}
                          onChange={e => updateScopeItem(gi, ii, e.target.value)}
                          placeholder="Deliverable"
                        />
                        <button
                          className={styles.deleteBtn}
                          onClick={() => removeScopeItem(gi, ii)}
                          aria-label="Remove item"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                    <button className={styles.addPill} onClick={() => addScopeItem(gi)}>
                      <Plus size={12} /> Add deliverable
                    </button>
                  </div>
                ))}
              </div>
              <button className={styles.addPill} onClick={addScopeGroup}>
                <Plus size={12} /> Add scope group
              </button>
            </Section>

            {/* 05 Pricing */}
            <Section num="05" title="Pricing">
              <div className={styles.rows}>
                {data.items.map((item, i) => (
                  <div key={i} className={styles.lineItemBlock}>
                    <div className={styles.lineItemHead}>
                      <input
                        className={styles.input}
                        value={item.desc}
                        onChange={e => updateItem(i, 'desc', e.target.value)}
                        placeholder="Service name"
                      />
                      <button
                        className={styles.deleteBtn}
                        onClick={() => removeItem(i)}
                        aria-label="Remove line item"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <input
                      className={`${styles.input} ${styles.subInput}`}
                      value={item.sub}
                      onChange={e => updateItem(i, 'sub', e.target.value)}
                      placeholder="Short description (optional)"
                    />
                    <div className={styles.twoCol}>
                      <Field label="Qty">
                        <input
                          className={styles.input}
                          type="number"
                          min="0"
                          step="1"
                          value={item.qty}
                          onChange={e => updateItem(i, 'qty', parseFloat(e.target.value) || 0)}
                        />
                      </Field>
                      <Field label="Rate ($)">
                        <input
                          className={styles.input}
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.rate}
                          onChange={e => updateItem(i, 'rate', parseFloat(e.target.value) || 0)}
                        />
                      </Field>
                    </div>
                  </div>
                ))}
              </div>
              <button className={styles.addPill} onClick={addItem}>
                <Plus size={12} /> Add line item
              </button>
              <div className={styles.taxRow}>
                <label className={styles.checkLabel}>
                  <input
                    type="checkbox"
                    checked={data.taxOn}
                    onChange={e => set('taxOn', e.target.checked)}
                  />
                  Apply tax
                </label>
                {data.taxOn && (
                  <div className={styles.taxRateWrap}>
                    <Field label="Tax rate (%)">
                      <input
                        className={styles.input}
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={data.taxRate}
                        onChange={e => set('taxRate', parseFloat(e.target.value) || 0)}
                      />
                    </Field>
                  </div>
                )}
              </div>
              <Field label="Discount ($)" optional>
                <input
                  className={styles.input}
                  type="number"
                  min="0"
                  step="0.01"
                  value={data.discount}
                  onChange={e => set('discount', parseFloat(e.target.value) || 0)}
                />
              </Field>
            </Section>

            {/* 06 Payment Schedule */}
            <Section num="06" title="Payment Schedule">
              {computed.stageTotal !== 100 && data.payment.length > 0 && (
                <p className={styles.payWarn}>
                  Stage percentages total {computed.stageTotal}% — must equal 100%.
                </p>
              )}
              <div className={styles.rows}>
                {data.payment.map((stage, i) => (
                  <div key={i} className={styles.stageRow}>
                    <input
                      className={styles.input}
                      value={stage.label}
                      onChange={e => updateStage(i, 'label', e.target.value)}
                      placeholder="Stage label"
                      style={{ flex: 1 }}
                    />
                    <div className={styles.pctWrap}>
                      <input
                        className={styles.input}
                        type="number"
                        min="0"
                        max="100"
                        value={stage.pct}
                        onChange={e => updateStage(i, 'pct', parseFloat(e.target.value) || 0)}
                        style={{ width: 64 }}
                      />
                      <span className={styles.pctSymbol}>%</span>
                    </div>
                    <button
                      className={styles.deleteBtn}
                      onClick={() => removeStage(i)}
                      aria-label="Remove payment stage"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <button className={styles.addPill} onClick={addStage}>
                <Plus size={12} /> Add stage
              </button>
              <Field label="Schedule note" optional>
                <textarea
                  className={styles.textarea}
                  rows={2}
                  value={data.payNote}
                  onChange={e => set('payNote', e.target.value)}
                  placeholder="e.g. Payments due within 5 business days of each milestone."
                />
              </Field>
            </Section>

            {/* 07 Terms & Conditions */}
            <Section num="07" title="Terms & Conditions">
              <div className={styles.rows}>
                {data.terms.map((term, i) => (
                  <div key={i} className={styles.termRow}>
                    <textarea
                      className={styles.textarea}
                      rows={2}
                      value={term}
                      onChange={e => updateTerm(i, e.target.value)}
                      placeholder="Enter term…"
                    />
                    <button
                      className={styles.deleteBtn}
                      onClick={() => removeTerm(i)}
                      aria-label="Remove term"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <button className={styles.addPill} onClick={addTerm}>
                <Plus size={12} /> Add term
              </button>
            </Section>

          </div>
        </aside>

        {/* ── Preview area ──────────────────────────────────────── */}
        <div className={styles.previewArea}>
          <div className={styles.previewScroll}>
            <ProposalPreview data={data} computed={computed} />
          </div>
        </div>
      </div>
    </div>
  )
}
