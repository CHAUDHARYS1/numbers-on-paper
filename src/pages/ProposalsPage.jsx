import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Scroll, PencilSimple, Trash, MagnifyingGlass } from '@phosphor-icons/react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { getProposals, deleteProposal } from '@/lib/proposals'
import Button from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'
import ConfirmModal from '@/components/ui/ConfirmModal'
import styles from './ProposalsPage.module.css'

export default function ProposalsPage() {
  const { user } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [proposals, setProposals] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!user) return
    getProposals(user.id).then(({ data, error }) => {
      if (!error) setProposals(data || [])
      setLoading(false)
    })
  }, [user])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    const { error } = await deleteProposal(deleteTarget.id)
    if (error) {
      toast.error('Failed to delete proposal')
    } else {
      setProposals(prev => prev.filter(p => p.id !== deleteTarget.id))
      toast.success('Proposal deleted')
    }
    setDeleting(false)
    setDeleteTarget(null)
  }

  const filteredProposals = proposals.filter(p => {
    const q = search.toLowerCase()
    if (!q) return true
    const title = (p.data?.title || '').toLowerCase()
    const client = (p.data?.client?.name || p.data?.clientCompany || p.data?.clientName || '').toLowerCase()
    return title.includes(q) || client.includes(q)
  })

  const mobileCards = filteredProposals.map(p => {
    const status = p.data?.status || 'draft'
    const title  = p.data?.title || 'Untitled'
    const client = p.data?.client?.name || p.data?.clientCompany || p.data?.clientName || null
    const date   = new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    const num    = `PROP-${String(p.proposal_no).padStart(4, '0')}`
    return (
      <div
        key={p.id}
        className={styles.propCard}
        onClick={() => navigate(`/proposals/${p.id}/edit`)}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && navigate(`/proposals/${p.id}/edit`)}
      >
        <div className={styles.propCardTop}>
          <span className={styles.propCardNum}>{num}</span>
          <span className={`prop-badge prop-badge--${status}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </div>
        <div className={styles.propCardTitle}>{title}</div>
        <div className={styles.propCardMeta}>
          <span className={styles.propCardClient}>{client || <span style={{ color: 'var(--ink-4)' }}>No client</span>}</span>
          <div className={styles.propCardRight}>
            <span className={styles.propCardDate}>{date}</span>
            <button
              className={styles.propCardDel}
              onClick={e => { e.stopPropagation(); setDeleteTarget(p) }}
              aria-label="Delete proposal"
              type="button"
            >
              <Trash size={14} />
            </button>
          </div>
        </div>
      </div>
    )
  })

  return (
    <>
      {/* ── Mobile ──────────────────────────────────────────────── */}
      <div className="m-only">
        <div className="m-head">
          <div className="m-head-top">
            <div>
              <div className="m-eyebrow">Proposals</div>
              <h1 className="m-title">Proposals</h1>
              <p className="m-sub">Build and send project proposals.</p>
            </div>
            <button
              className="m-iconbtn m-iconbtn--accent"
              onClick={() => navigate('/proposals/new')}
              aria-label="New proposal"
            >
              <Plus size={22} weight="bold" />
            </button>
          </div>
        </div>

        <div className="m-body">
          {loading ? (
            <div className={styles.loading}><span className="spinner" /></div>
          ) : proposals.length === 0 ? (
            <div className="m-card m-card--pad">
              <div className="m-empty">
                <Scroll size={36} style={{ color: 'var(--ink-4)' }} />
                <div className="m-empty-t">No proposals yet</div>
                <div className="m-empty-s">Create your first proposal to get started.</div>
                <button className="m-btn m-btn--primary" style={{ maxWidth: 220, margin: '0 auto' }} onClick={() => navigate('/proposals/new')}>
                  <Plus size={18} weight="bold" /> New Proposal
                </button>
              </div>
            </div>
          ) : (
            <>
              {proposals.length > 3 && (
                <div className={styles.mSearch}>
                  <MagnifyingGlass size={16} className={styles.mSearchIcon} />
                  <input className={styles.mSearchInput} placeholder="Search proposals…" value={search} onChange={e => setSearch(e.target.value)} aria-label="Search proposals" />
                </div>
              )}
              <div className={styles.cardList}>
                {mobileCards}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Desktop ──────────────────────────────────────────────── */}
      <div className={`d-only ${styles.page}`}>
        <div className="page-header">
          <div className="page-header__left">
            <h1 className="page-header__title">Proposals</h1>
            <p className="page-header__desc">Build and send project proposals.</p>
          </div>
          <div className="page-header__right">
            <Button variant="primary" onClick={() => navigate('/proposals/new')}>
              <Plus size={16} /> New proposal
            </Button>
          </div>
        </div>

        {loading ? (
          <div className={styles.loading}><span className="spinner" /></div>
        ) : proposals.length === 0 ? (
          <Card>
            <CardBody>
              <div className={styles.empty}>
                <Scroll size={40} className={styles.emptyIcon} />
                <p className={styles.emptyTitle}>No proposals yet</p>
                <p className={styles.emptyBody}>Create your first proposal to get started.</p>
                <Button variant="primary" onClick={() => navigate('/proposals/new')}>
                  <Plus size={16} />
                  New Proposal
                </Button>
              </div>
            </CardBody>
          </Card>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Number</th>
                  <th>Title</th>
                  <th>Client</th>
                  <th>Created</th>
                  <th>Status</th>
                  <th aria-label="Actions"></th>
                </tr>
              </thead>
              <tbody>
                {proposals.map(p => {
                  const status = p.data?.status || 'draft'
                  return (
                    <tr key={p.id} className={styles.row} onClick={() => navigate(`/proposals/${p.id}/edit`)}>
                      <td className={styles.mono}>PROP-{String(p.proposal_no).padStart(4, '0')}</td>
                      <td className={styles.bold}>{p.data?.title || 'Untitled'}</td>
                      <td>{p.data?.client?.name || p.data?.clientCompany || p.data?.clientName || '—'}</td>
                      <td>{new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                      <td><span className={`prop-badge prop-badge--${status}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</span></td>
                      <td className={styles.actionsCell}>
                        <button className={styles.iconBtn} onClick={e => { e.stopPropagation(); navigate(`/proposals/${p.id}/edit`) }} aria-label="Edit proposal">
                          <PencilSimple size={15} />
                        </button>
                        <button className={`${styles.iconBtn} ${styles.iconBtnDanger}`} onClick={e => { e.stopPropagation(); setDeleteTarget(p) }} aria-label="Delete proposal">
                          <Trash size={15} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Proposal"
        message={`Delete "${deleteTarget?.data?.title || 'Untitled'}"? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </>
  )
}
