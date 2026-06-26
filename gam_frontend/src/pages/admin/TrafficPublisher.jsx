import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { trafficApi } from '../../api/endpoints'
import toast from 'react-hot-toast'
import { useI18n } from '../../contexts/I18nContext'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { Globe, TrendingUp, AlertTriangle, Shield, Activity, Monitor, Smartphone, Tablet, ChevronLeft } from 'lucide-react'

const DEVICE_COLORS = { mobile: '#3b82f6', desktop: '#10b981', tablet: '#8b5cf6' }
const SEVERITY_COLORS = { critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#3b82f6' }
const REFERRER_COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#14b8a6']

function SeverityBadge({ severity }) {
  const { t } = useI18n()
  const colors = { critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#3b82f6' }
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5,
      padding: '2px 8px', borderRadius: 999,
      background: `${colors[severity]}20`, color: colors[severity],
      border: `1px solid ${colors[severity]}40`,
    }}>{t(`traffic.${severity}`, severity)}</span>
  )
}

export default function TrafficPublisherPage() {
  const { t } = useI18n()
  const { publisherId } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const websiteId = searchParams.get('website_id') || ''
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [anomalyPage, setAnomalyPage] = useState(1)

  useEffect(() => {
    if (!publisherId) return
    setLoading(true)
    trafficApi.getPublisherDetail(publisherId, websiteId)
      .then(res => setData(res.data))
      .catch(e => toast.error(t('traffic.publisher.toast_load_failed', 'Failed to load publisher traffic: ') + (e.response?.data?.message || e.message)))
      .finally(() => setLoading(false))
  }, [publisherId, websiteId])

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: 'var(--color-text-muted)' }}>
        <Activity size={32} style={{ opacity: 0.3, marginBottom: 12 }} />
        <div>{t('traffic.publisher.loading', 'Loading publisher traffic data…')}</div>
      </div>
    )
  }

  if (!data) return null

  const dailyStats      = data.daily_stats || []
  const hourlyStats     = data.hourly_stats_today || []
  const qualityHistory  = data.quality_history || []
  const anomalies       = data.anomalies || {}
  const baselineVsActual = data.baseline_vs_actual || {}
  const publisher       = data.publisher || {}

  // Chart data: visits vs day for 30 days
  const chartData = dailyStats.map(s => ({
    date:    s.date?.slice(5), // MM-DD
    visits:  s.visits,
    unique:  s.unique_visitors,
    mobile:  s.mobile_visits,
    desktop: s.desktop_visits,
    tablet:  s.tablet_visits,
  }))

  // Hourly heatmap — total by hour
  const hourlyChart = hourlyStats.map(h => ({
    hour:    `${h.hour}:00`,
    total:   h.total,
    mobile:  h.mobile,
    desktop: h.desktop,
    tablet:  h.tablet,
  }))

  // Top countries for bar chart
  const latestDay     = dailyStats[dailyStats.length - 1]
  const topCountries  = (latestDay?.top_countries || []).slice(0, 10)
  const topReferrers  = (latestDay?.top_referrers || []).slice(0, 6)
  const topBrowsers   = (latestDay?.top_browsers  || [])

  // Quality score for gauge
  const latestQuality = qualityHistory[qualityHistory.length - 1]
  const qualityScore  = latestQuality ? parseFloat(latestQuality.quality_score) : null
  const scoreColor    = qualityScore === null ? 'var(--color-text-muted)' : qualityScore >= 75 ? '#10b981' : qualityScore >= 50 ? '#eab308' : '#ef4444'

  const websites          = data.websites || []
  const selectedWebsiteId = data.selected_website_id || ''

  return (
    <div>
      {/* ── Header ── */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <button
            onClick={() => navigate('/admin/traffic')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, marginBottom: 6, padding: 0 }}
          >
            <ChevronLeft size={14} /> {t('traffic.publisher.back', 'Back to Overview')}
          </button>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={24} style={{ color: 'var(--br-primary)' }} />
            <span>{t('traffic.publisher.detail_title', '{name} — Traffic Detail', { name: publisher.name })}</span>
          </h1>
          <p className="page-subtitle" style={{ color: 'var(--color-text-muted)' }}>
            {t('traffic.publisher.subtitle', 'Last 30 days · {email}', { email: publisher.email })}
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          {websites.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--color-text-muted)' }}>
                {t('traffic.publisher.filter_website', 'Filter by Website')}
              </div>
              <select
                value={selectedWebsiteId}
                onChange={e => setSearchParams(e.target.value ? { website_id: e.target.value } : {})}
                className="form-input"
                style={{
                  minWidth: 200,
                  padding: '8px 12px',
                  background: 'var(--color-surface-2)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--color-text)',
                  fontSize: 13,
                  outline: 'none',
                }}
              >
                <option value="">{t('traffic.publisher.all_websites', 'All Websites (Rollup)')}</option>
                {websites.map(w => (
                  <option key={w.id} value={w.id}>
                    {w.domain} {w.is_active ? '' : ' ' + t('traffic.publisher.inactive', '(Inactive)')}
                  </option>
                ))}
              </select>
            </div>
          )}

          {qualityScore !== null && (
            <div style={{
              textAlign: 'center', padding: '12px 20px',
              background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--color-text-muted)', marginBottom: 4 }}>
                {t('traffic.table.quality_score', 'Quality Score')}
              </div>
              <div style={{ fontSize: 32, fontWeight: 800, color: scoreColor }}>{qualityScore.toFixed(1)}</div>
            </div>
          )}
        </div>
      </div>

      {/* ── Baseline vs Actual ── */}
      {baselineVsActual.baseline_avg_visits !== null && (
        <div className="card" style={{ padding: 16, marginBottom: 24, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600, marginBottom: 4 }}>
              {t('traffic.publisher.baseline_hour', 'Baseline (avg) — hour {hour}:00', { hour: baselineVsActual.hour })}
            </div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{Math.round(baselineVsActual.baseline_avg_visits || 0).toLocaleString()}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600, marginBottom: 4 }}>
              {t('traffic.publisher.current_hour_visits', 'Current hour visits')}
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: baselineVsActual.current_hour_visits > (baselineVsActual.baseline_avg_visits || 0) * 3 ? '#ef4444' : 'var(--color-text)' }}>
              {(baselineVsActual.current_hour_visits || 0).toLocaleString()}
            </div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', alignSelf: 'center' }}>
            {t('traffic.publisher.sample_weeks', 'Sample: {count} weeks of data', { count: baselineVsActual.sample_weeks || 0 })}
          </div>
        </div>
      )}

      {/* ── Line Chart: 30-day visits ── */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: 24 }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <TrendingUp size={16} style={{ color: 'var(--br-primary)' }} />
          {t('traffic.publisher.daily_visits_title', 'Daily Visits — Last 30 Days')}
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="visitsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} />
            <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} />
            <Tooltip
              contentStyle={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: 'var(--color-text)', fontWeight: 600 }}
            />
            <Area type="monotone" dataKey="visits" stroke="#3b82f6" fill="url(#visitsGrad)" strokeWidth={2} name={t('traffic.publisher.chart.visits', 'Visits')} />
            <Area type="monotone" dataKey="unique" stroke="#10b981" fill="none" strokeWidth={1.5} strokeDasharray="4 2" name={t('traffic.publisher.chart.unique_visitors', 'Unique Visitors')} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── Two-column: Hourly heatmap + Device split ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        {/* Hourly breakdown */}
        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={16} style={{ color: 'var(--br-primary)' }} />
            {t('traffic.publisher.hourly_breakdown_title', 'Hourly Breakdown — Today')}
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={hourlyChart} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="hour" tick={{ fontSize: 9, fill: 'var(--color-text-muted)' }} interval={2} />
              <YAxis tick={{ fontSize: 9, fill: 'var(--color-text-muted)' }} />
              <Tooltip contentStyle={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 11 }} />
              <Bar dataKey="mobile"  stackId="a" fill={DEVICE_COLORS.mobile}  name={t('traffic.publisher.devices.mobile', 'Mobile')} />
              <Bar dataKey="desktop" stackId="a" fill={DEVICE_COLORS.desktop} name={t('traffic.publisher.devices.desktop', 'Desktop')} />
              <Bar dataKey="tablet"  stackId="a" fill={DEVICE_COLORS.tablet}  name={t('traffic.publisher.devices.tablet', 'Tablet')} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Referrer donut */}
        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Globe size={16} style={{ color: 'var(--br-primary)' }} />
            {t('traffic.publisher.referrer_split_title', 'Referrer Split — Latest Day')}
          </div>
          {topReferrers.length > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <PieChart width={140} height={140}>
                <Pie data={topReferrers} dataKey="visits" cx={65} cy={65} outerRadius={55} innerRadius={30}>
                  {topReferrers.map((_, i) => <Cell key={i} fill={REFERRER_COLORS[i % REFERRER_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => v.toLocaleString()} contentStyle={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 11 }} />
              </PieChart>
              <div style={{ flex: 1 }}>
                {topReferrers.map((r, i) => (
                  <div key={r.source} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: REFERRER_COLORS[i % REFERRER_COLORS.length], flexShrink: 0 }} />
                    <span style={{ fontSize: 12, flex: 1 }}>{r.source}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)' }}>{r.visits.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <div style={{ color: 'var(--color-text-muted)', fontSize: 13, padding: 20, textAlign: 'center' }}>{t('traffic.publisher.no_data', 'No data yet')}</div>}
        </div>
      </div>

      {/* ── Top Countries Bar Chart ── */}
      {topCountries.length > 0 && (
        <div className="card" style={{ padding: '16px 20px', marginBottom: 24 }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Globe size={16} style={{ color: 'var(--br-primary)' }} />
            {t('traffic.publisher.top_countries_title', 'Top Countries — Latest Day')}
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={topCountries.map(c => ({ name: c.code, visits: c.visits }))} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: 'var(--color-text)' }} width={30} />
              <Tooltip contentStyle={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 11 }} />
              <Bar dataKey="visits" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Quality Score Timeline ── */}
      {qualityHistory.length > 0 && (
        <div className="card" style={{ padding: '16px 20px', marginBottom: 24 }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={16} style={{ color: 'var(--br-primary)' }} />
            {t('traffic.publisher.quality_timeline_title', 'Quality Score Timeline')}
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <AreaChart data={qualityHistory.map(q => ({ date: q.date?.slice(5), score: parseFloat(q.quality_score) }))}>
              <defs>
                <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} />
              <Tooltip contentStyle={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 11 }} />
              <Area type="monotone" dataKey="score" stroke="#10b981" fill="url(#scoreGrad)" strokeWidth={2} name={t('traffic.table.quality_score', 'Quality Score')} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Anomaly History Table ── */}
      <div className="card">
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={16} style={{ color: '#f97316' }} />
          <span style={{ fontWeight: 600, fontSize: 14 }}>{t('traffic.publisher.anomaly_history_title', 'Anomaly History')}</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                {[
                  { key: 'traffic.publisher.table.severity', label: 'Severity' },
                  { key: 'traffic.publisher.table.type', label: 'Type' },
                  { key: 'traffic.publisher.table.metric', label: 'Metric' },
                  { key: 'traffic.publisher.table.baseline', label: 'Baseline' },
                  { key: 'traffic.publisher.table.actual', label: 'Actual' },
                  { key: 'traffic.publisher.table.deviation', label: 'Deviation' },
                  { key: 'traffic.publisher.table.detected', label: 'Detected' },
                  { key: 'traffic.publisher.table.status', label: 'Status' }
                ].map(h => (
                  <th key={h.key} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>{t(h.key, h.label)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(anomalies.data || []).length === 0 ? (
                <tr><td colSpan={8} style={{ padding: 32, textAlign: 'center', color: 'var(--color-text-muted)' }}>{t('traffic.publisher.no_anomalies', 'No anomalies on record.')}</td></tr>
              ) : (
                (anomalies.data || []).map(a => (
                  <tr key={a.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '10px 14px' }}><SeverityBadge severity={a.severity} /></td>
                    <td style={{ padding: '10px 14px', fontSize: 12 }}>{t('traffic.anomaly_type.' + a.anomaly_type, a.type_label)}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>{a.metric_name}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12 }}>{parseFloat(a.baseline_value).toFixed(0)}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, fontWeight: 600 }}>{parseFloat(a.current_value).toFixed(0)}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: parseFloat(a.deviation_pct) > 0 ? '#ef4444' : '#10b981' }}>
                      {parseFloat(a.deviation_pct) > 0 ? '+' : ''}{parseFloat(a.deviation_pct).toFixed(0)}%
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 11, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(a.detected_at).toLocaleString()}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      {a.is_resolved ? (
                        <span style={{ fontSize: 11, color: '#10b981', fontWeight: 600 }}>✓ {t('traffic.anomalies.resolved', 'Resolved')}</span>
                      ) : (
                        <span style={{ fontSize: 11, color: '#f97316', fontWeight: 600 }}>⚠ {t('traffic.anomalies.open', 'Open')}</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
