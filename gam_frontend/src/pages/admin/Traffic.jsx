import { useState, useEffect, useRef } from 'react'
import { trafficApi } from '../../api/endpoints'
import toast from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext'
import { useI18n } from '../../contexts/I18nContext'
import {
  Activity, AlertTriangle, Users, Eye, Globe, TrendingUp,
  TrendingDown, Clock, Shield, Wifi, X, ChevronRight, RefreshCw
} from 'lucide-react'

const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 }

function SeverityBadge({ severity }) {
  const { t } = useI18n()
  const colors = {
    critical: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' },
    high:     { bg: 'rgba(249,115,22,0.15)', color: '#f97316', border: '1px solid rgba(249,115,22,0.3)' },
    medium:   { bg: 'rgba(234,179,8,0.15)',  color: '#eab308', border: '1px solid rgba(234,179,8,0.3)' },
    low:      { bg: 'rgba(59,130,246,0.15)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)' },
  }
  const s = colors[severity] || colors.low
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5,
      padding: '2px 8px', borderRadius: 999, ...s
    }}>
      {t(`traffic.${severity}`, severity)}
    </span>
  )
}

export default function TrafficOverviewPage() {
  const { user } = useAuth()
  const { t } = useI18n()
  const [data, setData]             = useState(null)
  const [loading, setLoading]       = useState(true)
  const [dismissedAlerts, setDismissedAlerts] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('dismissed_anomaly_alerts') || '[]') } catch { return [] }
  })
  const intervalRef = useRef(null)

  async function load() {
    try {
      const res = await trafficApi.getOverview()
      setData(res.data)
    } catch (e) {
      toast.error(t('traffic.toast_load_failed', 'Failed to load traffic overview: ') + (e.response?.data?.message || e.message))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    intervalRef.current = setInterval(load, 30000) // auto-refresh every 30s
    return () => clearInterval(intervalRef.current)
  }, [])

  function dismissAlert(anomalyId) {
    const next = [...dismissedAlerts, anomalyId]
    setDismissedAlerts(next)
    sessionStorage.setItem('dismissed_anomaly_alerts', JSON.stringify(next))
  }

  const urgentAnomalies = (data?.open_anomalies || [])
    .filter(a => ['critical', 'high'].includes(a.severity) && !dismissedAlerts.includes(a.id))

  const anomalySummary = data?.anomaly_summary || { critical: 0, high: 0, medium: 0, low: 0 }
  const totalOpen = Object.values(anomalySummary).reduce((s, n) => s + n, 0)

  return (
    <div>
      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={24} style={{ color: 'var(--br-primary)' }} />
            <span>{t('traffic.title', 'Traffic Intelligence')}</span>
          </h1>
          <p className="page-subtitle" style={{ color: 'var(--color-text-muted)' }}>
            {loading ? t('traffic.subtitle_loading', 'Loading…') : t('traffic.subtitle_overview', 'Platform overview · auto-refreshes every 30s')}
          </p>
        </div>
        <button
          className="btn btn-secondary"
          onClick={() => { setLoading(true); load() }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
          disabled={loading}
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          {t('traffic.refresh', 'Refresh')}
        </button>
      </div>

      {/* ── Alert Strip (critical + high anomalies, dismissible per session) ── */}
      {urgentAnomalies.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
          {urgentAnomalies.slice(0, 5).map(a => (
            <div key={a.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 16px', borderRadius: 'var(--radius-md)',
              background: a.severity === 'critical' ? 'rgba(239,68,68,0.1)' : 'rgba(249,115,22,0.1)',
              border: `1px solid ${a.severity === 'critical' ? 'rgba(239,68,68,0.3)' : 'rgba(249,115,22,0.3)'}`,
              gap: 12,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                <AlertTriangle size={16} style={{ color: a.severity === 'critical' ? '#ef4444' : '#f97316', flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-text)' }}>
                    {a.website_domain}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)', marginLeft: 8 }}>
                    ({a.publisher_name}) · {t('traffic.anomaly_type.' + a.anomaly_type, a.type_label)} — {a.deviation_pct > 0 ? '+' : ''}{parseFloat(a.deviation_pct).toFixed(0)}% {t('traffic.deviation', 'deviation')}
                  </span>
                </div>
                <SeverityBadge severity={a.severity} />
              </div>
              <button
                onClick={() => dismissAlert(a.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 4, flexShrink: 0 }}
              >
                <X size={14} />
              </button>
            </div>
          ))}
          {urgentAnomalies.length > 5 && (
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', paddingLeft: 8 }}>
              +{urgentAnomalies.length - 5} more alerts — <a href="/admin/traffic/anomalies" style={{ color: 'var(--br-primary)' }}>{t('traffic.view_all', 'View all')}</a>
            </div>
          )}
        </div>
      )}

      {/* ── Stat Cards ── */}
      <div className="stat-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card primary">
          <div className="stat-icon"><Wifi size={20} /></div>
          <div className="stat-label">{t('traffic.active_visitors', 'Active Visitors Now')}</div>
          <div className="stat-value">{loading ? '—' : (data?.total_active_visitors || 0).toLocaleString()}</div>
          <div className="stat-change up">▲ {t('traffic.live_across_websites', 'Live across all websites')}</div>
        </div>
        <div className="stat-card" style={{
          background: totalOpen > 0 ? 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(239,68,68,0.02))' : undefined,
          border: totalOpen > 0 ? '1px solid rgba(239,68,68,0.3)' : undefined,
        }}>
          <div className="stat-icon" style={{ background: totalOpen > 0 ? 'rgba(239,68,68,0.15)' : undefined }}>
            <AlertTriangle size={20} style={{ color: totalOpen > 0 ? '#ef4444' : undefined }} />
          </div>
          <div className="stat-label">{t('traffic.open_anomalies', 'Open Anomalies')}</div>
          <div className="stat-value" style={{ color: totalOpen > 0 ? '#ef4444' : undefined }}>
            {loading ? '—' : totalOpen}
          </div>
          <div className="stat-change" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {anomalySummary.critical > 0 && <span style={{ color: '#ef4444' }}>{anomalySummary.critical} {t('traffic.critical', 'critical')}</span>}
            {anomalySummary.high > 0 && <span style={{ color: '#f97316' }}>{anomalySummary.high} {t('traffic.high', 'high')}</span>}
            {anomalySummary.medium > 0 && <span style={{ color: '#eab308' }}>{anomalySummary.medium} {t('traffic.med', 'med')}</span>}
            {totalOpen === 0 && <span style={{ color: '#10b981' }}>✓ {t('traffic.all_clear', 'All clear')}</span>}
          </div>
        </div>
        <div className="stat-card accent">
          <div className="stat-icon"><Eye size={20} /></div>
          <div className="stat-label">{t('traffic.visits_today', 'Visits Today')}</div>
          <div className="stat-value">{loading ? '—' : (data?.platform_visits_today || 0).toLocaleString()}</div>
          <div className="stat-change up">▲ {t('traffic.platform_total', 'Platform total')}</div>
        </div>
        <div className="stat-card info">
          <div className="stat-icon"><TrendingUp size={20} /></div>
          <div className="stat-label">{t('traffic.visits_this_month', 'Visits This Month')}</div>
          <div className="stat-value">{loading ? '—' : (data?.platform_visits_this_month || 0).toLocaleString()}</div>
          <div className="stat-change">↗ {t('traffic.month_to_date', 'Month to date')}</div>
        </div>
      </div>

      {/* ── Publishers Traffic Table ── */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Globe size={16} style={{ color: 'var(--br-primary)' }} />
            {t('traffic.websites_today_traffic', "Websites — Today's Traffic")}
          </div>
          <a href="/admin/traffic/realtime" style={{ fontSize: 12, color: 'var(--br-primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
            {t('traffic.live_monitor', 'Live monitor')} <ChevronRight size={12} />
          </a>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                {[
                  { key: 'traffic.table.website', label: 'Website' },
                  { key: 'traffic.table.publisher', label: 'Publisher' },
                  { key: 'traffic.table.visits_today', label: 'Visits Today' },
                  { key: 'traffic.table.unique_visitors', label: 'Unique Visitors' },
                  { key: 'traffic.table.quality_score', label: 'Quality Score' },
                  { key: 'traffic.table.open_anomalies', label: 'Open Anomalies' },
                  { key: '', label: '' }
                ].map(h => (
                  <th key={h.key} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                    {h.key ? t(h.key, h.label) : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ padding: 32, textAlign: 'center', color: 'var(--color-text-muted)' }}>{t('traffic.subtitle_loading', 'Loading…')}</td></tr>
              ) : (data?.top_publishers_by_traffic || []).length === 0 ? (
                <tr><td colSpan={7} style={{ padding: 32, textAlign: 'center', color: 'var(--color-text-muted)' }}>{t('traffic.no_traffic_today', 'No traffic data for today yet.')}</td></tr>
              ) : (
                (data?.top_publishers_by_traffic || []).map((pub, i) => {
                  const score = pub.quality_score
                  const scoreColor = score === null ? 'var(--color-text-muted)' : score >= 75 ? '#10b981' : score >= 50 ? '#eab308' : '#ef4444'
                  return (
                    <tr key={pub.website_id || pub.publisher_id} style={{
                      borderBottom: '1px solid var(--color-border)',
                      background: pub.open_anomalies > 0 ? 'rgba(249,115,22,0.03)' : undefined,
                      transition: 'background 0.15s',
                    }}>
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>
                        {pub.website_domain}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 500, fontSize: 12, color: 'var(--color-text-muted)' }}>{pub.publisher_name}</div>
                        <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{pub.publisher_email}</div>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 600 }}>
                        {(pub.visits_today || 0).toLocaleString()}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--color-text-muted)' }}>
                        {(pub.unique_visitors || 0).toLocaleString()}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {score !== null && score !== undefined ? (
                          <span style={{ fontWeight: 700, fontSize: 14, color: scoreColor }}>
                            {parseFloat(score).toFixed(1)}
                          </span>
                        ) : <span style={{ color: 'var(--color-text-muted)' }}>—</span>}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {pub.open_anomalies > 0 ? (
                          <span style={{ fontWeight: 700, color: '#f97316', fontSize: 13 }}>
                            ⚠ {pub.open_anomalies}
                          </span>
                        ) : (
                          <span style={{ color: '#10b981', fontSize: 12 }}>✓ {t('traffic.clear', 'Clear')}</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <a
                          href={`/admin/traffic/publishers/${pub.publisher_id}?website_id=${pub.website_id}`}
                          style={{ fontSize: 12, color: 'var(--br-primary)', display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                          {t('traffic.table.detail', 'Detail')} <ChevronRight size={12} />
                        </a>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Open Anomalies Summary ── */}
      {totalOpen > 0 && (
        <div className="card">
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Shield size={16} style={{ color: '#ef4444' }} />
              {t('traffic.open_anomalies', 'Open Anomalies')}
            </div>
            <a href="/admin/traffic/anomalies" style={{ fontSize: 12, color: 'var(--br-primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
              {t('traffic.view_all', 'View all')} <ChevronRight size={12} />
            </a>
          </div>
          <div style={{ padding: 0 }}>
            {(data?.open_anomalies || []).slice(0, 10).map(a => (
              <div key={a.id} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px',
                borderBottom: '1px solid var(--color-border)',
              }}>
                <SeverityBadge severity={a.severity} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>
                    {a.website_domain} <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 400 }}>({a.publisher_name})</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                    {t('traffic.anomaly_type.' + a.anomaly_type, a.type_label)} · {a.metric_name}
                  </div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', textAlign: 'right' }}>
                  <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>
                    {a.deviation_pct > 0 ? '+' : ''}{parseFloat(a.deviation_pct).toFixed(0)}%
                  </div>
                  <div>{new Date(a.detected_at).toLocaleTimeString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
