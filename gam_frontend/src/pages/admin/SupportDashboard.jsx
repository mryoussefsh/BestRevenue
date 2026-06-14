import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { adminApi } from '../../api/endpoints'
import toast from 'react-hot-toast'
import { useI18n } from '../../contexts/I18nContext'
import { Ticket, Users, Clock, AlertCircle, Megaphone, Search, ArrowRight } from 'lucide-react'

export default function SupportDashboard() {
  const navigate = useNavigate()
  const { t } = useI18n()
  const [stats, setStats] = useState(null)
  const [tickets, setTickets] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [publishers, setPublishers] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [ticketsRes, pubRes, announcementsRes] = await Promise.all([
        adminApi.getTickets({ per_page: 50 }),
        adminApi.getPublishers({ per_page: 500 }),
        adminApi.getAnnouncements()
      ])

      const ticketsList = ticketsRes.data?.data || []
      const pubList = pubRes.data?.data || []
      const announcementsList = announcementsRes.data?.data || []

      const openTickets = ticketsList.filter(ti => ti.status === 'open')
      const inProgressTickets = ticketsList.filter(ti => ti.status === 'in_progress')

      setStats({
        openTickets: openTickets.length,
        inProgressTickets: inProgressTickets.length,
        activePublishers: pubList.filter(p => p.status === 'active').length,
        pendingPublishers: pubList.filter(p => p.status === 'pending').length
      })

      setTickets(ticketsList.filter(ti => ti.status !== 'resolved' && ti.status !== 'closed').slice(0, 6))
      setAnnouncements(announcementsList.slice(0, 5))
      setPublishers(pubList)

    } catch (err) {
      console.error(err)
      toast.error(t('support_dash.toast_load_fail', 'Failed to load support dashboard data'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }
    const q = searchQuery.toLowerCase()
    const filtered = publishers.filter(p => 
      p.name?.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q)
    ).slice(0, 5)
    setSearchResults(filtered)
  }, [searchQuery, publishers])

  const ticketPriorityBadge = p => ({
    low: 'badge-inactive', medium: 'badge-pending',
    high: 'badge-rejected', urgent: 'badge-rejected',
  })[p] || 'badge-inactive'

  if (loading) {
    return <div className="empty-state"><div className="spinner" /></div>
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Ticket size={28} style={{ color: 'var(--br-primary)' }} />
            <span>{t('support_dash.title', 'Support Operations Desk')}</span>
          </h1>
          <p className="page-subtitle" style={{ color: 'var(--color-text-muted)' }}>
            {t('support_dash.subtitle', 'Workspace for managing ticket lifecycles, publisher verification, and broadcast announcements')}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: .5, color: 'var(--color-text-muted)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Ticket size={14} style={{ color: 'var(--br-primary)' }} /> {t('support_dash.queue_label', 'Ticket Queue & Users')}
        </div>
        <div className="stat-grid">
          <div className="stat-card warning">
            <div className="stat-icon"><AlertCircle size={20} /></div>
            <div className="stat-label">{t('support_dash.open_tickets', 'Open Tickets')}</div>
            <div className="stat-value">{stats?.openTickets}</div>
            <div className="stat-change">{t('support_dash.awaiting_reply', 'Awaiting agent reply')}</div>
          </div>
          <div className="stat-card accent">
            <div className="stat-icon"><Clock size={20} /></div>
            <div className="stat-label">{t('support_dash.in_progress', 'In Progress Tickets')}</div>
            <div className="stat-value">{stats?.inProgressTickets}</div>
            <div className="stat-change">{t('support_dash.being_handled', 'Currently being handled')}</div>
          </div>
          <div className="stat-card primary">
            <div className="stat-icon"><Users size={20} /></div>
            <div className="stat-label">{t('support_dash.active_publishers', 'Active Publishers')}</div>
            <div className="stat-value">{stats?.activePublishers}</div>
            <div className="stat-change">{t('support_dash.verified_accounts', 'Verified accounts')}</div>
          </div>
          <div className="stat-card warning" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(245,158,11,0.02))', border: '1px solid rgba(245,158,11,0.3)' }}>
            <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.15)' }}><Users size={20} /></div>
            <div className="stat-label">{t('support_dash.pending_verifications', 'Pending Verifications')}</div>
            <div className="stat-value" style={{ color: '#f59e0b' }}>{stats?.pendingPublishers}</div>
            <div className="stat-change text-muted">{t('support_dash.awaiting_activation', 'Awaiting activation review')}</div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24, marginBottom: 24 }}>
        
        {/* Active Ticket List */}
        <div className="card" style={{ padding: 0 }}>
          <div className="card-header" style={{ padding: '16px 20px' }}>
            <div>
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Ticket size={16} style={{ color: 'var(--br-primary)' }} /> {t('support_dash.support_queue', 'Support Queue')}
              </div>
              <div className="card-subtitle">{t('support_dash.active_tickets_desc', 'Active tickets requiring attention')}</div>
            </div>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>{t('support_dash.col_publisher', 'Publisher')}</th>
                  <th>{t('support_dash.col_subject', 'Subject')}</th>
                  <th>{t('support_dash.col_priority', 'Priority')}</th>
                  <th>{t('support_dash.col_status', 'Status')}</th>
                  <th>{t('support_dash.col_action', 'Action')}</th>
                </tr>
              </thead>
              <tbody>
                {tickets.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--color-text-muted)' }}>
                        {t('support_dash.all_clear', 'All clear! No pending support tickets.')}
                      </div>
                    </td>
                  </tr>
                ) : (
                  tickets.map(ti => (
                    <tr key={ti.id}>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{ti.publisher?.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{ti.publisher?.email}</div>
                      </td>
                      <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ti.subject}
                      </td>
                      <td>
                        <span className={`badge ${ticketPriorityBadge(ti.priority)}`}>{ti.priority}</span>
                      </td>
                      <td>
                        <span className={`badge ${ti.status === 'open' ? 'badge-pending' : 'badge-approved'}`}>{ti.status}</span>
                      </td>
                      <td>
                        <Link to={`/admin/tickets/${ti.id}`} className="btn btn-secondary btn-xs" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          {t('support_dash.manage_btn', 'Manage')} <ArrowRight size={10} />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Search & Announcements */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Live Search Lookup */}
          <div className="card">
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <Search size={16} style={{ color: 'var(--br-primary)' }} /> {t('support_dash.publisher_lookup', 'Publisher Lookup')}
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-input"
                placeholder={t('support_dash.search_placeholder', 'Search publisher name or email...')}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ paddingLeft: 36 }}
              />
              <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--color-text-muted)' }} />
            </div>

            {searchResults.length > 0 && (
              <div style={{
                background: 'var(--color-surface-2)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                marginTop: 8,
                boxShadow: 'var(--shadow-lg)',
                overflow: 'hidden'
              }}>
                {searchResults.map(p => (
                  <div
                    key={p.id}
                    onClick={() => navigate(`/admin/publishers/${p.id}`)}
                    style={{
                      padding: '10px 16px',
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--color-border-light)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{p.email}</div>
                    </div>
                    <span className={`badge ${p.status === 'active' ? 'badge-approved' : 'badge-pending'}`} style={{ fontSize: 10 }}>{p.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Announcements Summary */}
          <div className="card" style={{ padding: 0, flex: 1 }}>
            <div className="card-header" style={{ padding: '16px 20px' }}>
              <div>
                <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Megaphone size={16} style={{ color: 'var(--br-primary)' }} /> {t('support_dash.recent_announcements', 'Recent Announcements')}
                </div>
                <div className="card-subtitle">{t('support_dash.announcements_desc', 'Broadcast messages sent to publisher portals')}</div>
              </div>
            </div>
            <div style={{ padding: '0 20px 20px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {announcements.length === 0 ? (
                <div style={{ color: 'var(--color-text-muted)', fontSize: 12, padding: '10px 0' }}>
                  {t('support_dash.no_announcements', 'No announcements published')}
                </div>
              ) : (
                announcements.map(ann => (
                  <div key={ann.id} style={{
                    padding: 12,
                    background: 'rgba(255,255,255,0.01)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{ann.title}</span>
                      <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{new Date(ann.created_at).toLocaleDateString()}</span>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {ann.content}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
