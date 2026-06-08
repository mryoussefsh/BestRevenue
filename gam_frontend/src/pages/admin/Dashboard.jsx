import { useState, useEffect, useRef } from 'react'
import { adminApi } from '../../api/endpoints'
import toast from 'react-hot-toast'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

// ── Date preset helpers ─────────────────────────────────────────────────────
// Use local-timezone formatting to avoid UTC shift (e.g. UTC+3 offset causing day-1 errors)
function fmtLocal(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function getPresetRange(preset) {
  const now = new Date()
  const today = fmtLocal(now)
  const daysAgo = n => fmtLocal(new Date(now.getFullYear(), now.getMonth(), now.getDate() - n))
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
      const s = new Date(now.getFullYear(), now.getMonth(), 1)
      return { date_from: fmtLocal(s), date_to: today }
    }
    case 'last_month': {
      const s = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const e = new Date(now.getFullYear(), now.getMonth(), 0)
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
            <input autoFocus className="form-input" placeholder="Search…" value={q}
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
                No results
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
  const [stats, setStats]           = useState(null)
  const [revenueChart, setRevenueChart] = useState([])
  const [publishers, setPublishers] = useState([])
  const [websites, setWebsites]     = useState([])
  const [syncing, setSyncing]       = useState(false)
  const [loading, setLoading]       = useState(true)
  const [visibleSeries, setVisibleSeries] = useState({ gross: true, earnings: true, approved: true, pending: true })
  const [publisherStats, setPublisherStats] = useState([])

  function toggleSeries(key) {
    setVisibleSeries(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const [preset, setPreset] = useState('30d')
  const [filters, setFilters] = useState({
    ...getPresetRange('30d'),
    publisher_id: '',
    website_id: '',
    status: '',
  })

  // Load publishers & websites once for dropdowns
  useEffect(() => {
    Promise.all([adminApi.getPublishers(), adminApi.getWebsites()])
      .then(([pRes, wRes]) => {
        setPublishers(pRes.data?.data || [])
        setWebsites(wRes.data?.data || [])
      })
  }, [])

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

      const [pubRes, closingsRes, payoutsRes, revenueRes, prevRevenueRes] = await Promise.all([
        adminApi.getPublishers(pubParams),
        adminApi.getPeriodClosings(),
        adminApi.getPayouts({ status: 'pending' }),
        adminApi.getRevenue(params),
        adminApi.getRevenue(prevParams),
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
      const totalApproved   = revenue
        .filter(r => r.period_closing_id !== null || r.is_approved)
        .reduce((s, r) => s + parseFloat(r.publisher_earnings || 0), 0)
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
        totalImpressions: totalImpr.toLocaleString(),
        totalClicks:   totalClicks.toLocaleString(),
        totalUnfilled: totalUnfilled.toLocaleString(),
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
      toast.error('Failed to load dashboard data: ' + (e.response?.data?.message || e.message))
    } finally {
      setLoading(false)
    }
  }

  async function handleSync() {
    setSyncing(true)
    try {
      const res = await adminApi.runSync()
      toast.success(res.data?.message || 'GAM sync completed successfully!')
      loadData()
    } catch (e) {
      toast.error(e.response?.data?.message || 'GAM sync failed.')
    } finally {
      setSyncing(false)
    }
  }

  function applyPreset(key) {
    setPreset(key)
    if (key !== 'custom') {
      setFilters(f => ({ ...f, ...getPresetRange(key) }))
    }
  }

  function resetFilters() {
    setPreset('30d')
    setFilters({ ...getPresetRange('30d'), publisher_id: '', website_id: '', status: '' })
  }

  const hasFilters = filters.publisher_id || filters.website_id || filters.status || preset !== '30d'

  // Filter website dropdown to selected publisher
  const websiteOptions = websites
    .filter(w => !filters.publisher_id || w.publisher_id === filters.publisher_id)
    .map(w => ({ value: w.id, label: w.domain, sub: w.gam_network_code || '' }))

  const publisherOptions = publishers.map(p => ({ value: p.id, label: p.name, sub: p.email }))

  return (
    <div>
      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">📊 Dashboard</h1>
          <p className="page-subtitle" style={{ color: 'var(--color-text-muted)' }}>
            {loading ? 'Loading…' : `${stats?.recordCount?.toLocaleString() || 0} revenue records · ${filters.date_from} → ${filters.date_to}`}
          </p>
        </div>
        <button
          className={`btn btn-primary ${syncing ? 'btn-loading' : ''}`}
          onClick={handleSync} disabled={syncing} id="run-gam-sync-btn"
        >
          {syncing
            ? <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Syncing…</>
            : '🔄 Run GAM Sync'}
        </button>
      </div>

      {/* ── Filter Panel ── */}
      <div className="card" style={{
        padding: '16px 20px', marginBottom: 24,
        background: 'var(--color-surface-2)',
        border: '1px solid var(--color-border)',
      }}>
        {/* Date Presets Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: .5, color: 'var(--color-text-muted)', marginRight: 4 }}>
            📅 Period
          </span>
          {DATE_PRESETS.map(p => (
            <button key={p.key} onClick={() => applyPreset(p.key)}
              style={{
                padding: '4px 12px', fontSize: 12, borderRadius: 20, cursor: 'pointer',
                fontWeight: preset === p.key ? 700 : 400,
                border: `1px solid ${preset === p.key ? 'var(--color-primary)' : 'var(--color-border)'}`,
                background: preset === p.key ? 'var(--color-primary)' : 'transparent',
                color: preset === p.key ? '#fff' : 'var(--color-text-muted)',
                transition: 'all .15s',
              }}>
              {p.label}
            </button>
          ))}
        </div>

        {/* Filters Row */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Custom date range — always visible */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>From</span>
            <input type="date" className="form-input" value={filters.date_from}
              style={{ height: 38, fontSize: 13, padding: '0 10px' }}
              onChange={e => { setPreset('custom'); setFilters(f => ({ ...f, date_from: e.target.value })) }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>To</span>
            <input type="date" className="form-input" value={filters.date_to}
              style={{ height: 38, fontSize: 13, padding: '0 10px' }}
              onChange={e => { setPreset('custom'); setFilters(f => ({ ...f, date_to: e.target.value })) }} />
          </div>

          {/* Divider */}
          <div style={{ width: 1, height: 28, background: 'var(--color-border)', margin: '0 4px' }} />

          {/* Publisher */}
          <SearchDropdown
            value={filters.publisher_id}
            onChange={val => setFilters(f => ({ ...f, publisher_id: val, website_id: '' }))}
            options={publisherOptions}
            allLabel="All Publishers"
            placeholder="All Publishers"
          />

          {/* Website */}
          <SearchDropdown
            value={filters.website_id}
            onChange={val => setFilters(f => ({ ...f, website_id: val }))}
            options={websiteOptions}
            allLabel="All Websites"
            placeholder="All Websites"
          />

          {/* Revenue Status */}
          <select className="form-select" value={filters.status}
            onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
            style={{ height: 38, fontSize: 13, minWidth: 150 }}>
            <option value="">All Statuses</option>
            <option value="pending">⏳ Pending</option>
            <option value="approved">🟢 Approved</option>
            <option value="closed">🔒 Closed</option>
          </select>

          {/* Reset */}
          {hasFilters && (
            <button className="btn btn-secondary" onClick={resetFilters}
              style={{ height: 38, padding: '0 14px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              ✕ Reset
            </button>
          )}

          {/* Live indicator */}
          {loading && (
            <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2, marginLeft: 4 }} />
          )}
        </div>
      </div>

      {/* ── Revenue Stats Grid ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: .5, color: 'var(--color-text-muted)', marginBottom: 10 }}>
          💰 Revenue Metrics
        </div>
        <div className="stat-grid">
          <div className="stat-card primary">
            <div className="stat-icon">💰</div>
            <div className="stat-label">Total Gross Revenue</div>
            <div className="stat-value money">${stats?.totalGross ?? '—'}</div>
            <div className="stat-change up">▲ Selected period</div>
          </div>
          <div className="stat-card accent">
            <div className="stat-icon">🤝</div>
            <div className="stat-label">Total Pub. Earnings</div>
            <div className="stat-value money">${stats?.totalEarnings ?? '—'}</div>
            <div className="stat-change up">▲ Ratio split</div>
          </div>
          <div className="stat-card accent">
            <div className="stat-icon">🟢</div>
            <div className="stat-label">Approved Earnings</div>
            <div className="stat-value money">${stats?.totalApproved ?? '—'}</div>
            <div className="stat-change up">✓ Approved</div>
          </div>
          <div className="stat-card warning">
            <div className="stat-icon">⏳</div>
            <div className="stat-label">Pending Earnings</div>
            <div className="stat-value money">${stats?.totalPending ?? '—'}</div>
            <div className="stat-change">⏳ Holding period</div>
          </div>
          <div className="stat-card accent" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.02))', border: '1px solid rgba(16,185,129,0.3)' }}>
            <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.15)' }}>💵</div>
            <div className="stat-label">Ready for Payout</div>
            <div className="stat-value money" style={{ color: 'var(--color-accent)' }}>${stats?.readyForPayout ?? '—'}</div>
            <div className="stat-change text-muted">Filtered wallet balance</div>
          </div>
        </div>
      </div>

      {/* ── Performance Stats Grid ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: .5, color: 'var(--color-text-muted)', marginBottom: 10 }}>
          📈 Performance Metrics
        </div>
        <div className="stat-grid">
          <div className="stat-card info">
            <div className="stat-icon">👀</div>
            <div className="stat-label">Total Impressions</div>
            <div className="stat-value">{stats?.totalImpressions ?? '—'}</div>
            <div className="stat-change up">▲ All ad units</div>
          </div>
          <div className="stat-card info">
            <div className="stat-icon">🖱️</div>
            <div className="stat-label">Total Clicks</div>
            <div className="stat-value">{stats?.totalClicks ?? '—'}</div>
            <div className="stat-change up">▲ All ad units</div>
          </div>
          <div className="stat-card info">
            <div className="stat-icon">💨</div>
            <div className="stat-label">Unfilled Impressions</div>
            <div className="stat-value">{stats?.totalUnfilled ?? '—'}</div>
            <div className="stat-change text-muted">Unserved inventory</div>
          </div>
          <div className="stat-card primary">
            <div className="stat-icon">📊</div>
            <div className="stat-label">Avg. Gross CPM</div>
            <div className="stat-value money">${stats?.avgCPM ?? '—'}</div>
            <div className="stat-change">Per 1000 impressions</div>
          </div>
          <div className="stat-card primary">
            <div className="stat-icon">🎯</div>
            <div className="stat-label">Avg. CTR</div>
            <div className="stat-value">{stats?.avgCTR ?? '—'}%</div>
            <div className="stat-change">Click-through rate</div>
          </div>
          <div className="stat-card primary">
            <div className="stat-icon">👁️</div>
            <div className="stat-label">Viewability Rate</div>
            <div className="stat-value">
              {stats?.viewabilityRate !== null && stats?.viewabilityRate !== undefined
                ? `${parseFloat(stats.viewabilityRate).toFixed(1)}%`
                : 'N/A'}
            </div>
            <div className="stat-change text-muted">
              {stats?.viewabilityRate !== null && stats?.viewabilityRate !== undefined
                ? `${(stats.totalAvViewable || 0).toLocaleString()} / ${(stats.totalAvEligible || 0).toLocaleString()} eligible`
                : 'No Active View data'}
            </div>
          </div>
          <div className="stat-card accent">
            <div className="stat-icon">⚖️</div>
            <div className="stat-label">Avg. Revenue Ratio</div>
            <div className="stat-value">{stats?.avgRatio ?? '—'}%</div>
            <div className="stat-change">Publisher share</div>
          </div>
        </div>
      </div>

      {/* ── Platform Stats Grid ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: .5, color: 'var(--color-text-muted)', marginBottom: 10 }}>
          🏢 Platform Overview
        </div>
        <div className="stat-grid">
          <div className="stat-card warning">
            <div className="stat-icon">💳</div>
            <div className="stat-label">Pending Payouts</div>
            <div className="stat-value money" style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              ${stats?.pendingPayoutsTotal ?? '—'}
              {stats?.pendingPayouts > 0 && (
                <span style={{ fontSize: 13, fontWeight: 600, color: '#f59e0b' }}>
                  ({stats.pendingPayouts} req.)
                </span>
              )}
            </div>
            <div className="stat-change" style={{ color: stats?.pendingPayouts > 0 ? 'var(--color-warning)' : 'var(--color-accent)' }}>
              {stats?.pendingPayouts > 0 ? '⚠ Needs attention' : '✓ All clear'}
            </div>
          </div>
          <div className="stat-card accent">
            <div className="stat-icon">👥</div>
            <div className="stat-label">Active Publishers</div>
            <div className="stat-value" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {stats?.activePublishers ?? '—'}
              {stats?.pendingPublishers > 0 && (
                <span style={{
                  fontSize: 12, color: '#f59e0b',
                  background: 'rgba(245,158,11,.1)', border: '1px solid rgba(245,158,11,.3)',
                  padding: '2px 8px', borderRadius: 12, fontWeight: 600,
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                }}>
                  ⏳ {stats.pendingPublishers} pending
                </span>
              )}
            </div>
            <div className="stat-change">{stats?.publishers ?? '—'} total publishers</div>
          </div>
          <div className="stat-card primary">
            <div className="stat-icon">📅</div>
            <div className="stat-label">Closed Periods</div>
            <div className="stat-value">{stats?.closedPeriods ?? '—'}</div>
            <div className="stat-change">Historical periods</div>
          </div>

          {/* Daily average with period comparison */}
          <div className="stat-card" style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,.12) 0%, rgba(16,185,129,.08) 100%)',
            border: '1px solid rgba(99,102,241,.25)',
          }}>
            <div className="stat-icon">📆</div>
            <div className="stat-label">Daily Avg. Pub. Earnings</div>
            <div className="stat-value money">${stats?.avgDailyEarnings ?? '—'}</div>
            {stats?.periodChangePct !== null && stats?.periodChangePct !== undefined ? (
              <div className="stat-change" style={{
                color: parseFloat(stats.periodChangePct) >= 0 ? '#10b981' : '#ef4444',
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                {parseFloat(stats.periodChangePct) >= 0 ? '▲' : '▼'}
                {Math.abs(parseFloat(stats.periodChangePct)).toFixed(1)}% vs prev {stats.spanDays}d
              </div>
            ) : (
              <div className="stat-change">No prior period data</div>
            )}
          </div>

          {/* Best day */}
          <div className="stat-card" style={{
            background: 'linear-gradient(135deg, rgba(245,158,11,.12) 0%, rgba(251,191,36,.06) 100%)',
            border: '1px solid rgba(245,158,11,.25)',
          }}>
            <div className="stat-icon">🏆</div>
            <div className="stat-label">Best Day (Pub. Earnings)</div>
            {stats?.bestDay ? (
              <>
                <div className="stat-value money" style={{ color: '#f59e0b' }}>${stats.bestDay.earnings}</div>
                <div className="stat-change" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>{stats.bestDay.date}</span>
                  <span style={{
                    fontSize: 10, padding: '1px 6px', borderRadius: 8,
                    background: 'rgba(245,158,11,.15)', color: '#f59e0b', fontWeight: 600,
                  }}>Gross ${stats.bestDay.gross}</span>
                </div>
              </>
            ) : (
              <>
                <div className="stat-value">—</div>
                <div className="stat-change">No data in range</div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Revenue Chart ── */}
      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div className="card-title">📈 Revenue Trend</div>
            <div className="card-subtitle">
              {filters.date_from} → {filters.date_to}
              {filters.publisher_id && ` · ${publishers.find(p => p.id === filters.publisher_id)?.name}`}
              {filters.website_id   && ` · ${websites.find(w => w.id === filters.website_id)?.domain}`}
            </div>
          </div>
          {/* Series toggles */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {[
              { key: 'gross',    label: 'Gross Revenue', color: '#6366f1' },
              { key: 'earnings', label: 'Pub. Earnings',  color: '#10b981' },
              { key: 'approved', label: '✅ Approved',    color: '#22d3ee' },
              { key: 'pending',  label: '⏳ Pending',     color: '#f59e0b' },
            ].map(s => (
              <button
                key={s.key}
                onClick={() => toggleSeries(s.key)}
                title={visibleSeries[s.key] ? `Hide ${s.label}` : `Show ${s.label}`}
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
                    gross:    'Gross Revenue',
                    earnings: 'Pub. Earnings',
                    approved: '✅ Approved',
                    pending:  '⏳ Pending',
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
            <div className="empty-state-icon">📊</div>
            <div className="empty-state-text">No revenue data for this period</div>
            <div className="empty-state-sub">Adjust your filters or run a GAM sync to populate records</div>
          </div>
        )}
      </div>

      {/* ── Daily Performance Table ── */}
      {revenueChart.length > 0 && (
        <DailyTable rows={revenueChart} bestDay={stats?.bestDay} />
      )}

      {/* ── Top 10 Publishers ── */}
      {publisherStats.length > 0 && (
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
  { key: 'approved', label: '✅ Approved',    fmt: v => `$${parseFloat(v).toFixed(2)}` },
  { key: 'pending',  label: '⏳ Pending',     fmt: v => `$${parseFloat(v).toFixed(2)}` },
]

function DailyTable({ rows, bestDay }) {
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
          <div className="card-title">📋 Daily Performance</div>
          <div className="card-subtitle">{rows.length} days · click column headers to sort</div>
        </div>
      </div>
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              {TABLE_COLS.map(col => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
                >
                  {col.label}{arrow(col.key)}
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
                      }}>🏆 Best</span>
                    )}
                  </td>
                  <td className="money">{parseInt(row.impressions).toLocaleString()}</td>
                  <td className="money" style={{ color: '#6366f1' }}>${parseFloat(row.gross).toFixed(2)}</td>
                  <td className="money positive" style={{ fontWeight: 700 }}>${parseFloat(row.earnings).toFixed(2)}</td>
                  <td className="money" style={{ color: '#22d3ee' }}>${parseFloat(row.approved).toFixed(2)}</td>
                  <td className="money" style={{ color: '#f59e0b' }}>${parseFloat(row.pending).toFixed(2)}</td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr style={{ background: 'rgba(99,102,241,.07)', fontWeight: 700, borderTop: '2px solid var(--color-border)' }}>
              <td style={{ padding: '10px 16px', fontSize: 12 }}>📊 Totals ({rows.length}d)</td>
              <td className="money">{totals.impressions.toLocaleString()}</td>
              <td className="money" style={{ color: '#6366f1' }}>${totals.gross.toFixed(2)}</td>
              <td className="money positive">${totals.earnings.toFixed(2)}</td>
              <td className="money" style={{ color: '#22d3ee' }}>${totals.approved.toFixed(2)}</td>
              <td className="money" style={{ color: '#f59e0b' }}>${totals.pending.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

// ── Top 10 Publishers ─────────────────────────────────────────────────────
function Top10Publishers({ rows }) {
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

  const rankEmoji = i => ['🥇','🥈','🥉'][i] || `#${i + 1}`

  return (
    <div className="card" style={{ padding: 0, marginTop: 24 }}>
      <div className="card-header" style={{ padding: '16px 20px' }}>
        <div>
          <div className="card-title">🏆 Top {rows.length} Publishers</div>
          <div className="card-subtitle">Ranked by publisher earnings for selected period</div>
        </div>
      </div>
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 48 }}>Rank</th>
              <th onClick={() => handleSort('name')} style={{ cursor: 'pointer', userSelect: 'none' }}>Publisher{arrow('name')}</th>
              <th onClick={() => handleSort('earnings')} style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>Pub. Earnings{arrow('earnings')}</th>
              <th style={{ minWidth: 140 }}>Approved %</th>
              <th onClick={() => handleSort('approved')} style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>✅ Approved{arrow('approved')}</th>
              <th onClick={() => handleSort('pending')} style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>⏳ Pending{arrow('pending')}</th>
              <th onClick={() => handleSort('gross')} style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>Gross Rev.{arrow('gross')}</th>
              <th onClick={() => handleSort('impressions')} style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>Impressions{arrow('impressions')}</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((pub, i) => {
              const originalRank = rows.findIndex(r => r.id === pub.id)
              const barPct = maxEarnings > 0 ? (pub.earnings / maxEarnings) * 100 : 0
              const approvedPct = pub.earnings > 0 ? (pub.approved / pub.earnings) * 100 : 0
              return (
                <tr key={pub.id || pub.name}>
                  <td style={{ textAlign: 'center', fontSize: 16, padding: '10px 12px' }}>
                    {rankEmoji(originalRank)}
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
                    ${pub.earnings.toFixed(2)}
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
                  <td className="money" style={{ color: '#22d3ee' }}>${pub.approved.toFixed(2)}</td>
                  <td className="money" style={{ color: '#f59e0b' }}>${pub.pending.toFixed(2)}</td>
                  <td className="money" style={{ color: '#6366f1' }}>${pub.gross.toFixed(2)}</td>
                  <td className="money">{pub.impressions.toLocaleString()}</td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr style={{ background: 'rgba(99,102,241,.07)', fontWeight: 700, borderTop: '2px solid var(--color-border)' }}>
              <td />
              <td style={{ padding: '10px 16px', fontSize: 12 }}>📊 Totals</td>
              <td className="money positive">
                ${rows.reduce((s, r) => s + r.earnings, 0).toFixed(2)}
              </td>
              <td />
              <td className="money" style={{ color: '#22d3ee' }}>
                ${rows.reduce((s, r) => s + r.approved, 0).toFixed(2)}
              </td>
              <td className="money" style={{ color: '#f59e0b' }}>
                ${rows.reduce((s, r) => s + r.pending, 0).toFixed(2)}
              </td>
              <td className="money" style={{ color: '#6366f1' }}>
                ${rows.reduce((s, r) => s + r.gross, 0).toFixed(2)}
              </td>
              <td className="money">
                {rows.reduce((s, r) => s + r.impressions, 0).toLocaleString()}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
