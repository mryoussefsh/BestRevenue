import { useState, useEffect, useRef } from 'react'
import { publisherApi } from '../../api/endpoints'
import toast from 'react-hot-toast'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useAuth } from '../../contexts/AuthContext'
import { useSettings } from '../../contexts/SettingsContext'

export default function PublisherDashboard() {
  const { user } = useAuth()
  const { settings, formatDate, formatDateTime } = useSettings()
  const [payouts, setPayouts] = useState([])
  const [revenue, setRevenue] = useState([])
  const [lastSyncAt, setLastSyncAt] = useState(null)
  
  const [initialLoading, setInitialLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [websites, setWebsites] = useState([])
  const [adUnits, setAdUnits] = useState([])
  
  const [filters, setFilters] = useState({
    preset: '30d',
    date_from: new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10),
    date_to: new Date().toISOString().slice(0, 10),
    website_id: '',
    ad_unit_id: '',
    status: '',
  })

  const isFirstRun = useRef(true)

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
      date_from: from.toISOString().slice(0, 10),
      date_to: to.toISOString().slice(0, 10)
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
      return new Date(dateStr).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
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

  // Chart data aggregation
  const byDate = {}
  revenue.forEach(r => {
    const d = r.date?.slice?.(0, 10) || r.date
    if (!byDate[d]) byDate[d] = { date: d, earnings: 0, impressions: 0 }
    byDate[d].earnings    += parseFloat(r.publisher_earnings || 0)
    byDate[d].impressions += parseInt(r.impressions || 0)
  })
  const chart = Object.values(byDate)
    .sort((a, b) => a.date < b.date ? -1 : 1)
    .map(d => ({ ...d, earnings: +d.earnings.toFixed(2) }))

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
            <div className="stat-value money">${totalApprovedEarnings.toFixed(2)}</div>
            <div className="stat-change up">▲ Approved</div>
          </div>
          
          <div className="stat-card warning">
            <div className="stat-icon">⏳</div>
            <div className="stat-label">Pending Earnings</div>
            <div className="stat-value money">${totalPendingEarnings.toFixed(2)}</div>
            <div className="stat-change">⏳ Holding</div>
          </div>
          
          <div className="stat-card info">
            <div className="stat-icon">👀</div>
            <div className="stat-label">Total Impressions</div>
            <div className="stat-value">{totalImpressions.toLocaleString()}</div>
            <div className="stat-change text-muted">Page ad loads</div>
          </div>
          
          <div className="stat-card info">
            <div className="stat-icon">💨</div>
            <div className="stat-label">Unfilled Impressions</div>
            <div className="stat-value">{totalUnfilled.toLocaleString()}</div>
            <div className="stat-change text-muted">Unserved inventory</div>
          </div>

          <div className="stat-card info">
            <div className="stat-icon">🖱️</div>
            <div className="stat-label">Total Clicks</div>
            <div className="stat-value">{totalClicks.toLocaleString()}</div>
            <div className="stat-change text-muted">Selected period</div>
          </div>

          <div className="stat-card primary">
            <div className="stat-icon">🎯</div>
            <div className="stat-label">Average CTR</div>
            <div className="stat-value">{averageCtr.toFixed(2)}%</div>
            <div className="stat-change text-muted">Click-through rate</div>
          </div>

          <div className="stat-card primary">
            <div className="stat-icon">📊</div>
            <div className="stat-label">Average CPM</div>
            <div className="stat-value money">${averageCpm.toFixed(2)}</div>
            <div className="stat-change text-muted">Earnings per 1k impressions</div>
          </div>
          
          <div className="stat-card primary">
            <div className="stat-icon">💳</div>
            <div className="stat-label">Last Payout</div>
            <div className="stat-value money">
              {lastPayout ? `$${parseFloat(lastPayout.final_amount).toFixed(2)}` : '—'}
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
          <div className="card-header">
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
          </div>
          {chart.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={chart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="pubGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a4a" />
                <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }}
                  tickFormatter={d => d?.slice?.(5) || d} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }}
                  tickFormatter={v => `$${v}`} />
                <Tooltip
                  contentStyle={{ background: '#1a1a2e', border: '1px solid #2a2a4a', borderRadius: 8 }}
                  formatter={(v) => [`$${v}`, 'Earnings']}
                />
                <Area type="monotone" dataKey="earnings" stroke="#10b981"
                  fill="url(#pubGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">📊</div>
              <div className="empty-state-text">No earnings data for this selection</div>
            </div>
          )}
        </div>

        {/* Recent Payouts */}
        {payouts.length > 0 && (
          <div className="card" style={{ marginTop: 24 }}>
            <div className="card-header">
              <div className="card-title">💳 Recent Payouts (Account-wide)</div>
            </div>
            <table className="table">
              <thead><tr><th>Period</th><th>Amount</th><th>Status</th><th>Paid At</th></tr></thead>
              <tbody>
                {payouts.slice(0, 5).map(p => (
                  <tr key={p.id}>
                    <td className="money">{p.period_year}-{String(p.period_month).padStart(2,'0')}</td>
                    <td className="money positive" style={{ fontWeight: 700 }}>
                      ${parseFloat(p.final_amount).toFixed(2)}
                    </td>
                    <td>
                      <span className={`badge badge-${p.status}`}>{p.status}</span>
                    </td>
                    <td className="text-muted text-sm">
                      {p.paid_at ? formatDate(p.paid_at) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
