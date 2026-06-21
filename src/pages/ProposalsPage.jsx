import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Scroll, PencilSimple, Trash } from '@phosphor-icons/react'
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

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <Button variant="primary" onClick={() => navigate('/proposals/new')}>
          <Plus size={16} />
          New Proposal
        </Button>
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
                <th aria-label="Actions"></th>
              </tr>
            </thead>
            <tbody>
              {proposals.map(p => (
                <tr
                  key={p.id}
                  className={styles.row}
                  onClick={() => navigate(`/proposals/${p.id}/edit`)}
                >
                  <td className={styles.mono}>PRO-{String(p.proposal_no).padStart(4, '0')}</td>
                  <td className={styles.bold}>{p.data?.title || 'Untitled'}</td>
                  <td>{p.data?.clientCompany || p.data?.clientName || '—'}</td>
                  <td>{new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                  <td className={styles.actionsCell}>
                    <button
                      className={styles.iconBtn}
                      onClick={e => { e.stopPropagation(); navigate(`/proposals/${p.id}/edit`) }}
                      aria-label="Edit proposal"
                    >
                      <PencilSimple size={15} />
                    </button>
                    <button
                      className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                      onClick={e => { e.stopPropagation(); setDeleteTarget(p) }}
                      aria-label="Delete proposal"
                    >
                      <Trash size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Proposal"
        message={`Delete "${deleteTarget?.data?.title || 'Untitled'}"? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  )
}
