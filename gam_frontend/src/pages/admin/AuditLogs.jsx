import { useState, useEffect } from 'react'
import { adminApi } from '../../api/endpoints'
import toast from 'react-hot-toast'
import Pagination from '../../components/Pagination'

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ action: '', entity_type: '' })
  const [page, setPage] = useState(1)

  useEffect(() => { load() }, [filters])

  async function load() {
    setLoading(true)
    try {
      const params = {}
      if (filters.action) params.action = filters.action
      if (filters.entity_type) params.entity_type = filters.entity_type
      
      const res = await adminApi.getAuditLogs(params)
      setLogs(res.data?.data || [])
    } catch { toast.error('Failed to load audit logs') }
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

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">📜 Audit Logs</h1>
          <p className="page-subtitle">Track admin and system actions</p>
        </div>
      </div>

      <div className="filter-bar">
        <select 
          className="form-select" 
          value={filters.action} 
          onChange={e => setFilters(f => ({ ...f, action: e.target.value }))}
        >
          <option value="">All Actions</option>
          <option value="created">Created</option>
          <option value="updated">Updated</option>
          <option value="deleted">Deleted</option>
          <option value="suspended">Suspended</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="paid">Paid</option>
          <option value="closed">Closed</option>
        </select>
        
        <select 
          className="form-select" 
          value={filters.entity_type} 
          onChange={e => setFilters(f => ({ ...f, entity_type: e.target.value }))}
        >
          <option value="">All Entities</option>
          <option value="Publisher">Publisher</option>
          <option value="Website">Website</option>
          <option value="AdUnit">Ad Unit</option>
          <option value="Setting">Setting</option>
          <option value="Payout">Payout</option>
          <option value="PeriodClosing">Period Closing</option>
        </select>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-container">
          {loading ? (
            <div className="empty-state"><div className="spinner"></div></div>
          ) : logs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📜</div>
              <div className="empty-state-text">No audit logs found</div>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Admin</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Changes (Diff)</th>
                  <th>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(log => (
                  <tr key={log.id}>
                    <td className="text-sm">{log.created_at?.slice(0, 16).replace('T', ' ')}</td>
                    <td>
                      {log.user ? (
                        <div>
                          <div style={{ fontWeight: 500 }}>{log.user.name}</div>
                          <div className="text-xs text-muted">{log.user.email}</div>
                        </div>
                      ) : (
                        <span className="badge badge-inactive">System</span>
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
                          View Payload
                        </summary>
                        <div style={{ marginTop: 8, padding: 8, background: 'var(--color-bg)', borderRadius: 4 }}>
                          {log.old_values && (
                            <div style={{ marginBottom: 8 }}>
                              <div className="text-xs text-muted">Old:</div>
                              <pre style={{ fontSize: 10, margin: 0, color: '#ef4444' }}>
                                {JSON.stringify(log.old_values, null, 2)}
                              </pre>
                            </div>
                          )}
                          {log.new_values && (
                            <div>
                              <div className="text-xs text-muted">New:</div>
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
