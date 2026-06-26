import { useState, useEffect } from 'react'
import { adminApi, gamAccountsApi } from '../../api/endpoints'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import Pagination from '../../components/Pagination'
import { SearchableSelect } from '../../components/BulkAdUnitGeneratorModal'
import { useSettings } from '../../contexts/SettingsContext'
import CompactAmount from '../../components/CompactAmount'
import { useI18n } from '../../contexts/I18nContext'
import { Scale, Gift, Zap, Plus, Lock, Clock, Trash2, BarChart2, Info, Globe, Filter } from 'lucide-react'


export default function AdjustmentsPage() {
  const { t } = useI18n()
  const { formatDate } = useSettings()
  const [adjustments, setAdjustments] = useState([])
  const [publishers, setPublishers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showFiltersPanel, setShowFiltersPanel] = useState(false)
  const [page, setPage] = useState(1)

  const activeFiltersCount = (search !== '' ? 1 : 0) + (statusFilter !== '' ? 1 : 0)
  const [totalItems, setTotalItems] = useState(0)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showIvtModal, setShowIvtModal] = useState(false)
  const [showBonusModal, setShowBonusModal] = useState(false)

  useEffect(() => {
    loadAdjustments()
  }, [search, statusFilter, page])

  useEffect(() => {
    // Load publishers once for the dropdown creation select
    adminApi.getPublishers().then(res => {
      setPublishers(res.data?.data || [])
    }).catch(() => {
      toast.error(t('adjustments.toast_load_pubs_fail', 'Failed to load publishers for dropdown'))
    })
  }, [])

  async function loadAdjustments() {
    setLoading(true)
    try {
      const params = {
        page,
        search: search || undefined,
        status: statusFilter || undefined
      }
      const res = await adminApi.getAdjustments(params)
      setAdjustments(res.data?.data || [])
      setTotalItems(res.data?.meta?.total || res.data?.total || 0)
    } catch {
      toast.error(t('adjustments.toast_load_fail', 'Failed to load adjustments'))
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(adj) {
    if (!confirm(t('adjustments.confirm_delete', 'Delete adjustment of ${amount} for "{name}"?', { amount: `$${Math.abs(adj.amount).toFixed(2)}`, name: adj.publisher?.name }))) return
    try {
      await adminApi.deleteAdjustment(adj.id)
      toast.success(t('adjustments.toast_delete_success', 'Adjustment deleted successfully!'))
      loadAdjustments()
    } catch (e) {
      toast.error(e.response?.data?.message || t('adjustments.toast_delete_fail', 'Failed to delete adjustment'))
    }
  }

  useEffect(() => {
    setPage(1)
  }, [search, statusFilter])

  const totalAmount = adjustments.reduce((s, a) => s + parseFloat(a.amount || 0), 0)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Scale size={24} style={{ color: 'var(--color-primary)' }} /> {t('nav.adjustments', 'Adjustments')}
          </h1>
          <p className="page-subtitle">{t('adjustments.total_count', '{count} total adjustments', { count: totalItems })}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
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
          <button className="btn btn-secondary" onClick={() => setShowBonusModal(true)} style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--color-accent)', border: '1px solid var(--color-accent)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Gift size={14} /> {t('adjustments.apply_bonus', 'Apply Bonus')}
          </button>
          <button className="btn btn-secondary" onClick={() => setShowIvtModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Zap size={14} /> {t('adjustments.apply_ivt', 'Apply IVT Deduction')}
          </button>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={14} /> {t('adjustments.create_adjustment', 'Create Adjustment')}
          </button>
        </div>
      </div>

      {showFiltersPanel && (
        <div className="filter-bar" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
          <input
            className="form-input"
            style={{ flex: 1, minWidth: 200 }}
            placeholder={t('adjustments.search_placeholder', 'Search publisher name, email, or notes…')}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select
            className="form-select"
            style={{ width: 180 }}
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="">{t('dashboard.filters.all_statuses', 'All Statuses')}</option>
            <option value="pending">{t('dashboard.status.pending', 'Pending')}</option>
            <option value="applied">{t('adjustments.status.applied', 'Applied (Processed)')}</option>
          </select>
        </div>
      )}

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          {loading ? (
            <div className="empty-state"><div className="spinner"></div></div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>{t('adjustments.table.publisher', 'Publisher')}</th>
                  <th>{t('adjustments.table.amount', 'Amount')}</th>
                  <th>{t('adjustments.table.notes', 'Reason / Notes')}</th>
                  <th>{t('adjustments.table.created_by', 'Created By')}</th>
                  <th>{t('adjustments.table.created_at', 'Created')}</th>
                  <th>{t('adjustments.table.status', 'Status')}</th>
                  <th>{t('adjustments.table.actions', 'Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {adjustments.length === 0 && (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty-state">
                        <div className="empty-state-icon"><Scale size={40} /></div>
                        <div className="empty-state-text">{t('adjustments.empty_state', 'No adjustments found')}</div>
                        <div className="empty-state-sub">{t('adjustments.empty_state_sub', 'Click "Create Adjustment" to add a new one')}</div>
                      </div>
                    </td>
                  </tr>
                )}
                {adjustments.map(adj => (
                  <tr key={adj.id}>
                    <td>
                      <Link to={`/admin/publishers/${adj.publisher_id}`} className="hover-link" style={{ fontWeight: 600 }}>
                        {adj.publisher?.name || 'N/A'}
                      </Link>
                      <div className="text-muted text-sm">{adj.publisher?.email}</div>
                    </td>
                    <td>
                      <span className={`badge ${adj.amount >= 0 ? 'badge-active' : 'badge-inactive'}`}
                            style={{
                              background: adj.amount >= 0 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                              color: adj.amount >= 0 ? 'var(--color-accent)' : 'var(--color-danger)',
                              fontWeight: 700
                            }}>
                        {adj.amount >= 0 ? '+' : ''}<CompactAmount value={adj.amount} />
                      </span>
                    </td>
                    <td>
                      <div style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'normal' }}>
                        {adj.notes}
                      </div>
                    </td>
                    <td className="text-muted">{adj.creator?.name || t('adjustments.system_admin', 'System / Admin')}</td>
                    <td className="text-muted text-sm">{formatDate(adj.created_at)}</td>
                    <td>
                      <span className={`badge ${adj.status === 'applied' ? 'badge-active' : 'badge-pending'}`}
                            style={{
                              background: adj.status === 'applied' ? 'rgba(99,102,241,0.15)' : 'rgba(245,158,11,0.15)',
                              color: adj.status === 'applied' ? 'var(--color-primary-light)' : 'var(--color-warning)'
                            }}>
                        {adj.status === 'applied' ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Lock size={12} /> {t('adjustments.status_applied', 'Applied')}</span>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Clock size={12} /> {t('adjustments.status_pending', 'Pending')}</span>
                        )}
                      </span>
                    </td>
                    <td>
                      {adj.status === 'pending' ? (
                        <button className="btn btn-danger btn-xs" onClick={() => handleDelete(adj)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Trash2 size={12} /> {t('common.delete', 'Delete')}
                        </button>
                      ) : (
                        <span className="text-muted text-sm">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              {adjustments.length > 0 && (
                <tfoot>
                  <tr style={{ background: 'rgba(99,102,241,.07)', fontWeight: 700, borderTop: '2px solid var(--color-border)' }}>
                    <td style={{ padding: '10px 16px', fontSize: 12 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <BarChart2 size={14} /> {t('adjustments.table.totals_page', 'Totals (Page)')}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${totalAmount >= 0 ? 'badge-active' : 'badge-inactive'}`}
                            style={{
                              background: totalAmount >= 0 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                              color: totalAmount >= 0 ? 'var(--color-accent)' : 'var(--color-danger)',
                              fontWeight: 700
                            }}>
                        {totalAmount >= 0 ? '+' : ''}<CompactAmount value={totalAmount} />
                      </span>
                    </td>
                    <td colSpan={5}></td>
                  </tr>
                </tfoot>
              )}
            </table>
          )}
        </div>
        <Pagination
          currentPage={page}
          totalItems={totalItems}
          pageSize={15}
          onPageChange={setPage}
        />
      </div>

      {showCreateModal && (
        <CreateAdjustmentModal
          publishers={publishers}
          onClose={() => setShowCreateModal(false)}
          onSaved={() => {
            setShowCreateModal(false)
            loadAdjustments()
          }}
        />
      )}

      {showIvtModal && (
        <ApplyIvtModal
          onClose={() => setShowIvtModal(false)}
          onSaved={() => {
            setShowIvtModal(false)
            loadAdjustments()
          }}
        />
      )}

      {showBonusModal && (
        <ApplyBonusModal
          onClose={() => setShowBonusModal(false)}
          onSaved={() => {
            setShowBonusModal(false)
            loadAdjustments()
          }}
        />
      )}
    </div>
  )
}

function CreateAdjustmentModal({ publishers, onClose, onSaved }) {
  const { t } = useI18n()
  const [publisherId, setPublisherId] = useState('')
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!publisherId) {
      toast.error(t('adjustments.toast_select_pub', 'Please select a publisher'))
      return
    }
    const val = parseFloat(amount)
    if (isNaN(val) || val === 0) {
      toast.error(t('adjustments.toast_invalid_amount', 'Please enter a non-zero valid amount'))
      return
    }

    setLoading(true)
    try {
      await adminApi.createAdjustment({
        publisher_id: publisherId,
        amount: val,
        notes
      })
      toast.success(t('adjustments.toast_create_success', 'Adjustment created successfully!'))
      onSaved()
    } catch (e) {
      toast.error(e.response?.data?.message || t('adjustments.toast_create_fail', 'Failed to create adjustment'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} style={{ color: 'var(--br-primary)' }} /> {t('adjustments.create_adjustment', 'Create Adjustment')}
          </span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="alert alert-warning" style={{ color: 'var(--color-text)', border: '1px solid var(--color-border)', margin: '12px 0 20px 0', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
          <Info size={16} style={{ flexShrink: 0, marginTop: 2, color: 'var(--color-warning)' }} />
          <span>{t('adjustments.create_desc', 'Adjustments created here will accumulate and automatically apply when the current monthly period is closed. Use positive values for bonuses, and negative values for deductions.')}</span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label">{t('adjustments.publisher_label', 'Publisher *')}</label>
            <SearchableSelect
              value={publisherId}
              onChange={setPublisherId}
              options={publishers.map(p => ({
                value: p.id,
                label: p.name,
                subLabel: p.email
              }))}
              placeholder={t('adjustments.select_publisher', 'Select Publisher')}
              emptyMessage={t('adjustments.no_publishers_found', 'No publishers found')}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label">{t('adjustments.amount_label', 'Adjustment Amount ($) *')}</label>
            <input
              type="number"
              step="0.01"
              className="form-input"
              placeholder="e.g. 150.00 or -25.00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              required
            />
            <span className="form-hint">{t('adjustments.amount_hint', 'Use positive for bonus/credit, negative for deductions/debits.')}</span>
          </div>

          <div className="form-group" style={{ marginBottom: 20 }}>
            <label className="form-label">{t('adjustments.notes_label', 'Reason / Notes *')}</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder={t('adjustments.notes_placeholder', 'Reason for adjustment (will be visible in audit logs, monthly payout, and publisher logs)')}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              required
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>{t('common.cancel', 'Cancel')}</button>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              {loading ? t('adjustments.creating', 'Creating…') : <><Plus size={14} /> {t('adjustments.create_adjustment', 'Create Adjustment')}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ApplyIvtModal({ onClose, onSaved }) {
  const { t } = useI18n()
  // Helper to compute last month start and end dates in YYYY-MM-DD
  const getLastMonthDates = () => {
    const now = new Date()
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    const formatDate = (date) => {
      const yyyy = date.getFullYear()
      const mm = String(date.getMonth() + 1).padStart(2, '0')
      const dd = String(date.getDate()).padStart(2, '0')
      return `${yyyy}-${mm}-${dd}`
    }

    return {
      from: formatDate(startOfLastMonth),
      to: formatDate(endOfLastMonth)
    }
  }

  const defaultDates = getLastMonthDates()

  const [gamAccounts, setGamAccounts] = useState([])
  const [selectedGamAccountId, setSelectedGamAccountId] = useState('')
  const [websites, setWebsites] = useState([])
  const [selectedWebsiteIds, setSelectedWebsiteIds] = useState([])
  const [showWebsiteSelector, setShowWebsiteSelector] = useState(false)
  const [dateFrom, setDateFrom] = useState(defaultDates.from)
  const [dateTo, setDateTo] = useState(defaultDates.to)
  const [ivtPercent, setIvtPercent] = useState('')
  const [loadingGamAccounts, setLoadingGamAccounts] = useState(false)
  const [loadingWebsites, setLoadingWebsites] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setLoadingGamAccounts(true)
    gamAccountsApi.getAll()
      .then(res => {
        setGamAccounts(res.data || [])
      })
      .catch(() => {
        toast.error(t('adjustments.toast_load_gam_fail', 'Failed to load GAM accounts'))
      })
      .finally(() => {
        setLoadingGamAccounts(false)
      })
  }, [])

  useEffect(() => {
    if (!selectedGamAccountId) {
      setWebsites([])
      setSelectedWebsiteIds([])
      return
    }
    setLoadingWebsites(true)
    adminApi.getWebsites({ gam_account_id: selectedGamAccountId })
      .then(res => {
        const list = res.data?.data || []
        setWebsites(list)
        setSelectedWebsiteIds(list.map(w => w.id))
      })
      .catch(() => {
        toast.error(t('adjustments.toast_load_websites_fail', 'Failed to load websites'))
      })
      .finally(() => {
        setLoadingWebsites(false)
      })
  }, [selectedGamAccountId])

  // Handlers moved to WebsiteSelectionModal component

  async function handleSubmit(e, isForced = false) {
    if (e) e.preventDefault()
    if (!selectedGamAccountId) {
      toast.error(t('adjustments.toast_select_gam', 'Please select a GAM Account'))
      return
    }
    if (selectedWebsiteIds.length === 0) {
      toast.error(t('adjustments.toast_select_website', 'Please select at least one website'))
      return
    }
    if (!dateFrom || !dateTo) {
      toast.error(t('adjustments.toast_select_dates', 'Please select a date range'))
      return
    }
    const percent = parseFloat(ivtPercent)
    if (isNaN(percent) || percent < 0 || percent > 100) {
      toast.error(t('adjustments.toast_invalid_percent', 'Please enter a valid percentage between 0 and 100'))
      return
    }

    setSubmitting(true)
    try {
      const res = await adminApi.applyIvtDeduction({
        gam_account_id: selectedGamAccountId,
        website_ids: selectedWebsiteIds,
        date_from: dateFrom,
        date_to: dateTo,
        ivt_percent: percent,
        force: isForced
      })
      const count = res.data?.applied_adjustments?.length || 0
      toast.success(t('adjustments.toast_ivt_success', 'Successfully applied IVT. Created {count} adjustment(s).', { count }))
      onSaved()
    } catch (err) {
      if (err.response?.status === 409 && err.response?.data?.conflict) {
        const confirmMessage = err.response.data.message
        if (window.confirm(confirmMessage)) {
          await handleSubmit(null, true)
          return
        }
      } else {
        toast.error(err.response?.data?.message || t('adjustments.toast_ivt_fail', 'Failed to apply IVT deductions'))
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 600 }}>
        <div className="modal-header">
          <span className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={18} style={{ color: 'var(--br-primary)' }} /> {t('adjustments.apply_ivt', 'Apply IVT Deduction')}
          </span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="alert alert-info" style={{ color: 'var(--color-text)', border: '1px solid var(--color-border)', margin: '12px 0 20px 0', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
          <Info size={16} style={{ flexShrink: 0, marginTop: 2, color: 'var(--color-info)' }} />
          <span>{t('adjustments.ivt_desc', 'This tool automatically creates negative pending adjustments for the selected websites based on their total publisher earnings in the selected period.')}</span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label">{t('adjustments.gam_account_label', 'GAM Account *')}</label>
            {loadingGamAccounts ? (
              <div className="text-muted">{t('adjustments.loading_accounts', 'Loading accounts...')}</div>
            ) : (
              <select
                className="form-select"
                value={selectedGamAccountId}
                onChange={e => setSelectedGamAccountId(e.target.value)}
                required
              >
                <option value="">{t('adjustments.select_gam_account', '-- Select GAM Account --')}</option>
                {gamAccounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.network_code})
                  </option>
                ))}
              </select>
            )}
          </div>

          {selectedGamAccountId && (
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label" style={{ marginBottom: 8 }}>{t('adjustments.websites_label', 'Websites *')}</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowWebsiteSelector(true)}
                  disabled={loadingWebsites || websites.length === 0}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Globe size={14} /> {t('adjustments.select_websites_btn', 'Select Websites...')}
                </button>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>
                  {loadingWebsites ? (
                    <span className="text-muted">{t('adjustments.loading_websites', 'Loading websites...')}</span>
                  ) : websites.length === 0 ? (
                    <span className="text-danger">{t('adjustments.no_websites_linked', 'No websites linked to this account')}</span>
                  ) : (
                    <span>{t('adjustments.selected_count', '{selected} of {total} selected', { selected: selectedWebsiteIds.length, total: websites.length })}</span>
                  )}
                </span>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">{t('dashboard.filters.start_date', 'Start Date *')}</label>
              <input
                type="date"
                className="form-input"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                required
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">{t('dashboard.filters.end_date', 'End Date *')}</label>
              <input
                type="date"
                className="form-input"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 20 }}>
            <label className="form-label">{t('adjustments.ivt_percent_label', 'IVT Percentage (%) *')}</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              className="form-input"
              placeholder="e.g. 5.0"
              value={ivtPercent}
              onChange={e => setIvtPercent(e.target.value)}
              required
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>{t('common.cancel', 'Cancel')}</button>
            <button type="submit" className="btn btn-primary" disabled={submitting || loadingWebsites || (selectedGamAccountId && websites.length === 0)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              {submitting ? t('adjustments.applying', 'Applying…') : <><Zap size={14} /> {t('adjustments.apply_ivt', 'Apply IVT Deduction')}</>}
            </button>
          </div>
        </form>
      </div>

      {showWebsiteSelector && (
        <WebsiteSelectionModal
          websites={websites}
          selectedWebsiteIds={selectedWebsiteIds}
          onClose={() => setShowWebsiteSelector(false)}
          onConfirm={(ids) => {
            setSelectedWebsiteIds(ids)
            setShowWebsiteSelector(false)
          }}
        />
      )}
    </div>
  )
}

function WebsiteSelectionModal({ websites, selectedWebsiteIds, onClose, onConfirm, type = 'ivt' }) {
  const { t } = useI18n()
  const [tempSelectedIds, setTempSelectedIds] = useState(selectedWebsiteIds)
  const [search, setSearch] = useState('')

  const displayedWebsites = websites.filter(web =>
    web.domain.toLowerCase().includes(search.toLowerCase()) ||
    (web.publisher?.name || '').toLowerCase().includes(search.toLowerCase())
  )

  const handleToggleSelectAll = () => {
    const visibleIds = displayedWebsites.map(w => w.id)
    const allVisibleSelected = visibleIds.length > 0 && visibleIds.every(id => tempSelectedIds.includes(id))
    if (allVisibleSelected) {
      setTempSelectedIds(prev => prev.filter(id => !visibleIds.includes(id)))
    } else {
      setTempSelectedIds(prev => [...new Set([...prev, ...visibleIds])])
    }
  }

  const getSelectAllLabel = () => {
    const visibleIds = displayedWebsites.map(w => w.id)
    const allVisibleSelected = visibleIds.length > 0 && visibleIds.every(id => tempSelectedIds.includes(id))
    if (allVisibleSelected) {
      return search ? t('adjustments.deselect_filtered', 'Deselect Filtered') : t('adjustments.deselect_all', 'Deselect All')
    } else {
      return search ? t('adjustments.select_filtered', 'Select Filtered') : t('adjustments.select_all', 'Select All')
    }
  }

  const handleToggleWebsite = (id) => {
    setTempSelectedIds(prev =>
      prev.includes(id) ? prev.filter(wId => wId !== id) : [...prev, id]
    )
  }

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div className="modal" style={{ maxWidth: 700, zIndex: 1101 }}>
        <div className="modal-header">
          <span className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Globe size={18} style={{ color: 'var(--br-primary)' }} /> {t('adjustments.select_websites', 'Select Websites')}
          </span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="alert alert-info" style={{ color: 'var(--color-text)', border: '1px solid var(--color-border)', margin: '12px 0 16px 0', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
          <Info size={16} style={{ flexShrink: 0, marginTop: 2, color: 'var(--color-info)' }} />
          <span>
            {type === 'bonus'
              ? t('adjustments.select_bonus_desc', 'Select websites to apply the bonus. Use search to filter if needed.')
              : t('adjustments.select_ivt_desc', 'Select websites to apply the IVT deduction. Use search to filter if needed.')}
          </span>
        </div>

        <div className="form-group" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>
              {t('adjustments.selected_count', '{selected} of {total} selected', { selected: tempSelectedIds.length, total: websites.length })}
            </span>
            <button
              type="button"
              className="btn btn-secondary btn-xs"
              onClick={handleToggleSelectAll}
              style={{ fontSize: '11px', padding: '2px 8px' }}
            >
              {getSelectAllLabel()}
            </button>
          </div>

          <input
            type="text"
            className="form-input"
            placeholder={t('adjustments.search_websites_placeholder', 'Search websites by domain or publisher name...')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ marginBottom: 12, height: 36, fontSize: '13px' }}
          />

          {displayedWebsites.length === 0 ? (
            <div className="text-muted" style={{ padding: 24, textAlign: 'center', background: 'var(--color-surface-2)', borderRadius: 4 }}>
              {t('adjustments.no_websites_match', 'No websites match your search query.')}
            </div>
          ) : (
            <div className="card" style={{ padding: 12, maxHeight: 300, overflowY: 'auto', background: 'var(--color-surface-2)' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: 8
              }}>
                {displayedWebsites.map(web => (
                  <label key={web.id} style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                    cursor: 'pointer',
                    background: 'var(--color-surface-3)',
                    padding: '6px 10px',
                    borderRadius: '4px',
                    border: '1px solid var(--color-border)',
                    fontSize: '13px',
                    transition: 'background 0.2s',
                    userSelect: 'none'
                  }} className="hover-surface-2">
                    <input
                      type="checkbox"
                      checked={tempSelectedIds.includes(web.id)}
                      onChange={() => handleToggleWebsite(web.id)}
                      style={{ marginTop: '3px' }}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                      <span style={{ fontWeight: 600, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={web.domain}>
                        {web.domain}
                      </span>
                      <span className="text-muted" style={{ fontSize: '11px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={web.publisher?.name}>
                        {t('adjustments.pub_prefix', 'Pub: ')}{web.publisher?.name || 'N/A'}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>{t('common.cancel', 'Cancel')}</button>
          <button type="button" className="btn btn-primary" onClick={() => onConfirm(tempSelectedIds)}>
            {t('adjustments.confirm_selection', 'Confirm Selection')}
          </button>
        </div>
      </div>
    </div>
  )
}

function ApplyBonusModal({ onClose, onSaved }) {
  const { t } = useI18n()
  const getLastMonthDates = () => {
    const now = new Date()
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    const formatDate = (date) => {
      const yyyy = date.getFullYear()
      const mm = String(date.getMonth() + 1).padStart(2, '0')
      const dd = String(date.getDate()).padStart(2, '0')
      return `${yyyy}-${mm}-${dd}`
    }

    return {
      from: formatDate(startOfLastMonth),
      to: formatDate(endOfLastMonth)
    }
  }

  const defaultDates = getLastMonthDates()

  const [gamAccounts, setGamAccounts] = useState([])
  const [selectedGamAccountId, setSelectedGamAccountId] = useState('')
  const [websites, setWebsites] = useState([])
  const [selectedWebsiteIds, setSelectedWebsiteIds] = useState([])
  const [showWebsiteSelector, setShowWebsiteSelector] = useState(false)
  const [dateFrom, setDateFrom] = useState(defaultDates.from)
  const [dateTo, setDateTo] = useState(defaultDates.to)
  const [bonusPercent, setBonusPercent] = useState('')
  const [loadingGamAccounts, setLoadingGamAccounts] = useState(false)
  const [loadingWebsites, setLoadingWebsites] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setLoadingGamAccounts(true)
    gamAccountsApi.getAll()
      .then(res => {
        setGamAccounts(res.data || [])
      })
      .catch(() => {
        toast.error(t('adjustments.toast_load_gam_fail', 'Failed to load GAM accounts'))
      })
      .finally(() => {
        setLoadingGamAccounts(false)
      })
  }, [])

  useEffect(() => {
    if (!selectedGamAccountId) {
      setWebsites([])
      setSelectedWebsiteIds([])
      return
    }
    setLoadingWebsites(true)
    adminApi.getWebsites({ gam_account_id: selectedGamAccountId })
      .then(res => {
        const list = res.data?.data || []
        setWebsites(list)
        setSelectedWebsiteIds(list.map(w => w.id))
      })
      .catch(() => {
        toast.error(t('adjustments.toast_load_websites_fail', 'Failed to load websites'))
      })
      .finally(() => {
        setLoadingWebsites(false)
      })
  }, [selectedGamAccountId])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!selectedGamAccountId) {
      toast.error(t('adjustments.toast_select_gam', 'Please select a GAM Account'))
      return
    }
    if (selectedWebsiteIds.length === 0) {
      toast.error(t('adjustments.toast_select_website', 'Please select at least one website'))
      return
    }
    if (!dateFrom || !dateTo) {
      toast.error(t('adjustments.toast_select_dates', 'Please select a date range'))
      return
    }
    const percent = parseFloat(bonusPercent)
    if (isNaN(percent) || percent < 0 || percent > 100) {
      toast.error(t('adjustments.toast_invalid_percent', 'Please enter a valid percentage between 0 and 100'))
      return
    }

    setSubmitting(true)
    try {
      const res = await adminApi.applyBonusAdjustment({
        gam_account_id: selectedGamAccountId,
        website_ids: selectedWebsiteIds,
        date_from: dateFrom,
        date_to: dateTo,
        bonus_percent: percent
      })
      const count = res.data?.applied_adjustments?.length || 0
      toast.success(t('adjustments.toast_bonus_success', 'Successfully applied bonuses. Created {count} adjustment(s).', { count }))
      onSaved()
    } catch (e) {
      toast.error(e.response?.data?.message || t('adjustments.toast_bonus_fail', 'Failed to apply bonuses'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 600 }}>
        <div className="modal-header">
          <span className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Gift size={18} style={{ color: 'var(--br-primary)' }} /> {t('adjustments.apply_bonus', 'Apply Bonus')}
          </span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="alert alert-info" style={{ color: 'var(--color-text)', border: '1px solid var(--color-border)', margin: '12px 0 20px 0', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
          <Info size={16} style={{ flexShrink: 0, marginTop: 2, color: 'var(--color-info)' }} />
          <span>{t('adjustments.bonus_desc', 'This tool automatically creates positive pending adjustments (bonuses) for the selected websites based on their total publisher earnings in the selected period.')}</span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label">{t('adjustments.gam_account_label', 'GAM Account *')}</label>
            {loadingGamAccounts ? (
              <div className="text-muted">{t('adjustments.loading_accounts', 'Loading accounts...')}</div>
            ) : (
              <select
                className="form-select"
                value={selectedGamAccountId}
                onChange={e => setSelectedGamAccountId(e.target.value)}
                required
              >
                <option value="">{t('adjustments.select_gam_account', '-- Select GAM Account --')}</option>
                {gamAccounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.network_code})
                  </option>
                ))}
              </select>
            )}
          </div>

          {selectedGamAccountId && (
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label" style={{ marginBottom: 8 }}>{t('adjustments.websites_label', 'Websites *')}</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowWebsiteSelector(true)}
                  disabled={loadingWebsites || websites.length === 0}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Globe size={14} /> {t('adjustments.select_websites_btn', 'Select Websites...')}
                </button>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>
                  {loadingWebsites ? (
                    <span className="text-muted">{t('adjustments.loading_websites', 'Loading websites...')}</span>
                  ) : websites.length === 0 ? (
                    <span className="text-danger">{t('adjustments.no_websites_linked', 'No websites linked to this account')}</span>
                  ) : (
                    <span>{t('adjustments.selected_count', '{selected} of {total} selected', { selected: selectedWebsiteIds.length, total: websites.length })}</span>
                  )}
                </span>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">{t('dashboard.filters.start_date', 'Start Date *')}</label>
              <input
                type="date"
                className="form-input"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                required
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">{t('dashboard.filters.end_date', 'End Date *')}</label>
              <input
                type="date"
                className="form-input"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 20 }}>
            <label className="form-label">{t('adjustments.bonus_percent_label', 'Bonus Percentage (%) *')}</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              className="form-input"
              placeholder="e.g. 5.0"
              value={bonusPercent}
              onChange={e => setBonusPercent(e.target.value)}
              required
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>{t('common.cancel', 'Cancel')}</button>
            <button type="submit" className="btn btn-primary" disabled={submitting || loadingWebsites || (selectedGamAccountId && websites.length === 0)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              {submitting ? t('adjustments.applying', 'Applying…') : <><Gift size={14} /> {t('adjustments.apply_bonus', 'Apply Bonus')}</>}
            </button>
          </div>
        </form>
      </div>

      {showWebsiteSelector && (
        <WebsiteSelectionModal
          websites={websites}
          selectedWebsiteIds={selectedWebsiteIds}
          type="bonus"
          onClose={() => setShowWebsiteSelector(false)}
          onConfirm={(ids) => {
            setSelectedWebsiteIds(ids)
            setShowWebsiteSelector(false)
          }}
        />
      )}
    </div>
  )
}
