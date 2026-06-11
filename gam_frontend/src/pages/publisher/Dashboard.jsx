import { useState, useEffect, useRef } from 'react'
import { publisherApi } from '../../api/endpoints'
import toast from 'react-hot-toast'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useAuth } from '../../contexts/AuthContext'
import { useSettings } from '../../contexts/SettingsContext'
import Pagination from '../../components/Pagination'
import CompactAmount from '../../components/CompactAmount'
import { SearchableSelect } from '../../components/BulkAdUnitGeneratorModal'
import AnnouncementsRenderer from '../../components/AnnouncementsRenderer'
import { 
  Sparkles, Clock, RefreshCw, FileText, DollarSign, Eye, MousePointer, 
  Target, TrendingUp, Percent, CreditCard, Ban, Info, AlertCircle 
} from 'lucide-react'

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
  const [pendingAdjustment, setPendingAdjustment] = useState(0)
  const [aggregates, setAggregates] = useState(null)
  
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
  })

  const isFirstRun = useRef(true)

  const [dailyPage, setDailyPage] = useState(1)
  const [dailySortField, setDailySortField] = useState('date')
  const [dailySortOrder, setDailySortOrder] = useState('desc')

  const getPlatformDate = () => {
    const timezone = settings.platform_timezone || 'UTC'
    try {
      const formatter = new Intl.DateTimeFormat('sv-SE', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
      const formatted = formatter.format(new Date())
      const parts = formatted.split('-')
      return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10))
    } catch (err) {
      console.error('Timezone offset error:', err)
      return new Date()
    }
  }

  // Date range presets helper
  const getPresetDates = (preset) => {
    const platDate = getPlatformDate()
    let from = platDate
    let to = platDate

    if (preset === 'today') {
      from = platDate
      to = platDate
    } else if (preset === 'yesterday') {
      from = new Date(platDate.getFullYear(), platDate.getMonth(), platDate.getDate() - 1)
      to = new Date(platDate.getFullYear(), platDate.getMonth(), platDate.getDate() - 1)
    } else if (preset === '7d') {
      from = new Date(platDate.getFullYear(), platDate.getMonth(), platDate.getDate() - 7)
      to = platDate
    } else if (preset === '30d') {
      from = new Date(platDate.getFullYear(), platDate.getMonth(), platDate.getDate() - 30)
      to = platDate
    } else if (preset === 'this_month') {
      from = new Date(platDate.getFullYear(), platDate.getMonth(), 1)
      to = platDate
    } else if (preset === 'last_month') {
      from = new Date(platDate.getFullYear(), platDate.getMonth() - 1, 1)
      to = new Date(platDate.getFullYear(), platDate.getMonth(), 0)
    } else {
      return null // custom
    }

    return {
      date_from: toLocalYYYYMMDD(from),
      date_to: toLocalYYYYMMDD(to)
    }
  }

  // Re-align default/preset dates once settings.platform_timezone loads
  useEffect(() => {
    if (settings.platform_timezone) {
      const dates = getPresetDates(filters.preset || '30d')
      if (dates) {
        setFilters(f => ({
          ...f,
          date_from: dates.date_from,
          date_to: dates.date_to
        }))
      }
    }
  }, [settings.platform_timezone])

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
  }, [filters.date_from, filters.date_to, filters.website_id, filters.ad_unit_id])

  // Core API loader
  async function fetchDashboardData(activeFilters) {
    try {
      const queryParams = {
        date_from: activeFilters.date_from,
        date_to: activeFilters.date_to,
        website_id: activeFilters.website_id,
        ad_unit_id: activeFilters.ad_unit_id,
        per_page: 1000, // retrieve larger dataset for accurate dashboard aggregate calculations
      }
      const [payRes, revRes] = await Promise.all([
        publisherApi.getPayouts(),
        publisherApi.getRevenue(queryParams),
      ])
      setPayouts(payRes.data?.data || [])
      setRevenue(revRes.data?.data || [])
      setPendingAdjustment(revRes.data?.pending_balance_adjustment || 0)
      setAggregates(revRes.data?.aggregates || null)
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
  // Approved earnings that have NOT gone to payout yet (excludes closed records)
  // Adjusted by pending adjustments (e.g. standalone manual payment deductions)
  const approvedEarningsTotal = aggregates ? aggregates.approved_earnings : 0
  const pendingEarningsTotal = aggregates ? aggregates.pending_earnings : 0
  const closedEarningsTotal = aggregates ? aggregates.closed_earnings : 0
  const impressionsTotal = aggregates ? aggregates.total_impressions : 0
  const clicksTotal = aggregates ? aggregates.total_clicks : 0
  const unfilledTotal = aggregates ? aggregates.total_unfilled : 0

  const totalApprovedEarnings = Math.max(0, approvedEarningsTotal + pendingAdjustment)
  const totalPendingEarnings = pendingEarningsTotal
  const totalImpressions = impressionsTotal
  const lastPayout      = payouts[0]

  const totalClicks = clicksTotal
  const totalUnfilled = unfilledTotal
  
  // Real total earnings in the period (including closed records) to calculate average CPM correctly
  const totalHistoricalApprovedEarnings = approvedEarningsTotal + closedEarningsTotal
  const totalHistoricalEarnings = totalHistoricalApprovedEarnings + totalPendingEarnings

  const averageCpm = totalImpressions > 0 ? (totalHistoricalEarnings / totalImpressions) * 1000 : 0
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

  const dailyTotals = sortedDailyRecords.reduce((acc, r) => {
    acc.impressions += r.impressions
    acc.clicks += r.clicks
    acc.approved += r.approved
    acc.pending += r.pending
    acc.earnings += r.earnings
    return acc
  }, { impressions: 0, clicks: 0, approved: 0, pending: 0, earnings: 0 })

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
      <AnnouncementsRenderer />
      {/* Welcome Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '20px' }}>
            <Sparkles size={16} style={{ color: 'var(--br-primary)' }} />
            {getGreeting()}, {user?.name || 'Publisher'}!
          </h1>
          <p className="page-subtitle">
            Earnings overview: {formatDateString(filters.date_from)} - {formatDateString(filters.date_to)}
          </p>
          {lastSyncAt && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--br-text-3)', marginTop: 4 }}>
              <span className="dot" style={{ color: 'var(--br-accent)', width: 6, height: 6, display: 'inline-block', borderRadius: '50%', background: 'currentColor' }} />
              <span>Last updated: {formatDateTime(lastSyncAt)}</span>
            </div>
          )}
        </div>
        <button
          className="btn btn-secondary"
          onClick={handleExportPDF}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
        >
          <FileText size={16} />
          Export PDF Statement
        </button>
      </div>

      {/* Filter Panel */}
      <div className="glass-card" style={{ marginBottom: 24, padding: '16px 20px', position: 'relative', zIndex: 10 }}>
        <div className="responsive-filters">
          
          {/* Preset Selector */}
          <div>
            <label className="form-label" style={{ marginBottom: 4, fontSize: 12 }}>Time Range</label>
            <select
              className="form-select"
              value={filters.preset}
              onChange={e => handlePresetChange(e.target.value)}
            >
              {!filters.preset && <option value="" disabled>Custom Range</option>}
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="form-label" style={{ marginBottom: 4, fontSize: 12 }}>Start Date</label>
            <input
              type="date"
              className="form-input"
              value={filters.date_from}
              onChange={e => setFilters(f => ({ ...f, date_from: e.target.value, preset: '' }))}
            />
          </div>

          {/* End Date */}
          <div>
            <label className="form-label" style={{ marginBottom: 4, fontSize: 12 }}>End Date</label>
            <input
              type="date"
              className="form-input"
              value={filters.date_to}
              onChange={e => setFilters(f => ({ ...f, date_to: e.target.value, preset: '' }))}
            />
          </div>

          {/* Website Filter */}
          <div className="flex-wide">
            <label className="form-label" style={{ marginBottom: 4, fontSize: 12 }}>Website</label>
            <SearchableSelect
              value={filters.website_id}
              onChange={handleWebsiteChange}
              options={websites.map(w => ({ value: w.id, label: w.domain }))}
              placeholder="All Websites"
              emptyMessage="No websites found"
              isOptional={true}
              clearLabel="All Websites"
            />
          </div>

          {/* Ad Unit Filter */}
          <div className="flex-wide">
            <label className="form-label" style={{ marginBottom: 4, fontSize: 12 }}>Ad Unit</label>
            <SearchableSelect
              value={filters.ad_unit_id}
              onChange={val => setFilters(f => ({ ...f, ad_unit_id: val }))}
              options={adUnits.map(au => ({ value: au.id, label: au.display_name }))}
              placeholder="All Ad Units"
              emptyMessage={!filters.website_id ? "Select a website first" : "No ad units found"}
              isOptional={true}
              clearLabel="All Ad Units"
              disabled={!filters.website_id}
            />
          </div>

          {/* Reset Action */}
          {(filters.preset !== '30d' || filters.website_id !== '' || filters.ad_unit_id !== '') && (
            <div className="flex-btn">
              <button
                className="btn btn-secondary"
                style={{ width: '100%', padding: '10px 16px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                onClick={handleResetFilters}
              >
                <Ban size={16} />
                Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Stats and Charts Container with Fade Overlay for refreshing */}
      <div style={{ opacity: refreshing ? 0.6 : 1, transition: 'opacity 0.15s ease' }}>
        
        {/* Stat Cards */}
        <div className="stat-grid">
          <div className="stat-card accent">
            <div className="stat-icon"><DollarSign size={20} /></div>
            <div className="stat-label">Approved Earnings</div>
            <div className="stat-value money"><CompactAmount value={totalApprovedEarnings} /></div>
            <div className="stat-change up">Approved</div>
          </div>
          
          <div className="stat-card warning">
            <div className="stat-icon"><Clock size={20} /></div>
            <div className="stat-label">Pending Earnings</div>
            <div className="stat-value money"><CompactAmount value={totalPendingEarnings} /></div>
            <div className="stat-change">Holding</div>
          </div>
          
          <div className="stat-card info">
            <div className="stat-icon"><Eye size={20} /></div>
            <div className="stat-label">Total Impressions</div>
            <div className="stat-value">
              <CompactAmount value={totalImpressions} prefix="" decimals={0} />
            </div>
            <div className="stat-change text-muted">Page ad loads</div>
          </div>
          
          <div className="stat-card info">
            <div className="stat-icon"><Ban size={20} /></div>
            <div className="stat-label">Unfilled Impressions</div>
            <div className="stat-value">
              <CompactAmount value={totalUnfilled} prefix="" decimals={0} />
            </div>
            <div className="stat-change text-muted">Unserved inventory</div>
          </div>

          <div className="stat-card info">
            <div className="stat-icon"><MousePointer size={20} /></div>
            <div className="stat-label">Total Clicks</div>
            <div className="stat-value">
              <CompactAmount value={totalClicks} prefix="" decimals={0} />
            </div>
            <div className="stat-change text-muted">Selected period</div>
          </div>

          <div className="stat-card primary">
            <div className="stat-icon"><Target size={20} /></div>
            <div className="stat-label">Average CTR</div>
            <div className="stat-value">{averageCtr.toFixed(2)}%</div>
            <div className="stat-change text-muted">Click-through rate</div>
          </div>

          <div className="stat-card primary">
            <div className="stat-icon"><Eye size={20} /></div>
            <div className="stat-label">Viewability Rate</div>
            <div className="stat-value">
              {viewabilityRate !== null ? `${viewabilityRate.toFixed(1)}%` : 'N/A'}
            </div>
            <div className="stat-change text-muted">
              {viewabilityRate !== null ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <CompactAmount value={totalAvViewable} prefix="" decimals={0} />
                  <span>/</span>
                  <CompactAmount value={totalAvEligible} prefix="" decimals={0} />
                  <span>measurable</span>
                </span>
              ) : (
                'No Active View data'
              )}
            </div>
          </div>

          <div className="stat-card primary">
            <div className="stat-icon"><TrendingUp size={20} /></div>
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
            <div className="stat-icon"><CreditCard size={20} /></div>
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
        <div className="glass-card" style={{ marginBottom: 24 }}>
          <div className="card-header" style={{ flexWrap: 'wrap', gap: 12 }}>
            <div className="card-title" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={18} style={{ color: 'var(--br-primary)' }} />
              Earnings Trend ({
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--br-accent)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--br-accent)', display: 'inline-block' }} />
                Approved
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--br-warning)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--br-warning)', display: 'inline-block' }} />
                Pending
              </div>
            </div>
          </div>
          {chart.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={chart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="approvedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="var(--br-accent)" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="var(--br-accent)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="pendingGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="var(--br-warning)" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="var(--br-warning)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--br-border)" />
                <XAxis dataKey="date" stroke="var(--br-text-3)" tick={{ fontSize: 11 }}
                  tickFormatter={d => d?.slice?.(5) || d} />
                <YAxis stroke="var(--br-text-3)" tick={{ fontSize: 11 }}
                  tickFormatter={v => `$${v}`} />
                <Tooltip
                  contentStyle={{ background: 'var(--br-bg-2)', border: '0.5px solid var(--br-border)', borderRadius: 'var(--br-radius)', backdropFilter: 'blur(10px)' }}
                  labelStyle={{ color: 'var(--br-text)', fontWeight: 600, marginBottom: 4 }}
                  itemStyle={{ color: 'var(--br-text-2)' }}
                  formatter={(v, name) => [
                    `$${v}`,
                    name === 'approved' ? 'Approved' : 'Pending'
                  ]}
                />
                <Area type="monotone" dataKey="approved" stroke="var(--br-accent)"
                  fill="url(#approvedGrad)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="pending" stroke="var(--br-warning)"
                  fill="url(#pendingGrad)" strokeWidth={2} dot={false} strokeDasharray="5 3" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state">
              <TrendingUp size={48} style={{ color: 'var(--br-text-3)', marginBottom: 16 }} />
              <div className="empty-state-text">No earnings data for this selection</div>
            </div>
          )}
        </div>

        {/* Daily Performance Table */}
        <div className="glass-card" style={{ marginTop: 24, padding: 0, overflow: 'hidden' }}>
          <div className="card-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--br-border)' }}>
            <div className="card-title">Daily Performance</div>
          </div>
          <div className="table-wrap">
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
                        <TrendingUp size={48} style={{ color: 'var(--br-text-3)', marginBottom: 16 }} />
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
                        <td className="text-sm td-primary" style={{ fontWeight: '500' }}>{formatDateString(r.date)}</td>
                        <td className="money">
                          <CompactAmount value={r.impressions} prefix="" decimals={0} />
                        </td>
                        <td className="money">
                          <CompactAmount value={r.clicks} prefix="" decimals={0} />
                        </td>
                        <td className="money">{ctr.toFixed(2)}%</td>
                        <td className="money td-amount">${cpm.toFixed(2)}</td>
                        <td className="money positive" style={{ fontWeight: '600' }}>
                          <CompactAmount value={r.approved} />
                        </td>
                        <td className="money" style={{ color: 'var(--br-warning)', fontWeight: '600' }}>
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
              {sortedDailyRecords.length > 0 && (
                <tfoot>
                  <tr style={{ background: 'rgba(99,102,241,.07)', fontWeight: 700, borderTop: '1px solid var(--br-border)' }}>
                    <td style={{ padding: '10px 16px', fontSize: 12 }}>Totals ({sortedDailyRecords.length}d)</td>
                    <td className="money">
                      <CompactAmount value={dailyTotals.impressions} prefix="" decimals={0} />
                    </td>
                    <td className="money">
                      <CompactAmount value={dailyTotals.clicks} prefix="" decimals={0} />
                    </td>
                    <td className="money">
                      {(dailyTotals.impressions > 0 ? (dailyTotals.clicks / dailyTotals.impressions) * 100 : 0).toFixed(2)}%
                    </td>
                    <td className="money">
                      ${(dailyTotals.impressions > 0 ? (dailyTotals.earnings / dailyTotals.impressions) * 1000 : 0).toFixed(2)}
                    </td>
                    <td className="money positive" style={{ fontWeight: '600' }}>
                      <CompactAmount value={dailyTotals.approved} />
                    </td>
                    <td className="money" style={{ color: 'var(--br-warning)', fontWeight: '600' }}>
                      <CompactAmount value={dailyTotals.pending} />
                    </td>
                    <td className="money positive" style={{ fontWeight: '800' }}>
                      <CompactAmount value={dailyTotals.earnings} />
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
          {sortedDailyRecords.length > 0 && (
            <div style={{ padding: '12px 20px' }}>
              <Pagination
                currentPage={dailyPage}
                totalItems={sortedDailyRecords.length}
                pageSize={10}
                onPageChange={setDailyPage}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
