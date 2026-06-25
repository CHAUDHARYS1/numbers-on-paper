import { useState } from 'react'
import { Plus } from '@phosphor-icons/react'
import styles from './ProjectTimeLog.module.css'

const LAST_NAME_KEY = 'nop_checkin_name'

function genId() { return Math.random().toString(36).slice(2, 10) }

function nowLocal() {
  const d = new Date()
  d.setSeconds(0, 0)
  const p = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

function fmtDuration(inIso, outIso) {
  const ms = new Date(outIso) - new Date(inIso)
  if (ms < 0) return '—'
  const totalMins = Math.round(ms / 60000)
  const h = Math.floor(totalMins / 60)
  const m = totalMins % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

function fmtTime(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function fmtDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function ProjectTimeLog({ sessions = [], onSessionsChange, mobile = false }) {
  const [checkInOpen,  setCheckInOpen]  = useState(false)
  const [checkInName,  setCheckInName]  = useState(() => localStorage.getItem(LAST_NAME_KEY) || '')
  const [checkInTime,  setCheckInTime]  = useState(nowLocal)
  const [checkInNote,  setCheckInNote]  = useState('')

  const [checkOutId,   setCheckOutId]   = useState(null)
  const [checkOutTime, setCheckOutTime] = useState('')
  const [checkOutNote, setCheckOutNote] = useState('')

  const [saving, setSaving] = useState(false)

  const active  = sessions.filter(s => !s.check_out_at)
  const history = sessions.filter(s =>  s.check_out_at)
    .sort((a, b) => b.check_out_at.localeCompare(a.check_out_at))

  const openCheckIn = () => {
    setCheckInTime(nowLocal())
    setCheckInOpen(true)
  }

  const handleCheckIn = async () => {
    if (!checkInName.trim()) return
    setSaving(true)
    const session = {
      id: genId(),
      name: checkInName.trim(),
      check_in_at: new Date(checkInTime).toISOString(),
      check_in_note: checkInNote.trim() || null,
      check_out_at: null,
      check_out_note: null,
    }
    localStorage.setItem(LAST_NAME_KEY, checkInName.trim())
    await onSessionsChange([...sessions, session])
    setCheckInOpen(false)
    setCheckInNote('')
    setSaving(false)
  }

  const openCheckOut = (sessionId) => {
    setCheckOutId(sessionId)
    setCheckOutTime(nowLocal())
    setCheckOutNote('')
  }

  const handleCheckOut = async () => {
    if (!checkOutNote.trim()) return
    setSaving(true)
    const updated = sessions.map(s =>
      s.id === checkOutId
        ? { ...s, check_out_at: new Date(checkOutTime).toISOString(), check_out_note: checkOutNote.trim() }
        : s
    )
    await onSessionsChange(updated)
    setCheckOutId(null)
    setSaving(false)
  }

  const totalLogged = history.reduce((acc, s) => {
    const ms = new Date(s.check_out_at) - new Date(s.check_in_at)
    return ms > 0 ? acc + ms : acc
  }, 0)

  const totalMins = Math.round(totalLogged / 60000)
  const totalH = Math.floor(totalMins / 60)
  const totalM = totalMins % 60
  const totalLabel = totalLogged > 0
    ? (totalH > 0 ? `${totalH}h ${totalM}m` : `${totalM}m`)
    : null

  return (
    <div className={mobile ? styles.mSection : styles.section}>
      <div className={styles.header}>
        <h2 className={mobile ? styles.mTitle : styles.title}>Time log</h2>
        {totalLabel && <span className={styles.totalBadge}>{totalLabel} total</span>}
        {active.length > 0 && <span className={styles.activeBadge}>{active.length} active</span>}
        <button
          className={styles.checkInBtn}
          onClick={openCheckIn}
          type="button"
          disabled={checkInOpen}
        >
          <Plus size={12} weight="bold" /> Check in
        </button>
      </div>

      {/* Check-in form */}
      {checkInOpen && (
        <div className={styles.formPanel}>
          <p className={styles.formLabel}>Check in</p>
          <input
            className={styles.formInput}
            type="text"
            placeholder="Full name"
            value={checkInName}
            onChange={e => setCheckInName(e.target.value)}
            autoFocus
            aria-label="Full name"
          />
          <input
            className={styles.formInput}
            type="datetime-local"
            value={checkInTime}
            onChange={e => setCheckInTime(e.target.value)}
            aria-label="Check-in time"
          />
          <textarea
            className={styles.formTextarea}
            placeholder="Note (optional) — what are you starting on?"
            value={checkInNote}
            onChange={e => setCheckInNote(e.target.value)}
            rows={2}
            aria-label="Check-in note"
          />
          <div className={styles.formActions}>
            <button className={styles.btnGhost} onClick={() => setCheckInOpen(false)} type="button">Cancel</button>
            <button
              className={styles.btnPrimary}
              onClick={handleCheckIn}
              disabled={saving || !checkInName.trim()}
              type="button"
            >
              {saving ? 'Checking in…' : 'Check in'}
            </button>
          </div>
        </div>
      )}

      {/* Active sessions */}
      {active.length > 0 && (
        <div className={styles.activeBlock}>
          {active.map(s => (
            <div key={s.id} className={styles.activeRow}>
              <span className={styles.liveDot} />
              <div className={styles.activeMeta}>
                <div className={styles.activeName}>{s.name}</div>
                <div className={styles.activeTime}>Since {fmtTime(s.check_in_at)} · {fmtDate(s.check_in_at)}</div>
                {s.check_in_note && <div className={styles.activeNote}>{s.check_in_note}</div>}
              </div>

              {checkOutId !== s.id ? (
                <button className={styles.checkOutBtn} onClick={() => openCheckOut(s.id)} type="button">
                  Check out
                </button>
              ) : (
                <div className={styles.checkOutForm}>
                  <input
                    className={styles.formInput}
                    type="datetime-local"
                    value={checkOutTime}
                    onChange={e => setCheckOutTime(e.target.value)}
                    aria-label="Check-out time"
                  />
                  <textarea
                    className={styles.formTextarea}
                    placeholder="What was accomplished? (required)"
                    value={checkOutNote}
                    onChange={e => setCheckOutNote(e.target.value)}
                    rows={2}
                    autoFocus
                    aria-label="Check-out note"
                  />
                  <div className={styles.formActions}>
                    <button className={styles.btnGhost} onClick={() => setCheckOutId(null)} type="button">Cancel</button>
                    <button
                      className={styles.btnPrimary}
                      onClick={handleCheckOut}
                      disabled={saving || !checkOutNote.trim()}
                      type="button"
                    >
                      {saving ? 'Checking out…' : 'Check out'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {sessions.length === 0 && !checkInOpen && (
        <p className={styles.empty}>No time logged yet.</p>
      )}

      {/* History */}
      {history.length > 0 && (
        <ul className={styles.historyList}>
          {history.map(s => (
            <li key={s.id} className={styles.historyRow}>
              <div className={styles.historyLeft}>
                <div className={styles.historyName}>{s.name}</div>
                <div className={styles.historyMeta}>
                  {fmtDate(s.check_in_at)} · {fmtTime(s.check_in_at)} → {fmtTime(s.check_out_at)}
                </div>
                {s.check_in_note && (
                  <div className={styles.historyNote}>
                    <span className={styles.noteTag}>In</span>{s.check_in_note}
                  </div>
                )}
                {s.check_out_note && (
                  <div className={styles.historyNote}>
                    <span className={styles.noteTag}>Out</span>{s.check_out_note}
                  </div>
                )}
              </div>
              <div className={styles.historyDuration}>{fmtDuration(s.check_in_at, s.check_out_at)}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
