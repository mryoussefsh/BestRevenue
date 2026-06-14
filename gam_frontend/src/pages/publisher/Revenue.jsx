import { useState, useEffect, useRef } from 'react'
import { publisherApi } from '../../api/endpoints'
import toast from 'react-hot-toast'
import Pagination from '../../components/Pagination'
import CompactAmount from '../../components/CompactAmount'
import { useSettings } from '../../contexts/SettingsContext'
import { useI18n } from '../../contexts/I18nContext'
import { DollarSign, FileText, Ban, TrendingUp, CheckCircle, Clock, Lock, Eye, Filter } from 'lucide-react'

const toLocalYYYYMMDD = (date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export default function PublisherRevenue() {
  const { settings } = useSettings()
  const { t } = useI18n()
  const [records, setRecords] = useState([])
  const [pendingAdjustment, setPendingAdjustment] = useState(0)
  const [payoutsSum, setPayoutsSum] = useState(0)
  const [aggregates, setAggregates] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    preset: '30d',
    date_from: toLocalYYYYMMDD(new Date(Date.now() - 30 * 86400000)),
    date_to: toLocalYYYYMMDD(new Date()),
    ad_unit_id: '',
    status: ''
  })
  const [showFiltersPanel, setShowFiltersPanel] = useState(false)
  const [page, setPage] = useState(1)
  const [sortField, setSortField] = useState('date')
  const [sortOrder, setSortOrder] = useState('desc')

  const getPlatformDate = () => {
    const timezone = settings.platform_timezone || 'UTC'
    try {
      const formatter = new Intl.DateTimeFormat('sv-SE', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
      const formatted = formatter.format(new Date())
      const parts = formatted.split('-')
      return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10))
    } catch (err) {
      console.error('Timezone offset error:', err)
      return new Date()
    }
  }

  const getPlatformDateStr = (daysAgo = 0) => {
    const timezone = settings.platform_timezone || 'UTC'
    try {
      const formatter = new Intl.DateTimeFormat('sv-SE', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
      const formatted = formatter.format(new Date())
      if (daysAgo === 0) {
        return formatted
      }
      const parts = formatted.split('-')
      const localDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10) - daysAgo)
      const y = localDate.getFullYear()
      const m = String(localDate.getMonth() + 1).padStart(2, '0')
      const d = String(localDate.getDate()).padStart(2, '0')
      return `${y}-${m}-${d}`
    } catch (err) {
      console.error('Timezone offset error:', err)
      return new Date(Date.now() - daysAgo * 86400000).toISOString().slice(0, 10)
    }
  }

  const getPresetDates = (preset) => {
    const platDate = getPlatformDate()
    let from = platDate
    let to = platDate

    if (preset === 'today') {
      from = platDate
      to = platDate
    } else if (preset === 'yesterday') {
      from = new Date(platDate.getFullYear(), platDate.getMonth(), platDate.getDate() - 1)
      to = new Date(platDate.getFullYear(), platDate.getMonth(), platDate.getDate() - 1)
    } else if (preset === '7d') {
      from = new Date(platDate.getFullYear(), platDate.getMonth(), platDate.getDate() - 7)
      to = platDate
    } else if (preset === '30d') {
      from = new Date(platDate.getFullYear(), platDate.getMonth(), platDate.getDate() - 30)
      to = platDate
    } else if (preset === 'this_month') {
      from = new Date(platDate.getFullYear(), platDate.getMonth(), 1)
      to = platDate
    } else if (preset === 'last_month') {
      from = new Date(platDate.getFullYear(), platDate.getMonth() - 1, 1)
      to = new Date(platDate.getFullYear(), platDate.getMonth(), 0)
    } else {
      return null
    }

    return {
      date_from: toLocalYYYYMMDD(from),
      date_to: toLocalYYYYMMDD(to)
    }
  }

  const handlePresetChange = (newPreset) => {
    const dates = getPresetDates(newPreset)
    if (dates) {
      setFilters(f => ({
        ...f,
        preset: newPreset,
        date_from: dates.date_from,
        date_to: dates.date_to
      }))
    } else {
      setFilters(f => ({ ...f, preset: newPreset }))
    }
  }

  const isFirstRun = useRef(true)

  // Re-align default/preset dates once settings.platform_timezone loads
  useEffect(() => {
    if (settings.platform_timezone) {
      const dates = getPresetDates(filters.preset || '30d')
      if (dates) {
        setFilters(f => ({
          ...f,
          date_from: dates.date_from,
          date_to: dates.date_to
        }))
      }
    }
  }, [settings.platform_timezone])

  // Initial load
  useEffect(() => {
    const dates = getPresetDates('30d')
    const initialFilters = {
      preset: '30d',
      date_from: dates ? dates.date_from : toLocalYYYYMMDD(new Date(Date.now() - 30 * 86400000)),
      date_to: dates ? dates.date_to : toLocalYYYYMMDD(new Date()),
      ad_unit_id: '',
      status: ''
    }
    
    setLoading(true)
    publisherApi.getRevenue(initialFilters).then(res => {
      setRecords(res.data?.data || [])
      setPendingAdjustment(res.data?.pending_balance_adjustment || 0)
      setPayoutsSum(res.data?.payouts_sum || 0)
      setAggregates(res.data?.aggregates || null)
      setPage(1)
      setLoading(false)
    }).catch(() => {
      toast.error(t('revenue.toast_failed', 'Failed to load revenue'))
      setLoading(false)
    })
  }, [])

  // Refetch when filters change (live updates)
  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false
      return
    }
    load()
  }, [filters.date_from, filters.date_to, filters.status])

  async function load() {
    setLoading(true)
    try {
      const res = await publisherApi.getRevenue(filters)
      setRecords(res.data?.data || [])
      setPendingAdjustment(res.data?.pending_balance_adjustment || 0)
      setPayoutsSum(res.data?.payouts_sum || 0)
      setAggregates(res.data?.aggregates || null)
      setPage(1)
    } catch { toast.error(t('revenue.toast_failed', 'Failed to load revenue')) }
    finally { setLoading(false) }
  }

  const handleResetFilters = () => {
    const dates = getPresetDates('30d')
    setFilters({
      preset: '30d',
      date_from: dates ? dates.date_from : toLocalYYYYMMDD(new Date(Date.now() - 30 * 86400000)),
      date_to: dates ? dates.date_to : toLocalYYYYMMDD(new Date()),
      ad_unit_id: '',
      status: ''
    })
  }

  function handleSort(field) {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const sortedRecords = [...records].sort((a, b) => {
    let valA = a[sortField]
    let valB = b[sortField]

    if (sortField === 'ad_unit') {
      valA = a.ad_unit?.display_name || ''
      valB = b.ad_unit?.display_name || ''
    } else if (['impressions', 'clicks', 'ctr', 'cpm', 'publisher_cpm', 'publisher_earnings'].includes(sortField)) {
      valA = parseFloat(valA || 0)
      valB = parseFloat(valB || 0)
    }

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1
    return 0
  })

  const paginated = sortedRecords.slice((page - 1) * 15, page * 15)

  const approvedEarningsTotal = aggregates ? aggregates.approved_earnings : 0
  const pendingEarningsTotal = aggregates ? aggregates.pending_earnings : 0
  const impressionsTotal = aggregates ? aggregates.total_impressions : 0

  const totalApprovedEarnings = Math.max(0, approvedEarningsTotal + pendingAdjustment)
  const totalPendingEarnings = pendingEarningsTotal
  const totalImpressions = impressionsTotal
  const totalEarningsCard = Math.max(0, approvedEarningsTotal + pendingAdjustment) + pendingEarningsTotal + payoutsSum

  const totalEarnings = aggregates ? (aggregates.approved_earnings + aggregates.pending_earnings + aggregates.closed_earnings) : 0
  const avgCtr = impressionsTotal > 0 ? (aggregates.total_clicks / impressionsTotal) * 100 : 0
  const avgCpm = impressionsTotal > 0 ? (totalEarnings / impressionsTotal) * 1000 : 0

  const handleExportPDF = async () => {
    try {
      const toastId = toast.loading(t('dashboard.toast_pdf_generating', 'Generating PDF statement...'))
      const res = await publisherApi.exportPdf(filters)
      
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.setAttribute('download', `earnings_statement_${filters.date_from}_to_${filters.date_to}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(downloadUrl)
      
      toast.dismiss(toastId)
      toast.success(t('dashboard.toast_pdf_success', 'PDF downloaded successfully'))
    } catch (err) {
      console.error(err)
      toast.error(t('dashboard.toast_pdf_failed', 'Failed to export PDF statement'))
    }
  }

  const activeFiltersCount = [
    filters.preset !== '30d',
    filters.ad_unit_id !== '',
    filters.status !== ''
  ].filter(Boolean).length

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <DollarSign size={24} style={{ color: 'var(--br-primary)' }} />
            {t('revenue.title', 'My Revenue')}
          </h1>
          <p className="page-subtitle">{t('revenue.subtitle', '{count} records', { count: records.length })}</p>
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
          <button
            className="btn btn-secondary"
            onClick={handleExportPDF}
            id="export-pdf-btn"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            <FileText size={16} />
            {t('revenue.export_pdf', 'Export PDF')}
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFiltersPanel && (
        <div className="glass-card" style={{ marginBottom: 24, padding: '16px 20px', position: 'relative', zIndex: 10 }}>
          <div className="responsive-filters">
          
          {/* Preset Selector */}
          <div>
            <label className="form-label" style={{ marginBottom: 4, fontSize: 12 }}>{t('dashboard.filters.time_range', 'Time Range')}</label>
            <select
              className="form-select"
              value={filters.preset}
              onChange={e => handlePresetChange(e.target.value)}
            >
              {!filters.preset && <option value="" disabled>{t('dashboard.filters.custom_range', 'Custom Range')}</option>}
              <option value="today">{t('dashboard.presets.today', 'Today')}</option>
              <option value="yesterday">{t('dashboard.presets.yesterday', 'Yesterday')}</option>
              <option value="7d">{t('dashboard.presets.7d', 'Last 7 Days')}</option>
              <option value="30d">{t('dashboard.presets.30d', 'Last 30 Days')}</option>
              <option value="this_month">{t('dashboard.presets.this_month', 'This Month')}</option>
              <option value="last_month">{t('dashboard.presets.last_month', 'Last Month')}</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="form-label" style={{ marginBottom: 4, fontSize: 12 }}>{t('dashboard.filters.start_date', 'Start Date')}</label>
            <input
              type="date"
              className="form-input"
              value={filters.date_from}
              onChange={e => setFilters(f => ({ ...f, date_from: e.target.value, preset: '' }))}
            />
          </div>

          {/* End Date */}
          <div>
            <label className="form-label" style={{ marginBottom: 4, fontSize: 12 }}>{t('dashboard.filters.end_date', 'End Date')}</label>
            <input
              type="date"
              className="form-input"
              value={filters.date_to}
              onChange={e => setFilters(f => ({ ...f, date_to: e.target.value, preset: '' }))}
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="form-label" style={{ marginBottom: 4, fontSize: 12 }}>{t('revenue.filters.status', 'Status')}</label>
            <select
              className="form-select"
              value={filters.status}
              onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
            >
              <option value="">{t('revenue.status.all', 'All Statuses')}</option>
              <option value="approved">{t('dashboard.status.approved', 'Approved')}</option>
              <option value="pending">{t('dashboard.status.pending', 'Pending')}</option>
              <option value="closed">{t('revenue.status.closed', 'Closed')}</option>
            </select>
          </div>

          {/* Reset Button */}
          {(filters.preset !== '30d' || filters.ad_unit_id !== '' || filters.status !== '') && (
            <div className="flex-btn">
              <button
                id="reset-pub-revenue-filter-btn"
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 24 }}>
        <div className="stat-card primary">
          <div className="stat-icon"><TrendingUp size={20} /></div>
          <div className="stat-label">{t('revenue.stats.total_earnings', 'Total Earnings')}</div>
          <div className="stat-value money"><CompactAmount value={totalEarningsCard} /></div>
        </div>
        <div className="stat-card accent">
          <div className="stat-icon"><DollarSign size={20} /></div>
          <div className="stat-label">{t('dashboard.stats.approved_earnings', 'Approved Earnings')}</div>
          <div className="stat-value money"><CompactAmount value={totalApprovedEarnings} /></div>
        </div>
        <div className="stat-card warning">
          <div className="stat-icon"><Clock size={20} /></div>
          <div className="stat-label">{t('dashboard.stats.pending_earnings', 'Pending Earnings')}</div>
          <div className="stat-value money"><CompactAmount value={totalPendingEarnings} /></div>
        </div>
        <div className="stat-card info">
          <div className="stat-icon"><Eye size={20} /></div>
          <div className="stat-label">{t('dashboard.stats.total_impressions', 'Total Impressions')}</div>
          <div className="stat-value">
            <CompactAmount value={totalImpressions} prefix="" decimals={0} />
          </div>
        </div>
      </div>

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div>
          {loading ? (
            <div className="empty-state"><div className="spinner"></div></div>
          ) : (
            <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('date')} style={{cursor: 'pointer'}}>{t('revenue.table.date', 'Date')} {sortField === 'date' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}</th>
                    <th onClick={() => handleSort('ad_unit')} style={{cursor: 'pointer'}}>{t('revenue.table.ad_unit', 'Ad Unit')} {sortField === 'ad_unit' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}</th>
                    <th onClick={() => handleSort('impressions')} style={{cursor: 'pointer'}}>{t('revenue.table.impressions', 'Impressions')} {sortField === 'impressions' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}</th>
                    <th onClick={() => handleSort('ctr')} style={{cursor: 'pointer'}}>{t('revenue.table.ctr', 'CTR')} {sortField === 'ctr' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}</th>
                    <th onClick={() => handleSort('publisher_cpm')} style={{cursor: 'pointer'}}>{t('revenue.table.cpm', 'My CPM')} {sortField === 'publisher_cpm' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}</th>
                    <th onClick={() => handleSort('publisher_earnings')} style={{cursor: 'pointer'}}>{t('revenue.table.earnings', 'My Earnings')} {sortField === 'publisher_earnings' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}</th>
                    <th>{t('revenue.table.status', 'Status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {records.length === 0 && (
                    <tr><td colSpan={9}>
                      <div className="empty-state">
                        <div className="empty-state-icon" style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                          <DollarSign size={40} style={{ color: 'var(--br-text-3)', opacity: 0.6 }} />
                        </div>
                        <div className="empty-state-text">{t('revenue.table.no_data', 'No revenue for this period')}</div>
                      </div>
                    </td></tr>
                  )}
                  {paginated.map(r => (
                    <tr key={r.id}>
                      <td className="text-sm">{r.date?.slice?.(0,10) || r.date}</td>
                      <td className="text-sm">
                        <div style={{ fontWeight: 600 }}>{r.ad_unit?.display_name || '—'}</div>
                        <div className="text-muted" style={{ fontSize: 11 }}>{r.ad_unit?.website?.domain}</div>
                      </td>
                      <td className="money">
                        <CompactAmount value={r.impressions} prefix="" decimals={0} />
                      </td>
                      <td className="money">{(parseFloat(r.ctr) * 100).toFixed(2)}%</td>
                      <td className="money">${parseFloat(r.publisher_cpm || 0).toFixed(3)}</td>
                      <td className="money positive" style={{ fontWeight: 700 }}>
                        <CompactAmount value={r.publisher_earnings} />
                      </td>
                      <td>
                        {r.is_closed ? (
                          <span className="badge badge-neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <Lock size={12} /> {t('revenue.status.closed', 'Closed')}
                          </span>
                        ) : r.approval_status === 'pending' ? (
                          <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <Clock size={12} /> {t('dashboard.status.pending', 'Pending')}
                          </span>
                        ) : (
                          <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <CheckCircle size={12} /> {t('dashboard.status.approved', 'Approved')}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                {records.length > 0 && (
                  <tfoot>
                    <tr style={{ background: 'rgba(99,102,241,.07)', fontWeight: 700, borderTop: '2px solid var(--color-border)' }}>
                      <td style={{ padding: '10px 16px', fontSize: 12 }} colSpan={2}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <TrendingUp size={14} style={{ color: 'var(--br-accent)' }} />
                          <span>{t('revenue.table.totals', 'Totals')}</span>
                        </div>
                      </td>
                      <td className="money">
                        <CompactAmount value={impressionsTotal} prefix="" decimals={0} />
                      </td>
                      <td className="money">{avgCtr.toFixed(2)}%</td>
                      <td className="money">${avgCpm.toFixed(3)}</td>
                      <td className="money positive" style={{ fontWeight: 700 }}>
                        <CompactAmount value={totalEarnings} />
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
        </div>
        <Pagination
          currentPage={page}
          totalItems={records.length}
          pageSize={15}
          onPageChange={setPage}
        />
      </div>
    </div>
  )
}
