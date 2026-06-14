import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminApi } from '../../api/endpoints'
import { useSettings } from '../../contexts/SettingsContext'
import { useI18n } from '../../contexts/I18nContext'
import toast from 'react-hot-toast'
import Pagination from '../../components/Pagination'
import { Clock, Settings, CheckCircle, Lock, Shield, User, Search, RefreshCw, Building, Filter } from 'lucide-react'

export default function AdminTickets() {
  const { formatDate } = useSettings()
  const { t } = useI18n()
  const navigate = useNavigate()
  
  const [tickets, setTickets] = useState([])
  const [publishers, setPublishers] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [filterPublisher, setFilterPublisher] = useState('')
  const [showFiltersPanel, setShowFiltersPanel] = useState(false)

  useEffect(() => {
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
        setTickets(res.data?.data || [])
        setTotalItems(res.data?.total || 0)
      })
      .catch(err => {
        console.error('ADMIN TICKETS FETCH ERROR:', err)
        toast.error(t('admin_tickets.toast_load_fail', 'Failed to load tickets'))
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
            <Shield size={24} style={{ color: 'var(--br-primary)' }} /> {t('admin_tickets.title', 'Support Tickets Panel')}
          </h1>
          <p className="page-subtitle">
            {t('admin_tickets.subtitle', 'Manage, assign, and respond to publisher support requests across the platform.')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button 
            className="btn btn-secondary" 
            onClick={() => setShowFiltersPanel(!showFiltersPanel)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            <Filter size={16} />
            <span>{showFiltersPanel ? t('common.hide_filters', 'Hide Filters') : t('common.show_filters', 'Show Filters')}</span>
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

      {showFiltersPanel && (
        <div className="glass-card" style={{ marginBottom: 20, padding: 20, position: 'relative', zIndex: 10 }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="filter-bar">
            
            {/* Search query */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 200 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>{t('admin_tickets.filter_search', 'Search Query')}</label>
              <input
                type="text"
                className="form-input"
                placeholder={t('admin_tickets.search_placeholder', 'Search subject, publisher, creator name...')}
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ padding: '6px 12px', fontSize: 13 }}
              />
            </div>

            {/* Status */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 140 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>{t('admin_tickets.filter_status', 'Status')}</label>
              <select
                className="form-select"
                value={filterStatus}
                onChange={e => { setFilterStatus(e.target.value); setPage(1) }}
                style={{ padding: '6px 10px', fontSize: 13 }}
              >
                <option value="">{t('admin_tickets.all_statuses', 'All Statuses')}</option>
                <option value="open">{t('tickets.status_open', 'Open')}</option>
                <option value="in_progress">{t('tickets.status_in_progress', 'In Progress')}</option>
                <option value="resolved">{t('tickets.status_resolved', 'Resolved')}</option>
                <option value="closed">{t('tickets.status_closed', 'Closed')}</option>
              </select>
            </div>

            {/* Category */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 140 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>{t('admin_tickets.filter_category', 'Category')}</label>
              <select
                className="form-select"
                value={filterCategory}
                onChange={e => { setFilterCategory(e.target.value); setPage(1) }}
                style={{ padding: '6px 10px', fontSize: 13 }}
              >
                <option value="">{t('admin_tickets.all_categories', 'All Categories')}</option>
                <option value="billing">{t('tickets.cat_billing', 'Billing')}</option>
                <option value="technical">{t('tickets.cat_technical', 'Technical')}</option>
                <option value="gam">{t('tickets.cat_gam', 'GAM Sync')}</option>
                <option value="other">{t('tickets.cat_other', 'Other')}</option>
              </select>
            </div>

            {/* Priority */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 120 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>{t('admin_tickets.filter_priority', 'Priority')}</label>
              <select
                className="form-select"
                value={filterPriority}
                onChange={e => { setFilterPriority(e.target.value); setPage(1) }}
                style={{ padding: '6px 10px', fontSize: 13 }}
              >
                <option value="">{t('admin_tickets.all_priorities', 'All Priorities')}</option>
                <option value="low">{t('tickets.priority_low', 'Low')}</option>
                <option value="medium">{t('tickets.priority_medium', 'Medium')}</option>
                <option value="high">{t('tickets.priority_high', 'High')}</option>
                <option value="urgent">{t('tickets.priority_urgent', 'Urgent')}</option>
              </select>
            </div>

            {/* Publisher */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 220 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>{t('admin_tickets.filter_publisher', 'Publisher')}</label>
              <PublisherSelect
                publishers={publishers}
                value={filterPublisher}
                onChange={val => { setFilterPublisher(val); setPage(1) }}
                allLabel={t('admin_tickets.all_publishers', 'All Publishers')}
              />
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" className="btn btn-primary btn-sm" style={{ padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Search size={14} /> {t('common.search', 'Search')}
              </button>
              {(search || filterStatus || filterCategory || filterPriority || filterPublisher) && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleResetFilters}
                  style={{ padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <RefreshCw size={14} /> {t('common.reset', 'Reset')}
                </button>
              )}
            </div>

          </div>
        </form>
      </div>
      )}

      <div className="glass-card" style={{ padding: 0 }}>
        <div className="table-wrap">
          {tickets.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 20px', textAlign: 'center' }}>
              <div style={{ marginBottom: 12 }}><Shield size={48} style={{ color: 'var(--color-text-subtle)', margin: '0 auto' }} /></div>
              <div className="empty-state-text" style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{t('admin_tickets.no_tickets', 'No support tickets found')}</div>
              <div className="empty-state-sub" style={{ fontSize: 13, color: 'var(--color-text-subtle)' }}>{t('admin_tickets.no_tickets_hint', 'Adjust your filters or query to find tickets.')}</div>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>{t('admin_tickets.col_publisher', 'Publisher')}</th>
                  <th>{t('admin_tickets.col_creator', 'Creator')}</th>
                  <th>{t('admin_tickets.col_subject', 'Subject')}</th>
                  <th>{t('admin_tickets.col_category', 'Category')}</th>
                  <th>{t('admin_tickets.col_priority', 'Priority')}</th>
                  <th>{t('admin_tickets.col_status', 'Status')}</th>
                  <th>{t('admin_tickets.col_assignee', 'Assignee')}</th>
                  <th>{t('admin_tickets.col_updated', 'Updated At')}</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map(ti => (
                  <tr
                    key={ti.id}
                    onClick={() => navigate(`/admin/tickets/${ti.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td style={{ fontWeight: 700, color: 'var(--color-primary-light)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Building size={14} />
                        {ti.publisher?.name || t('admin_tickets.guest', 'Guest / Unlinked')}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 600 }}>{ti.user?.name}</span>
                        <span style={{ fontSize: 11, color: 'var(--color-text-subtle)' }}>{ti.user?.email}</span>
                      </div>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--color-text)' }}>
                      {ti.subject}
                    </td>
                    <td>{getCategoryLabel(ti.category)}</td>
                    <td>{getPriorityBadge(ti.priority)}</td>
                    <td>{getStatusBadge(ti.status)}</td>
                    <td style={{ color: ti.assignee ? 'var(--color-text)' : 'var(--color-text-subtle)' }}>
                      {ti.assignee ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <User size={14} style={{ color: 'var(--br-primary)' }} />
                          {ti.assignee.name}
                        </div>
                      ) : t('admin_tickets.unassigned', 'Unassigned')}
                    </td>
                    <td style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>
                      {formatDate(ti.updated_at)}
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

function PublisherSelect({ publishers, value, onChange, allLabel = 'All Publishers' }) {
  const { t } = useI18n()
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
          {selected ? selected.name : allLabel}
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
              placeholder={t('common.search_publisher', 'Search publisher…')}
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
              {allLabel}
            </div>
            {filtered.length === 0 && (
              <div style={{ padding: '8px 12px', fontSize: 12, color: 'var(--color-text-muted)' }}>{t('common.no_results', 'No results')}</div>
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
