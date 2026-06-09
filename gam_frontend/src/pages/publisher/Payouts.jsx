import { useState, useEffect } from 'react'
import { publisherApi } from '../../api/endpoints'
import { useAuth } from '../../contexts/AuthContext'
import { useSettings } from '../../contexts/SettingsContext'
import toast from 'react-hot-toast'
import Pagination from '../../components/Pagination'
import CompactAmount from '../../components/CompactAmount'

export default function PublisherPayouts() {
  const { user } = useAuth()
  const { formatDate } = useSettings()
  const [payouts, setPayouts] = useState([])
  const [aggregates, setAggregates] = useState(null)
  const [pendingAdjustment, setPendingAdjustment] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  // Filters (client-side — all payouts already loaded)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterYear,   setFilterYear]   = useState('')
  const [filterMonth,  setFilterMonth]  = useState('')


  useEffect(() => {
    Promise.all([
      publisherApi.getPayouts(),
      publisherApi.getRevenue({ per_page: 1000 }),
    ])
      .then(([payRes, revRes]) => {
        setPayouts(payRes.data?.data || [])
        setAggregates(revRes.data?.aggregates || null)
        setPendingAdjustment(revRes.data?.pending_balance_adjustment || 0)
      })
      .catch(() => toast.error('Failed to load payouts'))
      .finally(() => setLoading(false))
  }, [])

  // Derive unique years for the year filter dropdown
  const uniqueYears = [...new Set(payouts.map(p => p.period_year))].sort((a, b) => b - a)

  // Apply filters
  const filteredPayouts = payouts.filter(p => {
    if (filterStatus && p.status !== filterStatus) return false
    if (filterYear   && String(p.period_year)  !== filterYear)  return false
    if (filterMonth  && String(p.period_month) !== filterMonth) return false
    return true
  })

  const paginated = filteredPayouts.slice((page - 1) * 15, page * 15)

  // Summary cards always reflect ALL payouts (unfiltered)
  const totalPaid = payouts
    .filter(p => p.status === 'paid')
    .reduce((s, p) => s + parseFloat(p.final_amount || 0), 0)

  // Approved Earnings = revenue records approved/closed by admin, same value as shown on Dashboard.
  // Adjusted by any pending balance adjustments (e.g. manual payment deductions).
  const availableBalance = Math.max(0, (aggregates?.approved_earnings ?? 0) + pendingAdjustment)

  // Table totals follow the filtered set
  const totalBase  = filteredPayouts.reduce((s, p) => s + parseFloat(p.amount || 0), 0)
  const totalAdj   = filteredPayouts.reduce((s, p) => s + parseFloat(p.adjustment || 0), 0)
  const totalFinal = filteredPayouts.reduce((s, p) => s + parseFloat(p.final_amount || 0), 0)

  function handleResetFilters() {
    setFilterStatus('')
    setFilterYear('')
    setFilterMonth('')
    setPage(1)
  }

  const statusBadge = s => ({
    pending:  'badge-pending',
    approved: 'badge-approved',
    paid:     'badge-paid',
    rejected: 'badge-rejected',
  })[s] || 'badge-inactive'

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">💳 My Payouts</h1>
          <p className="page-subtitle">
            {filteredPayouts.length === payouts.length
              ? `${payouts.length} payouts`
              : `${filteredPayouts.length} of ${payouts.length} payouts`}
            {' · '}<CompactAmount value={totalPaid} /> total paid
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 16, padding: '14px 20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 160 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Status</label>
            <select
              className="form-select"
              style={{ padding: '6px 10px', fontSize: 13 }}
              value={filterStatus}
              onChange={e => { setFilterStatus(e.target.value); setPage(1) }}
            >
              <option value="">All Statuses</option>
              <option value="pending">⏳ Pending</option>
              <option value="approved">✅ Approved</option>
              <option value="paid">💰 Paid</option>
              <option value="rejected">❌ Rejected</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 120 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Year</label>
            <select
              className="form-select"
              style={{ padding: '6px 10px', fontSize: 13 }}
              value={filterYear}
              onChange={e => { setFilterYear(e.target.value); setFilterMonth(''); setPage(1) }}
            >
              <option value="">All Years</option>
              {uniqueYears.map(y => (
                <option key={y} value={String(y)}>{y}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 140 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Month</label>
            <select
              className="form-select"
              style={{ padding: '6px 10px', fontSize: 13 }}
              value={filterMonth}
              onChange={e => { setFilterMonth(e.target.value); setPage(1) }}
            >
              <option value="">All Months</option>
              <option value="1">January</option>
              <option value="2">February</option>
              <option value="3">March</option>
              <option value="4">April</option>
              <option value="5">May</option>
              <option value="6">June</option>
              <option value="7">July</option>
              <option value="8">August</option>
              <option value="9">September</option>
              <option value="10">October</option>
              <option value="11">November</option>
              <option value="12">December</option>
            </select>
          </div>

          {(filterStatus || filterYear || filterMonth) && (
            <button
              className="btn btn-secondary"
              style={{ marginTop: 18, padding: '6px 14px', fontSize: 13 }}
              onClick={handleResetFilters}
            >
              ✕ Reset
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(2,1fr)', marginBottom: 24 }}>
        <div className="stat-card accent">
          <div className="stat-label">Total Paid Out</div>
          <div className="stat-value money"><CompactAmount value={totalPaid} /></div>
          <div className="stat-sub">{payouts.filter(p => p.status === 'paid').length} paid payouts</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--color-success, #10b981)', background: 'linear-gradient(135deg, rgba(16,185,129,.08) 0%, var(--color-surface) 100%)' }}>
          <div className="stat-label">Available Balance</div>
          <div className="stat-value money" style={{ color: 'var(--color-success, #10b981)' }}>
            <CompactAmount value={availableBalance} />
          </div>
          <div className="stat-sub">Approved &amp; awaiting next payment cycle</div>
        </div>
      </div>

      {/* Payouts Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-container">
          {filteredPayouts.length === 0 ? (
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
                  <th>Method / Account</th>
                  <th>Status</th>
                  <th>Reference</th>
                  <th>Paid At</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(p => (
                  <>
                    <tr key={p.id}>
                      <td className="money" style={{ fontWeight: 700 }}>
                        {p.period_year}-{String(p.period_month).padStart(2,'0')}
                      </td>
                      <td className="money"><CompactAmount value={p.amount} /></td>
                      <td className={`money ${parseFloat(p.adjustment) >= 0 ? 'positive' : 'negative'}`}>
                        {parseFloat(p.adjustment) >= 0 ? '+' : ''}<CompactAmount value={p.adjustment} />
                      </td>
                      <td className="money positive" style={{ fontWeight: 800, fontSize: 16 }}>
                        <CompactAmount value={p.final_amount} />
                      </td>
                      <td>
                        {p.payment_method ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-text)' }}>
                              {p.payment_method}
                            </span>
                            {(() => {
                              const acct = p.payment_account || user?.payment_info?.account
                              if (!acct) return null
                              const display = acct.length > 40 ? acct.substring(0, 40) + '…' : acct
                              return (
                                <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                                  {display}
                                </span>
                              )
                            })()}
                          </div>
                        ) : (
                          <span className="text-muted text-xs">—</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <span className={`badge ${statusBadge(p.status)}`}>
                            {p.status === 'pending'  && '⏳ Pending'}
                            {p.status === 'approved' && '✅ Approved'}
                            {p.status === 'paid'     && '💰 Paid'}
                            {p.status === 'rejected' && '❌ Rejected'}
                          </span>
                          {p.status === 'rejected' && p.rejection_reason && (
                            <div style={{
                              fontSize: 11,
                              color: 'var(--color-danger, #ef4444)',
                              background: 'rgba(239,68,68,.08)',
                              border: '1px solid rgba(239,68,68,.2)',
                              borderRadius: 4,
                              padding: '3px 6px',
                              lineHeight: 1.4,
                              maxWidth: 180,
                              wordBreak: 'break-word',
                            }}>
                              <span style={{ fontWeight: 700 }}>Reason: </span>
                              {p.rejection_reason}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        {p.payment_reference
                          ? <code style={{ fontSize: 12 }}>{p.payment_reference}</code>
                          : <span className="text-muted text-xs">—</span>}
                      </td>
                      <td className="text-sm text-muted">
                        {p.paid_at ? formatDate(p.paid_at) : '—'}
                      </td>
                    </tr>
                  </>
                ))}
              </tbody>
              {filteredPayouts.length > 0 && (
                <tfoot>
                  <tr style={{ background: 'rgba(99,102,241,.07)', fontWeight: 700, borderTop: '2px solid var(--color-border)' }}>
                    <td style={{ padding: '10px 16px', fontSize: 12 }}>📊 Totals ({filteredPayouts.length})</td>
                    <td className="money"><CompactAmount value={totalBase} /></td>
                    <td className={`money ${totalAdj >= 0 ? 'positive' : 'negative'}`}>
                      {totalAdj >= 0 ? '+' : ''}<CompactAmount value={totalAdj} />
                    </td>
                    <td className="money positive" style={{ fontWeight: 800 }}>
                      <CompactAmount value={totalFinal} />
                    </td>
                    <td colSpan={4}></td>
                  </tr>
                </tfoot>
              )}
            </table>
          )}
        </div>
        <Pagination
          currentPage={page}
          totalItems={filteredPayouts.length}
          pageSize={15}
          onPageChange={setPage}
        />
      </div>
    </div>
  )
}
