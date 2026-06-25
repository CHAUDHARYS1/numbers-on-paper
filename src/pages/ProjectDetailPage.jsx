import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, CaretLeft, CaretRight, Plus, Trash, Check, CaretDown,
  FileText, Scroll, UsersThree, PencilSimple
} from '@phosphor-icons/react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { getProject, updateProject, deleteProject } from '@/lib/projects'
import { supabase } from '@/lib/supabase'
import { STATUS_OPTS, StatusBadge } from './ProjectsPage'
import ProjectFiles from '@/components/projects/ProjectFiles'
import styles from './ProjectDetailPage.module.css'

function genId() { return Math.random().toString(36).slice(2, 10) }

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
function isThisWeek(d) {
  if (!d) return false
  const date = new Date(d + 'T00:00:00')
  const today = new Date()
  const dow = today.getDay()
  const mon = new Date(today); mon.setDate(today.getDate() - ((dow + 6) % 7)); mon.setHours(0, 0, 0, 0)
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6); sun.setHours(23, 59, 59, 999)
  return date >= mon && date <= sun
}
function isOverdue(d) {
  if (!d) return false
  return new Date(d + 'T00:00:00') < new Date(new Date().setHours(0, 0, 0, 0))
}
function fmtDateTime(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function ProjectDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const [project,  setProject]  = useState(null)
  const [client,   setClient]   = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)

  const [desc,      setDesc]      = useState('')
  const [descDirty, setDescDirty] = useState(false)

  const [reminders,   setReminders]   = useState([])
  const [newRemDate,  setNewRemDate]   = useState('')
  const [newRemText,  setNewRemText]   = useState('')
  const [addingRem,   setAddingRem]    = useState(false)

  const [notes,     setNotes]     = useState([])
  const [noteText,  setNoteText]  = useState('')
  const [addingNote, setAddingNote] = useState(false)

  const [editingNoteId,      setEditingNoteId]      = useState(null)
  const [editNoteText,       setEditNoteText]        = useState('')
  const [editNoteDate,       setEditNoteDate]        = useState('')
  const [confirmDeleteNoteId, setConfirmDeleteNoteId] = useState(null)

  const [files, setFiles] = useState([])

  const [statusOpen,     setStatusOpen]     = useState(false)
  const [confirmDelete,  setConfirmDelete]   = useState(false)
  const [deleting,       setDeleting]        = useState(false)
  const statusRef  = useRef(null)
  const mStatusRef = useRef(null)

  useEffect(() => {
    if (!user) return
    getProject(id).then(({ data, error }) => {
      if (error || !data) { navigate('/projects'); return }
      setProject(data)
      setDesc(data.description || '')
      setReminders(data.reminders || [])
      setNotes(data.notes || [])
      setFiles(data.files || [])
      if (data.client_id) {
        supabase.from('clients').select('id, name, city').eq('id', data.client_id).single()
          .then(({ data: c }) => setClient(c))
      }
      setLoading(false)
    })
  }, [id, user, navigate])

  useEffect(() => {
    const handler = (e) => {
      const inDesktop = statusRef.current && statusRef.current.contains(e.target)
      const inMobile  = mStatusRef.current && mStatusRef.current.contains(e.target)
      if (!inDesktop && !inMobile) setStatusOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const save = async (patch) => {
    setSaving(true)
    const { data, error } = await updateProject(id, { ...patch, last_activity_at: new Date().toISOString() })
    if (error) toast.error('Failed to save.')
    else setProject(data)
    setSaving(false)
    return !error
  }

  const handleSaveDesc = async () => {
    const ok = await save({ description: desc })
    if (ok) { setDescDirty(false); toast.success('Description saved.') }
  }

  const handleStatusChange = async (status) => {
    setStatusOpen(false)
    const ok = await save({ status })
    if (ok) setProject(p => ({ ...p, status }))
  }

  const handleToggleReminder = async (remId) => {
    const updated = reminders.map(r => r.id === remId ? { ...r, done: !r.done } : r)
    setReminders(updated)
    await save({ reminders: updated })
  }

  const handleDeleteReminder = async (remId) => {
    const updated = reminders.filter(r => r.id !== remId)
    setReminders(updated)
    await save({ reminders: updated })
  }

  const handleAddReminder = async () => {
    if (!newRemText.trim() || !newRemDate) return
    setAddingRem(true)
    const newRem = { id: genId(), text: newRemText.trim(), date: newRemDate, done: false }
    const updated = [...reminders, newRem].sort((a, b) => a.date > b.date ? 1 : -1)
    setReminders(updated)
    const ok = await save({ reminders: updated })
    if (ok) { setNewRemText(''); setNewRemDate('') }
    setAddingRem(false)
  }

  const handleAddNote = async () => {
    if (!noteText.trim()) return
    setAddingNote(true)
    const newNote = { id: genId(), text: noteText.trim(), created_at: new Date().toISOString() }
    const updated = [newNote, ...notes]
    setNotes(updated)
    const ok = await save({ notes: updated })
    if (ok) setNoteText('')
    setAddingNote(false)
  }

  const handleNoteEditStart = (note) => {
    const d = new Date(note.created_at)
    const localDate = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
    setEditNoteText(note.text)
    setEditNoteDate(localDate)
    setEditingNoteId(note.id)
    setConfirmDeleteNoteId(null)
  }

  const handleNoteEditSave = async () => {
    if (!editNoteText.trim()) return
    const original = notes.find(n => n.id === editingNoteId)
    const updatedAt = editNoteDate
      ? new Date(editNoteDate + 'T00:00:00').toISOString()
      : original?.created_at
    const updated = notes.map(n =>
      n.id === editingNoteId ? { ...n, text: editNoteText.trim(), created_at: updatedAt } : n
    )
    setNotes(updated)
    const ok = await save({ notes: updated })
    if (ok) { setEditingNoteId(null); toast.success('Note updated.') }
  }

  const handleNoteDelete = async (noteId) => {
    const updated = notes.filter(n => n.id !== noteId)
    setNotes(updated)
    await save({ notes: updated })
    setConfirmDeleteNoteId(null)
    toast.success('Note deleted.')
  }

  const handleFilesChange = async (updated) => {
    setFiles(updated)
    await save({ files: updated })
  }

  const handleDelete = async () => {
    setDeleting(true)
    const { error } = await deleteProject(id)
    if (error) { toast.error('Failed to delete project.'); setDeleting(false); setConfirmDelete(false) }
    else navigate('/projects')
  }

  if (loading) return (
    <div className={styles.loadWrap}><span className="spinner" /></div>
  )
  if (!project) return null

  const opt = STATUS_OPTS.find(s => s.value === project.status) || STATUS_OPTS[0]
  const pendingReminders = reminders.filter(r => !r.done)

  const statusDropdown = (
    <div className={styles.statusDropWrap} ref={statusRef}>
      <button className={styles.statusDropBtn} onClick={() => setStatusOpen(v => !v)} type="button" aria-label="Change status">
        {opt.label} <CaretDown size={12} />
      </button>
      {statusOpen && (
        <div className={styles.statusDropMenu}>
          {STATUS_OPTS.map(s => (
            <button key={s.value} className={[styles.statusDropItem, project.status === s.value ? styles.statusDropItemOn : ''].join(' ')} onClick={() => handleStatusChange(s.value)} type="button">
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <>
    {/* ── Mobile ──────────────────────────────────────────────── */}
    <div className="m-only">
      <div className="m-head">
        <button className="m-back" onClick={() => navigate('/projects')} type="button">
          <CaretLeft size={16} weight="bold" /> Projects
        </button>
        <div className="m-head-top" style={{ marginTop: 6 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 className="m-title" style={{ fontSize: 24 }}>{project.name}</h1>
            {(project.client_name || project.start_date) && (
              <p className="m-sub">
                {[project.client_name, project.start_date && `since ${fmtDate(project.start_date)}`].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
          <div className={styles.mStatusTrigger} ref={mStatusRef}>
            <button className={styles.mStatusBtn} onClick={() => setStatusOpen(v => !v)} type="button" aria-label="Change status">
              <StatusBadge status={project.status} />
              <CaretDown size={11} />
            </button>
            {statusOpen && (
              <div className={styles.statusDropMenu} style={{ right: 0, left: 'auto', top: 'calc(100% + 6px)' }}>
                {STATUS_OPTS.map(s => (
                  <button key={s.value} className={[styles.statusDropItem, project.status === s.value ? styles.statusDropItemOn : ''].join(' ')} onClick={() => handleStatusChange(s.value)} type="button">
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="m-body">

        {/* Reminders */}
        <p className="m-section-label">Reminders</p>
        <div className="m-card">
          <div className="m-card-h">
            <h3 className="m-card-title">Upcoming</h3>
            {pendingReminders.length > 0 && <span className={styles.cardBadge}>{pendingReminders.length} open</span>}
          </div>
          {reminders.length === 0 && (
            <p className={styles.mEmptyHint}>No reminders yet.</p>
          )}
          <ul className={styles.mRemList}>
            {reminders.map(r => (
              <li key={r.id} className={[styles.mRemRow, r.done ? styles.mRemDone : ''].join(' ')}>
                <button
                  className={[styles.mRemChk, r.done ? styles.remCheckDone : ''].join(' ')}
                  onClick={() => handleToggleReminder(r.id)}
                  aria-label={r.done ? 'Mark incomplete' : 'Mark complete'}
                  type="button"
                >
                  {r.done && <Check size={13} weight="bold" />}
                </button>
                <div className={styles.remMain}>
                  <span className={styles.remText}>{r.text}</span>
                  <span className={[styles.remDate, !r.done && isOverdue(r.date) ? styles.remDateOverdue : ''].join(' ')}>
                    {fmtDate(r.date)}
                    {!r.done && isThisWeek(r.date) && <span className={styles.thisWeekChip}>this week</span>}
                  </span>
                </div>
                <button className={styles.mRemDelete} onClick={() => handleDeleteReminder(r.id)} aria-label="Delete reminder" type="button">
                  <Trash size={16} />
                </button>
              </li>
            ))}
          </ul>
          <div className={styles.mAddRemForm}>
            <input className={styles.mAddRemDate} type="date" value={newRemDate} onChange={e => setNewRemDate(e.target.value)} aria-label="Reminder date" />
            <input className={styles.mAddRemText} placeholder="Add a reminder…" value={newRemText} onChange={e => setNewRemText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddReminder()} aria-label="Reminder text" />
            <button className="m-btn m-btn--primary" onClick={handleAddReminder} disabled={addingRem || !newRemText.trim() || !newRemDate} type="button" style={{ height: 44 }}>
              <Plus size={16} weight="bold" /> Add
            </button>
          </div>
        </div>

        {/* About */}
        <p className="m-section-label">About</p>
        <div className="m-card" style={{ padding: '14px 18px 18px' }}>
          <textarea
            className={styles.mDescArea}
            value={desc}
            onChange={e => { setDesc(e.target.value); setDescDirty(true) }}
            placeholder="What's this project about? Goals, scope, key details…"
            rows={4}
          />
          {descDirty && (
            <div className={styles.mDescActions}>
              <button className="m-btn m-btn--ghost" onClick={() => { setDesc(project.description || ''); setDescDirty(false) }} type="button">Discard</button>
              <button className="m-btn m-btn--primary" onClick={handleSaveDesc} disabled={saving} type="button">Save</button>
            </div>
          )}
        </div>

        {/* Notes */}
        <p className="m-section-label">Notes &amp; activity</p>
        <div className="m-card" style={{ padding: '14px 18px 18px' }}>
          <textarea className={styles.mNoteArea} value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Log a note — what happened, what was decided…" rows={3} />
          <button className="m-btn m-btn--primary" onClick={handleAddNote} disabled={addingNote || !noteText.trim()} type="button" style={{ height: 44, marginTop: 10 }}>
            <Plus size={16} weight="bold" /> Add note
          </button>
          {notes.length > 0 && (
            <ul className={styles.noteList} style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--line-soft)' }}>
              {notes.map(n => (
                <li key={n.id} className={styles.noteItem}>
                  <div className={styles.noteDot} />
                  <div className={styles.noteContent}>
                    {editingNoteId === n.id ? (
                      <div className={styles.noteEditForm}>
                        <input type="date" className={styles.noteEditDate} value={editNoteDate} onChange={e => setEditNoteDate(e.target.value)} aria-label="Note date" />
                        <textarea className={styles.noteEditArea} value={editNoteText} onChange={e => setEditNoteText(e.target.value)} rows={3} autoFocus aria-label="Note text" />
                        <div className={styles.noteEditActions}>
                          <button className="m-btn m-btn--ghost" onClick={() => setEditingNoteId(null)} type="button">Cancel</button>
                          <button className="m-btn m-btn--primary" onClick={handleNoteEditSave} disabled={!editNoteText.trim()} type="button">Save</button>
                        </div>
                      </div>
                    ) : confirmDeleteNoteId === n.id ? (
                      <>
                        <div className={styles.noteDate}>{fmtDateTime(n.created_at)}</div>
                        <div className={styles.noteText}>{n.text}</div>
                        <div className={styles.noteDeleteConfirm}>
                          <span className={styles.noteDeleteMsg}>Delete this note?</span>
                          <button className="m-btn m-btn--ghost" onClick={() => setConfirmDeleteNoteId(null)} type="button" style={{ height: 40 }}>Cancel</button>
                          <button className="m-btn m-btn--danger" onClick={() => handleNoteDelete(n.id)} type="button" style={{ height: 40 }}>Delete</button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className={styles.noteHead}>
                          <div className={styles.noteDate}>{fmtDateTime(n.created_at)}</div>
                          <div className={styles.noteItemBtns}>
                            <button className={styles.noteEditBtn} onClick={() => handleNoteEditStart(n)} type="button" aria-label="Edit note"><PencilSimple size={14} /></button>
                            <button className={styles.noteDeleteBtn} onClick={() => setConfirmDeleteNoteId(n.id)} type="button" aria-label="Delete note"><Trash size={14} /></button>
                          </div>
                        </div>
                        <div className={styles.noteText}>{n.text}</div>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Files */}
        <p className="m-section-label">Files</p>
        <ProjectFiles
          userId={user.id}
          projectId={id}
          files={files}
          onFilesChange={handleFilesChange}
          mobile
        />

        {/* Details */}
        <p className="m-section-label">Details</p>
        <div className="m-card" style={{ overflow: 'hidden' }}>
          {client && (
            <div className="m-cdet-head" style={{ paddingBottom: 14, borderBottom: '1px solid var(--line-soft)' }}>
              <div className="m-cdet-ava" style={{ background: '#2563EB', width: 40, height: 40, fontSize: 16 }}>
                {(client.name || '?')[0].toUpperCase()}
              </div>
              <div>
                <div className="m-cdet-name" style={{ fontSize: 17 }}>{client.name}</div>
                {client.city && <div className="m-cdet-city">{client.city}</div>}
              </div>
            </div>
          )}
          {project.budget && (
            <div className={styles.mDetailRow}>
              <span className={styles.mDetailLabel}>Budget</span>
              <span className={styles.mDetailVal}>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(project.budget)}</span>
            </div>
          )}
          {project.start_date && (
            <div className={styles.mDetailRow}>
              <span className={styles.mDetailLabel}>Started</span>
              <span className={styles.mDetailVal}>{fmtDate(project.start_date)}</span>
            </div>
          )}
          {project.linked_invoice_number && (
            <div className={styles.mDetailRow}>
              <span className={styles.mDetailLabel}>Invoice</span>
              <span
                className={styles.linkedChip}
                role="link" tabIndex={0}
                onClick={() => project.linked_invoice_id && navigate(`/invoices/${project.linked_invoice_id}/edit`)}
                onKeyDown={e => e.key === 'Enter' && project.linked_invoice_id && navigate(`/invoices/${project.linked_invoice_id}/edit`)}
              >
                <FileText size={11} /> {project.linked_invoice_number}
              </span>
            </div>
          )}
          {project.linked_proposal_number && (
            <div className={styles.mDetailRow}>
              <span className={styles.mDetailLabel}>Proposal</span>
              <span
                className={`${styles.linkedChip} ${styles.linkedChipProposal}`}
                role="link" tabIndex={0}
                onClick={() => project.linked_proposal_id && navigate(`/proposals/${project.linked_proposal_id}/edit`)}
                onKeyDown={e => e.key === 'Enter' && project.linked_proposal_id && navigate(`/proposals/${project.linked_proposal_id}/edit`)}
              >
                <Scroll size={11} /> {project.linked_proposal_number}
              </span>
            </div>
          )}
        </div>

        {/* Quick actions */}
        <p className="m-section-label">Actions</p>
        <div className="m-card" style={{ overflow: 'hidden' }}>
          <Link to={project.client_id ? `/invoices/new?client=${project.client_id}` : '/invoices/new'} className="m-cdet-row m-cdet-row--link">
            <div className="m-cdet-row-ic" style={{ background: 'var(--accent-tint)', color: 'var(--accent)' }}>
              <FileText size={17} />
            </div>
            <div>
              <div className="m-cdet-row-v">New invoice</div>
              <div className="m-cdet-row-l">Bill for this project</div>
            </div>
            <CaretRight size={16} style={{ color: 'var(--ink-4)', marginLeft: 'auto' }} />
          </Link>
          <Link to="/proposals/new" className="m-cdet-row m-cdet-row--link">
            <div className="m-cdet-row-ic" style={{ background: 'rgba(124,58,237,.1)', color: '#7c3aed' }}>
              <Scroll size={17} />
            </div>
            <div>
              <div className="m-cdet-row-v">New proposal</div>
              <div className="m-cdet-row-l">Draft a proposal</div>
            </div>
            <CaretRight size={16} style={{ color: 'var(--ink-4)', marginLeft: 'auto' }} />
          </Link>
          {project.client_id && (
            <Link to={`/clients/${project.client_id}/invoices`} className="m-cdet-row m-cdet-row--link">
              <div className="m-cdet-row-ic" style={{ background: 'var(--green-tint)', color: 'var(--green)' }}>
                <UsersThree size={17} />
              </div>
              <div>
                <div className="m-cdet-row-v">View client</div>
                <div className="m-cdet-row-l">{project.client_name || 'Client history'}</div>
              </div>
              <CaretRight size={16} style={{ color: 'var(--ink-4)', marginLeft: 'auto' }} />
            </Link>
          )}
        </div>

        {/* Delete */}
        {confirmDelete ? (
          <div className={styles.mDeleteConfirm}>
            <p className={styles.mDeleteMsg}>Permanently delete <strong>{project.name}</strong>? This cannot be undone.</p>
            <div className={styles.mDeleteBtns}>
              <button className="m-btn m-btn--ghost" onClick={() => setConfirmDelete(false)} type="button" disabled={deleting}>Cancel</button>
              <button className="m-btn m-btn--danger" onClick={handleDelete} type="button" disabled={deleting}>
                {deleting ? 'Deleting…' : 'Delete project'}
              </button>
            </div>
          </div>
        ) : (
          <button className={`m-btn m-btn--danger ${styles.mDeleteBtn}`} onClick={() => setConfirmDelete(true)} type="button">
            <Trash size={18} /> Delete project
          </button>
        )}

      </div>
    </div>

    {/* ── Desktop ─────────────────────────────────────────────── */}
    <div className={`d-only ${styles.page}`}>
      {/* ── Header ─────────────────────────────── */}
      <div className={styles.titleRow}>
        <div className={styles.titleLeft}>
          <h1 className={styles.title}>{project.name}</h1>
          {(project.client_name || project.start_date) && (
            <p className={styles.subtitle}>
              {project.client_name && <span>{project.client_name}</span>}
              {project.client_name && project.start_date && <span className={styles.dot}>·</span>}
              {project.start_date && <span>since {fmtDate(project.start_date)}</span>}
            </p>
          )}
        </div>
        <div className={styles.headerRight}>
          <StatusBadge status={project.status} />
          {statusDropdown}
        </div>
      </div>
      <Link to="/projects" className={styles.backLink}>
        <ArrowLeft size={14} />
        <span>Back to projects</span>
      </Link>

      {/* ── Two-column body ────────────────────── */}
      <div className={styles.body}>
        {/* Left column */}
        <div className={styles.left}>

          {/* About */}
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>About this project</h2>
            <textarea
              className={styles.descArea}
              value={desc}
              onChange={e => { setDesc(e.target.value); setDescDirty(true) }}
              placeholder="What's this project about? Goals, scope, key details…"
              rows={5}
            />
            {descDirty && (
              <div className={styles.descActions}>
                <button className={styles.btnGhost} onClick={() => { setDesc(project.description || ''); setDescDirty(false) }} type="button">Discard</button>
                <button className={styles.btnPrimary} onClick={handleSaveDesc} disabled={saving} type="button">Save</button>
              </div>
            )}
          </section>

          {/* Reminders */}
          <section className={styles.card}>
            <div className={styles.cardHeaderRow}>
              <h2 className={styles.cardTitle}>Reminders</h2>
              {pendingReminders.length > 0 && (
                <span className={styles.cardBadge}>{pendingReminders.length} open</span>
              )}
            </div>

            {reminders.length === 0 && (
              <p className={styles.emptyHint}>No reminders yet — add one below.</p>
            )}

            <ul className={styles.remList}>
              {reminders.map(r => (
                <li key={r.id} className={[styles.remRow, r.done ? styles.remDone : ''].join(' ')}>
                  <button className={[styles.remCheck, r.done ? styles.remCheckDone : ''].join(' ')} onClick={() => handleToggleReminder(r.id)} aria-label={r.done ? 'Mark incomplete' : 'Mark complete'} type="button">
                    {r.done && <Check size={11} weight="bold" />}
                  </button>
                  <div className={styles.remMain}>
                    <span className={styles.remText}>{r.text}</span>
                    <span className={[styles.remDate, !r.done && isOverdue(r.date) ? styles.remDateOverdue : ''].join(' ')}>
                      {fmtDate(r.date)}
                      {!r.done && isThisWeek(r.date) && <span className={styles.thisWeekChip}>this week</span>}
                    </span>
                  </div>
                  <button className={styles.remDelete} onClick={() => handleDeleteReminder(r.id)} aria-label="Delete reminder" type="button">
                    <Trash size={13} />
                  </button>
                </li>
              ))}
            </ul>

            <div className={styles.addRemRow}>
              <input
                className={styles.remDateInput}
                type="date"
                value={newRemDate}
                onChange={e => setNewRemDate(e.target.value)}
                aria-label="Reminder date"
              />
              <input
                className={styles.remTextInput}
                placeholder="Add a reminder…"
                value={newRemText}
                onChange={e => setNewRemText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddReminder()}
                aria-label="Reminder text"
              />
              <button className={styles.btnPrimary} onClick={handleAddReminder} disabled={addingRem || !newRemText.trim() || !newRemDate} type="button">
                <Plus size={14} /> Add
              </button>
            </div>
          </section>

          {/* Notes & activity */}
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Notes &amp; activity</h2>
            <div className={styles.noteInputWrap}>
              <textarea
                className={styles.noteArea}
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                placeholder="Log a note — what happened, what was decided…"
                rows={3}
              />
              <div className={styles.noteActions}>
                <button className={styles.btnPrimary} onClick={handleAddNote} disabled={addingNote || !noteText.trim()} type="button">
                  <Plus size={14} /> Add note
                </button>
              </div>
            </div>

            {notes.length > 0 && (
              <ul className={styles.noteList}>
                {notes.map(n => (
                  <li key={n.id} className={styles.noteItem}>
                    <div className={styles.noteDot} />
                    <div className={styles.noteContent}>
                      {editingNoteId === n.id ? (
                        <div className={styles.noteEditForm}>
                          <input type="date" className={styles.noteEditDate} value={editNoteDate} onChange={e => setEditNoteDate(e.target.value)} aria-label="Note date" />
                          <textarea className={styles.noteEditArea} value={editNoteText} onChange={e => setEditNoteText(e.target.value)} rows={3} autoFocus aria-label="Note text" />
                          <div className={styles.noteEditActions}>
                            <button className={styles.btnGhost} onClick={() => setEditingNoteId(null)} type="button">Cancel</button>
                            <button className={styles.btnPrimary} onClick={handleNoteEditSave} disabled={!editNoteText.trim()} type="button">Save</button>
                          </div>
                        </div>
                      ) : confirmDeleteNoteId === n.id ? (
                        <>
                          <div className={styles.noteDate}>{fmtDateTime(n.created_at)}</div>
                          <div className={styles.noteText}>{n.text}</div>
                          <div className={styles.noteDeleteConfirm}>
                            <span className={styles.noteDeleteMsg}>Delete this note?</span>
                            <button className={styles.btnGhost} onClick={() => setConfirmDeleteNoteId(null)} type="button">Cancel</button>
                            <button className={styles.btnDanger} onClick={() => handleNoteDelete(n.id)} type="button">Delete</button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className={styles.noteHead}>
                            <div className={styles.noteDate}>{fmtDateTime(n.created_at)}</div>
                            <div className={styles.noteItemBtns}>
                              <button className={styles.noteEditBtn} onClick={() => handleNoteEditStart(n)} type="button" aria-label="Edit note"><PencilSimple size={12} /></button>
                              <button className={styles.noteDeleteBtn} onClick={() => setConfirmDeleteNoteId(n.id)} type="button" aria-label="Delete note"><Trash size={12} /></button>
                            </div>
                          </div>
                          <div className={styles.noteText}>{n.text}</div>
                        </>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
          {/* Files */}
          <ProjectFiles
            userId={user.id}
            projectId={id}
            files={files}
            onFilesChange={handleFilesChange}
          />

        </div>

        {/* Right sidebar */}
        <div className={styles.right}>

          {/* Details */}
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Details</h2>

            {client && (
              <div className={styles.clientRow}>
                <div className={styles.clientAvatar} style={{ background: '#2563EB' }}>
                  {(client.name || '?')[0].toUpperCase()}
                </div>
                <div>
                  <div className={styles.clientName}>{client.name}</div>
                  {client.city && <div className={styles.clientCity}>{client.city}</div>}
                </div>
              </div>
            )}

            <dl className={styles.detailList}>
              <dt className={styles.detailLabel}>Status</dt>
              <dd><StatusBadge status={project.status} /></dd>

              {project.start_date && (
                <>
                  <dt className={styles.detailLabel}>Started</dt>
                  <dd className={styles.detailVal}>{fmtDate(project.start_date)}</dd>
                </>
              )}

              {project.budget && (
                <>
                  <dt className={styles.detailLabel}>Budget</dt>
                  <dd className={styles.detailVal}>
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(project.budget)}
                  </dd>
                </>
              )}

              {project.linked_invoice_number && (
                <>
                  <dt className={styles.detailLabel}>Linked</dt>
                  <dd>
                    <span
                      className={styles.linkedChip}
                      role="link"
                      tabIndex={0}
                      onClick={() => project.linked_invoice_id && navigate(`/invoices/${project.linked_invoice_id}/edit`)}
                      onKeyDown={e => e.key === 'Enter' && project.linked_invoice_id && navigate(`/invoices/${project.linked_invoice_id}/edit`)}
                    >
                      <FileText size={11} /> {project.linked_invoice_number}
                    </span>
                  </dd>
                </>
              )}

              {project.linked_proposal_number && (
                <>
                  <dt className={styles.detailLabel}>Proposal</dt>
                  <dd>
                    <span
                      className={`${styles.linkedChip} ${styles.linkedChipProposal}`}
                      role="link"
                      tabIndex={0}
                      onClick={() => project.linked_proposal_id && navigate(`/proposals/${project.linked_proposal_id}/edit`)}
                      onKeyDown={e => e.key === 'Enter' && project.linked_proposal_id && navigate(`/proposals/${project.linked_proposal_id}/edit`)}
                    >
                      <Scroll size={11} /> {project.linked_proposal_number}
                    </span>
                  </dd>
                </>
              )}
            </dl>
          </section>

          {/* Quick actions */}
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Quick actions</h2>
            <div className={styles.quickActions}>
              <Link
                to={project.client_id ? `/invoices/new?client=${project.client_id}` : '/invoices/new'}
                className={styles.quickBtn}
              >
                <FileText size={14} /> New invoice
              </Link>
              <Link to="/proposals/new" className={styles.quickBtn}>
                <Scroll size={14} /> New proposal
              </Link>
              {project.client_id && (
                <Link to={`/clients/${project.client_id}/invoices`} className={styles.quickBtn}>
                  <UsersThree size={14} /> View client
                </Link>
              )}
              <div className={styles.deleteDivider} />
              {confirmDelete ? (
                <div className={styles.deleteConfirm}>
                  <span className={styles.deleteConfirmLabel}>Delete this project?</span>
                  <div className={styles.deleteConfirmBtns}>
                    <button className={styles.btnGhost} onClick={() => setConfirmDelete(false)} type="button" disabled={deleting}>Cancel</button>
                    <button className={styles.btnDanger} onClick={handleDelete} type="button" disabled={deleting}>
                      {deleting ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                </div>
              ) : (
                <button className={styles.quickBtnDanger} onClick={() => setConfirmDelete(true)} type="button">
                  <Trash size={14} /> Delete project
                </button>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
    </>
  )
}
