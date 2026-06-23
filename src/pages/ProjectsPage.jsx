import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, MagnifyingGlass, Briefcase, FileText, Scroll } from '@phosphor-icons/react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { getProjects, createProject } from '@/lib/projects'
import { supabase } from '@/lib/supabase'
import ProjectModal from '@/components/projects/ProjectModal'
import styles from './ProjectsPage.module.css'

export const STATUS_OPTS = [
  { value: 'active',    label: 'Active',             color: 'green'   },
  { value: 'waiting',   label: 'Waiting on client',  color: 'amber'   },
  { value: 'on-hold',   label: 'On Hold',            color: 'neutral' },
  { value: 'completed', label: 'Completed',          color: 'blue'    },
]

export function StatusBadge({ status }) {
  const opt = STATUS_OPTS.find(s => s.value === status) || STATUS_OPTS[0]
  return <span className={`${styles.badge} ${styles['badge--' + opt.color]}`}>{opt.label}</span>
}

export function projectAvatar(name) {
  const colors = ['#2563EB','#15803d','#7c3aed','#c2410c','#be185d','#0f766e','#b45309','#0369a1']
  const color = colors[(name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length]
  return { initial: (name || '?')[0].toUpperCase(), color }
}

function fmtDate(d) {
  if (!d) return null
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
function fmtDateFull(d) {
  if (!d) return null
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
function isOverdue(dateStr) {
  if (!dateStr) return false
  const today = new Date(); today.setHours(0,0,0,0)
  return new Date(dateStr + 'T00:00:00') < today
}

export default function ProjectsPage() {
  const { user } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const [projects, setProjects] = useState([])
  const [clients,  setClients]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [filter,   setFilter]   = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [saving,    setSaving]    = useState(false)

  useEffect(() => {
    if (!user) return
    Promise.all([
      getProjects(user.id),
      supabase.from('clients').select('id, name, city').eq('user_id', user.id).order('name'),
    ]).then(([{ data: pData }, { data: cData }]) => {
      setProjects(pData || [])
      setClients(cData || [])
      setLoading(false)
    })
  }, [user])

  const today = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d }, [])
  const weekEnd = useMemo(() => { const d = new Date(today); d.setDate(today.getDate() + 7); return d }, [today])

  const stats = useMemo(() => {
    const active    = projects.filter(p => p.status === 'active').length
    const waiting   = projects.filter(p => p.status === 'waiting').length
    const overdue   = projects.reduce((n, p) => n + (p.reminders || []).filter(r => !r.done && isOverdue(r.date)).length, 0)
    const dueWeek   = projects.reduce((n, p) => n + (p.reminders || []).filter(r => {
      if (r.done) return false
      const d = new Date(r.date + 'T00:00:00')
      return d >= today && d < weekEnd
    }).length, 0)
    return { active, waiting, overdue, dueWeek }
  }, [projects, today, weekEnd])

  const filtered = useMemo(() => projects.filter(p => {
    const matchTab = filter === 'all' || p.status === filter
    const q = search.toLowerCase()
    const matchSearch = !q || p.name.toLowerCase().includes(q) || (p.client_name || '').toLowerCase().includes(q)
    return matchTab && matchSearch
  }), [projects, filter, search])

  const counts = useMemo(() => ({
    all:       projects.length,
    active:    projects.filter(p => p.status === 'active').length,
    waiting:   projects.filter(p => p.status === 'waiting').length,
    'on-hold': projects.filter(p => p.status === 'on-hold').length,
    completed: projects.filter(p => p.status === 'completed').length,
  }), [projects])

  const handleCreate = async (fields) => {
    setSaving(true)
    const { data, error } = await createProject(user.id, fields)
    if (error) { toast.error('Failed to create project.') }
    else {
      setProjects(prev => [data, ...prev])
      toast.success('Project created.')
      setModalOpen(false)
      navigate(`/projects/${data.id}`)
    }
    setSaving(false)
  }

  const nextReminder = (project) => {
    const pending = (project.reminders || []).filter(r => !r.done).sort((a, b) => a.date > b.date ? 1 : -1)
    return pending[0] || null
  }

  const TABS = [
    { value: 'all',       label: 'All'       },
    { value: 'active',    label: 'Active'    },
    { value: 'waiting',   label: 'Waiting'   },
    { value: 'on-hold',   label: 'On Hold'   },
    { value: 'completed', label: 'Completed' },
  ]

  return (
    <>
      {/* ── Mobile ─────────────────────────────────────────── */}
      <div className="m-only">
        <div className="m-head">
          <div className="m-head-top">
            <div>
              <div className="m-eyebrow">Projects</div>
              <h1 className="m-title">Projects</h1>
              <p className="m-sub">Track every client engagement.</p>
            </div>
            <button className="m-iconbtn m-iconbtn--accent" onClick={() => setModalOpen(true)} aria-label="New project" type="button">
              <Plus size={22} weight="bold" />
            </button>
          </div>
          <div className="m-search" style={{ marginTop: 14 }}>
            <MagnifyingGlass size={18} />
            <input placeholder="Search projects…" value={search} onChange={e => setSearch(e.target.value)} aria-label="Search projects" />
          </div>
          <div className="m-chips" style={{ marginTop: 12 }}>
            {TABS.map(({ value, label }) => (
              <button key={value} className={['m-chip', filter === value ? 'm-chip--on' : ''].join(' ')} onClick={() => setFilter(value)} type="button">
                {label}<span className="m-chip-ct">{counts[value] ?? 0}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="m-body">
          {loading ? (
            <div className={styles.mSkeleton}>{[1,2,3].map(n => <div key={n} className={styles.mSkeletonRow} />)}</div>
          ) : filtered.length === 0 ? (
            <div className="m-card m-card--pad">
              <div className="m-empty">
                <Briefcase size={36} style={{ color: 'var(--ink-4)' }} />
                <div className="m-empty-t">{projects.length === 0 ? 'No projects yet' : 'No matches'}</div>
                <div className="m-empty-s">{projects.length === 0 ? 'Create your first project to get started.' : 'Try a different search or filter.'}</div>
                {projects.length === 0 && (
                  <button className="m-btn m-btn--primary" style={{ maxWidth: 200, margin: '0 auto' }} onClick={() => setModalOpen(true)} type="button">
                    <Plus size={18} weight="bold" /> New project
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="m-list m-card">
              {filtered.map(p => {
                const { initial, color } = projectAvatar(p.name)
                const rem = nextReminder(p)
                return (
                  <div key={p.id} className="m-row" role="button" tabIndex={0} onClick={() => navigate(`/projects/${p.id}`)} onKeyDown={e => e.key === 'Enter' && navigate(`/projects/${p.id}`)}>
                    <div className={styles.mAvatar} style={{ background: color }}>{initial}</div>
                    <div className="m-row-main">
                      <div className="m-row-title">{p.name}</div>
                      <div className="m-row-meta">{p.client_name || 'No client'}{rem ? ` · ${fmtDate(rem.date)}` : ''}</div>
                    </div>
                    <div className="m-row-end">
                      <StatusBadge status={p.status} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Desktop ─────────────────────────────────────────── */}
      <div className={`d-only ${styles.page}`}>
        <div className="page-header">
          <div className="page-header__left">
            <h1 className="page-header__title">Projects</h1>
            <p className="page-header__desc">Track every client engagement — status, reminders, and notes.</p>
          </div>
          <div className="page-header__right">
            <div className={styles.searchWrap}>
              <MagnifyingGlass size={15} className={styles.searchIcon} />
              <input className={styles.searchInput} placeholder="Search projects…" value={search} onChange={e => setSearch(e.target.value)} aria-label="Search projects" />
            </div>
            <button className={styles.btnPrimary} onClick={() => setModalOpen(true)} type="button">
              <Plus size={15} /> New project
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className={styles.statsRow}>
          <div className={styles.stat}>
            <span className={`${styles.statNum} ${styles['statNum--blue']}`}>{stats.active}</span>
            <span className={styles.statLabel}>Active</span>
          </div>
          <div className={styles.stat}>
            <span className={`${styles.statNum} ${styles['statNum--amber']}`}>{stats.waiting}</span>
            <span className={styles.statLabel}>Waiting on client</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statNum}>{stats.overdue}</span>
            <span className={styles.statLabel}>Overdue reminders</span>
          </div>
          <div className={styles.stat}>
            <span className={`${styles.statNum} ${styles['statNum--blue']}`}>{stats.dueWeek}</span>
            <span className={styles.statLabel}>Due this week</span>
          </div>
        </div>

        {/* Filter tabs */}
        <div className={styles.tabRow} role="tablist">
          {TABS.map(({ value, label }) => (
            <button key={value} role="tab" aria-selected={filter === value} className={[styles.tab, filter === value ? styles.tabOn : ''].join(' ')} onClick={() => setFilter(value)} type="button">
              {label}
            </button>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div className={styles.tableCard}>
            <div className={styles.skeleton}>{[1,2,3,4,5].map(n => <div key={n} className={styles.skeletonRow} />)}</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>
            <Briefcase size={40} className={styles.emptyIcon} />
            <p className={styles.emptyTitle}>{projects.length === 0 ? 'No projects yet' : 'No matches'}</p>
            <p className={styles.emptySub}>{projects.length === 0 ? 'Create your first project to start tracking your work.' : 'Try adjusting your search or filter.'}</p>
            {projects.length === 0 && (
              <button className={styles.btnPrimary} onClick={() => setModalOpen(true)} type="button">
                <Plus size={15} /> New project
              </button>
            )}
          </div>
        ) : (
          <div className={styles.tableCard}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.thProject}>Project</th>
                  <th className={styles.thStatus}>Status</th>
                  <th className={styles.thReminder}>Next reminder</th>
                  <th className={styles.thLinked}>Linked</th>
                  <th className={styles.thActivity}>Last activity</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const { initial, color } = projectAvatar(p.name)
                  const rem = nextReminder(p)
                  const pendingCount = (p.reminders || []).filter(r => !r.done).length
                  const lastAct = p.last_activity_at ? new Date(p.last_activity_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'
                  return (
                    <tr key={p.id} className={styles.row} onClick={() => navigate(`/projects/${p.id}`)}>
                      <td>
                        <div className={styles.projectCell}>
                          <div className={styles.avatar} style={{ background: color }}>{initial}</div>
                          <div>
                            <div className={styles.projectName}>{p.name}</div>
                            {p.client_name && <div className={styles.projectClient}>{p.client_name}</div>}
                          </div>
                        </div>
                      </td>
                      <td><StatusBadge status={p.status} /></td>
                      <td>
                        {rem ? (
                          <div className={styles.reminderCell}>
                            <span className={[styles.reminderDate, isOverdue(rem.date) ? styles.reminderOverdue : ''].join(' ')}>
                              {fmtDate(rem.date)}
                              {pendingCount > 1 && <span className={styles.reminderExtra}>+{pendingCount - 1}</span>}
                            </span>
                            <span className={styles.reminderText}>{rem.text}</span>
                          </div>
                        ) : <span className={styles.reminderNone}>—</span>}
                      </td>
                      <td>
                        {p.linked_invoice_number ? (
                          <span className={styles.linkedChip} onClick={e => { e.stopPropagation(); if (p.linked_invoice_id) navigate(`/invoices/${p.linked_invoice_id}/edit`) }}>
                            <FileText size={11} weight="bold" aria-hidden="true" />{p.linked_invoice_number}
                          </span>
                        ) : p.linked_proposal_number ? (
                          <span className={`${styles.linkedChip} ${styles.linkedChipProposal}`} onClick={e => { e.stopPropagation(); if (p.linked_proposal_id) navigate(`/proposals/${p.linked_proposal_id}/edit`) }}>
                            <Scroll size={11} weight="bold" aria-hidden="true" />{p.linked_proposal_number}
                          </span>
                        ) : <span className={styles.reminderNone}>—</span>}
                      </td>
                      <td className={styles.activityCell}>{lastAct}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <ProjectModal
          clients={clients}
          onSave={handleCreate}
          onClose={() => setModalOpen(false)}
          saving={saving}
        />
      )}
    </>
  )
}
