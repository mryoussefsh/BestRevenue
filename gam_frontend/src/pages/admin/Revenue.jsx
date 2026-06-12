import { useState, useEffect } from 'react'
import { adminApi } from '../../api/endpoints'
import toast from 'react-hot-toast'
import Pagination from '../../components/Pagination'
import CompactAmount from '../../components/CompactAmount'
import { DollarSign, RefreshCw, Search, Lock, Clock, Check, X, Filter } from 'lucide-react'

function PublisherSelect({ publishers, value, onChange, style }) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [hoveredId, setHoveredId] = useState(null)
  
  const selected = publishers.find(p => p.id === value)
  const filtered = publishers.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.email.toLowerCase().includes(search.toLowerCase()))

  return (
    <div style={{ position: 'relative', width: '100%', ...style }} onBlur={e => { if(!e.currentTarget.contains(e.relatedTarget)) setOpen(false) }}>
      <div 
        className="form-select" 
        style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '38px' }} 
        onClick={() => setOpen(!open)}
        tabIndex={0}
      >
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selected ? selected.name : 'All Publishers'}</span>
        <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>▼</span>
      </div>
      {open && (
        <div style={{ 
          position: 'absolute', 
          top: 'calc(100% + 4px)', 
          left: 0, 
          right: 0, 
          zIndex: 1000, 
          background: 'var(--color-surface-2)', 
          border: '1px solid var(--color-border-light)', 
          borderRadius: 'var(--radius-md)', 
          marginTop: 4, 
          maxHeight: 300, 
          overflow: 'auto', 
          boxShadow: 'var(--shadow-md)' 
        }}>
          <div style={{ padding: 8, borderBottom: '1px solid var(--color-border-light)', position: 'sticky', top: 0, background: 'var(--color-surface-2)', zIndex: 11 }}>
            <input 
              autoFocus
              className="form-input" 
              placeholder="Search publisher..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              style={{ padding: '4px 8px', height: '30px' }}
            />
          </div>
          <div 
            style={{ 
              padding: '8px 12px', 
              cursor: 'pointer', 
              borderBottom: '1px solid var(--color-border-light)',
              background: hoveredId === 'all' ? 'var(--color-surface-3)' : 'transparent',
              transition: 'background 0.15s'
            }} 
            onMouseDown={() => { onChange(''); setOpen(false); setSearch('') }}
            onMouseEnter={() => setHoveredId('all')}
            onMouseLeave={() => setHoveredId(null)}
          >
            All Publishers
          </div>
          {filtered.map(p => {
            const isSelected = value === p.id
            const isHovered = hoveredId === p.id
            return (
              <div 
                key={p.id} 
                style={{ 
                  padding: '8px 12px', 
                  cursor: 'pointer', 
                  background: isSelected ? 'var(--color-primary)' : (isHovered ? 'var(--color-surface-3)' : 'transparent'), 
                  borderBottom: '1px solid var(--color-border-light)',
                  color: isSelected ? 'white' : 'var(--color-text)',
                  transition: 'background 0.15s'
                }} 
                onMouseDown={() => { onChange(p.id); setOpen(false); setSearch('') }}
                onMouseEnter={() => setHoveredId(p.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <div style={{ fontWeight: 600 }}>{p.name}</div>
                <div style={{ fontSize: 11, color: isSelected ? 'rgba(255,255,255,0.7)' : 'var(--color-text-muted)' }}>{p.email}</div>
              </div>
            )
          })}
          {filtered.length === 0 && (
            <div style={{ padding: '8px 12px', color: 'var(--color-text-muted)', fontSize: 12, textAlign: 'center' }}>No publishers found</div>
          )}
        </div>
      )}
    </div>
  )
}

export default function RevenuePage() {
  const [records, setRecords] = useState([])
  const [publishers, setPublishers] = useState([])
  const [loading, setLoading] = useState(true)
  
  const [initialFilters] = useState(() => ({
    date_from: new Date(Date.now() - 30 * 86400000).toISOString().slice(0,10),
    date_to: new Date().toISOString().slice(0,10),
    publisher_id: '',
    search: '',
    status: '',
  }))
  const [filters, setFilters] = useState(initialFilters)
  const [showFiltersPanel, setShowFiltersPanel] = useState(false)
  const [page, setPage] = useState(1)
  const [sortField, setSortField] = useState('date')
  const [sortOrder, setSortOrder] = useState('desc')

  useEffect(() => {
    adminApi.getPublishers().then(r => setPublishers(r.data?.data || []))
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData()
    }, 250)
    return () => clearTimeout(timer)
  }, [filters])

  async function loadData() {
    setLoading(true)
    try {
      const params = {}
      if (filters.date_from)    params.date_from    = filters.date_from
      if (filters.date_to)      params.date_to      = filters.date_to
      if (filters.publisher_id) params.publisher_id = filters.publisher_id
      if (filters.search)       params.search       = filters.search
      if (filters.status)       params.status       = filters.status
      const res = await adminApi.getRevenue(params)
      setRecords(res.data?.data || [])
      setPage(1)
    } catch { toast.error('Failed to load revenue') }
    finally { setLoading(false) }
  }

  function handleSort(field) {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const sortedRecords = [...records].sort((a, b) => {
    let valA = a[sortField]
    let valB = b[sortField]

    if (sortField === 'ad_unit') {
      valA = a.ad_unit?.display_name || ''
      valB = b.ad_unit?.display_name || ''
    } else if (['impressions', 'clicks', 'ctr', 'cpm', 'gross_revenue', 'ratio_applied', 'publisher_earnings', 'publisher_cpm'].includes(sortField)) {
      valA = parseFloat(valA || 0)
      valB = parseFloat(valB || 0)
    }

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1
    return 0
  })

  function resetFilters() {
    setFilters(initialFilters)
  }

  const paginated = sortedRecords.slice((page - 1) * 15, page * 15)

  const totalGross    = records.reduce((s, r) => s + parseFloat(r.gross_revenue || 0), 0)
  const totalEarnings = records.reduce((s, r) => s + parseFloat(r.publisher_earnings || 0), 0)
  const totalImpr     = records.reduce((s, r) => s + parseInt(r.impressions || 0), 0)

  const totalClicks   = records.reduce((s, r) => s + parseInt(r.clicks || 0), 0)
  const avgCtr        = totalImpr > 0 ? (totalClicks / totalImpr) * 100 : 0
  const avgCpm        = totalImpr > 0 ? (totalGross / totalImpr) * 1000 : 0
  const avgRatio      = records.length > 0 ? (records.reduce((s, r) => s + parseFloat(r.ratio_applied || 0), 0) / records.length) * 100 : 0

  const hasAppliedFilters = 
    filters.date_from !== initialFilters.date_from ||
    filters.date_to !== initialFilters.date_to ||
    filters.publisher_id !== initialFilters.publisher_id ||
    filters.search !== initialFilters.search ||
    filters.status !== initialFilters.status

  const activeFiltersCount = [
    filters.date_from !== initialFilters.date_from,
    filters.date_to !== initialFilters.date_to,
    filters.publisher_id !== initialFilters.publisher_id,
    filters.search !== initialFilters.search,
    filters.status !== initialFilters.status
  ].filter(Boolean).length

  return (
    <div className="revenue-container">
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DollarSign size={28} style={{ color: 'var(--br-primary)' }} />
            <span>Revenue</span>
          </h1>
          <p className="page-subtitle">{records.length} records · Full admin view</p>
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
          <button id="apply-revenue-filters-btn" className="btn btn-secondary" onClick={loadData}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFiltersPanel && (
        <div className="card filter-bar-card" style={{ padding: '16px 20px', marginBottom: 24, background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: 12 
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label className="text-muted text-xs" style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date From</label>
                <input type="date" className="form-input" value={filters.date_from}
                  onChange={e => setFilters(f => ({ ...f, date_from: e.target.value }))} style={{ height: 38 }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label className="text-muted text-xs" style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date To</label>
                <input type="date" className="form-input" value={filters.date_to}
                  onChange={e => setFilters(f => ({ ...f, date_to: e.target.value }))} style={{ height: 38 }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label className="text-muted text-xs" style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Publisher</label>
                <PublisherSelect 
                  publishers={publishers} 
                  value={filters.publisher_id} 
                  onChange={val => setFilters(f => ({ ...f, publisher_id: val }))} 
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label className="text-muted text-xs" style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</label>
                <select className="form-select" value={filters.status}
                  onChange={e => setFilters(f => ({ ...f, status: e.target.value }))} style={{ height: 38 }}>
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 200 }} className="filter-search-field">
                <label className="text-muted text-xs" style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Search</label>
                <div style={{ position: 'relative' }}>
                  <input className="form-input" placeholder="Search publishers, domains, ad units…" style={{ height: 38, paddingLeft: 36 }}
                    value={filters.search}
                    onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} />
                  <Search size={14} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--color-text-muted)' }} />
                </div>
              </div>
            </div>

            {(hasAppliedFilters || records.length !== sortedRecords.length) && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, borderTop: '1px solid var(--color-border)', paddingTop: 12 }}>
                <span className="text-muted text-sm">
                  Showing {records.length} records
                </span>
                {hasAppliedFilters && (
                  <button className="btn btn-secondary btn-xs" onClick={resetFilters}
                    style={{ 
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      color: '#ef4444',
                      padding: '6px 12px',
                      fontWeight: 600,
                    }}>
                    <X size={12} /> Clear Filters
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', marginBottom: 24 }}>
        <div className="stat-card primary">
          <div className="stat-label">Total Gross Revenue</div>
          <div className="stat-value money"><CompactAmount value={totalGross} /></div>
        </div>
        <div className="stat-card accent">
          <div className="stat-label">Publisher Earnings</div>
          <div className="stat-value money"><CompactAmount value={totalEarnings} /></div>
        </div>
        <div className="stat-card info">
          <div className="stat-label">Total Impressions</div>
          <div className="stat-value">
            <CompactAmount value={totalImpr} prefix="" decimals={0} />
          </div>
        </div>
      </div>

      <div className="card table-card-wrapper" style={{ padding: 0 }}>
        <div className="table-wrap">
          {loading ? (
            <div className="empty-state"><div className="spinner"></div></div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('date')} style={{cursor: 'pointer'}}>Date {sortField === 'date' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}</th>
                  <th onClick={() => handleSort('ad_unit')} style={{cursor: 'pointer'}}>Ad Unit {sortField === 'ad_unit' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}</th>
                  <th onClick={() => handleSort('impressions')} style={{cursor: 'pointer'}}>Impressions {sortField === 'impressions' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}</th>
                  <th onClick={() => handleSort('ctr')} style={{cursor: 'pointer'}}>CTR {sortField === 'ctr' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}</th>
                  <th onClick={() => handleSort('cpm')} style={{cursor: 'pointer'}}>Gross CPM {sortField === 'cpm' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}</th>
                  <th onClick={() => handleSort('gross_revenue')} style={{cursor: 'pointer'}}>Gross Revenue {sortField === 'gross_revenue' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}</th>
                  <th>Ratio</th>
                  <th onClick={() => handleSort('publisher_earnings')} style={{cursor: 'pointer'}}>Pub. Earnings {sortField === 'publisher_earnings' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {records.length === 0 && (
                  <tr><td colSpan={11}>
                    <div className="empty-state">
                      <div className="empty-state-icon"><DollarSign size={40} style={{ color: 'var(--br-text-2)' }} /></div>
                      <div className="empty-state-text">No revenue records for this period</div>
                    </div>
                  </td></tr>
                )}
                {paginated.map(r => (
                  <tr key={r.id}>
                    <td className="text-sm">{r.date?.slice?.(0,10) || r.date}</td>
                    <td className="text-sm">
                      <div style={{ fontWeight: 600 }}>{r.ad_unit?.display_name || '—'}</div>
                      <div className="text-muted" style={{ fontSize: 11 }}>{r.ad_unit?.website?.domain}</div>
                    </td>
                    <td className="money">
                      <CompactAmount value={r.impressions} prefix="" decimals={0} />
                    </td>
                    <td className="money">{(parseFloat(r.ctr) * 100).toFixed(2)}%</td>
                    <td className="money">${parseFloat(r.cpm).toFixed(2)}</td>
                    <td className="money positive"><CompactAmount value={r.gross_revenue} /></td>
                    <td>
                      <span className="badge badge-approved">
                        {(parseFloat(r.ratio_applied) * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td className="money positive" style={{ fontWeight: 700 }}>
                      <CompactAmount value={r.publisher_earnings} />
                    </td>
                    <td>
                      {r.period_closing_id ? (
                        <span className="badge badge-closed">
                          <Lock size={12} />
                          Closed
                        </span>
                      ) : r.approval_status === 'pending' ? (
                        <span className="badge badge-pending">
                          <Clock size={12} />
                          Pending
                        </span>
                      ) : (
                        <span className="badge badge-approved">
                          <Check size={12} />
                          Approved
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              {records.length > 0 && (
                <tfoot>
                  <tr style={{ background: 'rgba(99,102,241,.07)', fontWeight: 700, borderTop: '2px solid var(--color-border)' }}>
                    <td style={{ padding: '10px 16px', fontSize: 12 }} colSpan={2}>Totals</td>
                    <td className="money">
                      <CompactAmount value={totalImpr} prefix="" decimals={0} />
                    </td>
                    <td className="money">{avgCtr.toFixed(2)}%</td>
                    <td className="money">${avgCpm.toFixed(2)}</td>
                    <td className="money positive"><CompactAmount value={totalGross} /></td>
                    <td>
                      <span className="badge badge-approved" style={{ fontWeight: 700 }}>
                        {avgRatio.toFixed(0)}%
                      </span>
                    </td>
                    <td className="money positive" style={{ fontWeight: 700 }}>
                      <CompactAmount value={totalEarnings} />
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          )}
        </div>
        <Pagination
          currentPage={page}
          totalItems={records.length}
          pageSize={15}
          onPageChange={setPage}
        />
      </div>
    </div>
  )
}
