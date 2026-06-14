import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { publisherApi } from '../../api/endpoints'
import { useSettings } from '../../contexts/SettingsContext'
import toast from 'react-hot-toast'
import Pagination from '../../components/Pagination'
import { MessageSquare, Plus, Clock, HelpCircle, CheckCircle, Lock, AlertTriangle, User, Settings, Mail, X, Filter } from 'lucide-react'
import { useI18n } from '../../contexts/I18nContext'

export default function PublisherTickets() {
  const { formatDate } = useSettings()
  const navigate = useNavigate()
  const { t } = useI18n()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [filterStatus, setFilterStatus] = useState('')
  const [hasActiveTicket, setHasActiveTicket] = useState(false)
  const [showFiltersPanel, setShowFiltersPanel] = useState(false)

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
        toast.error(t('tickets.toast_load_fail', 'Failed to load tickets'))
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchTickets()
  }, [page, filterStatus])

  const handleOpenModal = () => {
    if (hasActiveTicket) {
      toast.error(t('tickets.toast_already_active', 'You already have an active support ticket. Please resolve or close it before opening a new one.'))
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
      toast.error(t('tickets.toast_required_fields', 'Subject and message details are required.'))
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
      toast.success(res.data?.message || t('tickets.toast_success', 'Support ticket opened successfully!'))
      setIsModalOpen(false)
      setPage(1)
      fetchTickets()
    } catch (err) {
      toast.error(err.response?.data?.message || t('tickets.toast_create_fail', 'Failed to open ticket.'))
    } finally {
      setSubmitting(false)
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
      case 'billing':
        return t('tickets.category_billing', 'Billing')
      case 'technical':
        return t('tickets.category_technical', 'Technical')
      case 'gam':
        return t('tickets.category_gam', 'GAM Sync')
      case 'other':
      default:
        return t('tickets.category_other', 'Other')
    }
  }

  if (loading && tickets.length === 0) {
    return <div className="loading-screen"><div className="spinner"></div></div>
  }

  const activeFiltersCount = filterStatus !== '' ? 1 : 0

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <MessageSquare size={24} style={{ color: 'var(--br-primary)' }} />
            {t('tickets.title', 'Support Tickets')}
          </h1>
          <p className="page-subtitle">
            {t('tickets.subtitle', 'Need help? Open a ticket to reach our administration team directly.')}
          </p>
          {hasActiveTicket && (
            <p style={{ color: 'var(--br-warning)', fontSize: 13, marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 500 }}>
              <AlertTriangle size={14} /> {t('tickets.active_warning', 'You have an active support ticket. You must close or resolve it before you can open a new one.')}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button 
            className="btn btn-secondary" 
            onClick={() => setShowFiltersPanel(!showFiltersPanel)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            <Filter size={16} />
            <span>{showFiltersPanel ? t('tickets.hide_filters', 'Hide Filters') : t('tickets.show_filters', 'Show Filters')}</span>
            {activeFiltersCount > 0 && (
              <span style={{
                background: 'var(--br-primary)',
                color: '#fff',
                borderRadius: '50%',
                width: 20,
                height: 20,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 'bold'
              }}>
                {activeFiltersCount}
              </span>
            )}
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleOpenModal}
            disabled={hasActiveTicket}
            style={hasActiveTicket ? { opacity: 0.6, cursor: 'not-allowed', display: 'inline-flex', alignItems: 'center', gap: 8 } : { display: 'inline-flex', alignItems: 'center', gap: 8 }}
            title={hasActiveTicket ? t('tickets.already_active_title', 'You already have an active ticket') : t('tickets.open_ticket_title', 'Open a new ticket')}
          >
            <Plus size={16} /> {t('tickets.open_ticket_btn', 'Open Support Ticket')}
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      {showFiltersPanel && (
        <div className="glass-card" style={{ marginBottom: 20, padding: '16px 20px', position: 'relative', zIndex: 10 }}>
          <div className="responsive-filters">
            <div>
              <label className="form-label" style={{ marginBottom: 4, fontSize: 12 }}>{t('tickets.filter_status_label', 'Filter Status')}</label>
              <select
                className="form-select"
                value={filterStatus}
                onChange={e => { setFilterStatus(e.target.value); setPage(1) }}
              >
                <option value="">{t('tickets.filter_all', 'All Tickets')}</option>
                <option value="open">{t('tickets.status_open', 'Open')}</option>
                <option value="in_progress">{t('tickets.status_in_progress', 'In Progress')}</option>
                <option value="resolved">{t('tickets.status_resolved', 'Resolved')}</option>
                <option value="closed">{t('tickets.status_closed', 'Closed')}</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Tickets List */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div>
          {tickets.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon" style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                <MessageSquare size={40} style={{ color: 'var(--br-text-3)', opacity: 0.6 }} />
              </div>
              <div className="empty-state-text">{t('tickets.empty_title', 'No support tickets found')}</div>
              <div className="empty-state-sub">{t('tickets.empty_subtitle', 'If you have any questions, feel free to open a ticket above.')}</div>
            </div>
          ) : (
            <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>{t('tickets.table_subject', 'Ticket Subject')}</th>
                    <th>{t('tickets.table_category', 'Category')}</th>
                    <th>{t('tickets.table_priority', 'Priority')}</th>
                    <th>{t('tickets.table_status', 'Status')}</th>
                    <th>{t('tickets.table_agent', 'Assigned Agent')}</th>
                    <th>{t('tickets.table_updated', 'Last Update')}</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map(tData => (
                    <tr
                      key={tData.id}
                      onClick={() => navigate(`/publisher/tickets/${tData.id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td style={{ fontWeight: 600, color: 'var(--color-text)' }}>
                        {tData.subject}
                      </td>
                      <td>{getCategoryLabel(tData.category)}</td>
                      <td>{getPriorityBadge(tData.priority)}</td>
                      <td>{getStatusBadge(tData.status)}</td>
                      <td style={{ color: tData.assignee ? 'var(--color-text)' : 'var(--color-text-subtle)' }}>
                        {tData.assignee ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <User size={12} style={{ color: 'var(--br-primary)' }} />
                            {tData.assignee.name}
                          </span>
                        ) : t('tickets.unassigned', 'Unassigned')}
                      </td>
                      <td style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>
                        {formatDate(tData.updated_at)}
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
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 600, background: 'rgba(15, 17, 23, 0.75)', backdropFilter: 'blur(24px)', border: '0.5px solid var(--br-border)' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <Mail size={18} style={{ color: 'var(--br-primary)' }} />
                {t('tickets.modal_title', 'Create Support Ticket')}
              </h3>
              <button className="modal-close" onClick={() => setIsModalOpen(false)} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreateTicket}>
              <div className="form-group">
                <label className="form-label">{t('tickets.subject_label', 'Subject')}</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder={t('tickets.subject_placeholder', 'e.g. Google Ad Manager sync failing, Payout issue')}
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">{t('tickets.category_label', 'Category')}</label>
                  <select
                    className="form-select"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                  >
                    <option value="billing">{t('tickets.category_billing_option', 'Billing Inquiry')}</option>
                    <option value="technical">{t('tickets.category_technical_option', 'Technical Issue')}</option>
                    <option value="gam">{t('tickets.category_gam_option', 'Google Ad Manager Sync')}</option>
                    <option value="other">{t('tickets.category_other_option', 'Other Question')}</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">{t('tickets.priority_label', 'Priority')}</label>
                  <select
                    className="form-select"
                    value={priority}
                    onChange={e => setPriority(e.target.value)}
                  >
                    <option value="low">{t('tickets.priority_low_option', 'Low')}</option>
                    <option value="medium">{t('tickets.priority_medium_option', 'Medium')}</option>
                    <option value="high">{t('tickets.priority_high_option', 'High')}</option>
                    <option value="urgent">{t('tickets.priority_urgent_option', 'Urgent')}</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">{t('tickets.message_label', 'Message Details')}</label>
                <textarea
                  className="form-textarea"
                  rows={6}
                  placeholder={t('tickets.message_placeholder', 'Please describe your problem or question in detail so we can assist you quickly...')}
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
                  {t('tickets.cancel_btn', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  {submitting ? t('tickets.submitting', 'Submitting...') : <><Mail size={16} /> {t('tickets.submit_btn', 'Submit Ticket')}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
