import { useState, useEffect } from 'react'
import { adminApi } from '../../api/endpoints'
import toast from 'react-hot-toast'
import Pagination from '../../components/Pagination'
import CompactAmount from '../../components/CompactAmount'
import { DollarSign, RefreshCw, Search, Lock, Clock, Check } from 'lucide-react'

function PublisherSelect({ publishers, value, onChange }) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  
  const selected = publishers.find(p => p.id === value)
  const filtered = publishers.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.email.toLowerCase().includes(search.toLowerCase()))

  return (
    <div style={{ position: 'relative', width: 240 }} onBlur={e => { if(!e.currentTarget.contains(e.relatedTarget)) setOpen(false) }}>
      <div 
        className="form-input" 
        style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '38px', background: '#1c1f2e', border: '1px solid #333' }} 
        onClick={() => setOpen(!open)}
        tabIndex={0}
      >
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selected ? selected.name : 'All Publishers'}</span>
        <span style={{ fontSize: 10, color: '#888' }}>▼</span>
      </div>
      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, background: '#1c1f2e', border: '1px solid #333', borderRadius: 4, marginTop: 4, maxHeight: 300, overflow: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
          <div style={{ padding: 8, borderBottom: '1px solid #333', position: 'sticky', top: 0, background: '#1c1f2e', zIndex: 11 }}>
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
            style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #222' }} 
            onMouseDown={() => { onChange(''); setOpen(false); setSearch('') }}
          >
            All Publishers
          </div>
          {filtered.map(p => (
            <div 
              key={p.id} 
              style={{ padding: '8px 12px', cursor: 'pointer', background: value === p.id ? '#2a2d3e' : 'transparent', borderBottom: '1px solid #222' }} 
              onMouseDown={() => { onChange(p.id); setOpen(false); setSearch('') }}
            >
              <div style={{ fontWeight: 600 }}>{p.name}</div>
              <div style={{ fontSize: 11, color: '#888' }}>{p.email}</div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ padding: '8px 12px', color: '#888', fontSize: 12, textAlign: 'center' }}>No publishers found</div>
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
  const [filters, setFilters] = useState({
    date_from: new Date(Date.now() - 30 * 86400000).toISOString().slice(0,10),
    date_to: new Date().toISOString().slice(0,10),
    publisher_id: '',
    search: '',
    status: '',
  })
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
    setFilters({
      date_from: new Date(Date.now() - 30 * 86400000).toISOString().slice(0,10),
      date_to: new Date().toISOString().slice(0,10),
      publisher_id: '',
      search: '',
      status: '',
    })
  }

  const paginated = sortedRecords.slice((page - 1) * 15, page * 15)

  const totalGross    = records.reduce((s, r) => s + parseFloat(r.gross_revenue || 0), 0)
  const totalEarnings = records.reduce((s, r) => s + parseFloat(r.publisher_earnings || 0), 0)
  const totalImpr     = records.reduce((s, r) => s + parseInt(r.impressions || 0), 0)

  const totalClicks   = records.reduce((s, r) => s + parseInt(r.clicks || 0), 0)
  const avgCtr        = totalImpr > 0 ? (totalClicks / totalImpr) * 100 : 0
  const avgCpm        = totalImpr > 0 ? (totalGross / totalImpr) * 1000 : 0
  const avgRatio      = records.length > 0 ? (records.reduce((s, r) => s + parseFloat(r.ratio_applied || 0), 0) / records.length) * 100 : 0

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DollarSign size={28} style={{ color: 'var(--br-primary)' }} />
            <span>Revenue</span>
          </h1>
          <p className="page-subtitle">{records.length} records · Full admin view</p>
        </div>
        <button id="apply-revenue-filters-btn" className="btn btn-secondary" onClick={loadData}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 24 }}>
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

      {/* Filters */}
      <div className="filter-bar">
        <input type="date" className="form-input" value={filters.date_from}
          onChange={e => setFilters(f => ({ ...f, date_from: e.target.value }))} />
        <input type="date" className="form-input" value={filters.date_to}
          onChange={e => setFilters(f => ({ ...f, date_to: e.target.value }))} />
        <PublisherSelect 
          publishers={publishers} 
          value={filters.publisher_id} 
          onChange={val => setFilters(f => ({ ...f, publisher_id: val }))} 
        />
        <select className="form-select" value={filters.status}
          onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="closed">Closed</option>
        </select>
        <input className="form-input" placeholder="Search publishers, domains, ad units…" style={{ flex: 1, minWidth: 240 }}
          value={filters.search}
          onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} />
        <button className="btn btn-secondary" onClick={resetFilters} title="Reset Filters" style={{ height: '38px', padding: '0 12px' }}>
          ✕
        </button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-container">
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
