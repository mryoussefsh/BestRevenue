import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { publisherApi } from '../../api/endpoints'
import { useSettings } from '../../contexts/SettingsContext'
import toast from 'react-hot-toast'
import Pagination from '../../components/Pagination'
import { 
  MessageSquare, Plus, Clock, HelpCircle, CheckCircle, Lock, AlertTriangle, 
  User, Settings, Mail, X 
} from 'lucide-react'

export default function PublisherTickets() {
  const { formatDate } = useSettings()
  const navigate = useNavigate()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [filterStatus, setFilterStatus] = useState('')
  const [hasActiveTicket, setHasActiveTicket] = useState(false)

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [subject, setSubject] = useState('')
  const [category, setCategory] = useState('other')
  const [priority, setPriority] = useState('medium')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchTickets = () => {
    setLoading(true)
    publisherApi.getTickets({ status: filterStatus, page })
      .then(res => {
        console.log('PUBLISHER TICKETS COUNT:', res.data?.data?.length, JSON.stringify(res.data))
        setTickets(res.data?.data || [])
        setTotalItems(res.data?.total || 0)
        setHasActiveTicket(res.data?.has_active_ticket || false)
      })
      .catch(err => {
        console.error('PUBLISHER TICKETS FETCH ERROR:', err)
        toast.error('Failed to load tickets')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchTickets()
  }, [page, filterStatus])

  const handleOpenModal = () => {
    if (hasActiveTicket) {
      toast.error('You already have an active support ticket. Please resolve or close it before opening a new one.')
      return
    }
    setSubject('')
    setCategory('other')
    setPriority('medium')
    setMessage('')
    setIsModalOpen(true)
  }

  const handleCreateTicket = async (e) => {
    e.preventDefault()
    if (!subject.trim() || !message.trim()) {
      toast.error('Subject and message details are required.')
      return
    }

    setSubmitting(true)
    try {
      const res = await publisherApi.createTicket({
        subject,
        category,
        priority,
        message
      })
      toast.success(res.data?.message || 'Support ticket opened successfully!')
      setIsModalOpen(false)
      setPage(1)
      fetchTickets()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to open ticket.')
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'open':
        return (
          <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Clock size={12} /> Open
          </span>
        )
      case 'in_progress':
        return (
          <span className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Settings size={12} /> In Progress
          </span>
        )
      case 'resolved':
        return (
          <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <CheckCircle size={12} /> Resolved
          </span>
        )
      case 'closed':
        return (
          <span className="badge badge-neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Lock size={12} /> Closed
          </span>
        )
      default:
        return <span className="badge badge-neutral">{status}</span>
    }
  }

  const getPriorityBadge = (prio) => {
    switch (prio) {
      case 'low':
        return (
          <span style={{ color: 'var(--br-accent)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span className="dot" style={{ background: 'var(--br-accent)' }} /> Low
          </span>
        )
      case 'medium':
        return (
          <span style={{ color: 'var(--br-warning)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span className="dot" style={{ background: 'var(--br-warning)' }} /> Medium
          </span>
        )
      case 'high':
        return (
          <span style={{ color: '#f97316', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span className="dot" style={{ background: '#f97316' }} /> High
          </span>
        )
      case 'urgent':
        return (
          <span style={{ color: 'var(--br-danger)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span className="dot" style={{ background: 'var(--br-danger)' }} /> Urgent
          </span>
        )
      default:
        return <span>{prio}</span>
    }
  }

  const getCategoryLabel = (cat) => {
    switch (cat) {
      case 'billing':
        return 'Billing'
      case 'technical':
        return 'Technical'
      case 'gam':
        return 'GAM Sync'
      case 'other':
      default:
        return 'Other'
    }
  }

  if (loading && tickets.length === 0) {
    return <div className="loading-screen"><div className="spinner"></div></div>
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <MessageSquare size={24} style={{ color: 'var(--br-primary)' }} />
            Support Tickets
          </h1>
          <p className="page-subtitle">
            Need help? Open a ticket to reach our administration team directly.
          </p>
          {hasActiveTicket && (
            <p style={{ color: 'var(--br-warning)', fontSize: 13, marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 500 }}>
              <AlertTriangle size={14} /> You have an active support ticket. You must close or resolve it before you can open a new one.
            </p>
          )}
        </div>
        <button 
          className="btn btn-primary" 
          onClick={handleOpenModal}
          disabled={hasActiveTicket}
          style={hasActiveTicket ? { opacity: 0.6, cursor: 'not-allowed', display: 'inline-flex', alignItems: 'center', gap: 8 } : { display: 'inline-flex', alignItems: 'center', gap: 8 }}
          title={hasActiveTicket ? "You already have an active ticket" : "Open a new ticket"}
        >
          <Plus size={16} /> Open Support Ticket
        </button>
      </div>

      {/* Filter Bar */}
      <div className="glass-card" style={{ marginBottom: 20, padding: '16px 20px', position: 'relative', zIndex: 10 }}>
        <div className="responsive-filters">
          <div>
            <label className="form-label" style={{ marginBottom: 4, fontSize: 12 }}>Filter Status</label>
            <select
              className="form-select"
              value={filterStatus}
              onChange={e => { setFilterStatus(e.target.value); setPage(1) }}
            >
              <option value="">All Tickets</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tickets List */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div>
          {tickets.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon" style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                <MessageSquare size={40} style={{ color: 'var(--br-text-3)', opacity: 0.6 }} />
              </div>
              <div className="empty-state-text">No support tickets found</div>
              <div className="empty-state-sub">If you have any questions, feel free to open a ticket above.</div>
            </div>
          ) : (
            <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Ticket Subject</th>
                    <th>Category</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Assigned Agent</th>
                    <th>Last Update</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map(t => (
                    <tr
                      key={t.id}
                      onClick={() => navigate(`/publisher/tickets/${t.id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td style={{ fontWeight: 600, color: 'var(--color-text)' }}>
                        {t.subject}
                      </td>
                      <td>{getCategoryLabel(t.category)}</td>
                      <td>{getPriorityBadge(t.priority)}</td>
                      <td>{getStatusBadge(t.status)}</td>
                      <td style={{ color: t.assignee ? 'var(--color-text)' : 'var(--color-text-subtle)' }}>
                        {t.assignee ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <User size={12} style={{ color: 'var(--br-primary)' }} />
                            {t.assignee.name}
                          </span>
                        ) : 'Unassigned'}
                      </td>
                      <td style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>
                        {formatDate(t.updated_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {totalItems > 15 && (
          <Pagination
            currentPage={page}
            totalItems={totalItems}
            pageSize={15}
            onPageChange={setPage}
          />
        )}
      </div>

      {/* Create Ticket Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600, background: 'rgba(15, 17, 23, 0.75)', backdropFilter: 'blur(24px)', border: '0.5px solid var(--br-border)' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <Mail size={18} style={{ color: 'var(--br-primary)' }} />
                Create Support Ticket
              </h3>
              <button className="modal-close" onClick={() => setIsModalOpen(false)} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreateTicket}>
              <div className="form-group">
                <label className="form-label">Subject</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Google Ad Manager sync failing, Payout issue"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    className="form-select"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                  >
                    <option value="billing">Billing Inquiry</option>
                    <option value="technical">Technical Issue</option>
                    <option value="gam">Google Ad Manager Sync</option>
                    <option value="other">Other Question</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select
                    className="form-select"
                    value={priority}
                    onChange={e => setPriority(e.target.value)}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Message Details</label>
                <textarea
                  className="form-textarea"
                  rows={6}
                  placeholder="Please describe your problem or question in detail so we can assist you quickly..."
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  required
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={submitting}
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  {submitting ? 'Submitting...' : <><Mail size={16} /> Submit Ticket</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
