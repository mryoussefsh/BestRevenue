import { useState, useEffect, useRef } from 'react'
import { trafficApi } from '../../api/endpoints'
import toast from 'react-hot-toast'
import { useI18n } from '../../contexts/I18nContext'
import { AlertTriangle, CheckCircle2, Filter, X, ChevronLeft, ChevronRight } from 'lucide-react'

const SEVERITY_META = {
  critical: { label: 'Critical', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)' },
  high:     { label: 'High',     color: '#f97316', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.3)' },
  medium:   { label: 'Medium',   color: '#eab308', bg: 'rgba(234,179,8,0.12)',  border: 'rgba(234,179,8,0.3)' },
  low:      { label: 'Low',      color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.3)' },
}

function SeverityBadge({ severity }) {
  const { t } = useI18n()
  const m = SEVERITY_META[severity] || SEVERITY_META.low
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5,
      padding: '2px 8px', borderRadius: 999,
      background: m.bg, color: m.color, border: `1px solid ${m.border}`,
    }}>{t(`traffic.${severity}`, severity)}</span>
  )
}

function ResolveModal({ anomaly, onClose, onResolved }) {
  const { t } = useI18n()
  const [notes, setNotes]     = useState('')
  const [loading, setLoading] = useState(false)

  async function submit() {
    setLoading(true)
    try {
      await trafficApi.resolveAnomaly(anomaly.id, notes)
      toast.success(t('traffic.anomalies.resolve_modal.success', 'Anomaly marked as resolved.'))
      onResolved(anomaly.id)
      onClose()
    } catch (e) {
      toast.error(t('traffic.anomalies.resolve_modal.failed', 'Failed to resolve: ') + (e.response?.data?.message || e.message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: 'var(--color-surface)', border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)', padding: 24, width: '100%', maxWidth: 480,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{t('traffic.anomalies.resolve_modal.title', 'Resolve Anomaly')}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 4 }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ marginBottom: 16, padding: 12, background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)', fontSize: 13 }}>
          <div style={{ fontWeight: 700, marginBottom: 4, color: 'var(--color-text)' }}>{anomaly.website_domain}</div>
          <div style={{ color: 'var(--color-text-muted)' }}>{anomaly.publisher_name} · {t('traffic.anomaly_type.' + anomaly.anomaly_type, anomaly.type_label)} · {anomaly.metric_name}</div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
            {t('traffic.anomalies.resolve_modal.notes_label', 'Admin Notes (optional)')}
          </label>
          <textarea
            className="form-input"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder={t('traffic.anomalies.resolve_modal.notes_placeholder', 'Explain why this anomaly is being resolved…')}
            rows={3}
            style={{ width: '100%', resize: 'vertical' }}
          />
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose} disabled={loading}>{t('traffic.anomalies.resolve_modal.cancel', 'Cancel')}</button>
          <button
            className={`btn btn-primary ${loading ? 'btn-loading' : ''}`}
            onClick={submit}
            disabled={loading}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            <CheckCircle2 size={14} />
            {loading ? t('traffic.anomalies.resolve_modal.submitting', 'Resolving…') : t('traffic.anomalies.resolve_modal.submit', 'Mark as Resolved')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function TrafficAnomaliesPage() {
  const { t } = useI18n()
  const [data, setData]           = useState(null)
  const [loading, setLoading]     = useState(true)
  const [resolveTarget, setResolveTarget] = useState(null)
  const [filters, setFilters]     = useState({
    severity:     '',
    publisher_id: '',
    resolved:     'false',
  })
  const [page, setPage]           = useState(1)

  async function load(f = filters, p = page) {
    setLoading(true)
    try {
      const params = { page: p }
      if (f.severity)     params.severity     = f.severity
      if (f.publisher_id) params.publisher_id = f.publisher_id
      if (f.resolved !== '') params.resolved  = f.resolved
      const res = await trafficApi.getAnomalies(params)
      setData(res.data)
    } catch (e) {
      toast.error(t('traffic.anomalies.toast_load_failed', 'Failed to load anomalies: ') + (e.response?.data?.message || e.message))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [filters, page])

  function applyFilter(key, val) {
    const next = { ...filters, [key]: val }
    setFilters(next)
    setPage(1)
  }

  function handleResolved(id) {
    if (!data) return
    setData(prev => ({
      ...prev,
      data: prev.data.map(a => a.id === id ? { ...a, is_resolved: true, resolved_at: new Date().toISOString() } : a),
    }))
  }

  const items = data?.data || []
  const meta  = data?.meta || {}

  const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : ''

  return (
    <div>
      {resolveTarget && (
        <ResolveModal
          anomaly={resolveTarget}
          onClose={() => setResolveTarget(null)}
          onResolved={handleResolved}
        />
      )}

      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={24} style={{ color: '#f97316' }} />
            <span>{t('traffic.anomalies.title', 'Anomaly Feed')}</span>
          </h1>
          <p className="page-subtitle" style={{ color: 'var(--color-text-muted)' }}>
            {loading ? t('traffic.subtitle_loading', 'Loading…') : t('traffic.anomalies.count', '{count} anomalies', { count: meta.total || 0 })}
          </p>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="card" style={{ padding: '12px 16px', marginBottom: 20, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <Filter size={14} style={{ color: 'var(--color-text-muted)' }} />

        <select className="form-select" value={filters.severity} onChange={e => applyFilter('severity', e.target.value)} style={{ height: 36, fontSize: 13, minWidth: 130 }}>
          <option value="">{t('traffic.anomalies.severity_all', 'All Severities')}</option>
          <option value="critical">{capitalize(t('traffic.critical', 'critical'))}</option>
          <option value="high">{capitalize(t('traffic.high', 'high'))}</option>
          <option value="medium">{capitalize(t('traffic.med', 'med'))}</option>
          <option value="low">{capitalize(t('traffic.low', 'low'))}</option>
        </select>

        <select className="form-select" value={filters.resolved} onChange={e => applyFilter('resolved', e.target.value)} style={{ height: 36, fontSize: 13, minWidth: 130 }}>
          <option value="false">{t('traffic.anomalies.status_open', 'Open Only')}</option>
          <option value="true">{t('traffic.anomalies.status_resolved', 'Resolved Only')}</option>
          <option value="">{t('traffic.anomalies.status_all', 'All')}</option>
        </select>

        {(filters.severity || filters.resolved !== 'false') && (
          <button
            className="btn btn-secondary"
            onClick={() => { setFilters({ severity: '', publisher_id: '', resolved: 'false' }); setPage(1) }}
            style={{ height: 36, fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 6, color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)' }}
          >
            <X size={12} /> {t('traffic.anomalies.reset', 'Reset')}
          </button>
        )}
      </div>

      {/* ── Anomaly List ── */}
      <div className="card">
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--color-text-muted)' }}>{t('traffic.anomalies.loading', 'Loading anomalies…')}</div>
        ) : items.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--color-text-muted)' }}>
            <CheckCircle2 size={32} style={{ opacity: 0.3, marginBottom: 12 }} />
            <div>{t('traffic.anomalies.no_anomalies', 'No anomalies found for these filters.')}</div>
          </div>
        ) : (
          items.map(a => {
            const m = SEVERITY_META[a.severity] || SEVERITY_META.low
            return (
              <div key={a.id} style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px',
                borderBottom: '1px solid var(--color-border)',
                borderLeft: `3px solid ${a.is_resolved ? 'transparent' : m.color}`,
                opacity: a.is_resolved ? 0.6 : 1,
                transition: 'opacity 0.2s',
              }}>
                <SeverityBadge severity={a.severity} />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--color-text)' }}>{a.website_domain}</span>
                    <span style={{ fontWeight: 500, fontSize: 12, color: 'var(--color-text-muted)' }}>({a.publisher_name})</span>
                    <span style={{
                      fontSize: 11, padding: '1px 6px', borderRadius: 4,
                      background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
                      color: 'var(--color-text-muted)',
                    }}>{t('traffic.anomaly_type.' + a.anomaly_type, a.type_label)}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                    {a.metric_name}
                  </div>
                </div>

                <div style={{ textAlign: 'center', minWidth: 80 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: m.color }}>
                    {parseFloat(a.deviation_pct) > 0 ? '+' : ''}{parseFloat(a.deviation_pct).toFixed(0)}%
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{t('traffic.deviation', 'deviation')}</div>
                </div>

                <div style={{ textAlign: 'right', minWidth: 100 }}>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                    {new Date(a.detected_at).toLocaleDateString()}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                    {new Date(a.detected_at).toLocaleTimeString()}
                  </div>
                </div>

                <div style={{ minWidth: 100, textAlign: 'right' }}>
                  {a.is_resolved ? (
                    <span style={{ fontSize: 11, color: '#10b981', fontWeight: 600 }}>✓ {t('traffic.anomalies.resolved', 'Resolved')}</span>
                  ) : (
                    <button
                      className="btn btn-secondary"
                      onClick={() => setResolveTarget(a)}
                      style={{ fontSize: 12, padding: '4px 12px', height: 32 }}
                    >
                      {t('traffic.anomalies.resolve', 'Resolve')}
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}

        {/* Pagination */}
        {(meta.last_page || 1) > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '16px 20px', borderTop: '1px solid var(--color-border)' }}>
            <button className="btn btn-secondary" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1 || loading} style={{ padding: '4px 10px', display: 'flex', alignItems: 'center' }}>
              <ChevronLeft size={14} />
            </button>
            <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
              {t('traffic.anomalies.pagination.page', 'Page {current} of {last}', { current: meta.current_page || page, last: meta.last_page || 1 })}
            </span>
            <button className="btn btn-secondary" onClick={() => setPage(p => p + 1)} disabled={page >= (meta.last_page || 1) || loading} style={{ padding: '4px 10px', display: 'flex', alignItems: 'center' }}>
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
