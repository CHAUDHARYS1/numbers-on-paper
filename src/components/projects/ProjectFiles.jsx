import { useState, useRef } from 'react'
import {
  Plus, Trash, Check, X, Eye, DownloadSimple,
  Image, FileText, FilePdf, FileZip, FileCode, FileVideo, FileAudio,
} from '@phosphor-icons/react'
import { uploadProjectFile, deleteProjectFile, getProjectFileUrl } from '@/lib/projects'
import { useToast } from '@/context/ToastContext'
import styles from './ProjectFiles.module.css'

function genId() { return Math.random().toString(36).slice(2, 10) }

function fmtSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function fmtDate(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function FileTypeIcon({ type = '' }) {
  const sz = 15
  if (type.startsWith('image/'))       return <Image size={sz} />
  if (type === 'application/pdf')      return <FilePdf size={sz} />
  if (type.includes('zip') || type.includes('tar') || type.includes('compressed')) return <FileZip size={sz} />
  if (type.startsWith('video/'))       return <FileVideo size={sz} />
  if (type.startsWith('audio/'))       return <FileAudio size={sz} />
  if (type.startsWith('text/') || type.includes('json') || type.includes('xml')) return <FileCode size={sz} />
  return <FileText size={sz} />
}

export default function ProjectFiles({ userId, projectId, files = [], onFilesChange, mobile = false }) {
  const toast = useToast()
  const fileInputRef = useRef(null)

  const [staged, setStaged]               = useState([])
  const [uploading, setUploading]         = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [deleting, setDeleting]           = useState(false)
  const [renamingId, setRenamingId]       = useState(null)
  const [renameText, setRenameText]       = useState('')

  const handleFilePick = (e) => {
    const picked = Array.from(e.target.files || [])
    if (!picked.length) return
    setStaged(prev => [
      ...prev,
      ...picked.map(f => ({ id: genId(), file: f, name: f.name })),
    ])
    e.target.value = ''
  }

  const handleUpload = async () => {
    setUploading(true)
    const added = []
    let failed = 0

    for (const s of staged) {
      const { data, error } = await uploadProjectFile(userId, projectId, s.file, s.name.trim() || s.file.name)
      if (error) { failed++; continue }
      added.push(data)
    }

    if (added.length) await onFilesChange([...files, ...added])
    setStaged([])
    setUploading(false)

    if (failed > 0) toast.error(`${failed} file${failed > 1 ? 's' : ''} failed to upload.`)
    else toast.success(`${added.length} file${added.length > 1 ? 's' : ''} uploaded.`)
  }

  const handlePreview = async (f) => {
    const { url, error } = await getProjectFileUrl(f.path)
    if (error || !url) { toast.error('Could not load file.'); return }
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleDownload = async (f) => {
    const { url, error } = await getProjectFileUrl(f.path, true)
    if (error || !url) { toast.error('Could not download file.'); return }
    const a = document.createElement('a')
    a.href = url
    a.download = f.name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const handleDelete = async (fileId) => {
    const target = files.find(f => f.id === fileId)
    if (!target) return
    setDeleting(true)
    const { error } = await deleteProjectFile(target.path)
    if (error) { toast.error('Failed to delete file.'); setDeleting(false); return }
    await onFilesChange(files.filter(f => f.id !== fileId))
    setConfirmDeleteId(null)
    setDeleting(false)
    toast.success('File removed.')
  }

  const handleRenameStart = (f) => {
    setRenamingId(f.id)
    setRenameText(f.name)
  }

  const handleRenameSave = async () => {
    if (!renameText.trim()) return
    const updated = files.map(f => f.id === renamingId ? { ...f, name: renameText.trim() } : f)
    await onFilesChange(updated)
    setRenamingId(null)
    toast.success('File renamed.')
  }

  return (
    <div className={mobile ? styles.mSection : styles.section}>
      {/* Header */}
      <div className={styles.header}>
        <h2 className={mobile ? styles.mTitle : styles.title}>Files</h2>
        {files.length > 0 && (
          <span className={styles.countBadge}>{files.length}</span>
        )}
        <button
          className={styles.addBtn}
          onClick={() => fileInputRef.current?.click()}
          type="button"
          disabled={uploading}
        >
          <Plus size={13} weight="bold" /> Add
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFilePick}
          aria-label="Select files to upload"
          style={{ display: 'none' }}
        />
      </div>

      {/* Staging area */}
      {staged.length > 0 && (
        <div className={styles.staging}>
          <p className={styles.stagingLabel}>Ready to upload — rename if needed</p>
          <ul className={styles.stagedList}>
            {staged.map(s => (
              <li key={s.id} className={styles.stagedRow}>
                <span className={styles.stagedIcon}><FileTypeIcon type={s.file.type} /></span>
                <input
                  className={styles.stagedName}
                  value={s.name}
                  onChange={e => setStaged(prev => prev.map(p => p.id === s.id ? { ...p, name: e.target.value } : p))}
                  aria-label="File name"
                />
                <span className={styles.stagedSize}>{fmtSize(s.file.size)}</span>
                <button
                  className={styles.stagedRemove}
                  onClick={() => setStaged(prev => prev.filter(p => p.id !== s.id))}
                  type="button"
                  aria-label="Remove from queue"
                >
                  <X size={13} />
                </button>
              </li>
            ))}
          </ul>
          <div className={styles.stagingActions}>
            <button
              className={styles.btnGhost}
              onClick={() => setStaged([])}
              type="button"
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              className={styles.btnPrimary}
              onClick={handleUpload}
              type="button"
              disabled={uploading}
            >
              {uploading ? 'Uploading…' : `Upload ${staged.length} file${staged.length > 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {files.length === 0 && staged.length === 0 && (
        <p className={styles.empty}>No files attached yet.</p>
      )}

      {/* File list */}
      {files.length > 0 && (
        <ul className={styles.fileList}>
          {files.map(f => (
            <li key={f.id} className={styles.fileRow}>
              <span className={styles.fileIcon}><FileTypeIcon type={f.type} /></span>

              <div className={styles.fileMeta}>
                {renamingId === f.id ? (
                  <div className={styles.renameWrap}>
                    <input
                      className={styles.renameInput}
                      value={renameText}
                      onChange={e => setRenameText(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter')  handleRenameSave()
                        if (e.key === 'Escape') setRenamingId(null)
                      }}
                      autoFocus
                      aria-label="Rename file"
                    />
                    <button className={styles.renameSave}  onClick={handleRenameSave}         type="button" aria-label="Save name"><Check size={12} weight="bold" /></button>
                    <button className={styles.renameCancel} onClick={() => setRenamingId(null)} type="button" aria-label="Cancel rename"><X size={12} /></button>
                  </div>
                ) : (
                  <button
                    className={styles.fileName}
                    onClick={() => handleRenameStart(f)}
                    type="button"
                    title="Click to rename"
                  >
                    {f.name}
                  </button>
                )}
                <span className={styles.fileInfo}>
                  {[fmtSize(f.size), fmtDate(f.uploaded_at)].filter(Boolean).join(' · ')}
                </span>
              </div>

              {confirmDeleteId === f.id ? (
                <div className={styles.deleteConfirm}>
                  <button className={styles.btnGhostSm} onClick={() => setConfirmDeleteId(null)} type="button" disabled={deleting}>Cancel</button>
                  <button className={styles.btnDangerSm} onClick={() => handleDelete(f.id)}      type="button" disabled={deleting}>
                    {deleting ? '…' : 'Delete'}
                  </button>
                </div>
              ) : (
                <div className={styles.fileActions}>
                  <button className={styles.actionBtn} onClick={() => handlePreview(f)}            type="button" aria-label="Preview"><Eye size={14} /></button>
                  <button className={styles.actionBtn} onClick={() => handleDownload(f)}           type="button" aria-label="Download"><DownloadSimple size={14} /></button>
                  <button className={`${styles.actionBtn} ${styles.actionBtnDanger}`} onClick={() => setConfirmDeleteId(f.id)} type="button" aria-label="Delete"><Trash size={14} /></button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
