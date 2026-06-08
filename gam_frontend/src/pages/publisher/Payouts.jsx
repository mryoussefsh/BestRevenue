import { useState, useEffect } from 'react'
import { publisherApi } from '../../api/endpoints'
import { useAuth } from '../../contexts/AuthContext'
import { useSettings } from '../../contexts/SettingsContext'
import toast from 'react-hot-toast'
import Pagination from '../../components/Pagination'

export default function PublisherPayouts() {
  const { user, updatePaymentInfo } = useAuth()
  const { settings } = useSettings()
  const [payouts, setPayouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  const [method, setMethod] = useState(user?.payment_info?.method || '')
  const [account, setAccount] = useState(user?.payment_info?.account || '')
  const [savingPayment, setSavingPayment] = useState(false)

  async function handleSavePayment(e) {
    e.preventDefault()
    if (!method) return toast.error('Please select a payment method')
    if (!account.trim()) return toast.error('Please provide payment account details')

    setSavingPayment(true)
    try {
      console.log('Sending payment update request:', { method, account })
      const res = await publisherApi.updatePaymentInfo({ method, account })
      console.log('Payment update API success:', res.data)
      
      if (typeof updatePaymentInfo === 'function') {
        updatePaymentInfo({ method, account })
      } else {
        console.warn('updatePaymentInfo is not a function in AuthContext')
      }
      
      toast.success('Payment details updated successfully!')
    } catch (err) {
      console.error('Failed to update payment details:', err)
      if (err.response) {
        console.error('API Error Response Status:', err.response.status)
        console.error('API Error Response Data:', err.response.data)
      }
      const errMsg = err.response?.data?.message || err.message || 'Failed to update payment details'
      toast.error(errMsg)
    } finally {
      setSavingPayment(false)
    }
  }

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

      {/* Payout Details Settings */}
      <div className="card" style={{ marginTop: 24 }}>
        <div className="card-header">
          <div className="card-title">🏦 Payment Method Settings</div>
        </div>
        <form onSubmit={handleSavePayment} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20 }}>
            <div>
              <label className="form-label">Payout Method *</label>
              <select
                className="form-select"
                value={method}
                onChange={e => setMethod(e.target.value)}
                required
              >
                <option value="">-- Select Payout Method --</option>
                {(settings.payment_methods || []).map(m => {
                  const name = typeof m === 'object' && m !== null ? m.name : m
                  return <option key={name} value={name}>{name}</option>
                })}
              </select>
            </div>
            <div>
              <label className="form-label">Payment Account Details *</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Paste your bank details, PayPal address, or cryptocurrency keys here..."
                value={account}
                onChange={e => setAccount(e.target.value)}
                required
              />
            </div>
          </div>

          {(() => {
            const selected = (settings.payment_methods || []).find(m => {
              const name = typeof m === 'object' && m !== null ? m.name : m
              return name === method
            })
            if (!selected) return null
            const isObject = typeof selected === 'object' && selected !== null
            const name = isObject ? selected.name : selected
            const guidance = isObject ? selected.guidance : 'Please provide your account details.'
            const minimum = isObject ? parseFloat(selected.minimum || 0) : 50.00

            return (
              <div style={{
                background: 'var(--color-surface-2)',
                borderLeft: '4px solid var(--color-primary)',
                padding: '12px 16px',
                borderRadius: '0 var(--radius-md) var(--radius-md) 0',
                fontSize: '13px'
              }}>
                <div style={{ fontWeight: 600, color: 'var(--color-primary-light)', marginBottom: 4 }}>
                  💡 {name} Instructions
                </div>
                <div style={{ color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                  {guidance}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                  Minimum payout amount: <strong>${minimum.toFixed(2)}</strong>
                </div>
              </div>
            )
          })()}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ alignSelf: 'flex-start' }}
            disabled={savingPayment}
          >
            {savingPayment ? 'Saving...' : '💾 Save Payment Details'}
          </button>
        </form>
      </div>
    </div>
  )
}
