import { useState, useEffect } from 'react'
import { adminApi } from '../../api/endpoints'
import toast from 'react-hot-toast'
import Pagination from '../../components/Pagination'

function CloseModal({ onClose, onDone }) {
  const now = new Date()
  const [year, setYear]   = useState(now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() === 0 ? 12 : now.getMonth())
  const [closing, setClosing] = useState(false)

  async function handleClose() {
    if (!confirm(`Close period ${year}-${String(month).padStart(2,'0')}? This is irreversible.`)) return
    setClosing(true)
    try {
      await adminApi.closePeriod(year, month)
      toast.success(`Period ${year}-${month} closed and payouts generated!`)
      onDone()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to close period')
    } finally { setClosing(false) }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">📅 Close Financial Period</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="alert alert-warning">
          ⚠️ Closing a period <strong>locks</strong> all revenue records for that month and
          auto-generates payout records for all publishers. This action cannot be undone.
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Year</label>
            <input className="form-input" type="number" value={year}
              onChange={e => setYear(parseInt(e.target.value))} />
          </div>
          <div className="form-group">
            <label className="form-label">Month</label>
            <select className="form-select" value={month}
              onChange={e => setMonth(parseInt(e.target.value))}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <option key={m} value={m}>
                  {new Date(2000, m-1).toLocaleString('default', { month: 'long' })} ({m})
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button id="confirm-close-period-btn" className="btn btn-danger" onClick={handleClose} disabled={closing}>
            {closing ? 'Closing…' : '🔒 Close Period & Generate Payouts'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function PeriodClosingsPage() {
  const [closings, setClosings] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [detail, setDetail] = useState(null)
  const [page, setPage] = useState(1)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const res = await adminApi.getPeriodClosings()
      setClosings(res.data?.data || [])
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }

  const paginatedClosings = closings.slice((page - 1) * 15, page * 15)

  async function loadDetail(id) {
    try {
      const res = await adminApi.getPeriodClosing(id)
      setDetail(res.data)
    } catch { toast.error('Failed to load period detail') }
  }

  async function handleDelete(id, year, month) {
    if (!confirm(`Are you sure you want to DELETE period ${year}-${String(month).padStart(2,'0')}?\n\nThis will permanently delete generated payouts, reset manual adjustments back to pending, and UNLOCK all revenue records for this month so they can be closed again.\n\nThis action cannot be undone.`)) return
    try {
      await adminApi.deletePeriodClosing(id)
      toast.success(`Period ${year}-${month} deleted successfully!`)
      if (detail?.closing?.id === id) {
        setDetail(null)
      }
      load()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to delete period closing')
    }
  }

  const monthLabel = (y, m) => `${new Date(y, m-1).toLocaleString('default', { month: 'long' })} ${y}`

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">📅 Period Closings</h1>
          <p className="page-subtitle">Financial month-end closing system</p>
        </div>
        <button id="open-close-period-btn" className="btn btn-danger" onClick={() => setShowModal(true)}>
          🔒 Close a Period
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: detail ? '1fr 1fr' : '1fr', gap: 24 }}>
        <div className="card" style={{ padding: 0 }}>
          <div className="table-container">
            {loading ? <div className="empty-state"><div className="spinner"></div></div> : (
              <table className="table">
                <thead><tr>
                  <th>Period</th><th>Status</th>
                  <th>Total Gross</th><th>Pub. Earnings</th><th>Total Payouts</th><th>Impressions</th><th>Closed At</th><th></th>
                </tr></thead>
                <tbody>
                  {closings.length === 0 && (
                    <tr><td colSpan={8}>
                      <div className="empty-state">
                        <div className="empty-state-icon">📅</div>
                        <div className="empty-state-text">No closed periods yet</div>
                        <div className="empty-state-sub">Use the button above to close a financial period</div>
                      </div>
                    </td></tr>
                  )}
                    {paginatedClosings.map(c => (
                      <tr key={c.id}>
                        <td style={{ fontWeight: 700 }}>{monthLabel(c.period_year, c.period_month)}</td>
                        <td>
                          <span className={`badge ${c.status === 'closed' ? 'badge-closed' : 'badge-pending'}`}>
                            {c.status === 'closed' ? '🔒 Closed' : '🔄 ' + c.status}
                          </span>
                        </td>
                        <td className="money positive">${parseFloat(c.total_gross_revenue || 0).toFixed(2)}</td>
                        <td className="money positive">${parseFloat(c.total_publisher_earnings || 0).toFixed(2)}</td>
                        <td className="money positive" style={{ fontWeight: 700, color: 'var(--color-accent)' }}>
                          ${parseFloat(c.payouts_sum_final_amount || 0).toFixed(2)}
                        </td>
                        <td className="money">{parseInt(c.total_impressions || 0).toLocaleString()}</td>
                        <td className="text-sm text-muted">{c.closed_at?.slice(0,10) || '—'}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn btn-secondary btn-xs" onClick={() => loadDetail(c.id)}>
                              👁 View
                            </button>
                            <button className="btn btn-danger btn-xs" onClick={() => handleDelete(c.id, c.period_year, c.period_month)}>
                              🗑 Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <Pagination
              currentPage={page}
              totalItems={closings.length}
              pageSize={15}
              onPageChange={setPage}
            />
          </div>

        {detail && (
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">
                  {monthLabel(detail.closing.period_year, detail.closing.period_month)} — Breakdown
                </div>
              </div>
              <button className="modal-close" onClick={() => setDetail(null)}>×</button>
            </div>
            {detail.payouts?.length === 0 ? (
              <div className="empty-state">No payouts for this period</div>
            ) : (
              <table className="table">
                <thead><tr><th>Publisher</th><th>Earnings</th><th>Status</th></tr></thead>
                <tbody>
                  {(detail.payouts || []).map(p => (
                    <tr key={p.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{p.publisher?.name}</div>
                        <div className="text-muted text-sm">{p.publisher?.email}</div>
                      </td>
                      <td className="money positive" style={{ fontWeight: 700 }}>
                        ${parseFloat(p.final_amount).toFixed(2)}
                      </td>
                      <td>
                        <span className={`badge badge-${p.status}`}>
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <CloseModal
          onClose={() => setShowModal(false)}
          onDone={() => { setShowModal(false); load() }}
        />
      )}
    </div>
  )
}
