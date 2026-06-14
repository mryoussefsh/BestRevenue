import { useState, useEffect } from 'react'
import { adminApi } from '../../api/endpoints'
import toast from 'react-hot-toast'
import CompactAmount from '../../components/CompactAmount'
import { Eye, MousePointer, Ban, TrendingUp, Target, RefreshCw, Server, Globe, LayoutDashboard } from 'lucide-react'
import { useI18n } from '../../contexts/I18nContext'

export default function AdOpsDashboard() {
  const { t } = useI18n()
  const [stats, setStats] = useState(null)
  const [websites, setWebsites] = useState([])
  const [adUnits, setAdUnits] = useState([])
  const [syncLogs, setSyncLogs] = useState([])
  const [syncing, setSyncing] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [webRes, adUnitsRes, syncLogsRes, revenueRes] = await Promise.all([
        adminApi.getWebsites({ per_page: 500 }).catch(() => ({ data: { data: [] } })),
        adminApi.getAdUnits({ per_page: 6 }).catch(() => ({ data: { data: [] } })),
        adminApi.getSyncLogs().catch(() => ({ data: [] })),
        adminApi.getRevenue({ limit: 5000 }).catch(() => ({ data: { data: [] } }))
      ])

      const webList = webRes.data?.data || []
      const adUnitsList = adUnitsRes.data?.data || []
      const logsList = Array.isArray(syncLogsRes.data) ? syncLogsRes.data : (Array.isArray(syncLogsRes) ? syncLogsRes : [])
      const revenueRecords = revenueRes.data?.data || []

      // Stats aggregation
      const totalImpr = revenueRecords.reduce((s, r) => s + parseInt(r.impressions || 0), 0)
      const totalClicks = revenueRecords.reduce((s, r) => s + parseInt(r.clicks || 0), 0)
      const totalUnfilled = revenueRecords.reduce((s, r) => s + parseInt(r.unfilled_impressions || 0), 0)
      const totalGross = revenueRecords.reduce((s, r) => s + parseFloat(r.gross_revenue || 0), 0)
      const totalAvEligible = revenueRecords.reduce((s, r) => s + parseInt(r.active_view_eligible_impressions || 0), 0)
      const totalAvViewable = revenueRecords.reduce((s, r) => s + parseInt(r.active_view_viewable_impressions || 0), 0)

      const avgCPM = totalImpr > 0 ? (totalGross / totalImpr) * 1000 : 0
      const avgCTR = totalImpr > 0 ? (totalClicks / totalImpr) * 100 : 0
      const viewabilityRate = totalAvEligible > 0 ? (totalAvViewable / totalAvEligible) * 100 : null

      setStats({
        totalImpressions: totalImpr,
        totalClicks: totalClicks,
        totalUnfilled: totalUnfilled,
        avgCPM: avgCPM.toFixed(2),
        avgCTR: avgCTR.toFixed(3),
        viewabilityRate: viewabilityRate !== null ? viewabilityRate.toFixed(1) : null
      })

      setWebsites(webList.slice(0, 5))
      setAdUnits(adUnitsList)
      setSyncLogs(logsList.slice(0, 10))

    } catch (err) {
      console.error(err)
      toast.error(t('adops.toast_load_fail', 'Failed to load ad ops dashboard data'))
    } finally {
      setLoading(false)
    }
  }

  async function handleSync() {
    setSyncing(true)
    try {
      const res = await adminApi.runSync()
      toast.success(res.data?.message || t('adops.toast_sync_success', 'GAM sync completed successfully!'))
      loadData()
    } catch (e) {
      toast.error(e.response?.data?.message || t('adops.toast_sync_fail', 'GAM sync failed.'))
    } finally {
      setSyncing(false)
    }
  }

  if (loading) {
    return <div className="empty-state"><div className="spinner" /></div>
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Server size={28} style={{ color: 'var(--br-primary)' }} />
            <span>{t('adops.title', 'Ad Operations Control Room')}</span>
          </h1>
          <p className="page-subtitle" style={{ color: 'var(--color-text-muted)' }}>
            {t('adops.subtitle', 'Workspace for traffic tracking, ad configuration, and GAM synchronization status')}
          </p>
        </div>
        <div>
          <button
            className={`btn btn-primary ${syncing ? 'btn-loading' : ''}`}
            onClick={handleSync} disabled={syncing} id="run-gam-sync-btn"
          >
            {syncing
              ? <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> {t('adops.syncing', 'Syncing…')}</>
              : <><RefreshCw size={14} /> {t('adops.run_sync_btn', 'Run GAM Sync')}</>}
          </button>
        </div>
      </div>

      {/* Traffic Stats Grid */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: .5, color: 'var(--color-text-muted)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Eye size={14} style={{ color: 'var(--br-primary)' }} /> {t('adops.traffic_stats', 'Traffic & Ad Performance')}
        </div>
        <div className="stat-grid">
          <div className="stat-card info">
            <div className="stat-icon"><Eye size={20} /></div>
            <div className="stat-label">{t('adops.stat_impressions', 'Total Impressions')}</div>
            <div className="stat-value">
              <CompactAmount value={stats?.totalImpressions} prefix="" decimals={0} />
            </div>
            <div className="stat-change up">▲ {t('adops.platform_wide', 'Platform-wide')}</div>
          </div>
          <div className="stat-card info">
            <div className="stat-icon"><MousePointer size={20} /></div>
            <div className="stat-label">{t('adops.stat_clicks', 'Total Clicks')}</div>
            <div className="stat-value">
              <CompactAmount value={stats?.totalClicks} prefix="" decimals={0} />
            </div>
            <div className="stat-change up">▲ {t('adops.platform_wide', 'Platform-wide')}</div>
          </div>
          <div className="stat-card info">
            <div className="stat-icon"><Ban size={20} /></div>
            <div className="stat-label">{t('adops.stat_unfilled', 'Unfilled Impressions')}</div>
            <div className="stat-value">
              <CompactAmount value={stats?.totalUnfilled} prefix="" decimals={0} />
            </div>
            <div className="stat-change text-muted">{t('adops.unserved', 'Unserved inventory')}</div>
          </div>
          <div className="stat-card primary">
            <div className="stat-icon"><TrendingUp size={20} /></div>
            <div className="stat-label">{t('adops.stat_avg_cpm', 'Avg. Gross CPM')}</div>
            <div className="stat-value money">${stats?.avgCPM ?? '0.00'}</div>
            <div className="stat-change">{t('adops.gross_per_1000', 'Gross earnings per 1000')}</div>
          </div>
          <div className="stat-card primary">
            <div className="stat-icon"><Target size={20} /></div>
            <div className="stat-label">{t('adops.stat_avg_ctr', 'Avg. CTR')}</div>
            <div className="stat-value">{stats?.avgCTR ?? '0.000'}%</div>
            <div className="stat-change">{t('adops.platform_click_rate', 'Platform click rate')}</div>
          </div>
          <div className="stat-card primary">
            <div className="stat-icon"><Eye size={20} /></div>
            <div className="stat-label">{t('adops.stat_viewability', 'Viewability Rate')}</div>
            <div className="stat-value">
              {stats?.viewabilityRate ? `${stats.viewabilityRate}%` : 'N/A'}
            </div>
            <div className="stat-change text-muted">{t('adops.active_view_viewable', 'Active View viewable')}</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Websites list & Sync console */}
      <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24, marginBottom: 24 }}>
        
        {/* Active Websites */}
        <div className="card" style={{ padding: 0 }}>
          <div className="card-header" style={{ padding: '16px 20px' }}>
            <div>
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Globe size={16} style={{ color: 'var(--br-primary)' }} /> {t('adops.websites_tracker', 'Websites Tracker')}
              </div>
              <div className="card-subtitle">{t('adops.websites_subtitle', 'Active domains and connected GAM networks')}</div>
            </div>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>{t('common.domain', 'Domain')}</th>
                  <th>{t('gam.network_code_label', 'Network Code')}</th>
                  <th>{t('common.publisher', 'Publisher')}</th>
                  <th>{t('common.status', 'Status')}</th>
                </tr>
              </thead>
              <tbody>
                {websites.length === 0 ? (
                  <tr>
                    <td colSpan={4}>
                      <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--color-text-muted)' }}>
                        {t('adops.no_websites', 'No websites configured')}
                      </div>
                    </td>
                  </tr>
                ) : (
                  websites.map(w => (
                    <tr key={w.id}>
                      <td style={{ fontWeight: 600 }}>{w.domain}</td>
                      <td><code>{w.gam_network_code || '—'}</code></td>
                      <td style={{ fontSize: 12 }}>{w.publisher?.name || '—'}</td>
                      <td>
                        <span className={`badge badge-approved`} style={{ textTransform: 'uppercase' }}>{t('common.active', 'Active')}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sync Console Logs */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <div>
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <RefreshCw size={16} style={{ color: 'var(--br-primary)' }} /> {t('adops.sync_logs', 'GAM Sync Logs')}
              </div>
              <div className="card-subtitle">{t('adops.sync_logs_subtitle', 'Recent automated and manual synchronization activities')}</div>
            </div>
          </div>
          <div style={{
            background: 'rgba(0,0,0,0.3)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            padding: 16,
            fontFamily: 'monospace',
            fontSize: 12,
            overflowY: 'auto',
            maxHeight: 250,
            flex: 1,
            color: '#10b981'
          }}>
            {syncLogs.length === 0 ? (
              <div style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '20px 0' }}>
                {t('adops.no_sync_logs', 'No sync logs recorded')}
              </div>
            ) : (
              syncLogs.map((log, idx) => {
                let time = '04:00';
                let msg = '';
                let isError = false;
                if (log && typeof log === 'object') {
                  if (log.started_at) {
                    time = new Date(log.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                  }
                  msg = `Sync status: ${log.status || 'unknown'} (Matched: ${log.rows_matched || 0}, Fetched: ${log.rows_fetched || 0})`;
                  if (log.triggered_by) {
                    msg += ` by ${log.triggered_by}`;
                  }
                  if (log.error_message) {
                    msg += ` - Error: ${log.error_message}`;
                    isError = true;
                  } else if (log.status === 'failed') {
                    isError = true;
                  }
                } else {
                  msg = String(log);
                }
                return (
                  <div key={idx} style={{ marginBottom: 6, display: 'flex', gap: 8 }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>[{time}]</span>
                    <span style={{ color: isError ? '#ef4444' : '#10b981' }}>{msg}</span>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Ad Units Summary */}
      <div className="card" style={{ padding: 0 }}>
        <div className="card-header" style={{ padding: '16px 20px' }}>
          <div>
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <LayoutDashboard size={16} style={{ color: 'var(--br-primary)' }} /> {t('adops.configured_ad_units', 'Configured Ad Units')}
            </div>
            <div className="card-subtitle">{t('adops.ad_units_subtitle', 'Registered banner & video placement units')}</div>
          </div>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>{t('adops.col_ad_unit_name', 'Ad Unit Name')}</th>
                <th>{t('adops.col_display_name', 'Display Name')}</th>
                <th>{t('adops.col_format', 'Format')}</th>
                <th>{t('adops.col_sizes', 'Sizes')}</th>
                <th>{t('adops.col_gam_status', 'GAM Status')}</th>
              </tr>
            </thead>
            <tbody>
              {adUnits.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--color-text-muted)' }}>
                      {t('adops.no_ad_units', 'No ad units mapped')}
                    </div>
                  </td>
                </tr>
              ) : (
                adUnits.map(ad => (
                  <tr key={ad.id}>
                    <td style={{ fontWeight: 600, fontSize: 13 }}>{ad.gam_ad_unit_name}</td>
                    <td>{ad.display_name}</td>
                    <td><span className="badge badge-inactive">{ad.ad_type}</span></td>
                    <td><code>{ad.sizes || 'Fluid'}</code></td>
                    <td>
                      <span className="badge badge-approved">{t('adops.linked', 'Linked')}</span>
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
