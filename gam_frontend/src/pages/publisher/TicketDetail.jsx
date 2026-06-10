import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { publisherApi } from '../../api/endpoints'
import { useSettings } from '../../contexts/SettingsContext'
import toast from 'react-hot-toast'

export default function PublisherTicketDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { formatDate } = useSettings()
  
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)

  const fetchTicketDetails = (shouldScroll = false) => {
    publisherApi.getTicket(id)
      .then(res => {
        setTicket(res.data)
        if (shouldScroll) {
          setTimeout(scrollToBottom, 100)
        }
      })
      .catch(() => {
        toast.error('Failed to load ticket details')
        navigate('/publisher/tickets')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchTicketDetails(true)
  }, [id])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendReply = async (e) => {
    e.preventDefault()
    if (!replyText.trim()) return

    setSending(true)
    try {
      await publisherApi.replyTicket(id, { message: replyText })
      setReplyText('')
      toast.success('Message sent successfully!')
      fetchTicketDetails(true)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reply.')
    } finally {
      setSending(false)
    }
  }

  const handleCloseTicket = async () => {
    if (!window.confirm('Are you sure you want to close this ticket?')) return

    try {
      const res = await publisherApi.closeTicket(id)
      toast.success(res.data?.message || 'Ticket marked as closed.')
      fetchTicketDetails()
    } catch (err) {
      toast.error('Failed to close ticket.')
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

  if (loading) {
    return <div className="loading-screen"><div className="spinner"></div></div>
  }

  if (!ticket) return null

  return (
    <div>
      {/* Back button */}
      <div style={{ marginBottom: 16 }}>
        <Link to="/publisher/tickets" className="btn btn-secondary btn-sm" style={{ gap: 6 }}>
          ← Back to Support Tickets
        </Link>
      </div>

      {/* Ticket Details Card */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-text)', marginBottom: 8 }}>
              {ticket.subject}
            </h1>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', fontSize: 13, color: 'var(--color-text-muted)' }}>
              <span>Category: <strong>{getCategoryLabel(ticket.category)}</strong></span>
              <span>•</span>
              <span>Priority: {getPriorityBadge(ticket.priority)}</span>
              <span>•</span>
              <span>Status: {getStatusBadge(ticket.status)}</span>
              <span>•</span>
              <span>Opened by: <strong>{ticket.user?.name || 'You'}</strong></span>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{
              background: 'var(--color-surface-2)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '8px 16px',
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <span>Assigned Agent:</span>
              <strong style={{ color: ticket.assignee ? 'var(--color-text)' : 'var(--color-text-subtle)' }}>
                {ticket.assignee ? `👤 ${ticket.assignee.name}` : 'Unassigned'}
              </strong>
            </div>

            {ticket.status !== 'closed' && (
              <button className="btn btn-danger btn-sm" onClick={handleCloseTicket}>
                🔒 Close Ticket
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Chat Thread */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 360px)', minHeight: 450, padding: 0 }}>
        
        {/* Messages scroll area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {ticket.messages?.map((msg) => {
            const isAdmin = msg.is_admin_reply
            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  justifyContent: isAdmin ? 'flex-start' : 'flex-end',
                  width: '100%',
                }}
              >
                <div
                  style={{
                    maxWidth: '75%',
                    background: isAdmin ? 'var(--color-surface-3)' : 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, var(--color-surface-2) 100%)',
                    border: '1px solid ' + (isAdmin ? 'var(--color-border-light)' : 'rgba(99, 102, 241, 0.3)'),
                    borderRadius: 'var(--radius-lg)',
                    borderTopLeftRadius: isAdmin ? '4px' : 'var(--radius-lg)',
                    borderBottomRightRadius: isAdmin ? 'var(--radius-lg)' : '4px',
                    padding: '16px 20px',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 16 }}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: isAdmin ? 'var(--color-primary-light)' : 'var(--color-accent)' }}>
                      {isAdmin ? '🛡️ Admin Support' : (msg.user?.name || 'You')}
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

        {/* Input response area */}
        <div style={{ padding: 20, borderTop: '1px solid var(--color-border)', background: 'var(--color-surface-2)', borderBottomLeftRadius: 'var(--radius-lg)', borderBottomRightRadius: 'var(--radius-lg)' }}>
          {ticket.status === 'closed' ? (
            <div className="alert alert-warning" style={{ margin: 0, padding: '14px 18px', fontSize: 14, display: 'flex', alignItems: 'center', gap: 10, borderRadius: 'var(--radius-md)' }}>
              <span>🔒 This ticket is closed. Please open a new ticket if you need more help or have other problems.</span>
            </div>
          ) : (
            <form onSubmit={handleSendReply} style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
              <textarea
                className="form-input"
                rows={2}
                style={{ flex: 1, resize: 'none', minHeight: 60, padding: '10px 14px' }}
                placeholder="Type your response here..."
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
                {sending ? 'Sending...' : '✉️ Reply'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
