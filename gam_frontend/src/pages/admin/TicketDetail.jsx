import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { adminApi } from '../../api/endpoints'
import { useSettings } from '../../contexts/SettingsContext'
import toast from 'react-hot-toast'
import { 
  ArrowLeft, MessageSquare, Clock, Settings, CheckCircle, Lock, 
  Shield, User, Send, AlertTriangle, Tag 
} from 'lucide-react'

const renderMessageWithLinks = (text) => {
  if (!text) return '';
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, index) => {
    if (part.match(/^(https?:\/\/|www\.)/i)) {
      const href = part.toLowerCase().startsWith('www.') ? `https://${part}` : part;
      return (
        <a 
          key={index} 
          href={href} 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ 
            color: 'var(--color-primary-light)', 
            textDecoration: 'underline',
            wordBreak: 'break-all',
            fontWeight: 600
          }}
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

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

  if (loading) {
    return <div className="loading-screen"><div className="spinner"></div></div>
  }

  if (!ticket) return null

  return (
    <div>
      {/* Back button */}
      <div style={{ marginBottom: 16 }}>
        <Link to="/admin/tickets" className="btn btn-secondary btn-sm" style={{ gap: 6, display: 'inline-flex', alignItems: 'center' }}>
          <ArrowLeft size={14} /> Back to Support Tickets
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: 24, alignItems: 'stretch' }}>
        
        {/* Chat Thread Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Ticket Subject and Info header */}
          <div className="glass-card" style={{ padding: 20 }}>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-text)', marginBottom: 8 }}>
              {ticket.subject}
            </h1>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', fontSize: 13, color: 'var(--color-text-muted)', flexWrap: 'wrap' }}>
              <span>Publisher: {ticket.publisher ? (
                <Link to={`/admin/publishers/${ticket.publisher.id}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary-light)', fontWeight: 700, textDecoration: 'none' }} onMouseEnter={e => e.target.style.textDecoration = 'underline'} onMouseLeave={e => e.target.style.textDecoration = 'none'}>
                  {ticket.publisher.name}
                </Link>
              ) : 'Guest'}</span>
              <span>•</span>
              <span>Creator: <strong>{ticket.user?.name}</strong> ({ticket.user?.email})</span>
              <span>•</span>
              <span>Updated: <strong>{formatDate(ticket.updated_at)}</strong></span>
            </div>
          </div>

          {/* Messages block */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 380px)', minHeight: 450, padding: 0, overflow: 'hidden' }}>
            
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
                      className="ticket-bubble"
                      style={{
                        background: isAdmin ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(255, 255, 255, 0.02) 100%)' : 'var(--br-surface)',
                        border: '0.5px solid ' + (isAdmin ? 'rgba(99, 102, 241, 0.3)' : 'var(--br-border)'),
                        borderTopRightRadius: isAdmin ? '4px' : 'var(--radius-lg)',
                        borderTopLeftRadius: isAdmin ? 'var(--radius-lg)' : '4px',
                      }}
                    >
                      <div className="ticket-bubble-header">
                        <span className="ticket-bubble-name" style={{ color: 'var(--color-primary-light)' }}>
                          {isAdmin ? (
                            <>
                              <Shield size={12} style={{ color: 'var(--br-primary)' }} />
                              Support Expert: {msg.user?.name || 'Support'}
                            </>
                          ) : (
                            <>
                              <User size={12} style={{ color: 'var(--color-primary-light)' }} />
                              Publisher: {msg.user?.name || 'Contact'}
                            </>
                          )}
                        </span>
                        <span className="ticket-bubble-date">
                          {formatDate(msg.created_at)}
                        </span>
                      </div>
                      
                      <div className="ticket-bubble-message">
                        {renderMessageWithLinks(msg.message)}
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Admin Response Textarea */}
            <div style={{ padding: 20, borderTop: '0.5px solid var(--br-border)', background: 'var(--br-bg-2)' }}>
              {ticket.status === 'closed' ? (
                <div className="alert alert-warning" style={{ margin: 0, padding: '14px 18px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 10, borderRadius: 'var(--radius-md)' }}>
                  <Lock size={16} />
                  <span>This ticket is closed. Please update the status to reopen and reply.</span>
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
                    style={{ height: 48, padding: '0 24px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    disabled={sending || !replyText.trim()}
                  >
                    {sending ? 'Posting...' : <><Send size={16} /> Reply</>}
                  </button>
                </form>
              )}
            </div>

          </div>
        </div>

        {/* Sidebar Controls Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          {/* Quick Actions Panel */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 700, borderBottom: '1px solid var(--color-border)', paddingBottom: 10 }}>
              <Settings size={18} style={{ color: 'var(--br-primary)' }} />
              <span>Ticket Management</span>
            </div>

            {/* Status Dropdown */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: 11, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={12} /> Ticket Status
              </label>
              <select
                className="form-select"
                value={ticket.status}
                onChange={e => handleUpdateField('status', e.target.value)}
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            {/* Priority Dropdown */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: 11, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertTriangle size={12} /> Ticket Priority
              </label>
              <select
                className="form-select"
                value={ticket.priority}
                onChange={e => handleUpdateField('priority', e.target.value)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            {/* Category Dropdown */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: 11, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Tag size={12} /> Category
              </label>
              <select
                className="form-select"
                value={ticket.category}
                onChange={e => handleUpdateField('category', e.target.value)}
              >
                <option value="billing">Billing Inquiry</option>
                <option value="technical">Technical Issue</option>
                <option value="gam">Google Ad Manager Sync</option>
                <option value="other">Other Question</option>
              </select>
            </div>

            {/* Assignee Dropdown */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: 11, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                <User size={12} /> Assignee
              </label>
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
