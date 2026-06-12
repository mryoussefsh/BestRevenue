import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminApi } from '../../api/endpoints'
import { useSettings } from '../../contexts/SettingsContext'
import toast from 'react-hot-toast'
import Pagination from '../../components/Pagination'
import { 
  Clock, Settings, CheckCircle, Lock, Shield, User, Search, RefreshCw, AlertTriangle, Plus, Tag, HelpCircle, Building, Filter
} from 'lucide-react'

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
  const [showFiltersPanel, setShowFiltersPanel] = useState(false)

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

  const activeFiltersCount = [
    search !== '',
    filterStatus !== '',
    filterCategory !== '',
    filterPriority !== '',
    filterPublisher !== ''
  ].filter(Boolean).length

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <Shield size={24} style={{ color: 'var(--br-primary)' }} /> Support Tickets Panel
          </h1>
          <p className="page-subtitle">
            Manage, assign, and respond to publisher support requests across the platform.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button 
            className="btn btn-secondary" 
            onClick={() => setShowFiltersPanel(!showFiltersPanel)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            <Filter size={16} />
            <span>{showFiltersPanel ? 'Hide Filters' : 'Show Filters'}</span>
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
        </div>
      </div>

      {/* Filter and Search Bar */}
      {showFiltersPanel && (
        <div className="glass-card" style={{ marginBottom: 20, padding: 20, position: 'relative', zIndex: 10 }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="filter-bar">
            
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
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
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
                <option value="billing">Billing</option>
                <option value="technical">Technical</option>
                <option value="gam">GAM Sync</option>
                <option value="other">Other</option>
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
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            {/* Publisher */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 220 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Publisher</label>
              <PublisherSelect
                publishers={publishers}
                value={filterPublisher}
                onChange={val => { setFilterPublisher(val); setPage(1) }}
              />
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" className="btn btn-primary btn-sm" style={{ padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Search size={14} /> Search
              </button>
              {(search || filterStatus || filterCategory || filterPriority || filterPublisher) && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleResetFilters}
                  style={{ padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <RefreshCw size={14} /> Reset
                </button>
              )}
            </div>

          </div>
        </form>
      </div>
      )}

      {/* Tickets List Card */}
      <div className="glass-card" style={{ padding: 0 }}>
        <div className="table-wrap">
          {tickets.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 20px', textAlign: 'center' }}>
              <div style={{ marginBottom: 12 }}><Shield size={48} style={{ color: 'var(--color-text-subtle)', margin: '0 auto' }} /></div>
              <div className="empty-state-text" style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>No support tickets found</div>
              <div className="empty-state-sub" style={{ fontSize: 13, color: 'var(--color-text-subtle)' }}>Adjust your filters or query to find tickets.</div>
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Building size={14} />
                        {t.publisher?.name || 'Guest / Unlinked'}
                      </div>
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
                      {t.assignee ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <User size={14} style={{ color: 'var(--br-primary)' }} />
                          {t.assignee.name}
                        </div>
                      ) : 'Unassigned'}
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

function PublisherSelect({ publishers, value, onChange }) {
  const [search, setSearch]   = useState('')
  const [open, setOpen]       = useState(false)
  const containerRef          = useRef(null)

  const selected = publishers.find(p => p.id === value)

  const filtered = publishers.filter(p =>
    !search || p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.email?.toLowerCase().includes(search.toLowerCase())
  )

  useEffect(() => {
    function handleOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  function handleSelect(pub) {
    onChange(pub ? pub.id : '')
    setOpen(false)
    setSearch('')
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', minWidth: 220 }}>
      <div
        className="form-input"
        style={{
          cursor: 'pointer', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '6px 10px',
          fontSize: 13, userSelect: 'none',
        }}
        onClick={() => setOpen(o => !o)}
      >
        <span style={{ color: selected ? 'var(--color-text)' : 'var(--color-text-muted)' }}>
          {selected ? selected.name : 'All Publishers'}
        </span>
        <span style={{ fontSize: 10, color: 'var(--color-text-muted)', marginLeft: 8 }}>{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 999,
          maxHeight: 280,
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--color-border)' }}>
            <input
              autoFocus
              className="form-input"
              style={{ padding: '5px 8px', fontSize: 12, width: '100%' }}
              placeholder="Search publisher…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onClick={e => e.stopPropagation()}
            />
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            <div
              style={{
                padding: '8px 12px', fontSize: 13, cursor: 'pointer',
                color: 'var(--color-text-muted)',
                background: !value ? 'rgba(99,102,241,.1)' : 'transparent',
              }}
              onClick={() => handleSelect(null)}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,.08)'}
              onMouseLeave={e => e.currentTarget.style.background = !value ? 'rgba(99,102,241,.1)' : 'transparent'}
            >
              All Publishers
            </div>
            {filtered.length === 0 && (
              <div style={{ padding: '8px 12px', fontSize: 12, color: 'var(--color-text-muted)' }}>No results</div>
            )}
            {filtered.map(pub => (
              <div
                key={pub.id}
                style={{
                  padding: '8px 12px', cursor: 'pointer',
                  background: value === pub.id ? 'rgba(99,102,241,.1)' : 'transparent',
                }}
                onClick={() => handleSelect(pub)}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,.08)'}
                onMouseLeave={e => e.currentTarget.style.background = value === pub.id ? 'rgba(99,102,241,.1)' : 'transparent'}
              >
                <div style={{ fontWeight: 600, fontSize: 13 }}>{pub.name}</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{pub.email}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
