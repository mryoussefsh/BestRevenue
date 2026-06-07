import { useState, useEffect } from 'react'
import { publisherApi } from '../../api/endpoints'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'
import Pagination from '../../components/Pagination'

export default function PublisherPayouts() {
  const { user } = useAuth()
  const [payouts, setPayouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  useEffect(() => {
    publisherApi.getPayouts()
      .then(r => setPayouts(r.data?.data || []))
      .catch(() => toast.error('Failed to load payouts'))
      .finally(() => setLoading(false))
  }, [])

  const paginated = payouts.slice((page - 1) * 15, page * 15)

  const totalPaid = payouts
    .filter(p => p.status === 'paid')
    .reduce((s, p) => s + parseFloat(p.final_amount || 0), 0)

  const statusBadge = s => ({
    pending: 'badge-pending', approved: 'badge-approved',
    paid: 'badge-paid', rejected: 'badge-rejected',
  })[s] || 'badge-inactive'

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">💳 My Payouts</h1>
          <p className="page-subtitle">{payouts.length} payouts · ${totalPaid.toFixed(2)} total paid</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 24 }}>
        <div className="stat-card accent">
          <div className="stat-label">Total Paid Out</div>
          <div className="stat-value money">${totalPaid.toFixed(2)}</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-label">Pending</div>
          <div className="stat-value">
            {payouts.filter(p => p.status === 'pending').length}
          </div>
        </div>
        <div className="stat-card info">
          <div className="stat-label">Approved (Upcoming)</div>
          <div className="stat-value">
            {payouts.filter(p => p.status === 'approved').length}
          </div>
        </div>
        <div className="stat-card primary">
          <div className="stat-label">Upcoming Adjustment</div>
          <div className="stat-value money" style={{ color: (user?.pending_balance || 0) >= 0 ? 'var(--color-accent)' : 'var(--color-warning)' }}>
            {(user?.pending_balance || 0) >= 0 ? '+' : ''}${(user?.pending_balance || 0).toFixed(2)}
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-container">
          {payouts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">💳</div>
              <div className="empty-state-text">No payouts yet</div>
              <div className="empty-state-sub">Payouts are generated at end of each month</div>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Base Amount</th>
                  <th>Adjustment</th>
                  <th>Final Amount</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th>Reference</th>
                  <th>Paid At</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(p => (
                  <tr key={p.id}>
                    <td className="money" style={{ fontWeight: 700 }}>
                      {p.period_year}-{String(p.period_month).padStart(2,'0')}
                    </td>
                    <td className="money">${parseFloat(p.amount).toFixed(2)}</td>
                    <td className={`money ${parseFloat(p.adjustment) >= 0 ? 'positive' : 'negative'}`}>
                      {parseFloat(p.adjustment) >= 0 ? '+' : ''}${parseFloat(p.adjustment).toFixed(2)}
                    </td>
                    <td className="money positive" style={{ fontWeight: 800, fontSize: 16 }}>
                      ${parseFloat(p.final_amount).toFixed(2)}
                    </td>
                    <td className="text-sm text-muted">{p.payment_method || '—'}</td>
                    <td>
                      <span className={`badge ${statusBadge(p.status)}`}>
                        {p.status === 'pending'  && '⏳ Pending'}
                        {p.status === 'approved' && '✅ Approved'}
                        {p.status === 'paid'     && '💰 Paid'}
                        {p.status === 'rejected' && '❌ Rejected'}
                      </span>
                    </td>
                    <td>
                      {p.payment_reference
                        ? <code style={{ fontSize: 12 }}>{p.payment_reference}</code>
                        : <span className="text-muted text-xs">—</span>}
                    </td>
                    <td className="text-sm text-muted">
                      {p.paid_at ? p.paid_at.slice(0,10) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <Pagination
          currentPage={page}
          totalItems={payouts.length}
          pageSize={15}
          onPageChange={setPage}
        />
      </div>
    </div>
  )
}
