import { useState, useEffect } from 'react'
import { publisherApi } from '../../api/endpoints'
import { useAuth } from '../../contexts/AuthContext'
import { useSettings } from '../../contexts/SettingsContext'
import { useI18n } from '../../contexts/I18nContext'
import toast from 'react-hot-toast'
import Pagination from '../../components/Pagination'
import CompactAmount from '../../components/CompactAmount'
import { CreditCard, DollarSign, Clock, CheckCircle, XCircle, TrendingUp, Ban, Filter } from 'lucide-react'

export default function PublisherPayouts() {
  const { user } = useAuth()
  const { formatDate } = useSettings()
  const { t } = useI18n()
  const [payouts, setPayouts] = useState([])
  const [aggregates, setAggregates] = useState(null)
  const [pendingAdjustment, setPendingAdjustment] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  // Filters (client-side — all payouts already loaded)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterYear,   setFilterYear]   = useState('')
  const [filterMonth,  setFilterMonth]  = useState('')
  const [showFiltersPanel, setShowFiltersPanel] = useState(false)

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
      .catch(() => toast.error(t('payouts.toast_failed', 'Failed to load payouts')))
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

  const activeFiltersCount = [filterStatus, filterYear, filterMonth].filter(Boolean).length

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <CreditCard size={24} style={{ color: 'var(--br-primary)' }} />
            {t('payouts.title', 'My Payouts')}
          </h1>
          <p className="page-subtitle">
            {filteredPayouts.length === payouts.length
              ? t('payouts.count', '{count} payouts', { count: payouts.length })
              : t('payouts.count_filtered', '{filtered} of {total} payouts', { filtered: filteredPayouts.length, total: payouts.length })}
            {' · '}<CompactAmount value={totalPaid} /> {t('payouts.total_paid', 'total paid')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button 
            className="btn btn-secondary" 
            onClick={() => setShowFiltersPanel(!showFiltersPanel)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            <Filter size={16} />
            <span>{showFiltersPanel ? t('dashboard.filters.hide', 'Hide Filters') : t('dashboard.filters.show', 'Show Filters')}</span>
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

      {/* Filters */}
      {showFiltersPanel && (
        <div className="glass-card" style={{ marginBottom: 16, padding: '14px 20px', position: 'relative', zIndex: 10 }}>
          <div className="responsive-filters">

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>{t('revenue.filters.status', 'Status')}</label>
            <select
              className="form-select"
              style={{ padding: '6px 10px', fontSize: 13 }}
              value={filterStatus}
              onChange={e => { setFilterStatus(e.target.value); setPage(1) }}
            >
              <option value="">{t('revenue.status.all', 'All Statuses')}</option>
              <option value="pending">{t('dashboard.status.pending', 'Pending')}</option>
              <option value="approved">{t('dashboard.status.approved', 'Approved')}</option>
              <option value="paid">{t('landing.proofs.paid', 'Paid')}</option>
              <option value="rejected">{t('payouts.status.rejected', 'Rejected')}</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>{t('payouts.filters.year', 'Year')}</label>
            <select
              className="form-select"
              style={{ padding: '6px 10px', fontSize: 13 }}
              value={filterYear}
              onChange={e => { setFilterYear(e.target.value); setFilterMonth(''); setPage(1) }}
            >
              <option value="">{t('payouts.years.all', 'All Years')}</option>
              {uniqueYears.map(y => (
                <option key={y} value={String(y)}>{y}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>{t('payouts.filters.month', 'Month')}</label>
            <select
              className="form-select"
              style={{ padding: '6px 10px', fontSize: 13 }}
              value={filterMonth}
              onChange={e => { setFilterMonth(e.target.value); setPage(1) }}
            >
              <option value="">{t('payouts.months.all', 'All Months')}</option>
              <option value="1">{t('common.months.jan', 'January')}</option>
              <option value="2">{t('common.months.feb', 'February')}</option>
              <option value="3">{t('common.months.mar', 'March')}</option>
              <option value="4">{t('common.months.apr', 'April')}</option>
              <option value="5">{t('common.months.may', 'May')}</option>
              <option value="6">{t('common.months.jun', 'June')}</option>
              <option value="7">{t('common.months.jul', 'July')}</option>
              <option value="8">{t('common.months.aug', 'August')}</option>
              <option value="9">{t('common.months.sep', 'September')}</option>
              <option value="10">{t('common.months.oct', 'October')}</option>
              <option value="11">{t('common.months.nov', 'November')}</option>
              <option value="12">{t('common.months.dec', 'December')}</option>
            </select>
          </div>

          {(filterStatus || filterYear || filterMonth) && (
            <div className="flex-btn">
              <button
                className="btn btn-secondary"
                style={{ width: '100%', padding: '10px 16px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                onClick={handleResetFilters}
              >
                <Ban size={16} />
                {t('common.reset', 'Reset')}
              </button>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 24 }}>
        <div className="stat-card primary">
          <div className="stat-icon"><CreditCard size={20} /></div>
          <div className="stat-label">{t('payouts.stats.total_paid', 'Total Paid Out')}</div>
          <div className="stat-value money"><CompactAmount value={totalPaid} /></div>
          <div className="stat-sub">{t('payouts.stats.paid_count', '{count} paid payouts', { count: payouts.filter(p => p.status === 'paid').length })}</div>
        </div>
        <div className="stat-card accent">
          <div className="stat-icon"><DollarSign size={20} /></div>
          <div className="stat-label">{t('dashboard.stats.available_balance', 'Available Balance')}</div>
          <div className="stat-value money">
            <CompactAmount value={availableBalance} />
          </div>
          <div className="stat-sub">{t('payouts.stats.available_sub', 'Approved & awaiting next payment cycle')}</div>
        </div>
      </div>

      {/* Payouts Table */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div>
          {filteredPayouts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon" style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                <CreditCard size={40} style={{ color: 'var(--br-text-3)', opacity: 0.6 }} />
              </div>
              <div className="empty-state-text">{t('payouts.table.no_data', 'No payouts yet')}</div>
              <div className="empty-state-sub">{t('payouts.table.no_data_desc', 'Payouts are generated at end of each month')}</div>
            </div>
          ) : (
            <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>{t('payouts.table.period', 'Period')}</th>
                    <th>{t('payouts.table.base_amount', 'Base Amount')}</th>
                    <th>{t('payouts.table.adjustment', 'Adjustment')}</th>
                    <th>{t('payouts.table.final_amount', 'Final Amount')}</th>
                    <th>{t('payouts.table.method', 'Method / Account')}</th>
                    <th>{t('payouts.table.status', 'Status')}</th>
                    <th>{t('payouts.table.reference', 'Reference')}</th>
                    <th>{t('payouts.table.paid_at', 'Paid At')}</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map(p => (
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
                          <span className={`badge ${statusBadge(p.status)}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            {p.status === 'pending'  && <><Clock size={12} /> {t('dashboard.status.pending', 'Pending')}</>}
                            {p.status === 'approved' && <><CheckCircle size={12} /> {t('dashboard.status.approved', 'Approved')}</>}
                            {p.status === 'paid'     && <><DollarSign size={12} /> {t('landing.proofs.paid', 'Paid')}</>}
                            {p.status === 'rejected' && <><XCircle size={12} /> {t('payouts.status.rejected', 'Rejected')}</>}
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
                              <span style={{ fontWeight: 700 }}>{t('payouts.rejection_reason', 'Reason:')} </span>
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
                  ))}
                </tbody>
                {filteredPayouts.length > 0 && (
                  <tfoot>
                    <tr style={{ background: 'rgba(99,102,241,.07)', fontWeight: 700, borderTop: '2px solid var(--color-border)' }}>
                      <td style={{ padding: '10px 16px', fontSize: 12 }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <TrendingUp size={14} style={{ color: 'var(--br-accent)' }} />
                          <span>{t('payouts.table.totals_count', 'Totals ({count})', { count: filteredPayouts.length })}</span>
                        </div>
                      </td>
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
            </div>
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
