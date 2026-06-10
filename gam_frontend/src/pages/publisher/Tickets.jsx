import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { publisherApi } from '../../api/endpoints'
import { useSettings } from '../../contexts/SettingsContext'
import toast from 'react-hot-toast'
import Pagination from '../../components/Pagination'

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
        return <span className="badge badge-pending">⏳ Open</span>
      case 'in_progress':
        return <span className="badge badge-approved">⚙️ In Progress</span>
      case 'resolved':
        return <span className="badge badge-active">✅ Resolved</span>
      case 'closed':
        return <span className="badge badge-inactive">🔒 Closed</span>
      default:
        return <span className="badge badge-inactive">{status}</span>
    }
  }

  const getPriorityBadge = (prio) => {
    switch (prio) {
      case 'low':
        return <span style={{ color: 'var(--color-accent)', fontWeight: 600 }}>🟢 Low</span>
      case 'medium':
        return <span style={{ color: 'var(--color-warning)', fontWeight: 600 }}>🟡 Medium</span>
      case 'high':
        return <span style={{ color: '#f97316', fontWeight: 600 }}>🟠 High</span>
      case 'urgent':
        return <span style={{ color: 'var(--color-danger)', fontWeight: 600 }}>🔴 Urgent</span>
      default:
        return <span>{prio}</span>
    }
  }

  const getCategoryLabel = (cat) => {
    switch (cat) {
      case 'billing':
        return '💳 Billing'
      case 'technical':
        return '🛠️ Technical'
      case 'gam':
        return '📡 GAM Sync'
      case 'other':
      default:
        return '📝 Other'
    }
  }

  if (loading && tickets.length === 0) {
    return <div className="loading-screen"><div className="spinner"></div></div>
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">🎫 Support Tickets</h1>
          <p className="page-subtitle">
            Need help? Open a ticket to reach our administration team directly.
          </p>
          {hasActiveTicket && (
            <p style={{ color: 'var(--color-warning)', fontSize: 13, marginTop: 6, fontWeight: 500 }}>
              ⚠️ You have an active support ticket. You must close or resolve it before you can open a new one.
            </p>
          )}
        </div>
        <button 
          className="btn btn-primary" 
          onClick={handleOpenModal}
          disabled={hasActiveTicket}
          style={hasActiveTicket ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
          title={hasActiveTicket ? "You already have an active ticket" : "Open a new ticket"}
        >
          ➕ Open Support Ticket
        </button>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ marginBottom: 20, padding: '14px 20px' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 160 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Filter Status</label>
            <select
              className="form-select"
              value={filterStatus}
              onChange={e => { setFilterStatus(e.target.value); setPage(1) }}
              style={{ padding: '6px 10px', fontSize: 13 }}
            >
              <option value="">All Tickets</option>
              <option value="open">⏳ Open</option>
              <option value="in_progress">⚙️ In Progress</option>
              <option value="resolved">✅ Resolved</option>
              <option value="closed">🔒 Closed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tickets List */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-container">
          {tickets.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🎫</div>
              <div className="empty-state-text">No support tickets found</div>
              <div className="empty-state-sub">If you have any questions, feel free to open a ticket above.</div>
            </div>
          ) : (
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
                      {t.assignee ? `👤 ${t.assignee.name}` : 'Unassigned'}
                    </td>
                    <td style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>
                      {formatDate(t.updated_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <h3 className="modal-title">✉️ Create Support Ticket</h3>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>✕</button>
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
                    <option value="billing">💳 Billing Inquiry</option>
                    <option value="technical">🛠️ Technical Issue</option>
                    <option value="gam">📡 Google Ad Manager Sync</option>
                    <option value="other">📝 Other Question</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select
                    className="form-select"
                    value={priority}
                    onChange={e => setPriority(e.target.value)}
                  >
                    <option value="low">🟢 Low</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="high">🟠 High</option>
                    <option value="urgent">🔴 Urgent</option>
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
                >
                  {submitting ? 'Submitting...' : '✉️ Submit Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
