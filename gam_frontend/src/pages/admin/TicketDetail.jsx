import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { adminApi } from '../../api/endpoints'
import { useSettings } from '../../contexts/SettingsContext'
import { useI18n } from '../../contexts/I18nContext'
import toast from 'react-hot-toast'
import { ArrowLeft, Clock, Settings, CheckCircle, Lock, Shield, User, Send, AlertTriangle, Tag } from 'lucide-react'

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
  const { t } = useI18n()

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
        toast.error(t('admin_ticket_detail.toast_load_fail', 'Failed to load ticket details'))
        navigate('/admin/tickets')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchTicketDetails(true)
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
      toast.success(t('admin_ticket_detail.toast_reply_sent', 'Reply posted successfully!'))
      fetchTicketDetails(true)
    } catch (err) {
      toast.error(err.response?.data?.message || t('admin_ticket_detail.toast_reply_fail', 'Failed to send reply.'))
    } finally {
      setSending(false)
    }
  }

  const handleUpdateField = async (field, value) => {
    try {
      const payload = { [field]: value }
      const res = await adminApi.updateTicket(id, payload)
      setTicket(res.data?.ticket ? { ...ticket, ...res.data.ticket } : ticket)
      toast.success(t('admin_ticket_detail.toast_updated', `Ticket ${field} updated successfully!`))
      fetchTicketDetails()
    } catch (err) {
      toast.error(err.response?.data?.message || t('admin_ticket_detail.toast_update_fail', 'Failed to update ticket field.'))
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'open':
        return (
          <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Clock size={12} /> {t('tickets.status_open', 'Open')}
          </span>
        )
      case 'in_progress':
        return (
          <span className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Settings size={12} /> {t('tickets.status_in_progress', 'In Progress')}
          </span>
        )
      case 'resolved':
        return (
          <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <CheckCircle size={12} /> {t('tickets.status_resolved', 'Resolved')}
          </span>
        )
      case 'closed':
        return (
          <span className="badge badge-neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Lock size={12} /> {t('tickets.status_closed', 'Closed')}
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
            <span className="dot" style={{ background: 'var(--br-accent)' }} /> {t('tickets.priority_low', 'Low')}
          </span>
        )
      case 'medium':
        return (
          <span style={{ color: 'var(--br-warning)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span className="dot" style={{ background: 'var(--br-warning)' }} /> {t('tickets.priority_medium', 'Medium')}
          </span>
        )
      case 'high':
        return (
          <span style={{ color: '#f97316', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span className="dot" style={{ background: '#f97316' }} /> {t('tickets.priority_high', 'High')}
          </span>
        )
      case 'urgent':
        return (
          <span style={{ color: 'var(--br-danger)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span className="dot" style={{ background: 'var(--br-danger)' }} /> {t('tickets.priority_urgent', 'Urgent')}
          </span>
        )
      default:
        return <span>{prio}</span>
    }
  }

  const getCategoryLabel = (cat) => {
    switch (cat) {
      case 'billing': return t('tickets.cat_billing', 'Billing')
      case 'technical': return t('tickets.cat_technical', 'Technical')
      case 'gam': return t('tickets.cat_gam', 'GAM Sync')
      case 'other': default: return t('tickets.cat_other', 'Other')
    }
  }

  if (loading) {
    return <div className="loading-screen"><div className="spinner"></div></div>
  }

  if (!ticket) return null

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Link to="/admin/tickets" className="btn btn-secondary btn-sm" style={{ gap: 6, display: 'inline-flex', alignItems: 'center' }}>
          <ArrowLeft size={14} /> {t('admin_ticket_detail.back', 'Back to Support Tickets')}
        </Link>
      </div>

      <div className="profile-grid" style={{ gridTemplateColumns: '3fr 1fr', alignItems: 'stretch' }}>
        
        {/* Chat Thread Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Ticket Subject and Info header */}
          <div className="glass-card" style={{ padding: 20 }}>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-text)', marginBottom: 8 }}>
              {ticket.subject}
            </h1>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', fontSize: 13, color: 'var(--color-text-muted)', flexWrap: 'wrap' }}>
              <span>{t('admin_ticket_detail.publisher_label', 'Publisher')}: {ticket.publisher ? (
                <Link to={`/admin/publishers/${ticket.publisher.id}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary-light)', fontWeight: 700, textDecoration: 'none' }} onMouseEnter={e => e.target.style.textDecoration = 'underline'} onMouseLeave={e => e.target.style.textDecoration = 'none'}>
                  {ticket.publisher.name}
                </Link>
              ) : t('admin_ticket_detail.guest', 'Guest')}</span>
              <span>•</span>
              <span>{t('admin_ticket_detail.creator', 'Creator')}: <strong>{ticket.user?.name}</strong> ({ticket.user?.email})</span>
              <span>•</span>
              <span>{t('admin_ticket_detail.updated', 'Updated')}: <strong>{formatDate(ticket.updated_at)}</strong></span>
            </div>
          </div>

          {/* Messages block */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 380px)', minHeight: 450, padding: 0, overflow: 'hidden' }}>
            
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
                              {t('admin_ticket_detail.support_expert', 'Support Expert')}: {msg.user?.name || 'Support'}
                            </>
                          ) : (
                            <>
                              <User size={12} style={{ color: 'var(--color-primary-light)' }} />
                              {t('admin_ticket_detail.publisher_msg', 'Publisher')}: {msg.user?.name || 'Contact'}
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
                  <span>{t('admin_ticket_detail.closed_notice', 'This ticket is closed. Please update the status to reopen and reply.')}</span>
                </div>
              ) : (
                <form onSubmit={handleSendReply} style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
                  <textarea
                    className="form-input"
                    rows={2}
                    style={{ flex: 1, resize: 'none', minHeight: 60, padding: '10px 14px' }}
                    placeholder={t('admin_ticket_detail.reply_placeholder', 'Draft your administrator support response...')}
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
                    {sending ? t('admin_ticket_detail.posting', 'Posting...') : <><Send size={16} /> {t('admin_ticket_detail.reply_btn', 'Reply')}</>}
                  </button>
                </form>
              )}
            </div>

          </div>
        </div>

        {/* Sidebar Controls Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 700, borderBottom: '1px solid var(--color-border)', paddingBottom: 10 }}>
              <Settings size={18} style={{ color: 'var(--br-primary)' }} />
              <span>{t('admin_ticket_detail.management_title', 'Ticket Management')}</span>
            </div>

            {/* Status Dropdown */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: 11, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={12} /> {t('admin_ticket_detail.ticket_status', 'Ticket Status')}
              </label>
              <select
                className="form-select"
                value={ticket.status}
                onChange={e => handleUpdateField('status', e.target.value)}
              >
                <option value="open">{t('tickets.status_open', 'Open')}</option>
                <option value="in_progress">{t('tickets.status_in_progress', 'In Progress')}</option>
                <option value="resolved">{t('tickets.status_resolved', 'Resolved')}</option>
                <option value="closed">{t('tickets.status_closed', 'Closed')}</option>
              </select>
            </div>

            {/* Priority Dropdown */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: 11, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertTriangle size={12} /> {t('admin_ticket_detail.ticket_priority', 'Ticket Priority')}
              </label>
              <select
                className="form-select"
                value={ticket.priority}
                onChange={e => handleUpdateField('priority', e.target.value)}
              >
                <option value="low">{t('tickets.priority_low', 'Low')}</option>
                <option value="medium">{t('tickets.priority_medium', 'Medium')}</option>
                <option value="high">{t('tickets.priority_high', 'High')}</option>
                <option value="urgent">{t('tickets.priority_urgent', 'Urgent')}</option>
              </select>
            </div>

            {/* Category Dropdown */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: 11, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Tag size={12} /> {t('admin_ticket_detail.category', 'Category')}
              </label>
              <select
                className="form-select"
                value={ticket.category}
                onChange={e => handleUpdateField('category', e.target.value)}
              >
                <option value="billing">{t('tickets.cat_billing_inquiry', 'Billing Inquiry')}</option>
                <option value="technical">{t('tickets.cat_technical_issue', 'Technical Issue')}</option>
                <option value="gam">{t('tickets.cat_gam_sync', 'Google Ad Manager Sync')}</option>
                <option value="other">{t('tickets.cat_other_question', 'Other Question')}</option>
              </select>
            </div>

            {/* Assignee Dropdown */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: 11, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                <User size={12} /> {t('admin_ticket_detail.assignee', 'Assignee')}
              </label>
              <select
                className="form-select"
                value={ticket.assigned_to || ''}
                onChange={e => handleUpdateField('assigned_to', e.target.value || null)}
              >
                <option value="">{t('admin_tickets.unassigned', 'Unassigned')}</option>
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
