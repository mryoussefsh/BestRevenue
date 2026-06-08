import { useState, useEffect, useRef } from 'react'
import { publisherApi } from '../../api/endpoints'
import toast from 'react-hot-toast'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useAuth } from '../../contexts/AuthContext'
import { useSettings } from '../../contexts/SettingsContext'
import Pagination from '../../components/Pagination'
import CompactAmount from '../../components/CompactAmount'

const toLocalYYYYMMDD = (date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export default function PublisherDashboard() {
  const { user } = useAuth()
  const { settings, formatDateTime } = useSettings()
  const [payouts, setPayouts] = useState([])
  const [revenue, setRevenue] = useState([])
  const [lastSyncAt, setLastSyncAt] = useState(null)
  
  const [initialLoading, setInitialLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [websites, setWebsites] = useState([])
  const [adUnits, setAdUnits] = useState([])
  
  const [filters, setFilters] = useState({
    preset: '30d',
    date_from: toLocalYYYYMMDD(new Date(Date.now() - 30 * 86400000)),
    date_to: toLocalYYYYMMDD(new Date()),
    website_id: '',
    ad_unit_id: '',
    status: '',
  })

  const isFirstRun = useRef(true)

  const [dailyPage, setDailyPage] = useState(1)
  const [dailySortField, setDailySortField] = useState('date')
  const [dailySortOrder, setDailySortOrder] = useState('desc')

  // Date range presets helper
  const getPresetDates = (preset) => {
    const today = new Date()
    let from = new Date()
    let to = today

    if (preset === 'today') {
      from = today
      to = today
    } else if (preset === 'yesterday') {
      from = new Date(Date.now() - 1 * 86400000)
      to = new Date(Date.now() - 1 * 86400000)
    } else if (preset === '7d') {
      from = new Date(Date.now() - 7 * 86400000)
    } else if (preset === '30d') {
      from = new Date(Date.now() - 30 * 86400000)
    } else if (preset === 'this_month') {
      from = new Date(today.getFullYear(), today.getMonth(), 1)
    } else if (preset === 'last_month') {
      from = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      to = new Date(today.getFullYear(), today.getMonth(), 0)
    } else {
      return null // custom
    }

    return {
      date_from: toLocalYYYYMMDD(from),
      date_to: toLocalYYYYMMDD(to)
    }
  }

  // Initial loader: fetch websites and first batch of stats
  useEffect(() => {
    async function init() {
      try {
        const webRes = await publisherApi.getWebsites()
        setWebsites(webRes.data?.data || [])
      } catch (err) {
        console.error('Failed to load websites list', err)
      }

      const defaultDates = getPresetDates('30d')
      await fetchDashboardData({
        date_from: defaultDates.date_from,
        date_to: defaultDates.date_to,
        website_id: '',
        ad_unit_id: '',
        status: '',
      })
      setInitialLoading(false)
    }
    init()
  }, [])

  // Refetch when filters change (ignoring the preset state itself)
  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false
      return
    }

    async function reloadData() {
      setRefreshing(true)
      setDailyPage(1)
      await fetchDashboardData(filters)
      setRefreshing(false)
    }
    reloadData()
  }, [filters.date_from, filters.date_to, filters.website_id, filters.ad_unit_id, filters.status])

  // Core API loader
  async function fetchDashboardData(activeFilters) {
    try {
      const queryParams = {
        date_from: activeFilters.date_from,
        date_to: activeFilters.date_to,
        website_id: activeFilters.website_id,
        ad_unit_id: activeFilters.ad_unit_id,
        status: activeFilters.status,
        per_page: 1000, // retrieve larger dataset for accurate dashboard aggregate calculations
      }
      const [payRes, revRes] = await Promise.all([
        publisherApi.getPayouts(),
        publisherApi.getRevenue(queryParams),
      ])
      setPayouts(payRes.data?.data || [])
      setRevenue(revRes.data?.data || [])
      setLastSyncAt(revRes.data?.last_sync_at || null)
    } catch {
      toast.error('Failed to load dashboard data')
    }
  }

  // Dropdown change handlers
  const handleWebsiteChange = async (newWebId) => {
    setFilters(f => ({ ...f, website_id: newWebId, ad_unit_id: '' }))
    if (!newWebId) {
      setAdUnits([])
      return
    }
    try {
      const res = await publisherApi.getAdUnits(newWebId)
      setAdUnits(res.data?.data || [])
    } catch {
      toast.error('Failed to load ad units')
    }
  }

  const handlePresetChange = (newPreset) => {
    const dates = getPresetDates(newPreset)
    if (dates) {
      setFilters(f => ({
        ...f,
        preset: newPreset,
        date_from: dates.date_from,
        date_to: dates.date_to
      }))
    } else {
      setFilters(f => ({ ...f, preset: newPreset }))
    }
  }

  const handleResetFilters = () => {
    const defaultDates = getPresetDates('30d')
    setFilters({
      preset: '30d',
      date_from: defaultDates.date_from,
      date_to: defaultDates.date_to,
      website_id: '',
      ad_unit_id: '',
      status: '',
    })
    setAdUnits([])
    setDailyPage(1)
  }

  // Secure PDF Export handler using Axios blob download to pass Bearer tokens
  const handleExportPDF = async () => {
    try {
      const toastId = toast.loading('Generating PDF statement...')
      const queryParams = {
        date_from: filters.date_from,
        date_to: filters.date_to,
        website_id: filters.website_id,
        ad_unit_id: filters.ad_unit_id,
        status: filters.status,
      }
      
      const res = await publisherApi.exportPdf(queryParams)
      
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.setAttribute('download', `earnings_statement_${filters.date_from}_to_${filters.date_to}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(downloadUrl)
      
      toast.dismiss(toastId)
      toast.success('PDF downloaded successfully')
    } catch (err) {
      console.error(err)
      toast.error('Failed to export PDF statement')
    }
  }

  const getGreeting = () => {
    const hr = new Date().getHours()
    if (hr < 12) return 'Good morning'
    if (hr < 18) return 'Good afternoon'
    return 'Good evening'
  }

  const formatDateString = (dateStr) => {
    if (!dateStr) return ''
    try {
      const cleanDate = dateStr.slice(0, 10)
      const parts = cleanDate.split('-')
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10)
        const month = parseInt(parts[1], 10) - 1 // 0-indexed month
        const day = parseInt(parts[2], 10)
        return new Date(year, month, day).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        })
      }
      return dateStr
    } catch {
      return dateStr
    }
  }

  // Aggregate stats from filtered revenue
  const totalApprovedEarnings = revenue
    .filter(r => r.is_closed || r.is_approved)
    .reduce((s, r) => s + parseFloat(r.publisher_earnings || 0), 0)

  const totalPendingEarnings = revenue
    .filter(r => !r.is_closed && !r.is_approved)
    .reduce((s, r) => s + parseFloat(r.publisher_earnings || 0), 0)

  const totalImpressions = revenue.reduce((s, r) => s + parseInt(r.impressions || 0), 0)
  const lastPayout      = payouts[0]

  const totalClicks = revenue.reduce((s, r) => s + parseInt(r.clicks || 0), 0)
  const totalUnfilled = revenue.reduce((s, r) => s + parseInt(r.unfilled_impressions || 0), 0)
  const totalEarnings = totalApprovedEarnings + totalPendingEarnings
  const averageCpm = totalImpressions > 0 ? (totalEarnings / totalImpressions) * 1000 : 0
  const averageCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0

  const totalAvEligible = revenue.reduce((s, r) => s + parseInt(r.active_view_eligible_impressions || 0), 0)
  const totalAvViewable = revenue.reduce((s, r) => s + parseInt(r.active_view_viewable_impressions || 0), 0)
  const viewabilityRate = totalAvEligible > 0 ? (totalAvViewable / totalAvEligible) * 100 : null

  // Chart data aggregation — split by approved vs pending per day
  const byDate = {}
  revenue.forEach(r => {
    const d = r.date?.slice?.(0, 10) || r.date
    const isApproved = r.is_closed || r.is_approved
    if (!byDate[d]) byDate[d] = { date: d, approved: 0, pending: 0, impressions: 0 }
    byDate[d].impressions += parseInt(r.impressions || 0)
    if (isApproved) byDate[d].approved += parseFloat(r.publisher_earnings || 0)
    else            byDate[d].pending  += parseFloat(r.publisher_earnings || 0)
  })
  const chart = Object.values(byDate)
    .sort((a, b) => a.date < b.date ? -1 : 1)
    .map(d => ({ ...d, approved: +d.approved.toFixed(2), pending: +d.pending.toFixed(2) }))

  const [currentTime, setCurrentTime] = useState('')

  useEffect(() => {
    const timezone = settings.platform_timezone || 'UTC'
    const updateClock = () => {
      try {
        const formatted = new Date().toLocaleTimeString([], {
          timeZone: timezone,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
          timeZoneName: 'short'
        })
        setCurrentTime(formatted)
      } catch (err) {
        console.error('Timezone formatting error:', err)
        setCurrentTime(new Date().toLocaleTimeString())
      }
    }
    updateClock()
    const interval = setInterval(updateClock, 1000)
    return () => clearInterval(interval)
  }, [settings.platform_timezone])

  // Group daily performance records
  const dailyData = {}
  revenue.forEach(r => {
    const d = r.date?.slice?.(0, 10) || r.date
    if (!dailyData[d]) {
      dailyData[d] = {
        date: d,
        impressions: 0,
        clicks: 0,
        approved: 0,
        pending: 0,
        earnings: 0
      }
    }
    const val = parseFloat(r.publisher_earnings || 0)
    const isApproved = r.is_closed || r.is_approved
    dailyData[d].impressions += parseInt(r.impressions || 0)
    dailyData[d].clicks += parseInt(r.clicks || 0)
    dailyData[d].earnings += val
    if (isApproved) {
      dailyData[d].approved += val
    } else {
      dailyData[d].pending += val
    }
  })

  const dailyRecords = Object.values(dailyData)

  // Sort daily performance records
  const sortedDailyRecords = [...dailyRecords].sort((a, b) => {
    let valA = a[dailySortField]
    let valB = b[dailySortField]

    if (dailySortField === 'ctr') {
      const ctrA = a.impressions > 0 ? (a.clicks / a.impressions) : 0
      const ctrB = b.impressions > 0 ? (b.clicks / b.impressions) : 0
      valA = ctrA
      valB = ctrB
    } else if (dailySortField === 'cpm') {
      const cpmA = a.impressions > 0 ? (a.earnings / a.impressions) * 1000 : 0
      const cpmB = b.impressions > 0 ? (b.earnings / b.impressions) * 1000 : 0
      valA = cpmA
      valB = cpmB
    }

    if (valA < valB) return dailySortOrder === 'asc' ? -1 : 1
    if (valA > valB) return dailySortOrder === 'asc' ? 1 : -1
    return 0
  })

  const paginatedDailyRecords = sortedDailyRecords.slice((dailyPage - 1) * 10, dailyPage * 10)

  const handleDailySort = (field) => {
    if (dailySortField === field) {
      setDailySortOrder(dailySortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setDailySortField(field)
      setDailySortOrder('desc')
    }
    setDailyPage(1)
  }

  if (initialLoading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading dashboard metrics...</p>
      </div>
    )
  }

  return (
    <div>
      {/* Welcome Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">👋 {getGreeting()}, {user?.name || 'Publisher'}!</h1>
          <p className="page-subtitle">
            Here's your earnings overview — {formatDateString(filters.date_from)} to {formatDateString(filters.date_to)}
            {currentTime && (
              <>
                <span style={{ margin: '0 8px', color: '#94a3b8' }}>•</span>
                <span className="live-clock" style={{ color: '#6366f1', fontWeight: '500' }}>
                  Platform Time: {currentTime}
                </span>
              </>
            )}
            {lastSyncAt && (
              <>
                <span style={{ margin: '0 8px', color: '#94a3b8' }}>•</span>
                <span className="last-sync-time" style={{ color: '#10b981', fontWeight: '500' }}>
                  Last Updated: {formatDateTime(lastSyncAt)}
                </span>
              </>
            )}
          </p>
        </div>
        <button
          className="btn btn-secondary"
          onClick={handleExportPDF}
        >
          📄 Export PDF Statement
        </button>
      </div>

      {/* Filter Panel */}
      <div className="card" style={{ marginBottom: 24, padding: '16px 20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
          
          {/* Preset Selector */}
          <div style={{ flex: '1 1 140px' }}>
            <label className="form-label" style={{ marginBottom: 4, fontSize: 12 }}>Time Range</label>
            <select
              className="form-select"
              value={filters.preset}
              onChange={e => handlePresetChange(e.target.value)}
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {/* Start Date */}
          <div style={{ flex: '1 1 140px' }}>
            <label className="form-label" style={{ marginBottom: 4, fontSize: 12 }}>Start Date</label>
            <input
              type="date"
              className="form-input"
              value={filters.date_from}
              disabled={filters.preset !== 'custom'}
              onChange={e => setFilters(f => ({ ...f, date_from: e.target.value }))}
            />
          </div>

          {/* End Date */}
          <div style={{ flex: '1 1 140px' }}>
            <label className="form-label" style={{ marginBottom: 4, fontSize: 12 }}>End Date</label>
            <input
              type="date"
              className="form-input"
              value={filters.date_to}
              disabled={filters.preset !== 'custom'}
              onChange={e => setFilters(f => ({ ...f, date_to: e.target.value }))}
            />
          </div>

          {/* Website Filter */}
          <div style={{ flex: '1 1 170px' }}>
            <label className="form-label" style={{ marginBottom: 4, fontSize: 12 }}>Website</label>
            <select
              className="form-select"
              value={filters.website_id}
              onChange={e => handleWebsiteChange(e.target.value)}
            >
              <option value="">All Websites</option>
              {websites.map(w => (
                <option key={w.id} value={w.id}>{w.domain}</option>
              ))}
            </select>
          </div>

          {/* Ad Unit Filter */}
          <div style={{ flex: '1 1 170px' }}>
            <label className="form-label" style={{ marginBottom: 4, fontSize: 12 }}>Ad Unit</label>
            <select
              className="form-select"
              value={filters.ad_unit_id}
              disabled={!filters.website_id}
              onChange={e => setFilters(f => ({ ...f, ad_unit_id: e.target.value }))}
            >
              <option value="">All Ad Units</option>
              {adUnits.map(au => (
                <option key={au.id} value={au.id}>{au.display_name}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div style={{ flex: '1 1 140px' }}>
            <label className="form-label" style={{ marginBottom: 4, fontSize: 12 }}>Status</label>
            <select
              className="form-select"
              value={filters.status}
              onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
            >
              <option value="">All Statuses</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          {/* Reset Action */}
          <div>
            <button
              className="btn btn-secondary"
              style={{ width: '100%', padding: '10px 16px' }}
              onClick={handleResetFilters}
            >
              🧹 Clear
            </button>
          </div>
        </div>
      </div>

      {/* Main Stats and Charts Container with Fade Overlay for refreshing */}
      <div style={{ opacity: refreshing ? 0.6 : 1, transition: 'opacity 0.15s ease' }}>
        
        {/* Stat Cards */}
        <div className="stat-grid">
          <div className="stat-card accent">
            <div className="stat-icon">💰</div>
            <div className="stat-label">Approved Earnings</div>
            <div className="stat-value money"><CompactAmount value={totalApprovedEarnings} /></div>
            <div className="stat-change up">▲ Approved</div>
          </div>
          
          <div className="stat-card warning">
            <div className="stat-icon">⏳</div>
            <div className="stat-label">Pending Earnings</div>
            <div className="stat-value money"><CompactAmount value={totalPendingEarnings} /></div>
            <div className="stat-change">⏳ Holding</div>
          </div>
          
          <div className="stat-card info">
            <div className="stat-icon">👀</div>
            <div className="stat-label">Total Impressions</div>
            <div className="stat-value">
              <CompactAmount value={totalImpressions} prefix="" decimals={0} />
            </div>
            <div className="stat-change text-muted">Page ad loads</div>
          </div>
          
          <div className="stat-card info">
            <div className="stat-icon">💨</div>
            <div className="stat-label">Unfilled Impressions</div>
            <div className="stat-value">
              <CompactAmount value={totalUnfilled} prefix="" decimals={0} />
            </div>
            <div className="stat-change text-muted">Unserved inventory</div>
          </div>

          <div className="stat-card info">
            <div className="stat-icon">🖱️</div>
            <div className="stat-label">Total Clicks</div>
            <div className="stat-value">
              <CompactAmount value={totalClicks} prefix="" decimals={0} />
            </div>
            <div className="stat-change text-muted">Selected period</div>
          </div>

          <div className="stat-card primary">
            <div className="stat-icon">🎯</div>
            <div className="stat-label">Average CTR</div>
            <div className="stat-value">{averageCtr.toFixed(2)}%</div>
            <div className="stat-change text-muted">Click-through rate</div>
          </div>

          <div className="stat-card primary">
            <div className="stat-icon">👁️</div>
            <div className="stat-label">Viewability Rate</div>
            <div className="stat-value">
              {viewabilityRate !== null ? `${viewabilityRate.toFixed(1)}%` : 'N/A'}
            </div>
            <div className="stat-change text-muted">
              {viewabilityRate !== null
                ? `${totalAvViewable.toLocaleString()} / ${totalAvEligible.toLocaleString()} measurable`
                : 'No Active View data'}
            </div>
          </div>

          <div className="stat-card primary">
            <div className="stat-icon">📊</div>
            <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              Monetized CPM
              <span 
                style={{ cursor: 'pointer', fontSize: '12px', color: '#9ca3af' }}
                title="Your net earnings per 1,000 served (monetized) impressions after the platform share has been applied."
              >
                ⓘ
              </span>
            </div>
            <div className="stat-value money">${averageCpm.toFixed(2)}</div>
            <div className="stat-change text-muted">Earnings per 1k impressions</div>
          </div>
          
          <div className="stat-card primary">
            <div className="stat-icon">💳</div>
            <div className="stat-label">Last Payout</div>
            <div className="stat-value money">
              {lastPayout ? <CompactAmount value={lastPayout.final_amount} /> : '—'}
            </div>
            <div className="stat-change">
              {lastPayout ? (
                <span className={`badge badge-${lastPayout.status}`}>{lastPayout.status}</span>
              ) : 'No payouts yet'}
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="card">
          <div className="card-header" style={{ flexWrap: 'wrap', gap: 12 }}>
            <div className="card-title">
              📈 Earnings Trend ({
                filters.preset === 'today' ? 'Today' :
                filters.preset === 'yesterday' ? 'Yesterday' :
                filters.preset === '7d' ? 'Last 7 Days' :
                filters.preset === '30d' ? 'Last 30 Days' :
                filters.preset === 'this_month' ? 'This Month' :
                filters.preset === 'last_month' ? 'Last Month' :
                'Filtered Range'
              })
            </div>
            {/* Legend */}
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#10b981' }}>
                <span style={{ width: 24, height: 2, background: '#10b981', display: 'inline-block', borderRadius: 2 }} />
                ✅ Approved
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#f59e0b' }}>
                <span style={{ width: 24, height: 2, background: '#f59e0b', display: 'inline-block', borderRadius: 2, borderTop: '2px dashed #f59e0b', boxSizing: 'border-box' }} />
                ⏳ Pending
              </div>
            </div>
          </div>
          {chart.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={chart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="approvedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10b981" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="pendingGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a4a" />
                <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }}
                  tickFormatter={d => d?.slice?.(5) || d} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }}
                  tickFormatter={v => `$${v}`} />
                <Tooltip
                  contentStyle={{ background: '#1a1a2e', border: '1px solid #2a2a4a', borderRadius: 8 }}
                  labelStyle={{ color: '#e2e8f0', fontWeight: 600, marginBottom: 4 }}
                  formatter={(v, name) => [
                    `$${v}`,
                    name === 'approved' ? '✅ Approved' : '⏳ Pending'
                  ]}
                />
                <Area type="monotone" dataKey="approved" stroke="#10b981"
                  fill="url(#approvedGrad)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="pending" stroke="#f59e0b"
                  fill="url(#pendingGrad)" strokeWidth={2} dot={false} strokeDasharray="5 3" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">📊</div>
              <div className="empty-state-text">No earnings data for this selection</div>
            </div>
          )}
        </div>

        {/* Daily Performance Table */}
        <div className="card" style={{ marginTop: 24, padding: 0 }}>
          <div className="card-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)' }}>
            <div className="card-title">📅 Daily Performance</div>
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th onClick={() => handleDailySort('date')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                    Date {dailySortField === 'date' ? (dailySortOrder === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th onClick={() => handleDailySort('impressions')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                    Impressions {dailySortField === 'impressions' ? (dailySortOrder === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th onClick={() => handleDailySort('clicks')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                    Clicks {dailySortField === 'clicks' ? (dailySortOrder === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th onClick={() => handleDailySort('ctr')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                    CTR {dailySortField === 'ctr' ? (dailySortOrder === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th onClick={() => handleDailySort('cpm')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                    Monetized CPM {dailySortField === 'cpm' ? (dailySortOrder === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th onClick={() => handleDailySort('approved')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                    Approved {dailySortField === 'approved' ? (dailySortOrder === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th onClick={() => handleDailySort('pending')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                    Pending {dailySortField === 'pending' ? (dailySortOrder === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th onClick={() => handleDailySort('earnings')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                    Total Earnings {dailySortField === 'earnings' ? (dailySortOrder === 'asc' ? '↑' : '↓') : ''}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedDailyRecords.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <div className="empty-state">
                        <div className="empty-state-icon">📊</div>
                        <div className="empty-state-text">No performance data for this selection</div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedDailyRecords.map(r => {
                    const ctr = r.impressions > 0 ? (r.clicks / r.impressions) * 100 : 0
                    const cpm = r.impressions > 0 ? (r.earnings / r.impressions) * 1000 : 0
                    return (
                      <tr key={r.date}>
                        <td className="text-sm" style={{ fontWeight: '500' }}>{formatDateString(r.date)}</td>
                        <td className="money">
                          <CompactAmount value={r.impressions} prefix="" decimals={0} />
                        </td>
                        <td className="money">
                          <CompactAmount value={r.clicks} prefix="" decimals={0} />
                        </td>
                        <td className="money">{ctr.toFixed(2)}%</td>
                        <td className="money">${cpm.toFixed(2)}</td>
                        <td className="money positive" style={{ fontWeight: '600' }}>
                          <CompactAmount value={r.approved} />
                        </td>
                        <td className="money" style={{ color: 'var(--color-warning)', fontWeight: '600' }}>
                          <CompactAmount value={r.pending} />
                        </td>
                        <td className="money positive" style={{ fontWeight: '800' }}>
                          <CompactAmount value={r.earnings} />
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
          {sortedDailyRecords.length > 0 && (
            <Pagination
              currentPage={dailyPage}
              totalItems={sortedDailyRecords.length}
              pageSize={10}
              onPageChange={setDailyPage}
            />
          )}
        </div>
      </div>
    </div>
  )
}
