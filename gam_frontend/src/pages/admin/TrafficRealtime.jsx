import { useState, useEffect, useRef } from 'react'
import { trafficApi } from '../../api/endpoints'
import toast from 'react-hot-toast'
import { useI18n } from '../../contexts/I18nContext'
import { Wifi, AlertTriangle, Globe, Monitor, Smartphone, Tablet, RefreshCw, Search, LayoutGrid, List } from 'lucide-react'

const DEVICE_ICONS = {
  mobile:  <Smartphone size={12} />,
  desktop: <Monitor size={12} />,
  tablet:  <Tablet size={12} />,
}

function PublisherCard({ pub }) {
  const { t } = useI18n()
  const hasAnomaly = pub.has_open_anomaly
  const total = (pub.device_breakdown?.mobile || 0) + (pub.device_breakdown?.desktop || 0) + (pub.device_breakdown?.tablet || 0)

  const deviceLabels = {
    mobile: t('traffic.publisher.devices.mobile', 'Mobile'),
    desktop: t('traffic.publisher.devices.desktop', 'Desktop'),
    tablet: t('traffic.publisher.devices.tablet', 'Tablet'),
  }

  return (
    <div style={{
      background: 'var(--color-surface-2)',
      border: hasAnomaly
        ? '1px solid rgba(249,115,22,0.5)'
        : '1px solid var(--color-border)',
      borderRadius: 'var(--radius-lg)',
      padding: 16,
      transition: 'border-color 0.2s',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {hasAnomaly && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: 'linear-gradient(90deg, #f97316, #ef4444)',
        }} />
      )}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--color-text)' }}>
            {pub.website_domain}
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
            {pub.publisher_name}
          </div>
        </div>
        {hasAnomaly && (
          <span style={{
            fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5,
            padding: '2px 6px', borderRadius: 999,
            background: 'rgba(249,115,22,0.15)', color: '#f97316', border: '1px solid rgba(249,115,22,0.3)',
            flexShrink: 0, marginLeft: 8,
          }}>
            ⚠ {t('traffic.realtime.card.alert', 'Alert')}
          </span>
        )}
      </div>

      {/* Live Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        <div style={{
          background: 'rgba(59,130,246,0.08)', borderRadius: 'var(--radius-md)',
          padding: '8px 10px', border: '1px solid rgba(59,130,246,0.15)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
            <Wifi size={10} style={{ color: '#3b82f6' }} />
            <span style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 0.4, fontWeight: 600 }}>{t('traffic.realtime.card.active', 'Active')}</span>
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text)' }}>
            {(pub.active_visitors || 0).toLocaleString()}
          </div>
        </div>
        <div style={{
          background: 'rgba(16,185,129,0.08)', borderRadius: 'var(--radius-md)',
          padding: '8px 10px', border: '1px solid rgba(16,185,129,0.15)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
            <RefreshCw size={10} style={{ color: '#10b981' }} />
            <span style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 0.4, fontWeight: 600 }}>{t('traffic.realtime.card.active_15min', '15-min')}</span>
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text)' }}>
            {(pub.visits_last_15min || 0).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Top Country */}
      {pub.top_country && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: 12 }}>
          <Globe size={12} style={{ color: 'var(--color-text-muted)' }} />
          <span style={{ color: 'var(--color-text-muted)' }}>{t('traffic.realtime.card.top_country', 'Top country:')}</span>
          <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>
            {pub.top_country.code}
          </span>
          <span style={{
            fontSize: 11, padding: '1px 6px', borderRadius: 999,
            background: 'var(--color-surface)', border: '1px solid var(--color-border)',
            color: 'var(--color-text-muted)',
          }}>
            {pub.top_country.pct}%
          </span>
        </div>
      )}

      {/* Top Referrer */}
      {pub.top_referrer && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontSize: 12 }}>
          <span style={{ color: 'var(--color-text-muted)', width: 12, textAlign: 'center' }}>↗</span>
          <span style={{ color: 'var(--color-text-muted)' }}>{t('traffic.realtime.card.top_referrer', 'Top referrer:')}</span>
          <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{pub.top_referrer}</span>
        </div>
      )}

      {/* Device Split */}
      {total > 0 && (
        <div>
          <div style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600, marginBottom: 6 }}>{t('traffic.realtime.card.devices', 'Devices')}</div>
          <div style={{ display: 'flex', borderRadius: 4, overflow: 'hidden', height: 6, background: 'var(--color-border)' }}>
            {['mobile', 'desktop', 'tablet'].map((d, idx) => {
              const count = pub.device_breakdown?.[d] || 0
              const pct = total > 0 ? (count / total) * 100 : 0
              const colors = ['#3b82f6', '#10b981', '#8b5cf6']
              return pct > 0 ? (
                <div key={d} style={{ width: `${pct}%`, background: colors[idx], transition: 'width 0.3s' }} title={`${d}: ${count}`} />
              ) : null
            })}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 5 }}>
            {['mobile', 'desktop', 'tablet'].map((d, idx) => {
              const count = pub.device_breakdown?.[d] || 0
              const colors = ['#3b82f6', '#10b981', '#8b5cf6']
              return count > 0 ? (
                <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: 'var(--color-text-muted)' }}>
                   <div style={{ width: 6, height: 6, borderRadius: 2, background: colors[idx] }} />
                  <span style={{ textTransform: 'capitalize' }}>{deviceLabels[d]}</span>
                  <span style={{ color: 'var(--color-text)' }}>{count}</span>
                </div>
              ) : null
            })}
          </div>
        </div>
      )}

      <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--color-border)' }}>
        <a href={`/admin/traffic/publishers/${pub.publisher_id}?website_id=${pub.website_id}`}
          style={{ fontSize: 11, color: 'var(--br-primary)', fontWeight: 500 }}>
          {t('traffic.realtime.card.view_report', 'View report for this website →')}
        </a>
      </div>
    </div>
  )
}

export default function TrafficRealtimePage() {
  const { t } = useI18n()
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const intervalRef           = useRef(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  // Filters & layout preferences
  const [search, setSearch] = useState('')
  const [filterAlerts, setFilterAlerts] = useState(false)
  const [sortBy, setSortBy] = useState('alerts_first')
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('realtime_view_mode') || 'grid')

  async function load() {
    try {
      const res = await trafficApi.getRealtime()
      setData(res.data)
      setLastUpdated(new Date())
    } catch (e) {
      toast.error(t('traffic.realtime.toast_load_failed', 'Failed to load realtime data: ') + (e.response?.data?.message || e.message))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    intervalRef.current = setInterval(load, 30000)
    return () => clearInterval(intervalRef.current)
  }, [])

  const handleSetViewMode = (mode) => {
    setViewMode(mode)
    localStorage.setItem('realtime_view_mode', mode)
  }

  const websites = data?.websites || []
  const alertCount = websites.filter(w => w.has_open_anomaly).length

  // Filter and sort matching items
  const filteredWebsites = websites
    .filter(pub => {
      const q = search.toLowerCase()
      const matchesSearch = !search || 
        pub.website_domain.toLowerCase().includes(q) || 
        pub.publisher_name.toLowerCase().includes(q)
      
      const matchesAlerts = !filterAlerts || pub.has_open_anomaly
      
      return matchesSearch && matchesAlerts
    })
    .sort((a, b) => {
      if (sortBy === 'alerts_first') {
        return (b.has_open_anomaly ? 1 : 0) - (a.has_open_anomaly ? 1 : 0) || b.active_visitors - a.active_visitors
      }
      if (sortBy === 'active_desc') {
        return b.active_visitors - a.active_visitors
      }
      if (sortBy === 'visits_desc') {
        return (b.visits_last_15min || 0) - (a.visits_last_15min || 0)
      }
      if (sortBy === 'domain_asc') {
        return a.website_domain.localeCompare(b.website_domain)
      }
      return 0
    })

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Wifi size={24} style={{ color: 'var(--br-primary)' }} />
            <span>{t('traffic.realtime.title', 'Realtime Monitor')}</span>
          </h1>
          <p className="page-subtitle" style={{ color: 'var(--color-text-muted)' }}>
            {loading ? t('traffic.realtime.connecting', 'Connecting to live data…') : t('traffic.realtime.subtitle', '{count} websites · last updated {time} · auto-refreshes every 30s', { count: websites.length, time: lastUpdated ? lastUpdated.toLocaleTimeString() : '—' })}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {alertCount > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6, fontSize: 13,
              padding: '6px 12px', borderRadius: 'var(--radius-md)',
              background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.3)',
              color: '#f97316', fontWeight: 600,
            }}>
              <AlertTriangle size={14} />
              {t('traffic.realtime.alert_count', '{count} websites with alerts', { count: alertCount })}
            </div>
          )}
          <button className="btn btn-secondary" onClick={load} disabled={loading}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <RefreshCw size={14} /> {t('traffic.refresh', 'Refresh')}
          </button>
        </div>
      </div>

      {/* Control bar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 12,
        alignItems: 'center',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: 16,
        marginBottom: 20
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input
            className="form-input"
            style={{ paddingLeft: 36, height: 38 }}
            placeholder={t('traffic.realtime.search_placeholder', 'Search domain or owner...')}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Filter Tab Buttons */}
        <div style={{ display: 'flex', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--color-border-light)' }}>
          <button
            onClick={() => setFilterAlerts(false)}
            style={{
              padding: '8px 16px',
              fontSize: 13,
              cursor: 'pointer',
              background: !filterAlerts ? 'var(--color-surface-3)' : 'transparent',
              color: !filterAlerts ? 'var(--color-text)' : 'var(--color-text-muted)',
              border: 'none',
              borderRight: '1px solid var(--color-border-light)',
              fontWeight: !filterAlerts ? 600 : 400,
              transition: 'all 0.15s ease'
            }}
          >
            {t('traffic.realtime.filter.all', 'All ({count})', { count: websites.length })}
          </button>
          <button
            onClick={() => setFilterAlerts(true)}
            style={{
              padding: '8px 16px',
              fontSize: 13,
              cursor: 'pointer',
              background: filterAlerts ? 'var(--color-surface-3)' : 'transparent',
              color: filterAlerts ? 'var(--color-text)' : 'var(--color-text-muted)',
              border: 'none',
              fontWeight: filterAlerts ? 600 : 400,
              transition: 'all 0.15s ease'
            }}
          >
            {t('traffic.realtime.filter.alerts', 'Alerts ({count})', { count: alertCount })}
          </button>
        </div>

        {/* Sort Select */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>{t('traffic.realtime.sort.label', 'Sort:')}</span>
          <select
            className="form-select"
            style={{ width: 180, height: 38, fontSize: 13, padding: '0 10px', background: 'var(--color-bg)' }}
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
          >
            <option value="alerts_first">{t('traffic.realtime.sort.alerts_first', 'Alerts First')}</option>
            <option value="active_desc">{t('traffic.realtime.sort.active_desc', 'Active Visitors (Highest)')}</option>
            <option value="visits_desc">{t('traffic.realtime.sort.visits_desc', '15-min Visits (Highest)')}</option>
            <option value="domain_asc">{t('traffic.realtime.sort.domain_asc', 'Domain (A-Z)')}</option>
          </select>
        </div>

        {/* View Mode Toggle */}
        <div style={{ display: 'flex', gap: 4, padding: 3, background: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-light)' }}>
          <button
            onClick={() => handleSetViewMode('grid')}
            style={{
              padding: 6,
              borderRadius: 'var(--radius-sm)',
              background: viewMode === 'grid' ? 'var(--color-surface-3)' : 'transparent',
              color: viewMode === 'grid' ? 'var(--color-primary-light)' : 'var(--color-text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            title={t('traffic.realtime.view_grid', 'Grid View')}
          >
            <LayoutGrid size={16} />
          </button>
          <button
            onClick={() => handleSetViewMode('list')}
            style={{
              padding: 6,
              borderRadius: 'var(--radius-sm)',
              background: viewMode === 'list' ? 'var(--color-surface-3)' : 'transparent',
              color: viewMode === 'list' ? 'var(--color-primary-light)' : 'var(--color-text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            title={t('traffic.realtime.view_list', 'List View')}
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {loading && websites.length === 0 ? (
        <div className="card" style={{ padding: 60, textAlign: 'center', color: 'var(--color-text-muted)' }}>
          <Wifi size={32} style={{ opacity: 0.3, marginBottom: 12 }} />
          <div>{t('traffic.realtime.connecting', 'Connecting to live data…')}</div>
        </div>
      ) : filteredWebsites.length === 0 ? (
        <div className="card" style={{ padding: 60, textAlign: 'center', color: 'var(--color-text-muted)' }}>
          <Wifi size={32} style={{ opacity: 0.3, marginBottom: 12 }} />
          <div>{t('traffic.realtime.no_matching', 'No matching websites found.')}</div>
        </div>
      ) : viewMode === 'list' ? (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-container">
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th>{t('traffic.realtime.table.website_domain', 'Website / Domain')}</th>
                  <th>{t('traffic.realtime.table.owner', 'Owner')}</th>
                  <th>{t('traffic.realtime.table.status', 'Status')}</th>
                  <th style={{ textAlign: 'right' }}>{t('traffic.realtime.table.active_visitors', 'Active Visitors')}</th>
                  <th style={{ textAlign: 'right' }}>{t('traffic.realtime.table.visits_15min', '15-min Visits')}</th>
                  <th>{t('traffic.realtime.table.top_country', 'Top Country')}</th>
                  <th>{t('traffic.realtime.table.top_referrer', 'Top Referrer')}</th>
                  <th>{t('traffic.realtime.table.device_split', 'Device Split')}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredWebsites.map(pub => {
                  const total = (pub.device_breakdown?.mobile || 0) + (pub.device_breakdown?.desktop || 0) + (pub.device_breakdown?.tablet || 0)
                  return (
                    <tr key={pub.website_id}>
                      <td style={{ fontWeight: 600, color: 'var(--color-text)' }}>
                        {pub.website_domain}
                      </td>
                      <td style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>
                        {pub.publisher_name}
                      </td>
                      <td>
                        {pub.has_open_anomaly ? (
                          <span style={{
                            fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5,
                            padding: '2px 8px', borderRadius: 999,
                            background: 'rgba(249,115,22,0.15)', color: '#f97316', border: '1px solid rgba(249,115,22,0.3)',
                            display: 'inline-flex', alignItems: 'center', gap: 4
                          }}>
                            <AlertTriangle size={10} /> {t('traffic.realtime.card.alert', 'Alert')}
                          </span>
                        ) : (
                          <span style={{
                            fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5,
                            padding: '2px 8px', borderRadius: 999,
                            background: 'rgba(16,185,129,0.15)', color: 'var(--color-accent)', border: '1px solid rgba(16,185,129,0.3)',
                            display: 'inline-flex', alignItems: 'center', gap: 4
                          }}>
                            <Wifi size={10} /> {t('traffic.realtime.card.active', 'Active')}
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, fontSize: 15, fontFamily: 'monospace' }}>
                        {(pub.active_visitors || 0).toLocaleString()}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, fontSize: 15, fontFamily: 'monospace' }}>
                        {(pub.visits_last_15min || 0).toLocaleString()}
                      </td>
                      <td>
                        {pub.top_country ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                            <Globe size={12} style={{ color: 'var(--color-text-muted)' }} />
                            <span>{pub.top_country.code}</span>
                            <span style={{ color: 'var(--color-text-muted)', fontSize: 11 }}>({pub.top_country.pct}%)</span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--color-text-muted)' }}>—</span>
                        )}
                      </td>
                      <td style={{ color: 'var(--color-text-muted)', fontSize: 13, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={pub.top_referrer}>
                        {pub.top_referrer || t('traffic.publisher.no_data', 'Direct')}
                      </td>
                      <td>
                        {total > 0 ? (
                          <div style={{ width: 100 }}>
                            <div style={{ display: 'flex', borderRadius: 3, overflow: 'hidden', height: 5, background: 'var(--color-border)' }}>
                              {['mobile', 'desktop', 'tablet'].map((d, idx) => {
                                const count = pub.device_breakdown?.[d] || 0
                                const pct = total > 0 ? (count / total) * 100 : 0
                                const colors = ['#3b82f6', '#10b981', '#8b5cf6']
                                return pct > 0 ? (
                                  <div key={d} style={{ width: `${pct}%`, background: colors[idx] }} title={`${d}: ${count} (${Math.round(pct)}%)`} />
                                ) : null
                              })}
                            </div>
                            <div style={{ display: 'flex', gap: 6, marginTop: 4, fontSize: 9, color: 'var(--color-text-muted)', flexWrap: 'wrap' }}>
                              {['mobile', 'desktop', 'tablet'].map((d, idx) => {
                                const count = pub.device_breakdown?.[d] || 0
                                const labels = { mobile: 'M', desktop: 'D', tablet: 'T' }
                                return count > 0 ? (
                                  <span key={d} style={{ textTransform: 'capitalize' }}>
                                    {labels[d]}:{count}
                                  </span>
                                ) : null
                              })}
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--color-text-muted)' }}>—</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <a href={`/admin/traffic/publishers/${pub.publisher_id}?website_id=${pub.website_id}`}
                          className="btn btn-secondary btn-xs"
                          style={{ fontWeight: 500 }}
                        >
                          {t('traffic.realtime.table.report', 'Report')}
                        </a>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 16,
        }}>
          {filteredWebsites.map(pub => <PublisherCard key={pub.website_id} pub={pub} />)}
        </div>
      )}
    </div>
  )
}
