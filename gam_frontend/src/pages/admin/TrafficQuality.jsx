import { useState, useEffect } from 'react'
import { trafficApi } from '../../api/endpoints'
import toast from 'react-hot-toast'
import { useI18n } from '../../contexts/I18nContext'
import { Shield, TrendingUp, TrendingDown, ChevronUp, ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react'

const SCORE_COLOR = (s) => s >= 75 ? '#10b981' : s >= 50 ? '#eab308' : '#ef4444'

function ScoreBar({ value }) {
  const pct   = Math.max(0, Math.min(100, parseFloat(value) || 0))
  const color = SCORE_COLOR(pct)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ flex: 1, height: 6, background: 'var(--color-border)', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 999, transition: 'width 0.4s' }} />
      </div>
      <span style={{ fontWeight: 700, fontSize: 13, color, minWidth: 40, textAlign: 'right' }}>
        {pct.toFixed(1)}
      </span>
    </div>
  )
}

export default function TrafficQualityPage() {
  const { t } = useI18n()
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy]   = useState('quality_score')
  const [page, setPage]       = useState(1)

  async function load(sort = sortBy, p = page) {
    setLoading(true)
    try {
      const res = await trafficApi.getQualityScores({ sort_by: sort, page: p })
      setData(res.data)
    } catch (e) {
      toast.error(t('traffic.quality.toast_load_failed', 'Failed to load quality scores: ') + (e.response?.data?.message || e.message))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [sortBy, page])

  function handleSort(col) {
    setSortBy(col)
    setPage(1)
  }

  const items = data?.data || []
  const meta  = data?.meta  || {}

  const SortIcon = ({ col }) => {
    if (sortBy !== col) return null
    return sortBy === 'quality_score' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
  }

  const COLUMNS = [
    { key: 'website',                  label: t('traffic.table.website', 'Website'),               sortable: false },
    { key: 'publisher',                label: t('traffic.table.publisher', 'Publisher'),             sortable: false },
    { key: 'quality_score',            label: t('traffic.table.quality_score', 'Quality Score'),         sortable: true  },
    { key: 'anomaly_count',            label: t('traffic.table.open_anomalies', 'Anomalies'),             sortable: true  },
    { key: 'high_severity_anomalies',  label: t('traffic.quality.table.high_severity', 'High Severity'),         sortable: true  },
    { key: 'dominant_country_pct',     label: t('traffic.quality.table.dominant_country', 'Dominant Country %'),    sortable: false },
    { key: 'referrer_diversity_score', label: t('traffic.quality.table.referrer_diversity', 'Referrer Diversity'),    sortable: false },
    { key: 'flags',                    label: t('traffic.quality.table.flags', 'Flags'),                 sortable: false },
    { key: 'actions',                  label: '',                      sortable: false },
  ]

  const sortLabels = {
    quality_score: t('traffic.table.quality_score', 'Quality Score'),
    anomaly_count: t('traffic.table.open_anomalies', 'Anomalies'),
    high_severity_anomalies: t('traffic.quality.table.high_severity', 'High Severity'),
  }
  const sortedByLabel = sortLabels[sortBy] || sortBy

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={24} style={{ color: 'var(--br-primary)' }} />
            <span>{t('traffic.quality.title', 'Quality Score Leaderboard')}</span>
          </h1>
          <p className="page-subtitle" style={{ color: 'var(--color-text-muted)' }}>
            {loading ? t('traffic.subtitle_loading', 'Loading…') : t('traffic.quality.subtitle', '{count} websites · sorted by {sortBy}', { count: meta.total || 0, sortBy: sortedByLabel })}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, fontSize: 12, color: 'var(--color-text-muted)', alignItems: 'center' }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }} />≥75 {t('traffic.quality.legend_good', 'Good')}
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#eab308', marginLeft: 6 }} />50–74 {t('traffic.quality.legend_warning', 'Warning')}
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444', marginLeft: 6 }} />&lt;50 {t('traffic.quality.legend_risk', 'Risk')}
        </div>
      </div>

      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                {COLUMNS.map(col => (
                  <th
                    key={col.key}
                    onClick={() => col.sortable && handleSort(col.key)}
                    style={{
                      padding: '11px 14px', textAlign: 'left',
                      fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5,
                      color: sortBy === col.key ? 'var(--br-primary)' : 'var(--color-text-muted)',
                      cursor: col.sortable ? 'pointer' : 'default',
                      whiteSpace: 'nowrap',
                      userSelect: 'none',
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      {col.label}
                      <SortIcon col={col.key} />
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} style={{ padding: 60, textAlign: 'center', color: 'var(--color-text-muted)' }}>{t('traffic.subtitle_loading', 'Loading…')}</td></tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: 60, textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    <Shield size={32} style={{ opacity: 0.2, display: 'block', margin: '0 auto 12px' }} />
                    {t('traffic.quality.no_scores', 'No quality scores for today yet. Scores are built daily at 00:05.')}
                  </td>
                </tr>
              ) : (
                items.map((s, idx) => {
                  const score = parseFloat(s.quality_score)
                  const hasBadFlags = (s.flags || []).length > 0
                  return (
                    <tr key={s.website_id || s.publisher_id} style={{
                      borderBottom: '1px solid var(--color-border)',
                      background: score < 50 ? 'rgba(239,68,68,0.03)' : undefined,
                    }}>
                      {/* Website */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 24, height: 24, borderRadius: '50%',
                            background: SCORE_COLOR(score) + '20',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: SCORE_COLOR(score), fontWeight: 700, fontSize: 10, flexShrink: 0,
                          }}>
                            {idx + 1 + (page - 1) * 50}
                          </div>
                          <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-text)' }}>{s.website_domain}</div>
                        </div>
                      </td>

                      {/* Publisher */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 500, fontSize: 12, color: 'var(--color-text-muted)' }}>{s.publisher_name}</div>
                        <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{s.publisher_email}</div>
                      </td>

                      {/* Quality Score bar */}
                      <td style={{ padding: '12px 14px', minWidth: 180 }}>
                        <ScoreBar value={score} />
                      </td>

                      {/* Anomaly Count */}
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          fontWeight: 700, fontSize: 14,
                          color: s.anomaly_count > 0 ? '#f97316' : '#10b981',
                        }}>
                          {s.anomaly_count}
                        </span>
                      </td>

                      {/* High Severity */}
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          fontWeight: 700, fontSize: 14,
                          color: s.high_severity_anomalies > 0 ? '#ef4444' : 'var(--color-text-muted)',
                        }}>
                          {s.high_severity_anomalies}
                        </span>
                      </td>

                      {/* Dominant Country % */}
                      <td style={{ padding: '12px 14px', fontSize: 13 }}>
                        <span style={{
                          color: parseFloat(s.dominant_country_pct) > 80 ? '#ef4444' : 'var(--color-text)',
                          fontWeight: parseFloat(s.dominant_country_pct) > 80 ? 700 : 400,
                        }}>
                          {parseFloat(s.dominant_country_pct).toFixed(1)}%
                        </span>
                      </td>

                      {/* Referrer Diversity */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {parseFloat(s.referrer_diversity_score) > 50
                            ? <TrendingUp size={12} style={{ color: '#10b981' }} />
                            : <TrendingDown size={12} style={{ color: '#ef4444' }} />}
                          <span style={{ fontSize: 13 }}>{parseFloat(s.referrer_diversity_score).toFixed(1)}</span>
                        </div>
                      </td>

                      {/* Flags */}
                      <td style={{ padding: '12px 14px', maxWidth: 200 }}>
                        {hasBadFlags ? (
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {(s.flags || []).map(flag => (
                              <span key={flag} style={{
                                fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4,
                                padding: '2px 6px', borderRadius: 4,
                                background: 'rgba(239,68,68,0.1)', color: '#ef4444',
                                border: '1px solid rgba(239,68,68,0.2)',
                              }}>
                                {t('traffic.quality.flag.' + flag, flag.replace(/_/g, ' '))}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ fontSize: 12, color: '#10b981' }}>✓ {t('traffic.quality.table.clean', 'Clean')}</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '12px 14px' }}>
                        <a
                          href={`/admin/traffic/publishers/${s.publisher_id}?website_id=${s.website_id}`}
                          style={{ fontSize: 12, color: 'var(--br-primary)', display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}
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

        {/* Pagination */}
        {(meta.last_page || 1) > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '16px 20px', borderTop: '1px solid var(--color-border)' }}>
            <button className="btn btn-secondary" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1 || loading}>
              ← {t('traffic.quality.pagination.prev', 'Prev')}
            </button>
            <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
              {t('traffic.anomalies.pagination.page', 'Page {current} of {last}', { current: meta.current_page || page, last: meta.last_page || 1 })}
            </span>
            <button className="btn btn-secondary" onClick={() => setPage(p => p + 1)} disabled={page >= (meta.last_page || 1) || loading}>
              {t('traffic.quality.pagination.next', 'Next')} →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
