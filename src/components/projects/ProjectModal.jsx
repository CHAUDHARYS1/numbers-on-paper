import { useState } from 'react'
import { X } from '@phosphor-icons/react'
import { STATUS_OPTS } from '@/pages/ProjectsPage'
import styles from './ProjectModal.module.css'

const EMPTY = {
  name: '', client_id: '', client_name: '', status: 'active',
  budget: '', description: '', start_date: '',
}

export default function ProjectModal({ project, clients = [], onSave, onClose, saving }) {
  const isNew = !project?.id
  const [form, setForm] = useState(project ? {
    name:        project.name || '',
    client_id:   project.client_id || '',
    client_name: project.client_name || '',
    status:      project.status || 'active',
    budget:      project.budget || '',
    description: project.description || '',
    start_date:  project.start_date || '',
  } : { ...EMPTY })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleClientChange = (id) => {
    const c = clients.find(c => c.id === id)
    setForm(f => ({ ...f, client_id: id, client_name: c?.name || '' }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    onSave({
      name:        form.name.trim(),
      client_id:   form.client_id || null,
      client_name: form.client_name || null,
      status:      form.status,
      budget:      form.budget ? Number(form.budget) : null,
      description: form.description.trim() || null,
      start_date:  form.start_date || null,
    })
  }

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label={isNew ? 'New project' : 'Edit project'} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHead}>
          <h2 className={styles.modalTitle}>{isNew ? 'New project' : 'Edit project'}</h2>
          <button className={styles.modalClose} onClick={onClose} aria-label="Close" type="button"><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            <div className={styles.fld}>
              <label htmlFor="pm-name" className={styles.fldLabel}>Project name <span className={styles.req}>*</span></label>
              <input id="pm-name" className={styles.fldInput} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Website redesign" required autoFocus />
            </div>

            <div className={styles.row2}>
              <div className={styles.fld}>
                <label htmlFor="pm-client" className={styles.fldLabel}>Client</label>
                <select id="pm-client" className={styles.fldInput} value={form.client_id} onChange={e => handleClientChange(e.target.value)}>
                  <option value="">No client</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className={styles.fld}>
                <label htmlFor="pm-status" className={styles.fldLabel}>Status</label>
                <select id="pm-status" className={styles.fldInput} value={form.status} onChange={e => set('status', e.target.value)}>
                  {STATUS_OPTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </div>

            <div className={styles.row2}>
              <div className={styles.fld}>
                <label htmlFor="pm-budget" className={styles.fldLabel}>Budget ($)</label>
                <input id="pm-budget" className={styles.fldInput} type="number" min="0" step="0.01" value={form.budget} onChange={e => set('budget', e.target.value)} placeholder="0.00" />
              </div>
              <div className={styles.fld}>
                <label htmlFor="pm-start" className={styles.fldLabel}>Start date</label>
                <input id="pm-start" className={styles.fldInput} type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} />
              </div>
            </div>

            <div className={styles.fld}>
              <label htmlFor="pm-desc" className={styles.fldLabel}>Description</label>
              <textarea id="pm-desc" className={`${styles.fldInput} ${styles.fldTextarea}`} value={form.description} onChange={e => set('description', e.target.value)} placeholder="What's this project about?" rows={3} />
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className={styles.btnGhost} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.btnPrimary} disabled={saving || !form.name.trim()}>
              {saving ? 'Creating…' : isNew ? 'Create project' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
