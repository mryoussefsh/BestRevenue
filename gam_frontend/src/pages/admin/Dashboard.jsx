import { useState, useEffect, useRef } from 'react'
import { adminApi } from '../../api/endpoints'
import toast from 'react-hot-toast'
import { useI18n } from '../../contexts/I18nContext'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import CompactAmount from '../../components/CompactAmount'
import { useSettings } from '../../contexts/SettingsContext'
import { useAuth } from '../../contexts/AuthContext'
import { DollarSign, Users, CheckCircle2, Clock, CreditCard, Eye, MousePointer, Ban, BarChart2, Target, Percent, Calendar, Award, Lock, ArrowRight, TrendingUp, Scale, LayoutDashboard, RefreshCw, Filter } from 'lucide-react'

// ── Date preset helpers ─────────────────────────────────────────────────────
// Use local-timezone formatting to avoid UTC shift (e.g. UTC+3 offset causing day-1 errors)
function fmtLocal(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function getPlatformDate(timezone) {
  try {
    const formatter = new Intl.DateTimeFormat('sv-SE', {
      timeZone: timezone || 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
    const formatted = formatter.format(new Date()) // e.g. "2026-06-09"
    const parts = formatted.split('-')
    return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10))
  } catch (err) {
    console.error('Timezone offset error:', err)
    return new Date()
  }
}

function getPresetRange(preset, timezone) {
  const platDate = getPlatformDate(timezone)
  const today = fmtLocal(platDate)
  const daysAgo = n => fmtLocal(new Date(platDate.getFullYear(), platDate.getMonth(), platDate.getDate() - n))
  switch (preset) {
    case 'today':
      return { date_from: today, date_to: today }
    case 'yesterday': {
      const y = daysAgo(1)
      return { date_from: y, date_to: y }
    }
    case '7d':
      return { date_from: daysAgo(7),  date_to: today }
    case '14d':
      return { date_from: daysAgo(14), date_to: today }
    case '30d':
      return { date_from: daysAgo(30), date_to: today }
    case '90d':
      return { date_from: daysAgo(90), date_to: today }
    case 'this_month': {
      const s = new Date(platDate.getFullYear(), platDate.getMonth(), 1)
      return { date_from: fmtLocal(s), date_to: today }
    }
    case 'last_month': {
      const s = new Date(platDate.getFullYear(), platDate.getMonth() - 1, 1)
      const e = new Date(platDate.getFullYear(), platDate.getMonth(), 0)
      return { date_from: fmtLocal(s), date_to: fmtLocal(e) }
    }
    default:
      return { date_from: daysAgo(30), date_to: today }
  }
}

const DATE_PRESETS = [
  { key: 'today',      label: 'Today' },
  { key: 'yesterday',  label: 'Yesterday' },
  { key: '7d',         label: '7 Days' },
  { key: '14d',        label: '14 Days' },
  { key: '30d',        label: '30 Days' },
  { key: '90d',        label: '90 Days' },
  { key: 'this_month', label: 'This Month' },
  { key: 'last_month', label: 'Last Month' },
  { key: 'custom',     label: 'Custom' },
]

// ── Searchable dropdown ─────────────────────────────────────────────────────
function SearchDropdown({ value, onChange, options, placeholder, allLabel = 'All' }) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    function click(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', click)
    return () => document.removeEventListener('mousedown', click)
  }, [])

  useEffect(() => { if (!open) setQ('') }, [open])

  const selected = options.find(o => o.value === value)
  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(q.toLowerCase()) ||
    (o.sub && o.sub.toLowerCase().includes(q.toLowerCase()))
  )

  return (
    <div ref={ref} style={{ position: 'relative', minWidth: 180 }}>
      <div
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '0 12px', height: 38, cursor: 'pointer',
          background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)', color: selected ? 'var(--color-text)' : 'var(--color-text-muted)',
          fontSize: 13, userSelect: 'none', transition: 'border-color .15s',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selected ? selected.label : placeholder || allLabel}
        </span>
        <span style={{ fontSize: 9, marginLeft: 8, opacity: .6, flexShrink: 0 }}>▼</span>
      </div>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 100,
          background: 'var(--color-surface-2)', border: '1px solid var(--color-border-light)',
          borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)',
          maxHeight: 260, display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ padding: 8, borderBottom: '1px solid var(--color-border)' }}>
            <input autoFocus className="form-input" placeholder={t('common.search_placeholder', 'Search…')} value={q}
              onChange={e => setQ(e.target.value)}
              style={{ padding: '5px 8px', height: 30, fontSize: 12 }} />
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            <div onClick={() => { onChange(''); setOpen(false) }}
              style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 13,
                color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border)' }}>
              {allLabel}
            </div>
            {filtered.map(o => (
              <div key={o.value} onClick={() => { onChange(o.value); setOpen(false) }}
                style={{
                  padding: '8px 12px', cursor: 'pointer', fontSize: 13,
                  background: o.value === value ? 'var(--color-primary)' : 'transparent',
                  color: o.value === value ? '#fff' : 'var(--color-text)',
                  transition: 'background .12s',
                }}>
                <div style={{ fontWeight: 500 }}>{o.label}</div>
                {o.sub && <div style={{ fontSize: 11, opacity: .6 }}>{o.sub}</div>}
              </div>
            ))}
            {filtered.length === 0 && (
              <div style={{ padding: '10px 12px', fontSize: 12, color: 'var(--color-text-muted)', textAlign: 'center' }}>
                {t('common.no_results', 'No results')}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Dashboard ──────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { t } = useI18n()
  const { settings } = useSettings()
  const { hasPermission } = useAuth()
  const [stats, setStats]           = useState(null)
  const [revenueChart, setRevenueChart] = useState([])
  const [publishers, setPublishers] = useState([])
  const [websites, setWebsites]     = useState([])
  const [adUnits, setAdUnits]       = useState([])
  const [syncing, setSyncing]       = useState(false)
  const [loading, setLoading]       = useState(true)
  const [visibleSeries, setVisibleSeries] = useState({ gross: true, earnings: true, approved: true, pending: true })
  const [publisherStats, setPublisherStats] = useState([])
  const [showFiltersPanel, setShowFiltersPanel] = useState(false)

  function toggleSeries(key) {
    setVisibleSeries(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const [preset, setPreset] = useState('30d')
  const [filters, setFilters] = useState({
    ...getPresetRange('30d'),
    publisher_id: '',
    website_id: '',
    ad_unit_id: '',
    status: '',
  })

  // Re-align default/preset dates once settings.platform_timezone loads
  useEffect(() => {
    if (settings.platform_timezone) {
      const range = getPresetRange(preset, settings.platform_timezone)
      setFilters(f => ({
        ...f,
        ...range
      }))
    }
  }, [settings.platform_timezone])

  // Load publishers & websites once for dropdowns
  useEffect(() => {
    const pPromise = hasPermission('manage_publishers') ? adminApi.getPublishers() : Promise.resolve({ data: { data: [] } })
    const wPromise = hasPermission('manage_websites') ? adminApi.getWebsites() : Promise.resolve({ data: { data: [] } })

    Promise.all([pPromise, wPromise])
      .then(([pRes, wRes]) => {
        setPublishers(pRes.data?.data || [])
        setWebsites(wRes.data?.data || [])
      })
      .catch(err => {
        console.error('Failed to load dropdown data:', err)
      })
  }, [hasPermission])

  // Load ad units dynamically when filters.publisher_id or filters.website_id changes
  useEffect(() => {
    if (!hasPermission('manage_ad_units')) {
      setAdUnits([])
      return
    }
    const params = { per_page: 'all' }
    if (filters.publisher_id) params.publisher_id = filters.publisher_id
    if (filters.website_id)   params.website_id   = filters.website_id

    adminApi.getAdUnits(params)
      .then(res => {
        setAdUnits(res.data?.data || [])
      })
      .catch(err => {
        console.error('Failed to load ad units:', err)
      })
  }, [filters.publisher_id, filters.website_id, hasPermission])

  // Reload stats whenever filters change (debounced 300ms)
  useEffect(() => {
    const t = setTimeout(() => loadData(), 300)
    return () => clearTimeout(t)
  }, [filters])

  async function loadData() {
    setLoading(true)
    try {
      const params = {}
      if (filters.date_from)    params.date_from    = filters.date_from
      if (filters.date_to)      params.date_to      = filters.date_to
      if (filters.publisher_id) params.publisher_id = filters.publisher_id
      if (filters.website_id)   params.website_id   = filters.website_id
      if (filters.ad_unit_id)   params.ad_unit_id   = filters.ad_unit_id
      if (filters.status)       params.status       = filters.status

      // Compute previous period date range (same length, immediately before)
      const dayMs = 86400000
      const dateFrom = filters.date_from ? new Date(filters.date_from) : new Date(Date.now() - 30 * dayMs)
      const dateTo   = filters.date_to   ? new Date(filters.date_to)   : new Date()
      const spanDays = Math.max(1, Math.round((dateTo - dateFrom) / dayMs) + 1)
      const prevTo   = new Date(dateFrom - dayMs)
      const prevFrom = new Date(prevTo   - (spanDays - 1) * dayMs)
      const fmt = d => d.toISOString().slice(0, 10)
      const prevParams = {
        ...params,
        date_from: fmt(prevFrom),
        date_to:   fmt(prevTo),
      }
      delete prevParams.status // compare gross periods regardless of status

      const pubParams = {}
      if (filters.date_from)    pubParams.date_from    = filters.date_from
      if (filters.date_to)      pubParams.date_to      = filters.date_to
      if (filters.website_id)   pubParams.website_id   = filters.website_id

      const pubPromise = hasPermission('manage_publishers')
        ? adminApi.getPublishers(pubParams)
        : Promise.resolve({ data: { data: [] } })

      const closingsPromise = hasPermission('manage_closings')
        ? adminApi.getPeriodClosings()
        : Promise.resolve({ data: { data: [] } })

      const payoutsPromise = hasPermission('manage_payouts')
        ? adminApi.getPayouts({ status: 'pending' })
        : Promise.resolve({ data: { data: [] } })

      const revenuePromise = hasPermission('manage_revenue')
        ? adminApi.getRevenue(params)
        : Promise.resolve({ data: { data: [] } })

      const prevRevenuePromise = hasPermission('manage_revenue')
        ? adminApi.getRevenue(prevParams)
        : Promise.resolve({ data: { data: [] } })

      const [pubRes, closingsRes, payoutsRes, revenueRes, prevRevenueRes] = await Promise.all([
        pubPromise,
        closingsPromise,
        payoutsPromise,
        revenuePromise,
        prevRevenuePromise,
      ])

      const allPublishers = pubRes.data?.data       || []
      const closings      = closingsRes.data?.data  || []
      const pending       = payoutsRes.data?.data   || []
      const revenue       = revenueRes.data?.data   || []
      const prevRevenue   = prevRevenueRes.data?.data || []

      // Chart — group by date (last 60 days max)
      const byDate = {}
      revenue.forEach(r => {
        const d = r.date?.slice(0, 10) || r.date
        const isApproved = r.period_closing_id !== null || r.is_approved
        if (!byDate[d]) byDate[d] = { date: d, gross: 0, earnings: 0, approved: 0, pending: 0, impressions: 0 }
        byDate[d].gross       += parseFloat(r.gross_revenue || 0)
        byDate[d].earnings    += parseFloat(r.publisher_earnings || 0)
        byDate[d].impressions += parseInt(r.impressions || 0)
        if (isApproved) byDate[d].approved += parseFloat(r.publisher_earnings || 0)
        else            byDate[d].pending  += parseFloat(r.publisher_earnings || 0)
      })
      const chart = Object.values(byDate)
        .sort((a, b) => a.date < b.date ? -1 : 1)
        .slice(-60)
        .map(d => ({
          ...d,
          gross:    +d.gross.toFixed(2),
          earnings: +d.earnings.toFixed(2),
          approved: +d.approved.toFixed(2),
          pending:  +d.pending.toFixed(2),
          impressions: d.impressions,
        }))

      // Stat aggregations
      const totalGross      = revenue.reduce((s, r) => s + parseFloat(r.gross_revenue || 0), 0)
      const totalEarnings   = revenue.reduce((s, r) => s + parseFloat(r.publisher_earnings || 0), 0)
      const filteredApprovedPubs = filters.publisher_id
        ? allPublishers.filter(p => p.id === filters.publisher_id)
        : allPublishers
      const totalApproved = filteredApprovedPubs.reduce((sum, p) => sum + parseFloat(p.approved_balance || 0), 0)
      const totalPendingAmt = revenue
        .filter(r => r.period_closing_id === null && !r.is_approved)
        .reduce((s, r) => s + parseFloat(r.publisher_earnings || 0), 0)
      const totalImpr   = revenue.reduce((s, r) => s + parseInt(r.impressions || 0), 0)
      const totalClicks  = revenue.reduce((s, r) => s + parseInt(r.clicks || 0), 0)
      const totalUnfilled = revenue.reduce((s, r) => s + parseInt(r.unfilled_impressions || 0), 0)
      const totalAvEligible = revenue.reduce((s, r) => s + parseInt(r.active_view_eligible_impressions || 0), 0)
      const totalAvViewable = revenue.reduce((s, r) => s + parseInt(r.active_view_viewable_impressions || 0), 0)
      const avgCPM      = totalImpr > 0 ? (totalGross / totalImpr) * 1000 : 0
      const avgCTR      = totalImpr > 0 ? (totalClicks / totalImpr) * 100  : 0
      const viewabilityRate = totalAvEligible > 0 ? (totalAvViewable / totalAvEligible) * 100 : null
      const avgRatio    = revenue.length > 0
        ? revenue.reduce((s, r) => s + parseFloat(r.ratio_applied || 0), 0) / revenue.length
        : 0

      // — Period daily average & comparison —
      // Unique days in current period
      const currentDays = new Set(revenue.map(r => r.date?.slice(0, 10))).size || 1
      const prevDays    = new Set(prevRevenue.map(r => r.date?.slice(0, 10))).size || 1
      const currentAvgDaily = totalEarnings / currentDays
      const prevTotalEarnings = prevRevenue.reduce((s, r) => s + parseFloat(r.publisher_earnings || 0), 0)
      const prevAvgDaily = prevTotalEarnings / prevDays
      const periodChangePct = prevAvgDaily > 0
        ? ((currentAvgDaily - prevAvgDaily) / prevAvgDaily) * 100
        : null

      // — Best day in selected range —
      let bestDay = null
      if (chart.length > 0) {
        bestDay = chart.reduce((best, d) => d.earnings > best.earnings ? d : best, chart[0])
      }

      // — Ready for Payout sum —
      const filteredPubsForPayout = filters.publisher_id
        ? allPublishers.filter(p => p.id === filters.publisher_id)
        : allPublishers
      const readyForPayout = filteredPubsForPayout.reduce((sum, p) => sum + parseFloat(p.approved_balance || 0), 0)

      setStats({
        // Publisher counts (always global regardless of filter)
        publishers:        allPublishers.length,
        activePublishers:  allPublishers.filter(p => p.status === 'active').length,
        pendingPublishers: allPublishers.filter(p => p.status === 'pending').length,
        pendingPayouts:    pending.length,
        pendingPayoutsTotal: pending.reduce((s, p) => s + parseFloat(p.final_amount || p.amount || 0), 0).toFixed(2),
        closedPeriods:     closings.filter(c => c.status === 'closed').length,
        // Revenue stats (filtered)
        totalGross:    totalGross.toFixed(2),
        totalEarnings: totalEarnings.toFixed(2),
        totalApproved: totalApproved.toFixed(2),
        totalPending:  totalPendingAmt.toFixed(2),
        readyForPayout: readyForPayout.toFixed(2),
        totalImpressions: totalImpr,
        totalClicks:   totalClicks,
        totalUnfilled: totalUnfilled,
        totalAvEligible,
        totalAvViewable,
        viewabilityRate,
        avgCPM:        avgCPM.toFixed(2),
        avgCTR:        avgCTR.toFixed(3),
        avgRatio:      (avgRatio * 100).toFixed(1),
        recordCount:   revenue.length,
        // Period comparison
        avgDailyEarnings: currentAvgDaily.toFixed(2),
        periodChangePct:  periodChangePct !== null ? periodChangePct.toFixed(1) : null,
        spanDays,
        // Best day
        bestDay: bestDay ? { date: bestDay.date, earnings: bestDay.earnings.toFixed(2), gross: bestDay.gross.toFixed(2) } : null,
      })
      setRevenueChart(chart)

      // — Top publishers aggregation —
      const byPub = {}
      revenue.forEach(r => {
        const pub = r.ad_unit?.website?.publisher
        if (!pub) return
        const key = pub.id || pub.name
        const isApproved = r.period_closing_id !== null || r.is_approved
        if (!byPub[key]) byPub[key] = {
          id: pub.id, name: pub.name, email: pub.email,
          earnings: 0, approved: 0, pending: 0,
          gross: 0, impressions: 0,
        }
        byPub[key].earnings    += parseFloat(r.publisher_earnings || 0)
        byPub[key].gross       += parseFloat(r.gross_revenue      || 0)
        byPub[key].impressions += parseInt(r.impressions          || 0)
        if (isApproved) byPub[key].approved += parseFloat(r.publisher_earnings || 0)
        else            byPub[key].pending  += parseFloat(r.publisher_earnings || 0)
      })
      const top10 = Object.values(byPub)
        .sort((a, b) => b.earnings - a.earnings)
        .slice(0, 10)
        .map(p => ({
          ...p,
          earnings:    +p.earnings.toFixed(2),
          approved:    +p.approved.toFixed(2),
          pending:     +p.pending.toFixed(2),
          gross:       +p.gross.toFixed(2),
        }))
      setPublisherStats(top10)
    } catch (e) {
      console.error(e)
      toast.error(t('dashboard.toast_failed', 'Failed to load dashboard data') + ': ' + (e.response?.data?.message || e.message))
    } finally {
      setLoading(false)
    }
  }

  async function handleSync() {
    setSyncing(true)
    try {
      const res = await adminApi.runSync()
      toast.success(res.data?.message || t('dashboard.toast_sync_success', 'GAM sync completed successfully!'))
      loadData()
    } catch (e) {
      toast.error(e.response?.data?.message || t('dashboard.toast_sync_fail', 'GAM sync failed.'))
    } finally {
      setSyncing(false)
    }
  }

  function applyPreset(key) {
    setPreset(key)
    if (key !== 'custom') {
      setFilters(f => ({ ...f, ...getPresetRange(key, settings.platform_timezone) }))
    }
  }

  function resetFilters() {
    setPreset('30d')
    setFilters({ ...getPresetRange('30d', settings.platform_timezone), publisher_id: '', website_id: '', ad_unit_id: '', status: '' })
  }

  const hasFilters = filters.publisher_id || filters.website_id || filters.ad_unit_id || filters.status || preset !== '30d'

  const activeFiltersCount = [
    filters.publisher_id,
    filters.website_id,
    filters.ad_unit_id,
    filters.status,
    preset !== '30d' ? 'preset' : null
  ].filter(Boolean).length

  // Filter website dropdown to selected publisher
  const websiteOptions = websites
    .filter(w => !filters.publisher_id || w.publisher_id === filters.publisher_id)
    .map(w => ({ value: w.id, label: w.domain, sub: w.gam_network_code || '' }))

  const publisherOptions = publishers.map(p => ({ value: p.id, label: p.name, sub: p.email }))

  const adUnitOptions = adUnits.map(a => {
    const web = websites.find(w => w.id === a.website_id)
    return {
      value: a.id,
      label: a.display_name,
      sub: `${web ? web.domain + ' · ' : ''}${a.gam_ad_unit_name}`
    }
  })

  return (
    <div>
      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <LayoutDashboard size={28} style={{ color: 'var(--br-primary)' }} />
            <span>{t('nav.dashboard', 'Dashboard')}</span>
          </h1>
          <p className="page-subtitle" style={{ color: 'var(--color-text-muted)' }}>
            {loading ? t('common.loading', 'Loading…') : (
              hasPermission('manage_revenue')
                ? t('dashboard.revenue_records_count', '{count} revenue records · {from} → {to}', { count: stats?.recordCount?.toLocaleString() || 0, from: filters.date_from, to: filters.date_to })
                : t('dashboard.admin_welcome', 'Welcome to the BestRevenue administrator dashboard')
            )}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {hasPermission('manage_revenue') && (
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
          )}
          {hasPermission('manage_gam_accounts') && (
            <button
              className={`btn btn-primary ${syncing ? 'btn-loading' : ''}`}
              onClick={handleSync} disabled={syncing} id="run-gam-sync-btn"
            >
              {syncing
                ? <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> {t('dashboard.syncing', 'Syncing…')}</>
                : <><RefreshCw size={14} /> {t('dashboard.run_sync', 'Run GAM Sync')}</>}
            </button>
          )}
        </div>
      </div>

      {/* ── Filter Panel ── */}
      {showFiltersPanel && (
        <div className="card" style={{
          padding: '16px 20px', marginBottom: 24,
          background: 'var(--color-surface-2)',
          border: '1px solid var(--color-border)',
        }}>
        {/* Filters Row */}
        <div className="dashboard-filters-grid" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Period Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>{t('dashboard.filters.period', 'Period')}</span>
            <select className="form-select" value={preset}
              onChange={e => applyPreset(e.target.value)}
              style={{ height: 38, fontSize: 13, minWidth: 120 }}>
              {DATE_PRESETS.map(p => (
                <option key={p.key} value={p.key}>{t(`dashboard.presets.${p.key}`, p.label)}</option>
              ))}
            </select>
          </div>

          {/* Custom date range — always visible */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>{t('dashboard.filters.from', 'From')}</span>
            <input type="date" className="form-input" value={filters.date_from}
              style={{ height: 38, fontSize: 13, padding: '0 10px' }}
              onChange={e => { setPreset('custom'); setFilters(f => ({ ...f, date_from: e.target.value })) }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>{t('dashboard.filters.to', 'To')}</span>
            <input type="date" className="form-input" value={filters.date_to}
              style={{ height: 38, fontSize: 13, padding: '0 10px' }}
              onChange={e => { setPreset('custom'); setFilters(f => ({ ...f, date_to: e.target.value })) }} />
          </div>

          {/* Divider */}
          <div className="filter-divider" />

          {/* Publisher */}
          {hasPermission('manage_publishers') && (
            <SearchDropdown
              value={filters.publisher_id}
              onChange={val => setFilters(f => ({ ...f, publisher_id: val, website_id: '', ad_unit_id: '' }))}
              options={publisherOptions}
              allLabel={t('dashboard.filters.all_publishers', 'All Publishers')}
              placeholder={t('dashboard.filters.all_publishers', 'All Publishers')}
            />
          )}

          {/* Website */}
          {hasPermission('manage_websites') && (
            <SearchDropdown
              value={filters.website_id}
              onChange={val => setFilters(f => ({ ...f, website_id: val, ad_unit_id: '' }))}
              options={websiteOptions}
              allLabel={t('dashboard.filters.all_websites', 'All Websites')}
              placeholder={t('dashboard.filters.all_websites', 'All Websites')}
            />
          )}

          {/* Ad Unit */}
          {hasPermission('manage_ad_units') && (
            <SearchDropdown
              value={filters.ad_unit_id}
              onChange={val => setFilters(f => ({ ...f, ad_unit_id: val }))}
              options={adUnitOptions}
              allLabel={t('dashboard.filters.all_ad_units', 'All Ad Units')}
              placeholder={t('dashboard.filters.all_ad_units', 'All Ad Units')}
            />
          )}

          {/* Revenue Status */}
          {hasPermission('manage_revenue') && (
            <div>
              <select className="form-select" value={filters.status}
                onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
                style={{ height: 38, fontSize: 13, minWidth: 150, width: '100%' }}>
                <option value="">{t('dashboard.filters.all_statuses', 'All Statuses')}</option>
                <option value="pending">{t('dashboard.status.pending', 'Pending')}</option>
                <option value="approved">{t('dashboard.status.approved', 'Approved')}</option>
                <option value="closed">{t('dashboard.status.closed', 'Closed')}</option>
              </select>
            </div>
          )}

          {/* Reset */}
          {hasFilters && (
            <div>
              <button 
                className="btn btn-secondary" 
                onClick={resetFilters}
                style={{ 
                  height: 38, 
                  padding: '0 16px', 
                  fontSize: 13, 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: 8,
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  color: '#ef4444',
                  transition: 'var(--transition)',
                  width: '100%'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#ef4444'
                  e.currentTarget.style.color = '#fff'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
                  e.currentTarget.style.color = '#ef4444'
                }}
              >
                <RefreshCw size={14} />
                {t('dashboard.filters.reset', 'Reset Filters')}
              </button>
            </div>
          )}

          {/* Live indicator */}
          {loading && (
            <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2, marginLeft: 4 }} />
          )}
        </div>
      </div>
      )}

      {/* ── Revenue Stats Grid ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: .5, color: 'var(--color-text-muted)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          <DollarSign size={14} style={{ color: 'var(--br-primary)' }} /> {t('dashboard.revenue_metrics', 'Revenue Metrics')}
        </div>
        {hasPermission('manage_revenue') ? (
          <div className="stat-grid">
            <div className="stat-card primary">
              <div className="stat-icon"><DollarSign size={20} /></div>
              <div className="stat-label">{t('dashboard.stats.total_gross', 'Total Gross Revenue')}</div>
              <div className="stat-value money"><CompactAmount value={stats?.totalGross} /></div>
              <div className="stat-change up">▲ {t('dashboard.stats.selected_period', 'Selected period')}</div>
            </div>
            <div className="stat-card accent">
              <div className="stat-icon"><Users size={20} /></div>
              <div className="stat-label">{t('dashboard.stats.total_pub_earnings', 'Total Pub. Earnings')}</div>
              <div className="stat-value money"><CompactAmount value={stats?.totalEarnings} /></div>
              <div className="stat-change up">▲ {t('dashboard.stats.ratio_split', 'Ratio split')}</div>
            </div>
            <div className="stat-card accent">
              <div className="stat-icon"><CheckCircle2 size={20} /></div>
              <div className="stat-label">{t('dashboard.stats.approved_earnings', 'Approved Earnings')}</div>
              <div className="stat-value money"><CompactAmount value={stats?.totalApproved} /></div>
              <div className="stat-change up">✓ {t('dashboard.stats.approved_label', 'Approved')}</div>
            </div>
            <div className="stat-card warning">
              <div className="stat-icon"><Clock size={20} /></div>
              <div className="stat-label">{t('dashboard.stats.pending_earnings', 'Pending Earnings')}</div>
              <div className="stat-value money"><CompactAmount value={stats?.totalPending} /></div>
              <div className="stat-change" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={12} />
                <span>{t('dashboard.stats.holding_period', 'Holding period')}</span>
              </div>
            </div>
            <div className="stat-card accent" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.02))', border: '1px solid rgba(16,185,129,0.3)' }}>
              <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.15)' }}><CreditCard size={20} /></div>
              <div className="stat-label">{t('dashboard.stats.ready_payout', 'Ready for Payout')}</div>
              <div className="stat-value money" style={{ color: 'var(--color-accent)' }}><CompactAmount value={stats?.readyForPayout} /></div>
              <div className="stat-change text-muted">{t('dashboard.stats.filtered_balance', 'Filtered wallet balance')}</div>
            </div>
          </div>
        ) : (
          <div className="card" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 20px',
            textAlign: 'center',
            background: 'var(--color-surface-2)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            gap: 12
          }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'rgba(99,102,241,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--br-primary)'
            }}>
              <Lock size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--color-text)' }}>{t('dashboard.restricted.revenue_title', 'Revenue Metrics Restricted')}</div>
              <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4 }}>{t('dashboard.restricted.revenue_desc', 'You do not have the required permissions to view financial revenue data.')}</div>
            </div>
          </div>
        )}
      </div>

      {/* ── Performance Stats Grid ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: .5, color: 'var(--color-text-muted)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          <BarChart2 size={14} style={{ color: 'var(--br-primary)' }} /> {t('dashboard.performance_metrics', 'Performance Metrics')}
        </div>
        {hasPermission('manage_revenue') ? (
          <div className="stat-grid">
            <div className="stat-card info">
              <div className="stat-icon"><Eye size={20} /></div>
              <div className="stat-label">{t('dashboard.stats.total_impressions', 'Total Impressions')}</div>
              <div className="stat-value">
                {stats?.totalImpressions !== undefined ? <CompactAmount value={stats.totalImpressions} prefix="" decimals={0} /> : '—'}
              </div>
              <div className="stat-change up">▲ {t('dashboard.stats.all_ad_units', 'All ad units')}</div>
            </div>
            <div className="stat-card info">
              <div className="stat-icon"><MousePointer size={20} /></div>
              <div className="stat-label">{t('dashboard.stats.total_clicks', 'Total Clicks')}</div>
              <div className="stat-value">
                {stats?.totalClicks !== undefined ? <CompactAmount value={stats.totalClicks} prefix="" decimals={0} /> : '—'}
              </div>
              <div className="stat-change up">▲ {t('dashboard.stats.all_ad_units', 'All ad units')}</div>
            </div>
            <div className="stat-card info">
              <div className="stat-icon"><Ban size={20} /></div>
              <div className="stat-label">{t('dashboard.stats.unfilled_impressions', 'Unfilled Impressions')}</div>
              <div className="stat-value">
                {stats?.totalUnfilled !== undefined ? <CompactAmount value={stats.totalUnfilled} prefix="" decimals={0} /> : '—'}
              </div>
              <div className="stat-change text-muted">{t('dashboard.stats.unserved_inventory', 'Unserved inventory')}</div>
            </div>
            <div className="stat-card primary">
              <div className="stat-icon"><TrendingUp size={20} /></div>
              <div className="stat-label">{t('dashboard.stats.avg_gross_cpm', 'Avg. Gross CPM')}</div>
              <div className="stat-value money">${stats?.avgCPM ?? '—'}</div>
              <div className="stat-change">{t('dashboard.stats.per_1k_impr', 'Per 1000 impressions')}</div>
            </div>
            <div className="stat-card primary">
              <div className="stat-icon"><Target size={20} /></div>
              <div className="stat-label">{t('dashboard.stats.avg_ctr', 'Avg. CTR')}</div>
              <div className="stat-value">{stats?.avgCTR ?? '—'}%</div>
              <div className="stat-change">{t('dashboard.stats.ctr_desc', 'Click-through rate')}</div>
            </div>
            <div className="stat-card primary">
              <div className="stat-icon"><Eye size={20} /></div>
              <div className="stat-label">{t('dashboard.stats.viewability_rate', 'Viewability Rate')}</div>
              <div className="stat-value">
                {stats?.viewabilityRate !== null && stats?.viewabilityRate !== undefined
                  ? `${parseFloat(stats.viewabilityRate).toFixed(1)}%`
                  : 'N/A'}
              </div>
              <div className="stat-change text-muted">
                {stats?.viewabilityRate !== null && stats?.viewabilityRate !== undefined ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <CompactAmount value={stats.totalAvViewable || 0} prefix="" decimals={0} showInfo={false} />
                    <span>/</span>
                    <CompactAmount value={stats.totalAvEligible || 0} prefix="" decimals={0} showInfo={false} />
                    <span>{t('dashboard.stats.measurable', 'measurable')}</span>
                  </span>
                ) : (
                  t('dashboard.stats.no_av_data', 'No Active View data')
                )}
              </div>
            </div>
            <div className="stat-card accent">
              <div className="stat-icon"><Percent size={20} /></div>
              <div className="stat-label">{t('dashboard.stats.avg_revenue_ratio', 'Avg. Revenue Ratio')}</div>
              <div className="stat-value">{stats?.avgRatio ?? '—'}%</div>
              <div className="stat-change">{t('dashboard.stats.publisher_share', 'Publisher share')}</div>
            </div>
          </div>
        ) : (
          <div className="card" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 20px',
            textAlign: 'center',
            background: 'var(--color-surface-2)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            gap: 12
          }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'rgba(99,102,241,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--br-primary)'
            }}>
              <Lock size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--color-text)' }}>{t('dashboard.restricted.performance_title', 'Performance Metrics Restricted')}</div>
              <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4 }}>{t('dashboard.restricted.performance_desc', 'You do not have the required permissions to view traffic and ad performance statistics.')}</div>
            </div>
          </div>
        )}
      </div>

      {/* ── Platform Stats Grid ── */}
      {(hasPermission('manage_payouts') || hasPermission('manage_publishers') || hasPermission('manage_closings') || hasPermission('manage_revenue')) && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: .5, color: 'var(--color-text-muted)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Scale size={14} style={{ color: 'var(--br-primary)' }} /> {t('dashboard.platform_overview', 'Platform Overview')}
          </div>
          <div className="stat-grid">
            {hasPermission('manage_payouts') && (
              <div className="stat-card warning">
                <div className="stat-icon"><CreditCard size={20} /></div>
                <div className="stat-label">{t('dashboard.stats.pending_payouts', 'Pending Payouts')}</div>
                <div className="stat-value money" style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <CompactAmount value={stats?.pendingPayoutsTotal} />
                  {stats?.pendingPayouts > 0 && (
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#f59e0b' }}>
                      {t('dashboard.stats.payout_reqs', '({count} req.)', { count: stats.pendingPayouts })}
                    </span>
                  )}
                </div>
                <div className="stat-change" style={{ color: stats?.pendingPayouts > 0 ? 'var(--color-warning)' : 'var(--color-accent)' }}>
                  {stats?.pendingPayouts > 0 ? t('dashboard.stats.needs_attention', '⚠ Needs attention') : t('dashboard.stats.all_clear', '✓ All clear')}
                </div>
              </div>
            )}
            {hasPermission('manage_publishers') && (
              <div className="stat-card accent">
                <div className="stat-icon"><Users size={20} /></div>
                <div className="stat-label">{t('dashboard.stats.active_publishers', 'Active Publishers')}</div>
                <div className="stat-value" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {stats?.activePublishers ?? '—'}
                  {stats?.pendingPublishers > 0 && (
                    <span style={{
                      fontSize: 12, color: '#f59e0b',
                      background: 'rgba(245,158,11,.1)', border: '1px solid rgba(245,158,11,.3)',
                      padding: '2px 8px', borderRadius: 12, fontWeight: 600,
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                    }}>
                      <Clock size={12} /> {t('dashboard.stats.pending_count', '{count} pending', { count: stats.pendingPublishers })}
                    </span>
                  )}
                </div>
                <div className="stat-change">{t('dashboard.stats.total_publishers_count', '{count} total publishers', { count: stats?.publishers ?? 0 })}</div>
              </div>
            )}
            {hasPermission('manage_closings') && (
              <div className="stat-card primary">
                <div className="stat-icon"><Lock size={20} /></div>
                <div className="stat-label">{t('dashboard.stats.closed_periods', 'Closed Periods')}</div>
                <div className="stat-value">{stats?.closedPeriods ?? '—'}</div>
                <div className="stat-change">{t('dashboard.stats.historical_periods', 'Historical periods')}</div>
              </div>
            )}

            {/* Daily average with period comparison */}
            {hasPermission('manage_revenue') && (
              <div className="stat-card" style={{
                background: 'linear-gradient(135deg, rgba(99,102,241,.12) 0%, rgba(16,185,129,.08) 100%)',
                border: '1px solid rgba(99,102,241,.25)',
              }}>
                <div className="stat-icon"><Calendar size={20} /></div>
                <div className="stat-label">{t('dashboard.stats.daily_avg_earnings', 'Daily Avg. Pub. Earnings')}</div>
                <div className="stat-value money"><CompactAmount value={stats?.avgDailyEarnings} /></div>
                {stats?.periodChangePct !== null && stats?.periodChangePct !== undefined ? (
                  <div className="stat-change" style={{
                    color: parseFloat(stats.periodChangePct) >= 0 ? '#10b981' : '#ef4444',
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    {parseFloat(stats.periodChangePct) >= 0 ? '▲' : '▼'}
                    {t('dashboard.stats.vs_prev_days', '{pct}% vs prev {days}d', { pct: Math.abs(parseFloat(stats.periodChangePct)).toFixed(1), days: stats.spanDays })}
                  </div>
                ) : (
                  <div className="stat-change">{t('dashboard.stats.no_prior_data', 'No prior period data')}</div>
                )}
              </div>
            )}

            {/* Best day */}
            {hasPermission('manage_revenue') && (
              <div className="stat-card" style={{
                background: 'linear-gradient(135deg, rgba(245,158,11,.12) 0%, rgba(251,191,36,.06) 100%)',
                border: '1px solid rgba(245,158,11,.25)',
              }}>
                <div className="stat-icon"><Award size={20} /></div>
                <div className="stat-label">{t('dashboard.stats.best_day_title', 'Best Day (Pub. Earnings)')}</div>
                {stats?.bestDay ? (
                  <>
                    <div className="stat-value money" style={{ color: '#f59e0b' }}><CompactAmount value={stats.bestDay.earnings} /></div>
                    <div className="stat-change" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>{stats.bestDay.date}</span>
                      <span style={{
                        fontSize: 10, padding: '1px 6px', borderRadius: 8,
                        background: 'rgba(245,158,11,.15)', color: '#f59e0b', fontWeight: 600,
                      }}>{t('dashboard.stats.gross_amount', 'Gross ${amount}', { amount: stats.bestDay.gross })}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="stat-value">—</div>
                    <div className="stat-change">{t('dashboard.stats.no_data_range', 'No data in range')}</div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Revenue Chart ── */}
      {hasPermission('manage_revenue') && (
        <div className="card">
          <div className="card-header" style={{ flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <TrendingUp size={16} style={{ color: 'var(--br-primary)' }} /> {t('dashboard.chart.revenue_trend', 'Revenue Trend')}
              </div>
              <div className="card-subtitle">
                {filters.date_from} → {filters.date_to}
                {filters.publisher_id && ` · ${publishers.find(p => p.id === filters.publisher_id)?.name}`}
                {filters.website_id   && ` · ${websites.find(w => w.id === filters.website_id)?.domain}`}
                {filters.ad_unit_id   && ` · ${adUnits.find(a => a.id === filters.ad_unit_id)?.display_name}`}
              </div>
            </div>
            {/* Series toggles */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              {[
                { key: 'gross',    label: t('dashboard.chart.gross_revenue', 'Gross Revenue'), color: '#6366f1' },
                { key: 'earnings', label: t('dashboard.chart.pub_earnings', 'Pub. Earnings'),  color: '#10b981' },
                { key: 'approved', label: t('dashboard.chart.approved', 'Approved'),    color: '#22d3ee' },
                { key: 'pending',  label: t('dashboard.chart.pending', 'Pending'),     color: '#f59e0b' },
              ].map(s => (
                <button
                  key={s.key}
                  onClick={() => toggleSeries(s.key)}
                  title={visibleSeries[s.key] ? t('dashboard.chart.hide_series', 'Hide {label}', { label: s.label }) : t('dashboard.chart.show_series', 'Show {label}', { label: s.label })}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '4px 12px', borderRadius: 20, cursor: 'pointer',
                    fontSize: 12, fontWeight: 600, transition: 'all .15s',
                    border: `1.5px solid ${s.color}`,
                    background: visibleSeries[s.key] ? s.color + '22' : 'transparent',
                    color: visibleSeries[s.key] ? s.color : '#4a5568',
                    opacity: visibleSeries[s.key] ? 1 : 0.5,
                  }}
                >
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: visibleSeries[s.key] ? s.color : 'transparent',
                    border: `1.5px solid ${s.color}`,
                    flexShrink: 0,
                  }} />
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {revenueChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={revenueChart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="grossGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.30} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="earningsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10b981" stopOpacity={0.30} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="approvedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#22d3ee" stopOpacity={0.30} />
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="pendingGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.30} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a4a" />
                <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }}
                  tickFormatter={d => d.slice(5)} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }}
                  tickFormatter={v => `$${v}`} />
                <Tooltip
                  contentStyle={{ background: '#1a1a2e', border: '1px solid #2a2a4a', borderRadius: 8 }}
                  labelStyle={{ color: '#e2e8f0', fontWeight: 600, marginBottom: 4 }}
                  formatter={(v, n) => {
                    const labels = {
                      gross:    t('dashboard.chart.gross_revenue', 'Gross Revenue'),
                      earnings: t('dashboard.chart.pub_earnings', 'Pub. Earnings'),
                      approved: t('dashboard.chart.approved', 'Approved'),
                      pending:  t('dashboard.chart.pending', 'Pending'),
                    }
                    return [`$${v}`, labels[n] || n]
                  }}
                />
                {visibleSeries.gross    && <Area type="monotone" dataKey="gross"    stroke="#6366f1" fill="url(#grossGrad)"    strokeWidth={2} dot={false} />}
                {visibleSeries.earnings && <Area type="monotone" dataKey="earnings" stroke="#10b981" fill="url(#earningsGrad)" strokeWidth={2} dot={false} />}
                {visibleSeries.approved && <Area type="monotone" dataKey="approved" stroke="#22d3ee" fill="url(#approvedGrad)" strokeWidth={2} dot={false} strokeDasharray="5 3" />}
                {visibleSeries.pending  && <Area type="monotone" dataKey="pending"  stroke="#f59e0b" fill="url(#pendingGrad)"  strokeWidth={2} dot={false} strokeDasharray="3 3" />}
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon"><BarChart2 size={40} style={{ color: 'var(--br-text-2)' }} /></div>
              <div className="empty-state-text">{t('dashboard.chart.no_data', 'No revenue data for this period')}</div>
              <div className="empty-state-sub">{t('dashboard.chart.no_data_desc', 'Adjust your filters or run a GAM sync to populate records')}</div>
            </div>
          )}
        </div>
      )}

      {/* ── Daily Performance Table ── */}
      {hasPermission('manage_revenue') && revenueChart.length > 0 && (
        <DailyTable rows={revenueChart} bestDay={stats?.bestDay} />
      )}

      {/* ── Top 10 Publishers ── */}
      {hasPermission('manage_revenue') && publisherStats.length > 0 && (
        <Top10Publishers rows={publisherStats} />
      )}
    </div>
  )
}

// ── Daily Performance Table ────────────────────────────────────────────────
const TABLE_COLS = [
  { key: 'date',     label: 'Date',          fmt: v => v },
  { key: 'impressions', label: 'Impressions', fmt: v => parseInt(v).toLocaleString() },
  { key: 'gross',    label: 'Gross Revenue',  fmt: v => `$${parseFloat(v).toFixed(2)}` },
  { key: 'earnings', label: 'Pub. Earnings',  fmt: v => `$${parseFloat(v).toFixed(2)}` },
  { key: 'approved', label: 'Approved',    fmt: v => `$${parseFloat(v).toFixed(2)}` },
  { key: 'pending',  label: 'Pending',     fmt: v => `$${parseFloat(v).toFixed(2)}` },
]

function DailyTable({ rows, bestDay }) {
  const { t } = useI18n()
  const [sortKey, setSortKey]     = useState('date')
  const [sortDir, setSortDir]     = useState('desc')

  function handleSort(key) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const sorted = [...rows].sort((a, b) => {
    const va = sortKey === 'date' ? a[sortKey] : parseFloat(a[sortKey]) || parseInt(a[sortKey]) || 0
    const vb = sortKey === 'date' ? b[sortKey] : parseFloat(b[sortKey]) || parseInt(b[sortKey]) || 0
    if (va < vb) return sortDir === 'asc' ? -1 : 1
    if (va > vb) return sortDir === 'asc' ? 1 : -1
    return 0
  })

  // Totals
  const totals = rows.reduce((acc, r) => ({
    impressions: acc.impressions + (parseInt(r.impressions) || 0),
    gross:       acc.gross       + (parseFloat(r.gross)    || 0),
    earnings:    acc.earnings    + (parseFloat(r.earnings) || 0),
    approved:    acc.approved    + (parseFloat(r.approved) || 0),
    pending:     acc.pending     + (parseFloat(r.pending)  || 0),
  }), { impressions: 0, gross: 0, earnings: 0, approved: 0, pending: 0 })

  const arrow = key => sortKey === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''

  return (
    <div className="card" style={{ padding: 0, marginTop: 24 }}>
      <div className="card-header" style={{ padding: '16px 20px' }}>
        <div>
          <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Calendar size={16} style={{ color: 'var(--br-primary)' }} /> {t('dashboard.table.daily_performance', 'Daily Performance')}
          </div>
          <div className="card-subtitle">{t('dashboard.table.subtitle', '{count} days · click column headers to sort', { count: rows.length })}</div>
        </div>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              {TABLE_COLS.map(col => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
                >
                  {t(`dashboard.table.${col.key}`, col.label)}{arrow(col.key)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map(row => {
              const isBest = bestDay && row.date === bestDay.date
              return (
                <tr key={row.date} style={isBest ? {
                  background: 'rgba(245,158,11,.07)',
                  outline: '1px solid rgba(245,158,11,.2)',
                  outlineOffset: '-1px',
                } : {}}>
                  <td className="text-sm" style={{ fontWeight: 600 }}>
                    {row.date}
                    {isBest && (
                      <span style={{
                        marginLeft: 6, fontSize: 10, padding: '1px 5px', borderRadius: 6,
                        background: 'rgba(245,158,11,.15)', color: '#f59e0b', fontWeight: 700,
                       }}>{t('dashboard.table.best', 'Best')}</span>
                    )}
                  </td>
                  <td className="money">
                    <CompactAmount value={row.impressions} prefix="" decimals={0} />
                  </td>
                  <td className="money" style={{ color: '#6366f1' }}><CompactAmount value={row.gross} /></td>
                  <td className="money positive" style={{ fontWeight: 700 }}><CompactAmount value={row.earnings} /></td>
                  <td className="money" style={{ color: '#22d3ee' }}><CompactAmount value={row.approved} /></td>
                  <td className="money" style={{ color: '#f59e0b' }}><CompactAmount value={row.pending} /></td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr style={{ background: 'rgba(99,102,241,.07)', fontWeight: 700, borderTop: '2px solid var(--color-border)' }}>
              <td style={{ padding: '10px 16px', fontSize: 12 }}>{t('dashboard.table.totals_days', 'Totals ({days}d)', { days: rows.length })}</td>
              <td className="money">
                <CompactAmount value={totals.impressions} prefix="" decimals={0} />
              </td>
              <td className="money" style={{ color: '#6366f1' }}><CompactAmount value={totals.gross} /></td>
              <td className="money positive"><CompactAmount value={totals.earnings} /></td>
              <td className="money" style={{ color: '#22d3ee' }}><CompactAmount value={totals.approved} /></td>
              <td className="money" style={{ color: '#f59e0b' }}><CompactAmount value={totals.pending} /></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

// ── Top 10 Publishers ─────────────────────────────────────────────────────
function Top10Publishers({ rows }) {
  const { t } = useI18n()
  const [sortKey, setSortKey] = useState('earnings')
  const [sortDir, setSortDir] = useState('desc')

  function handleSort(key) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const sorted = [...rows].sort((a, b) => {
    const va = typeof a[sortKey] === 'string' ? a[sortKey].toLowerCase() : (a[sortKey] || 0)
    const vb = typeof b[sortKey] === 'string' ? b[sortKey].toLowerCase() : (b[sortKey] || 0)
    if (va < vb) return sortDir === 'asc' ? -1 : 1
    if (va > vb) return sortDir === 'asc' ? 1 : -1
    return 0
  })

  const arrow = key => sortKey === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''
  const maxEarnings = rows[0]?.earnings || 1  // rows already sorted by earnings desc

  const rankBadge = i => {
    if (i === 0) return <span style={{ background: 'gold', color: '#000', borderRadius: '50%', width: 22, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>1</span>
    if (i === 1) return <span style={{ background: 'silver', color: '#000', borderRadius: '50%', width: 22, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>2</span>
    if (i === 2) return <span style={{ background: '#cd7f32', color: '#fff', borderRadius: '50%', width: 22, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>3</span>
    return <span style={{ color: 'var(--br-text-2)', fontSize: 12 }}>#{i + 1}</span>
  }

  return (
    <div className="card" style={{ padding: 0, marginTop: 24 }}>
      <div className="card-header" style={{ padding: '16px 20px' }}>
        <div>
          <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Award size={16} style={{ color: 'var(--br-primary)' }} /> {t('dashboard.table.top_publishers', 'Top {count} Publishers', { count: rows.length })}
          </div>
          <div className="card-subtitle">{t('dashboard.table.top_publishers_desc', 'Ranked by publisher earnings for selected period')}</div>
        </div>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 48 }}>{t('dashboard.table.rank', 'Rank')}</th>
              <th onClick={() => handleSort('name')} style={{ cursor: 'pointer', userSelect: 'none' }}>{t('dashboard.table.publisher', 'Publisher')}{arrow('name')}</th>
              <th onClick={() => handleSort('earnings')} style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>{t('dashboard.table.pub_earnings', 'Pub. Earnings')}{arrow('earnings')}</th>
              <th style={{ minWidth: 140 }}>{t('dashboard.table.approved_pct', 'Approved %')}</th>
              <th onClick={() => handleSort('approved')} style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>{t('dashboard.table.approved', 'Approved')}{arrow('approved')}</th>
              <th onClick={() => handleSort('pending')} style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>{t('dashboard.table.pending', 'Pending')}{arrow('pending')}</th>
              <th onClick={() => handleSort('gross')} style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>{t('dashboard.table.gross_revenue', 'Gross Rev.')}{arrow('gross')}</th>
              <th onClick={() => handleSort('impressions')} style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>{t('dashboard.table.impressions', 'Impressions')}{arrow('impressions')}</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((pub, i) => {
              const originalRank = rows.findIndex(r => r.id === pub.id)
              const barPct = maxEarnings > 0 ? (pub.earnings / maxEarnings) * 100 : 0
              const approvedPct = pub.earnings > 0 ? (pub.approved / pub.earnings) * 100 : 0
              return (
                <tr key={pub.id || pub.name}>
                  <td style={{ textAlign: 'center', padding: '10px 12px' }}>
                    {rankBadge(originalRank)}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{pub.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{pub.email}</div>
                    {/* Relative earnings bar */}
                    <div style={{ marginTop: 5, height: 3, borderRadius: 3, background: 'var(--color-border)', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 3, width: `${barPct}%`,
                        background: 'linear-gradient(90deg, #6366f1, #10b981)',
                        transition: 'width .4s ease',
                      }} />
                    </div>
                  </td>
                  <td className="money positive" style={{ fontWeight: 700, fontSize: 14 }}>
                    <CompactAmount value={pub.earnings} />
                  </td>
                  <td style={{ minWidth: 140 }}>
                    {/* Approved vs Pending stacked mini bar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ flex: 1, height: 8, borderRadius: 4, background: 'var(--color-border)', overflow: 'hidden', display: 'flex' }}>
                        <div style={{ width: `${approvedPct}%`, background: '#22d3ee', transition: 'width .4s' }} />
                        <div style={{ flex: 1, background: '#f59e0b33' }} />
                      </div>
                      <span style={{ fontSize: 10, color: '#22d3ee', whiteSpace: 'nowrap' }}>{approvedPct.toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="money" style={{ color: '#22d3ee' }}><CompactAmount value={pub.approved} /></td>
                  <td className="money" style={{ color: '#f59e0b' }}><CompactAmount value={pub.pending} /></td>
                  <td className="money" style={{ color: '#6366f1' }}><CompactAmount value={pub.gross} /></td>
                  <td className="money">
                    <CompactAmount value={pub.impressions} prefix="" decimals={0} />
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr style={{ background: 'rgba(99,102,241,.07)', fontWeight: 700, borderTop: '2px solid var(--color-border)' }}>
              <td />
              <td style={{ padding: '10px 16px', fontSize: 12 }}>{t('dashboard.table.totals', 'Totals')}</td>
              <td className="money positive">
                <CompactAmount value={rows.reduce((s, r) => s + r.earnings, 0)} />
              </td>
              <td />
              <td className="money" style={{ color: '#22d3ee' }}>
                <CompactAmount value={rows.reduce((s, r) => s + r.approved, 0)} />
              </td>
              <td className="money" style={{ color: '#f59e0b' }}>
                <CompactAmount value={rows.reduce((s, r) => s + r.pending, 0)} />
              </td>
              <td className="money" style={{ color: '#6366f1' }}>
                <CompactAmount value={rows.reduce((s, r) => s + r.gross, 0)} />
              </td>
              <td className="money">
                <CompactAmount value={rows.reduce((s, r) => s + r.impressions, 0)} prefix="" decimals={0} />
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
