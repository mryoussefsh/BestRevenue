import { useState, useEffect } from 'react'
import { adminApi } from '../../api/endpoints'
import toast from 'react-hot-toast'
import Pagination from '../../components/Pagination'
import { useSettings } from '../../contexts/SettingsContext'
import { ClipboardList, Filter } from 'lucide-react'
import { useI18n } from '../../contexts/I18nContext'


export default function AuditLogsPage() {
  const { formatDateTime } = useSettings()
  const { t } = useI18n()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ action: '', entity_type: '' })
  const [page, setPage] = useState(1)
  const [showFiltersPanel, setShowFiltersPanel] = useState(false)

  useEffect(() => { load() }, [filters])

  async function load() {
    setLoading(true)
    try {
      const params = {}
      if (filters.action) params.action = filters.action
      if (filters.entity_type) params.entity_type = filters.entity_type
      
      const res = await adminApi.getAuditLogs(params)
      setLogs(res.data?.data || [])
    } catch { toast.error(t('audit.toast_load_fail', 'Failed to load audit logs')) }
    finally { setLoading(false) }
  }

  useEffect(() => { setPage(1) }, [filters])

  const paginated = logs.slice((page - 1) * 15, page * 15)

  const badgeClass = {
    created: 'badge-active',
    updated: 'badge-pending',
    deleted: 'badge-rejected',
    suspended: 'badge-inactive',
    approved: 'badge-approved',
    paid: 'badge-paid',
    rejected: 'badge-rejected',
    closed: 'badge-closed'
  }

  const activeFiltersCount = [filters.action, filters.entity_type].filter(Boolean).length

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ClipboardList size={24} style={{ color: 'var(--color-primary)' }} /> {t('audit.title', 'Audit Logs')}
          </h1>
          <p className="page-subtitle">{t('audit.subtitle', 'Track admin and system actions')}</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button 
            className="btn btn-secondary" 
            onClick={() => setShowFiltersPanel(!showFiltersPanel)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            <Filter size={16} />
            <span>{showFiltersPanel ? t('common.hide_filters', 'Hide Filters') : t('common.show_filters', 'Show Filters')}</span>
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
        </div>
      </div>

      {showFiltersPanel && (
        <div className="filter-bar">
          <select 
            className="form-select" 
            value={filters.action} 
            onChange={e => setFilters(f => ({ ...f, action: e.target.value }))}
          >
            <option value="">{t('audit.all_actions', 'All Actions')}</option>
            <option value="created">{t('audit.action_created', 'Created')}</option>
            <option value="updated">{t('audit.action_updated', 'Updated')}</option>
            <option value="deleted">{t('audit.action_deleted', 'Deleted')}</option>
            <option value="suspended">{t('audit.action_suspended', 'Suspended')}</option>
            <option value="approved">{t('audit.action_approved', 'Approved')}</option>
            <option value="rejected">{t('audit.action_rejected', 'Rejected')}</option>
            <option value="paid">{t('payouts.status_paid', 'Paid')}</option>
            <option value="closed">{t('common.status_closed', 'Closed')}</option>
          </select>
          
          <select 
            className="form-select" 
            value={filters.entity_type} 
            onChange={e => setFilters(f => ({ ...f, entity_type: e.target.value }))}
          >
            <option value="">{t('audit.all_entities', 'All Entities')}</option>
            <option value="Publisher">{t('common.publisher', 'Publisher')}</option>
            <option value="Website">{t('audit.entity_website', 'Website')}</option>
            <option value="AdUnit">{t('audit.entity_ad_unit', 'Ad Unit')}</option>
            <option value="Setting">{t('audit.entity_setting', 'Setting')}</option>
            <option value="Payout">{t('audit.entity_payout', 'Payout')}</option>
            <option value="PeriodClosing">{t('audit.entity_period_closing', 'Period Closing')}</option>
          </select>
        </div>
      )}

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          {loading ? (
            <div className="empty-state"><div className="spinner"></div></div>
          ) : logs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><ClipboardList size={40} /></div>
              <div className="empty-state-text">{t('audit.no_logs', 'No audit logs found')}</div>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>{t('audit.col_timestamp', 'Timestamp')}</th>
                  <th>{t('audit.col_admin', 'Admin')}</th>
                  <th>{t('audit.col_action', 'Action')}</th>
                  <th>{t('audit.col_entity', 'Entity')}</th>
                  <th>{t('audit.col_changes', 'Changes (Diff)')}</th>
                  <th>{t('audit.col_ip', 'IP Address')}</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(log => (
                  <tr key={log.id}>
                    <td className="text-sm">{formatDateTime(log.created_at)}</td>
                    <td>
                      {log.user ? (
                        <div>
                          <div style={{ fontWeight: 500 }}>{log.user.name}</div>
                          <div className="text-xs text-muted">{log.user.email}</div>
                        </div>
                      ) : (
                        <span className="badge badge-inactive">{t('audit.system', 'System')}</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${badgeClass[log.action] || 'badge-pending'}`}>
                        {log.action.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{log.entity_type}</div>
                      <code style={{ fontSize: 11, color: 'var(--color-primary-light)' }}>
                        {log.entity_id?.slice(0,8)}…
                      </code>
                    </td>
                    <td style={{ maxWidth: 300, whiteSpace: 'normal', wordBreak: 'break-all' }}>
                      <details>
                        <summary className="text-sm" style={{ cursor: 'pointer', color: 'var(--color-primary)' }}>
                          {t('audit.view_payload', 'View Payload')}
                        </summary>
                        <div style={{ marginTop: 8, padding: 8, background: 'var(--color-bg)', borderRadius: 4 }}>
                          {log.old_values && (
                            <div style={{ marginBottom: 8 }}>
                              <div className="text-xs text-muted">{t('audit.old_label', 'Old')}:</div>
                              <pre style={{ fontSize: 10, margin: 0, color: '#ef4444' }}>
                                {JSON.stringify(log.old_values, null, 2)}
                              </pre>
                            </div>
                          )}
                          {log.new_values && (
                            <div>
                              <div className="text-xs text-muted">{t('audit.new_label', 'New')}:</div>
                              <pre style={{ fontSize: 10, margin: 0, color: '#10b981' }}>
                                {JSON.stringify(log.new_values, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </details>
                    </td>
                    <td className="text-xs text-muted">{log.ip_address}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <Pagination
          currentPage={page}
          totalItems={logs.length}
          pageSize={15}
          onPageChange={setPage}
        />
      </div>
    </div>
  )
}
