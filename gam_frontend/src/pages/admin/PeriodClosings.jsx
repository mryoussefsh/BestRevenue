import { useState, useEffect } from 'react'
import { adminApi } from '../../api/endpoints'
import toast from 'react-hot-toast'
import Pagination from '../../components/Pagination'
import { useSettings } from '../../contexts/SettingsContext'
import CompactAmount from '../../components/CompactAmount'
import { Calendar, Lock, Eye, Trash2, RefreshCw, AlertTriangle } from 'lucide-react'

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
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} style={{ color: 'var(--br-primary)' }} />
            <span>Close Financial Period</span>
          </span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="alert alert-warning" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertTriangle size={20} style={{ color: 'var(--color-warning)', flexShrink: 0 }} />
          <div>
            Closing a period <strong>locks</strong> all revenue records for that month and
            auto-generates payout records for all publishers. This action cannot be undone.
          </div>
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
          <button id="confirm-close-period-btn" className="btn btn-danger" onClick={handleClose} disabled={closing} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Lock size={14} />
            <span>{closing ? 'Closing…' : 'Close Period & Generate Payouts'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}function BreakdownModal({ detail, onClose }) {
  if (!detail) return null

  const monthLabel = (y, m) => `${new Date(y, m-1).toLocaleString('default', { month: 'long' })} ${y}`

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '600px', width: '95%' }}>
        <div className="modal-header">
          <span className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} style={{ color: 'var(--br-primary)' }} />
            <span>{monthLabel(detail.closing.period_year, detail.closing.period_month)} — Breakdown</span>
          </span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto', padding: 0 }}>
          {detail.payouts?.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 20px' }}>No payouts for this period</div>
          ) : (
            <div className="table-wrap" style={{ border: 'none', borderRadius: 0, margin: 0 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Publisher</th>
                    <th>Earnings</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(detail.payouts || []).map(p => (
                    <tr key={p.id}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 600 }}>{p.publisher?.name}</div>
                        <div className="text-muted text-sm">{p.publisher?.email}</div>
                      </td>
                      <td className="money positive" style={{ fontWeight: 700, padding: '12px 16px' }}>
                        <CompactAmount value={p.final_amount} />
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span className={`badge badge-${p.status}`}>
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: 'rgba(99,102,241,.07)', fontWeight: 700 }}>
                    <td style={{ padding: '12px 16px', fontSize: 12 }}>Totals ({detail.payouts.length})</td>
                    <td className="money positive" style={{ fontWeight: 700, padding: '12px 16px' }}>
                      <CompactAmount value={detail.payouts.reduce((s, p) => s + parseFloat(p.final_amount || 0), 0)} />
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
        <div className="modal-footer" style={{ padding: '12px 24px' }}>
          <button className="btn btn-secondary" onClick={onClose} style={{ width: '100%' }}>Close</button>
        </div>
      </div>
    </div>
  )
}

export default function PeriodClosingsPage() {
  const { formatDate } = useSettings()
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
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={28} style={{ color: 'var(--br-primary)' }} />
            <span>Period Closings</span>
          </h1>
          <p className="page-subtitle">Financial month-end closing system</p>
        </div>
        <button id="open-close-period-btn" className="btn btn-danger" onClick={() => setShowModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Lock size={16} /> Close a Period
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24, minWidth: 0 }}>
        <div className="card" style={{ padding: 0, overflow: 'hidden', minWidth: 0 }}>
          <div className="table-wrap">
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
                        <div className="empty-state-icon"><Calendar size={40} style={{ color: 'var(--br-text-2)' }} /></div>
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
                            {c.status === 'closed' ? (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <Lock size={12} />
                                Closed
                              </span>
                            ) : (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <RefreshCw size={12} />
                                {c.status}
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="money positive"><CompactAmount value={c.total_gross_revenue || 0} /></td>
                        <td className="money positive"><CompactAmount value={c.total_publisher_earnings || 0} /></td>
                        <td className="money positive" style={{ fontWeight: 700, color: 'var(--color-accent)' }}>
                          <CompactAmount value={c.payouts_sum_final_amount || 0} />
                        </td>
                        <td className="money">
                          <CompactAmount value={c.total_impressions || 0} prefix="" decimals={0} />
                        </td>
                        <td className="text-sm text-muted">{c.closed_at ? formatDate(c.closed_at) : '—'}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn btn-secondary btn-xs" onClick={() => loadDetail(c.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <Eye size={12} /> View
                            </button>
                            <button className="btn btn-danger btn-xs" onClick={() => handleDelete(c.id, c.period_year, c.period_month)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <Trash2 size={12} /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {closings.length > 0 && (
                    <tfoot>
                      <tr style={{ background: 'rgba(99,102,241,.07)', fontWeight: 700, borderTop: '2px solid var(--color-border)' }}>
                        <td style={{ padding: '10px 16px', fontSize: 12 }} colSpan={2}>Totals ({closings.length})</td>
                        <td className="money positive">
                          <CompactAmount value={closings.reduce((s, c) => s + parseFloat(c.total_gross_revenue || 0), 0)} />
                        </td>
                        <td className="money positive">
                          <CompactAmount value={closings.reduce((s, c) => s + parseFloat(c.total_publisher_earnings || 0), 0)} />
                        </td>
                        <td className="money positive" style={{ fontWeight: 700, color: 'var(--color-accent)' }}>
                          <CompactAmount value={closings.reduce((s, c) => s + parseFloat(c.payouts_sum_final_amount || 0), 0)} />
                        </td>
                        <td className="money">
                          <CompactAmount value={closings.reduce((s, c) => s + parseInt(c.total_impressions || 0), 0)} prefix="" decimals={0} />
                        </td>
                        <td colSpan={2}></td>
                      </tr>
                    </tfoot>
                  )}
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
      </div>

      {detail && (
        <BreakdownModal 
          detail={detail} 
          onClose={() => setDetail(null)} 
        />
      )}

      {showModal && (
        <CloseModal
          onClose={() => setShowModal(false)}
          onDone={() => { setShowModal(false); load() }}
        />
      )}
    </div>
  )
}
