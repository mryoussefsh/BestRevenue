import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminApi } from '../../api/endpoints'
import { useSettings } from '../../contexts/SettingsContext'
import toast from 'react-hot-toast'
import Pagination from '../../components/Pagination'

export default function AdminTickets() {
  const { formatDate } = useSettings()
  const navigate = useNavigate()
  
  // Data lists
  const [tickets, setTickets] = useState([])
  const [publishers, setPublishers] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  // Filter parameters
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [filterPublisher, setFilterPublisher] = useState('')

  useEffect(() => {
    // Load publishers for dropdown
    adminApi.getPublishers({ per_page: 200 })
      .then(res => setPublishers(res.data?.data || []))
      .catch(() => {})
  }, [])

  const fetchTickets = () => {
    setLoading(true)
    adminApi.getTickets({
      page,
      search,
      status: filterStatus,
      category: filterCategory,
      priority: filterPriority,
      publisher_id: filterPublisher,
    })
      .then(res => {
        console.log('ADMIN TICKETS COUNT:', res.data?.data?.length, JSON.stringify(res.data))
        setTickets(res.data?.data || [])
        setTotalItems(res.data?.total || 0)
      })
      .catch(err => {
        console.error('ADMIN TICKETS FETCH ERROR:', err)
        toast.error('Failed to load tickets')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchTickets()
  }, [page, filterStatus, filterCategory, filterPriority, filterPublisher])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setPage(1)
    fetchTickets()
  }

  const handleResetFilters = () => {
    setSearch('')
    setFilterStatus('')
    setFilterCategory('')
    setFilterPriority('')
    setFilterPublisher('')
    setPage(1)
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
          <h1 className="page-title">🎫 Support Tickets Panel</h1>
          <p className="page-subtitle">
            Manage, assign, and respond to publisher support requests across the platform.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ marginBottom: 20, padding: 20 }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            
            {/* Search query */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 200 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Search Query</label>
              <input
                type="text"
                className="form-input"
                placeholder="Search subject, publisher, creator name..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ padding: '6px 12px', fontSize: 13 }}
              />
            </div>

            {/* Status */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 140 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Status</label>
              <select
                className="form-select"
                value={filterStatus}
                onChange={e => { setFilterStatus(e.target.value); setPage(1) }}
                style={{ padding: '6px 10px', fontSize: 13 }}
              >
                <option value="">All Statuses</option>
                <option value="open">⏳ Open</option>
                <option value="in_progress">⚙️ In Progress</option>
                <option value="resolved">✅ Resolved</option>
                <option value="closed">🔒 Closed</option>
              </select>
            </div>

            {/* Category */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 140 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Category</label>
              <select
                className="form-select"
                value={filterCategory}
                onChange={e => { setFilterCategory(e.target.value); setPage(1) }}
                style={{ padding: '6px 10px', fontSize: 13 }}
              >
                <option value="">All Categories</option>
                <option value="billing">💳 Billing</option>
                <option value="technical">🛠️ Technical</option>
                <option value="gam">📡 GAM Sync</option>
                <option value="other">📝 Other</option>
              </select>
            </div>

            {/* Priority */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 120 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Priority</label>
              <select
                className="form-select"
                value={filterPriority}
                onChange={e => { setFilterPriority(e.target.value); setPage(1) }}
                style={{ padding: '6px 10px', fontSize: 13 }}
              >
                <option value="">All Priorities</option>
                <option value="low">🟢 Low</option>
                <option value="medium">🟡 Medium</option>
                <option value="high">🟠 High</option>
                <option value="urgent">🔴 Urgent</option>
              </select>
            </div>

            {/* Publisher */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 180 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Publisher</label>
              <select
                className="form-select"
                value={filterPublisher}
                onChange={e => { setFilterPublisher(e.target.value); setPage(1) }}
                style={{ padding: '6px 10px', fontSize: 13 }}
              >
                <option value="">All Publishers</option>
                {publishers.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" className="btn btn-primary btn-sm" style={{ padding: '8px 16px' }}>
                🔍 Search
              </button>
              {(search || filterStatus || filterCategory || filterPriority || filterPublisher) && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleResetFilters}
                  style={{ padding: '8px 16px' }}
                >
                  ✕ Reset
                </button>
              )}
            </div>

          </div>
        </form>
      </div>

      {/* Tickets List Card */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-container">
          {tickets.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🎫</div>
              <div className="empty-state-text">No support tickets found</div>
              <div className="empty-state-sub">Adjust your filters or query to find tickets.</div>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Publisher</th>
                  <th>Creator</th>
                  <th>Subject</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Assignee</th>
                  <th>Updated At</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map(t => (
                  <tr
                    key={t.id}
                    onClick={() => navigate(`/admin/tickets/${t.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td style={{ fontWeight: 700, color: 'var(--color-primary-light)' }}>
                      🏢 {t.publisher?.name || 'Guest / Unlinked'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 600 }}>{t.user?.name}</span>
                        <span style={{ fontSize: 11, color: 'var(--color-text-subtle)' }}>{t.user?.email}</span>
                      </div>
                    </td>
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
    </div>
  )
}
