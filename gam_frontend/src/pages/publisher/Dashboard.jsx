import { useState, useEffect } from 'react'
import { publisherApi } from '../../api/endpoints'
import toast from 'react-hot-toast'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useAuth } from '../../contexts/AuthContext'
import { useSettings } from '../../contexts/SettingsContext'
import { useI18n } from '../../contexts/I18nContext'
import Pagination from '../../components/Pagination'
import CompactAmount from '../../components/CompactAmount'
import { SearchableSelect } from '../../components/BulkAdUnitGeneratorModal'
import AnnouncementsRenderer from '../../components/AnnouncementsRenderer'
import { Sparkles, Clock, RefreshCw, FileText, DollarSign, Eye, MousePointer, Target, TrendingUp, Percent, CreditCard, Ban, Info, AlertCircle, Filter } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

const toLocalYYYYMMDD = (date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export default function PublisherDashboard() {
  const { user } = useAuth()
  const { settings, formatDateTime } = useSettings()
  const { t } = useI18n()
  
  const [websites, setWebsites] = useState([])
  const [adUnits, setAdUnits] = useState([])
  
  const [filters, setFilters] = useState({
    preset: '30d',
    date_from: toLocalYYYYMMDD(new Date(Date.now() - 29 * 86400000)),
    date_to: toLocalYYYYMMDD(new Date()),
    website_id: '',
    ad_unit_id: '',
  })
  const [showFiltersPanel, setShowFiltersPanel] = useState(false)

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
      from = new Date(platDate.getFullYear(), platDate.getMonth(), platDate.getDate() - 6)
      to = platDate
    } else if (preset === '30d') {
      from = new Date(platDate.getFullYear(), platDate.getMonth(), platDate.getDate() - 29)
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

  // Queries
  const { data: websitesRes } = useQuery({
    queryKey: ['publisherWebsites'],
    queryFn: () => publisherApi.getWebsites(),
  })
  
  // Keep websites list updated in local state for compatibility and select lists
  useEffect(() => {
    if (websitesRes?.data?.data) {
      setWebsites(websitesRes.data.data)
    }
  }, [websitesRes])

  const { data: payoutsRes } = useQuery({
    queryKey: ['publisherPayouts'],
    queryFn: () => publisherApi.getPayouts(),
  })
  const payouts = payoutsRes?.data?.data || []

  const { data: revenueRes, isLoading: revenueLoading, isFetching: revenueRefreshing, error: revenueError } = useQuery({
    queryKey: ['publisherRevenue', filters.date_from, filters.date_to, filters.website_id, filters.ad_unit_id],
    queryFn: () => publisherApi.getRevenue({
      date_from: filters.date_from,
      date_to: filters.date_to,
      website_id: filters.website_id,
      ad_unit_id: filters.ad_unit_id,
      dashboard: 1,
    }),
  })

  // Derived states
  const revenue = revenueRes?.data?.data || []
  const dailyStats = revenueRes?.data?.daily_stats || []
  const pendingAdjustment = revenueRes?.data?.pending_balance_adjustment || 0
  const aggregates = revenueRes?.data?.aggregates || null
  const lastSyncAt = revenueRes?.data?.last_sync_at || null

  const initialLoading = revenueLoading || !websitesRes || !payoutsRes
  const refreshing = revenueRefreshing && !revenueLoading

  useEffect(() => {
    if (revenueError) {
      toast.error(t('dashboard.toast_failed', 'Failed to load dashboard data'))
    }
  }, [revenueError, t])

  // Reset daily page when filters change
  useEffect(() => {
    setDailyPage(1)
  }, [filters.date_from, filters.date_to, filters.website_id, filters.ad_unit_id])

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
      toast.error(t('dashboard.toast_adunits_failed', 'Failed to load ad units'))
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
      const toastId = toast.loading(t('dashboard.toast_pdf_generating', 'Generating PDF statement...'))
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
      toast.success(t('dashboard.toast_pdf_success', 'PDF downloaded successfully'))
    } catch (err) {
      console.error(err)
      toast.error(t('dashboard.toast_pdf_failed', 'Failed to export PDF statement'))
    }
  }

  const getGreeting = () => {
    const hr = new Date().getHours()
    if (hr < 12) return t('dashboard.greeting.morning', 'Good morning')
    if (hr < 18) return t('dashboard.greeting.afternoon', 'Good afternoon')
    return t('dashboard.greeting.evening', 'Good evening')
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

  const totalClicks = clicksTotal
  const totalUnfilled = unfilledTotal
  
  // Real total earnings in the period (including closed records) to calculate average CPM correctly
  const totalHistoricalApprovedEarnings = approvedEarningsTotal + closedEarningsTotal
  const totalHistoricalEarnings = totalHistoricalApprovedEarnings + totalPendingEarnings

  const averageCpm = totalImpressions > 0 ? (totalHistoricalEarnings / totalImpressions) * 1000 : 0
  const averageCtr = aggregates?.total_ctr ?? 0

  const totalAvEligible = aggregates ? aggregates.total_active_view_eligible : 0
  const totalAvViewable = aggregates ? aggregates.total_active_view_viewable : 0
  const viewabilityRate = totalAvEligible > 0 ? (totalAvViewable / totalAvEligible) * 100 : null

  // Chart data aggregation — using pre-grouped dailyStats from backend
  const chart = [...dailyStats]
    .sort((a, b) => a.date < b.date ? -1 : 1)
    .map(d => ({
      ...d,
      approved: +d.approved.toFixed(2),
      pending: +d.pending.toFixed(2)
    }))

  const dailyRecords = dailyStats

  // Find the best day in the selected range (based on earnings)
  let bestDay = null
  if (dailyStats && dailyStats.length > 0) {
    const hasEarnings = dailyStats.some(d => (d.earnings || 0) > 0)
    if (hasEarnings) {
      bestDay = dailyStats.reduce((best, d) => (d.earnings || 0) > (best.earnings || 0) ? d : best, dailyStats[0])
    }
  }

  // Sort daily performance records
  const sortedDailyRecords = [...dailyRecords].sort((a, b) => {
    const valA = a[dailySortField]
    const valB = b[dailySortField]

    if (valA < valB) return dailySortOrder === 'asc' ? -1 : 1
    if (valA > valB) return dailySortOrder === 'asc' ? 1 : -1
    return 0
  })

  const paginatedDailyRecords = sortedDailyRecords.slice((dailyPage - 1) * 10, dailyPage * 10)

  const dailyTotals = {
    impressions: aggregates?.total_impressions ?? 0,
    clicks: aggregates?.total_clicks ?? 0,
    approved: (aggregates?.closed_earnings ?? 0) + (aggregates?.approved_earnings ?? 0),
    pending: aggregates?.pending_earnings ?? 0,
    earnings: ((aggregates?.closed_earnings ?? 0) + (aggregates?.approved_earnings ?? 0) + (aggregates?.pending_earnings ?? 0)),
  }

  const handleDailySort = (field) => {
    if (dailySortField === field) {
      setDailySortOrder(dailySortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setDailySortField(field)
      setDailySortOrder('desc')
    }
    setDailyPage(1)
  }

  const activeFiltersCount = [
    filters.preset !== '30d',
    filters.website_id !== '',
    filters.ad_unit_id !== ''
  ].filter(Boolean).length

  return (
    <div>
      {/* Welcome Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '20px' }}>
            <Sparkles size={16} style={{ color: 'var(--br-primary)' }} />
            {getGreeting()}, {user?.name || 'Publisher'}!
          </h1>
          <p className="page-subtitle">
            {t('dashboard.earnings_overview', 'Earnings overview: {from} - {to}', { from: formatDateString(filters.date_from), to: formatDateString(filters.date_to) })}
          </p>
          {lastSyncAt && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--br-text-3)', marginTop: 4 }}>
              <span className="dot" style={{ color: 'var(--br-accent)', width: 6, height: 6, display: 'inline-block', borderRadius: '50%', background: 'currentColor' }} />
              <span>{t('dashboard.last_updated', 'Last updated: {time}', { time: formatDateTime(lastSyncAt) })}</span>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button 
            className="btn btn-secondary" 
            onClick={() => setShowFiltersPanel(!showFiltersPanel)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            <Filter size={16} />
            <span>{showFiltersPanel ? t('dashboard.filters.hide', 'Hide Filters') : t('dashboard.filters.show', 'Show Filters')}</span>
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
            className="btn btn-secondary"
            onClick={handleExportPDF}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            <FileText size={16} />
            {t('dashboard.export_pdf', 'Export PDF Statement')}
          </button>
        </div>
      </div>

      <AnnouncementsRenderer />

      {/* Filter Panel */}
      {showFiltersPanel && (
        <div className="glass-card" style={{ marginBottom: 24, padding: '16px 20px', position: 'relative', zIndex: 10 }}>
          <div className="responsive-filters">
          
          {/* Preset Selector */}
          <div>
            <label className="form-label" style={{ marginBottom: 4, fontSize: 12 }}>{t('dashboard.filters.time_range', 'Time Range')}</label>
            <select
              className="form-select"
              value={filters.preset}
              onChange={e => handlePresetChange(e.target.value)}
            >
              {!filters.preset && <option value="" disabled>{t('dashboard.filters.custom_range', 'Custom Range')}</option>}
              <option value="today">{t('dashboard.presets.today', 'Today')}</option>
              <option value="yesterday">{t('dashboard.presets.yesterday', 'Yesterday')}</option>
              <option value="7d">{t('dashboard.presets.7d', 'Last 7 Days')}</option>
              <option value="30d">{t('dashboard.presets.30d', 'Last 30 Days')}</option>
              <option value="this_month">{t('dashboard.presets.this_month', 'This Month')}</option>
              <option value="last_month">{t('dashboard.presets.last_month', 'Last Month')}</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="form-label" style={{ marginBottom: 4, fontSize: 12 }}>{t('dashboard.filters.start_date', 'Start Date')}</label>
            <input
              type="date"
              className="form-input"
              value={filters.date_from}
              onChange={e => setFilters(f => ({ ...f, date_from: e.target.value, preset: '' }))}
            />
          </div>

          {/* End Date */}
          <div>
            <label className="form-label" style={{ marginBottom: 4, fontSize: 12 }}>{t('dashboard.filters.end_date', 'End Date')}</label>
            <input
              type="date"
              className="form-input"
              value={filters.date_to}
              onChange={e => setFilters(f => ({ ...f, date_to: e.target.value, preset: '' }))}
            />
          </div>

          {/* Website Filter */}
          <div className="flex-wide">
            <label className="form-label" style={{ marginBottom: 4, fontSize: 12 }}>{t('dashboard.filters.website', 'Website')}</label>
            <SearchableSelect
              value={filters.website_id}
              onChange={handleWebsiteChange}
              options={websites.map(w => ({ value: w.id, label: w.domain }))}
              placeholder={t('dashboard.filters.all_websites', 'All Websites')}
              emptyMessage={t('dashboard.filters.no_websites', 'No websites found')}
              isOptional={true}
              clearLabel={t('dashboard.filters.all_websites', 'All Websites')}
            />
          </div>

          {/* Ad Unit Filter */}
          <div className="flex-wide">
            <label className="form-label" style={{ marginBottom: 4, fontSize: 12 }}>{t('dashboard.filters.ad_unit', 'Ad Unit')}</label>
            <SearchableSelect
              value={filters.ad_unit_id}
              onChange={val => setFilters(f => ({ ...f, ad_unit_id: val }))}
              options={adUnits.map(au => ({ value: au.id, label: au.display_name }))}
              placeholder={t('dashboard.filters.all_ad_units', 'All Ad Units')}
              emptyMessage={!filters.website_id ? t('dashboard.filters.select_website_first', 'Select a website first') : t('dashboard.filters.no_ad_units', 'No ad units found')}
              isOptional={true}
              clearLabel={t('dashboard.filters.all_ad_units', 'All Ad Units')}
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
                {t('common.clear', 'Clear')}
              </button>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Main Stats and Charts Container with localized loading spinner */}
      {initialLoading ? (
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 350, margin: '24px 0', padding: 24 }}>
          <div className="spinner" style={{ marginBottom: 16 }}></div>
          <p style={{ color: 'var(--br-text-2)', fontSize: 14 }}>{t('dashboard.loading', 'Loading dashboard metrics...')}</p>
        </div>
      ) : (
        <div style={{ opacity: refreshing ? 0.6 : 1, transition: 'opacity 0.15s ease' }}>
        
        {/* Stat Cards */}
        <div className="stat-grid">
          <div className="stat-card accent">
            <div className="stat-icon"><DollarSign size={20} /></div>
            <div className="stat-label">{t('dashboard.stats.approved_earnings', 'Approved Earnings')}</div>
            <div className="stat-value money"><CompactAmount value={totalApprovedEarnings} /></div>
            <div className="stat-change up">{t('dashboard.status.approved', 'Approved')}</div>
          </div>
          
          <div className="stat-card warning">
            <div className="stat-icon"><Clock size={20} /></div>
            <div className="stat-label">{t('dashboard.stats.pending_earnings', 'Pending Earnings')}</div>
            <div className="stat-value money"><CompactAmount value={totalPendingEarnings} /></div>
            <div className="stat-change">{t('dashboard.status.holding', 'Holding')}</div>
          </div>
          
          <div className="stat-card info">
            <div className="stat-icon"><Eye size={20} /></div>
            <div className="stat-label">{t('dashboard.stats.total_impressions', 'Revenue Eligible Impressions')}</div>
            <div className="stat-value">
              <CompactAmount value={totalImpressions} prefix="" decimals={0} />
            </div>
            <div className="stat-change text-muted">{t('dashboard.stats.eligible_loads', 'Revenue eligible')}</div>
          </div>

          <div className="stat-card info">
            <div className="stat-icon"><Ban size={20} /></div>
            <div className="stat-label">{t('dashboard.stats.unfilled_impressions', 'Revenue Eligible Unfilled')}</div>
            <div className="stat-value">
              <CompactAmount value={totalUnfilled} prefix="" decimals={0} />
            </div>
            <div className="stat-change text-muted">{t('dashboard.stats.unserved_inventory', 'Unserved inventory')}</div>
          </div>

          <div className="stat-card info">
            <div className="stat-icon"><MousePointer size={20} /></div>
            <div className="stat-label">{t('dashboard.stats.total_clicks', 'Total Clicks')}</div>
            <div className="stat-value">
              <CompactAmount value={totalClicks} prefix="" decimals={0} />
            </div>
            <div className="stat-change text-muted">{t('dashboard.stats.selected_period', 'Selected period')}</div>
          </div>

          <div className="stat-card primary">
            <div className="stat-icon"><Target size={20} /></div>
            <div className="stat-label">{t('dashboard.stats.average_ctr', 'Average CTR')}</div>
            <div className="stat-value">{averageCtr.toFixed(2)}%</div>
            <div className="stat-change text-muted">{t('dashboard.stats.ctr_desc', 'Click-through rate')}</div>
          </div>

          <div className="stat-card primary">
            <div className="stat-icon"><Eye size={20} /></div>
            <div className="stat-label">{t('dashboard.stats.viewability_rate', 'Viewability Rate')}</div>
            <div className="stat-value">
              {viewabilityRate !== null ? `${viewabilityRate.toFixed(1)}%` : 'N/A'}
            </div>
            <div className="stat-change text-muted">
              {viewabilityRate !== null ? (
                <span>{t('dashboard.stats.viewability_rate_desc', 'Active View rate')}</span>
              ) : (
                t('dashboard.stats.no_av_data', 'No Active View data')
              )}
            </div>
          </div>

          <div className="stat-card primary">
            <div className="stat-icon"><TrendingUp size={20} /></div>
            <div className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {t('dashboard.stats.monetized_cpm', 'Monetized CPM')}
              <span 
                style={{ cursor: 'pointer', fontSize: '12px', color: '#9ca3af' }}
                title={t('dashboard.stats.cpm_tooltip', 'Your net earnings per 1,000 served (monetized) impressions after the platform share has been applied.')}
              >
                ⓘ
              </span>
            </div>
            <div className="stat-value money">${averageCpm.toFixed(2)}</div>
            <div className="stat-change text-muted">{t('dashboard.stats.cpm_desc', 'Earnings per 1k impressions')}</div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="glass-card dashboard-chart-card" style={{ marginBottom: 24 }}>
          <div className="card-header" style={{ flexWrap: 'wrap', gap: 12 }}>
            <div className="card-title" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={18} style={{ color: 'var(--br-primary)' }} />
              {t('dashboard.chart.earnings_trend', 'Earnings Trend')} ({
                filters.preset === 'today' ? t('dashboard.presets.today', 'Today') :
                filters.preset === 'yesterday' ? t('dashboard.presets.yesterday', 'Yesterday') :
                filters.preset === '7d' ? t('dashboard.presets.7d', 'Last 7 Days') :
                filters.preset === '30d' ? t('dashboard.presets.30d', 'Last 30 Days') :
                filters.preset === 'this_month' ? t('dashboard.presets.this_month', 'This Month') :
                filters.preset === 'last_month' ? t('dashboard.presets.last_month', 'Last Month') :
                t('dashboard.chart.filtered_range', 'Filtered Range')
              })
            </div>
            {/* Legend */}
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--br-primary)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--br-primary)', display: 'inline-block' }} />
                {t('dashboard.status.approved', 'Approved')}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--br-violet)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--br-violet)', display: 'inline-block' }} />
                {t('dashboard.status.pending', 'Pending')}
              </div>
            </div>
          </div>
          {chart.length > 0 ? (
            <div className="publisher-chart-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="approvedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="var(--br-primary)" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="var(--br-primary)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="pendingGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="var(--br-violet)" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="var(--br-violet)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.04)" />
                  <XAxis dataKey="date" stroke="var(--br-text-3)" tick={{ fontSize: 11 }}
                    tickFormatter={d => d?.slice?.(5) || d} />
                  <YAxis stroke="var(--br-text-3)" tick={{ fontSize: 11 }} width={40}
                    tickFormatter={v => `$${v}`} />
                  <Tooltip
                    contentStyle={{ 
                      background: 'rgba(15, 23, 42, 0.9)', 
                      border: '1px solid rgba(255, 255, 255, 0.08)', 
                      borderRadius: 12,
                      backdropFilter: 'blur(12px)',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)'
                    }}
                    labelStyle={{ color: '#f8fafc', fontWeight: 700, marginBottom: 6 }}
                    itemStyle={{ color: '#e2e8f0', fontSize: 13 }}
                    formatter={(v, name) => [
                      `$${v}`,
                      name === 'approved' ? t('dashboard.status.approved', 'Approved') : t('dashboard.status.pending', 'Pending')
                    ]}
                  />
                  <Area type="monotone" dataKey="approved" stroke="var(--br-primary)"
                    fill="url(#approvedGrad)" strokeWidth={3} dot={false} />
                  <Area type="monotone" dataKey="pending" stroke="var(--br-violet)"
                    fill="url(#pendingGrad)" strokeWidth={2.5} dot={false} strokeDasharray="5 3" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empty-state">
              <TrendingUp size={48} style={{ color: 'var(--br-text-3)', marginBottom: 16 }} />
              <div className="empty-state-text">{t('dashboard.chart.no_data', 'No earnings data for this selection')}</div>
            </div>
          )}
        </div>

        {/* Daily Performance Table */}
        <div className="glass-card" style={{ marginTop: 24, padding: 0, overflow: 'hidden' }}>
          <div className="card-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--br-border)' }}>
            <div className="card-title">{t('dashboard.table.daily_performance', 'Daily Performance')}</div>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th onClick={() => handleDailySort('date')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                    {t('dashboard.table.date', 'Date')} {dailySortField === 'date' ? (dailySortOrder === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th onClick={() => handleDailySort('impressions')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                    {t('dashboard.table.impressions', 'Revenue Eligible Impressions')} {dailySortField === 'impressions' ? (dailySortOrder === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th onClick={() => handleDailySort('clicks')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                    {t('dashboard.table.clicks', 'Clicks')} {dailySortField === 'clicks' ? (dailySortOrder === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th onClick={() => handleDailySort('ctr')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                    {t('dashboard.table.ctr', 'CTR')} {dailySortField === 'ctr' ? (dailySortOrder === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th onClick={() => handleDailySort('cpm')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                    {t('dashboard.table.cpm', 'Monetized CPM')} {dailySortField === 'cpm' ? (dailySortOrder === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th onClick={() => handleDailySort('approved')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                    {t('dashboard.table.approved', 'Approved')} {dailySortField === 'approved' ? (dailySortOrder === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th onClick={() => handleDailySort('pending')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                    {t('dashboard.table.pending', 'Pending')} {dailySortField === 'pending' ? (dailySortOrder === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th onClick={() => handleDailySort('earnings')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                    {t('dashboard.table.total_earnings', 'Total Earnings')} {dailySortField === 'earnings' ? (dailySortOrder === 'asc' ? '↑' : '↓') : ''}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedDailyRecords.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <div className="empty-state">
                        <TrendingUp size={48} style={{ color: 'var(--br-text-3)', marginBottom: 16 }} />
                        <div className="empty-state-text">{t('dashboard.table.no_data', 'No performance data for this selection')}</div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedDailyRecords.map(r => {
                    const ctr = r.ctr
                    const cpm = r.cpm
                    const isBest = bestDay && r.date === bestDay.date
                    return (
                      <tr key={r.date} style={isBest ? {
                        background: 'rgba(245,158,11,.07)',
                        outline: '1px solid rgba(245,158,11,.2)',
                        outlineOffset: '-1px',
                      } : {}}>
                        <td className="text-sm td-primary" style={{ fontWeight: '500' }}>
                          {formatDateString(r.date)}
                          {isBest && (
                            <span style={{
                              marginLeft: 6, fontSize: 10, padding: '1px 5px', borderRadius: 6,
                              background: 'rgba(245,158,11,.15)', color: '#f59e0b', fontWeight: 700,
                            }}>{t('dashboard.table.best', 'Best')}</span>
                          )}
                        </td>
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
                    <td style={{ padding: '10px 16px', fontSize: 12 }}>{t('dashboard.table.totals_days', 'Totals ({days}d)', { days: sortedDailyRecords.length })}</td>
                    <td className="money">
                      <CompactAmount value={dailyTotals.impressions} prefix="" decimals={0} />
                    </td>
                    <td className="money">
                      <CompactAmount value={dailyTotals.clicks} prefix="" decimals={0} />
                    </td>
                    <td className="money">
                      {(aggregates?.total_ctr ?? 0).toFixed(2)}%
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
      )}
    </div>
  )
}
