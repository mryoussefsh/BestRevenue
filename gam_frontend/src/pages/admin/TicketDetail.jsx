import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { adminApi } from '../../api/endpoints'
import { useSettings } from '../../contexts/SettingsContext'
import toast from 'react-hot-toast'

export default function AdminTicketDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { formatDate } = useSettings()

  const [ticket, setTicket] = useState(null)
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)

  const fetchTicketDetails = (shouldScroll = false) => {
    adminApi.getTicket(id)
      .then(res => {
        setTicket(res.data)
        if (shouldScroll) {
          setTimeout(scrollToBottom, 100)
        }
      })
      .catch(() => {
        toast.error('Failed to load ticket details')
        navigate('/admin/tickets')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchTicketDetails(true)

    // Load admins list for assigning dropdown
    adminApi.getAdminsList()
      .then(res => setAdmins(res.data || []))
      .catch(() => {})
  }, [id])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendReply = async (e) => {
    e.preventDefault()
    if (!replyText.trim()) return

    setSending(true)
    try {
      await adminApi.replyTicket(id, { message: replyText })
      setReplyText('')
      toast.success('Reply posted successfully!')
      fetchTicketDetails(true)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reply.')
    } finally {
      setSending(false)
    }
  }

  const handleUpdateField = async (field, value) => {
    try {
      const payload = { [field]: value }
      const res = await adminApi.updateTicket(id, payload)
      setTicket(res.data?.ticket ? { ...ticket, ...res.data.ticket } : ticket)
      toast.success(`Ticket ${field} updated successfully!`)
      fetchTicketDetails()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update ticket field.')
    }
  }

  const handleAssignToMe = (adminId) => {
    handleUpdateField('assigned_to', adminId)
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

  if (loading) {
    return <div className="loading-screen"><div className="spinner"></div></div>
  }

  if (!ticket) return null

  return (
    <div>
      {/* Back button */}
      <div style={{ marginBottom: 16 }}>
        <Link to="/admin/tickets" className="btn btn-secondary btn-sm" style={{ gap: 6 }}>
          ← Back to Support Tickets
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: 24, alignItems: 'stretch' }}>
        
        {/* Chat Thread Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Ticket Subject and Info header */}
          <div className="card" style={{ padding: 20 }}>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-text)', marginBottom: 8 }}>
              {ticket.subject}
            </h1>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', fontSize: 13, color: 'var(--color-text-muted)', flexWrap: 'wrap' }}>
              <span>Publisher: <strong style={{ color: 'var(--color-primary-light)' }}>{ticket.publisher?.name || 'Guest'}</strong></span>
              <span>•</span>
              <span>Creator: <strong>{ticket.user?.name}</strong> ({ticket.user?.email})</span>
              <span>•</span>
              <span>Updated: <strong>{formatDate(ticket.updated_at)}</strong></span>
            </div>
          </div>

          {/* Messages block */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 380px)', minHeight: 450, padding: 0 }}>
            
            {/* Scrollable messages container */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {ticket.messages?.map((msg) => {
                const isAdmin = msg.is_admin_reply
                return (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex',
                      justifyContent: isAdmin ? 'flex-end' : 'flex-start',
                      width: '100%',
                    }}
                  >
                    <div
                      style={{
                        maxWidth: '75%',
                        background: isAdmin ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, var(--color-surface-2) 100%)' : 'var(--color-surface-3)',
                        border: '1px solid ' + (isAdmin ? 'rgba(99, 102, 241, 0.3)' : 'var(--color-border-light)'),
                        borderRadius: 'var(--radius-lg)',
                        borderTopRightRadius: isAdmin ? '4px' : 'var(--radius-lg)',
                        borderTopLeftRadius: isAdmin ? 'var(--radius-lg)' : '4px',
                        padding: '16px 20px',
                        boxShadow: 'var(--shadow-sm)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 16 }}>
                        <span style={{ fontWeight: 700, fontSize: 13, color: isAdmin ? 'var(--color-primary-light)' : 'var(--color-accent)' }}>
                          {isAdmin ? `🛡️ Admin: ${msg.user?.name || 'Support'}` : `👤 Publisher: ${msg.user?.name || 'Contact'}`}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--color-text-subtle)' }}>
                          {formatDate(msg.created_at)}
                        </span>
                      </div>
                      
                      <div style={{
                        fontSize: 14,
                        color: 'var(--color-text)',
                        lineHeight: 1.5,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      }}>
                        {msg.message}
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Admin Response Textarea */}
            <div style={{ padding: 20, borderTop: '1px solid var(--color-border)', background: 'var(--color-surface-2)', borderBottomLeftRadius: 'var(--radius-lg)', borderBottomRightRadius: 'var(--radius-lg)' }}>
              {ticket.status === 'closed' ? (
                <div className="alert alert-warning" style={{ margin: 0, padding: '14px 18px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 10, borderRadius: 'var(--radius-md)' }}>
                  <span>🔒 This ticket is closed. Please update the status to reopen and reply.</span>
                </div>
              ) : (
                <form onSubmit={handleSendReply} style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
                  <textarea
                    className="form-input"
                    rows={2}
                    style={{ flex: 1, resize: 'none', minHeight: 60, padding: '10px 14px' }}
                    placeholder="Draft your administrator support response..."
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendReply(e)
                      }
                    }}
                    required
                  />
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ height: 48, padding: '0 24px' }}
                    disabled={sending || !replyText.trim()}
                  >
                    {sending ? 'Posting...' : '✉️ Reply'}
                  </button>
                </form>
              )}
            </div>

          </div>
        </div>

        {/* Sidebar Controls Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          {/* Quick Actions Panel */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, borderBottom: '1px solid var(--color-border)', paddingBottom: 10 }}>
              ⚙️ Ticket Management
            </h3>

            {/* Status Dropdown */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: 11, textTransform: 'uppercase' }}>Ticket Status</label>
              <select
                className="form-select"
                value={ticket.status}
                onChange={e => handleUpdateField('status', e.target.value)}
              >
                <option value="open">⏳ Open</option>
                <option value="in_progress">⚙️ In Progress</option>
                <option value="resolved">✅ Resolved</option>
                <option value="closed">🔒 Closed</option>
              </select>
            </div>

            {/* Priority Dropdown */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: 11, textTransform: 'uppercase' }}>Ticket Priority</label>
              <select
                className="form-select"
                value={ticket.priority}
                onChange={e => handleUpdateField('priority', e.target.value)}
              >
                <option value="low">🟢 Low</option>
                <option value="medium">🟡 Medium</option>
                <option value="high">🟠 High</option>
                <option value="urgent">🔴 Urgent</option>
              </select>
            </div>

            {/* Category Dropdown */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: 11, textTransform: 'uppercase' }}>Category</label>
              <select
                className="form-select"
                value={ticket.category}
                onChange={e => handleUpdateField('category', e.target.value)}
              >
                <option value="billing">💳 Billing Inquiry</option>
                <option value="technical">🛠️ Technical Issue</option>
                <option value="gam">📡 Google Ad Manager Sync</option>
                <option value="other">📝 Other Question</option>
              </select>
            </div>

            {/* Assignee Dropdown */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: 11, textTransform: 'uppercase' }}>Assignee</label>
              <select
                className="form-select"
                value={ticket.assigned_to || ''}
                onChange={e => handleUpdateField('assigned_to', e.target.value || null)}
              >
                <option value="">Unassigned</option>
                {admins.map(adm => (
                  <option key={adm.id} value={adm.id}>{adm.name} ({adm.email})</option>
                ))}
              </select>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
