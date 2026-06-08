import { useState, useEffect } from 'react'
import { adminApi, gamAccountsApi } from '../../api/endpoints'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import Pagination from '../../components/Pagination'
import { SearchableSelect } from '../../components/BulkAdUnitGeneratorModal'
import { useSettings } from '../../contexts/SettingsContext'
import CompactAmount from '../../components/CompactAmount'

export default function AdjustmentsPage() {
  const { formatDate } = useSettings()
  const [adjustments, setAdjustments] = useState([])
  const [publishers, setPublishers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
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
      toast.error('Failed to load publishers for dropdown')
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
      toast.error('Failed to load adjustments')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(adj) {
    if (!confirm(`Delete adjustment of $${Math.abs(adj.amount).toFixed(2)} for "${adj.publisher?.name}"?`)) return
    try {
      await adminApi.deleteAdjustment(adj.id)
      toast.success('Adjustment deleted successfully!')
      loadAdjustments()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to delete adjustment')
    }
  }

  useEffect(() => {
    setPage(1)
  }, [search, statusFilter])

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">⚖️ Adjustments</h1>
          <p className="page-subtitle">{totalItems} total adjustments</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={() => setShowBonusModal(true)} style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--color-accent)', border: '1px solid var(--color-accent)' }}>
            🎁 Apply Bonus
          </button>
          <button className="btn btn-secondary" onClick={() => setShowIvtModal(true)}>
            ⚡ Apply IVT Deduction
          </button>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            ➕ Create Adjustment
          </button>
        </div>
      </div>

      <div className="filter-bar" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <input
          className="form-input"
          style={{ flex: 1, minWidth: 200 }}
          placeholder="🔍 Search publisher name, email, or notes…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="form-select"
          style={{ width: 180 }}
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="applied">Applied (Processed)</option>
        </select>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-container">
          {loading ? (
            <div className="empty-state"><div className="spinner"></div></div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Publisher</th>
                  <th>Amount</th>
                  <th>Reason / Notes</th>
                  <th>Created By</th>
                  <th>Created</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {adjustments.length === 0 && (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty-state">
                        <div className="empty-state-icon">⚖️</div>
                        <div className="empty-state-text">No adjustments found</div>
                        <div className="empty-state-sub">Click "Create Adjustment" to add a new one</div>
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
                    <td className="text-muted">{adj.creator?.name || 'System / Admin'}</td>
                    <td className="text-muted text-sm">{formatDate(adj.created_at)}</td>
                    <td>
                      <span className={`badge ${adj.status === 'applied' ? 'badge-active' : 'badge-pending'}`}
                            style={{
                              background: adj.status === 'applied' ? 'rgba(99,102,241,0.15)' : 'rgba(245,158,11,0.15)',
                              color: adj.status === 'applied' ? 'var(--color-primary-light)' : 'var(--color-warning)'
                            }}>
                        {adj.status === 'applied' ? '🔒 Applied' : '⏳ Pending'}
                      </span>
                    </td>
                    <td>
                      {adj.status === 'pending' ? (
                        <button className="btn btn-danger btn-xs" onClick={() => handleDelete(adj)}>
                          🗑 Delete
                        </button>
                      ) : (
                        <span className="text-muted text-sm">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
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
  const [publisherId, setPublisherId] = useState('')
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!publisherId) {
      toast.error('Please select a publisher')
      return
    }
    const val = parseFloat(amount)
    if (isNaN(val) || val === 0) {
      toast.error('Please enter a non-zero valid amount')
      return
    }

    setLoading(true)
    try {
      await adminApi.createAdjustment({
        publisher_id: publisherId,
        amount: val,
        notes
      })
      toast.success('Adjustment created successfully!')
      onSaved()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to create adjustment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">➕ Create Adjustment</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="alert alert-warning" style={{ color: 'var(--color-text)', border: '1px solid var(--color-border)', margin: '12px 0 20px 0' }}>
          💡 Adjustments created here will accumulate and automatically apply when the current monthly period is closed. Use positive values for bonuses, and negative values for deductions.
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label">Publisher *</label>
            <SearchableSelect
              value={publisherId}
              onChange={setPublisherId}
              options={publishers.map(p => ({
                value: p.id,
                label: p.name,
                subLabel: p.email
              }))}
              placeholder="Select Publisher"
              emptyMessage="No publishers found"
            />
          </div>

          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label">Adjustment Amount ($) *</label>
            <input
              type="number"
              step="0.01"
              className="form-input"
              placeholder="e.g. 150.00 or -25.00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              required
            />
            <span className="form-hint">Use positive for bonus/credit, negative for deductions/debits.</span>
          </div>

          <div className="form-group" style={{ marginBottom: 20 }}>
            <label className="form-label">Reason / Notes *</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Reason for adjustment (will be visible in audit logs, monthly payout, and publisher logs)"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              required
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating…' : 'Create Adjustment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ApplyIvtModal({ onClose, onSaved }) {
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
        toast.error('Failed to load GAM accounts')
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
        toast.error('Failed to load websites')
      })
      .finally(() => {
        setLoadingWebsites(false)
      })
  }, [selectedGamAccountId])

  // Handlers moved to WebsiteSelectionModal component

  async function handleSubmit(e) {
    e.preventDefault()
    if (!selectedGamAccountId) {
      toast.error('Please select a GAM Account')
      return
    }
    if (selectedWebsiteIds.length === 0) {
      toast.error('Please select at least one website')
      return
    }
    if (!dateFrom || !dateTo) {
      toast.error('Please select a date range')
      return
    }
    const percent = parseFloat(ivtPercent)
    if (isNaN(percent) || percent < 0 || percent > 100) {
      toast.error('Please enter a valid percentage between 0 and 100')
      return
    }

    setSubmitting(true)
    try {
      const res = await adminApi.applyIvtDeduction({
        gam_account_id: selectedGamAccountId,
        website_ids: selectedWebsiteIds,
        date_from: dateFrom,
        date_to: dateTo,
        ivt_percent: percent
      })
      const count = res.data?.applied_adjustments?.length || 0
      toast.success(`Successfully applied IVT. Created ${count} adjustment(s).`)
      onSaved()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to apply IVT deductions')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 600 }}>
        <div className="modal-header">
          <span className="modal-title">⚡ Apply IVT Deduction</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="alert alert-info" style={{ color: 'var(--color-text)', border: '1px solid var(--color-border)', margin: '12px 0 20px 0' }}>
          💡 This tool automatically creates negative pending adjustments for the selected websites based on their total publisher earnings in the selected period.
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label">GAM Account *</label>
            {loadingGamAccounts ? (
              <div className="text-muted">Loading accounts...</div>
            ) : (
              <select
                className="form-select"
                value={selectedGamAccountId}
                onChange={e => setSelectedGamAccountId(e.target.value)}
                required
              >
                <option value="">-- Select GAM Account --</option>
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
              <label className="form-label" style={{ marginBottom: 8 }}>Websites *</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowWebsiteSelector(true)}
                  disabled={loadingWebsites || websites.length === 0}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  🌐 Select Websites...
                </button>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>
                  {loadingWebsites ? (
                    <span className="text-muted">Loading websites...</span>
                  ) : websites.length === 0 ? (
                    <span className="text-danger">No websites linked to this account</span>
                  ) : (
                    <span>{selectedWebsiteIds.length} of {websites.length} selected</span>
                  )}
                </span>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Start Date *</label>
              <input
                type="date"
                className="form-input"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                required
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">End Date *</label>
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
            <label className="form-label">IVT Percentage (%) *</label>
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
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting || loadingWebsites || (selectedGamAccountId && websites.length === 0)}>
              {submitting ? 'Applying…' : 'Apply IVT Deduction'}
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

function WebsiteSelectionModal({ websites, selectedWebsiteIds, onClose, onConfirm }) {
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
      return search ? 'Deselect Filtered' : 'Deselect All'
    } else {
      return search ? 'Select Filtered' : 'Select All'
    }
  }

  const handleToggleWebsite = (id) => {
    setTempSelectedIds(prev =>
      prev.includes(id) ? prev.filter(wId => wId !== id) : [...prev, id]
    )
  }

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 700, zIndex: 1101 }}>
        <div className="modal-header">
          <span className="modal-title">🌐 Select Websites</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="alert alert-info" style={{ color: 'var(--color-text)', border: '1px solid var(--color-border)', margin: '12px 0 16px 0' }}>
          Select websites to apply the IVT deduction. Use search to filter if needed.
        </div>

        <div className="form-group" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>
              {tempSelectedIds.length} of {websites.length} selected
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
            placeholder="🔍 Search websites by domain or publisher name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ marginBottom: 12, height: 36, fontSize: '13px' }}
          />

          {displayedWebsites.length === 0 ? (
            <div className="text-muted" style={{ padding: 24, textAlign: 'center', background: 'var(--color-surface-2)', borderRadius: 4 }}>
              No websites match your search query.
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
                        Pub: {web.publisher?.name || 'N/A'}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={() => onConfirm(tempSelectedIds)}>
            Confirm Selection
          </button>
        </div>
      </div>
    </div>
  )
}

function ApplyBonusModal({ onClose, onSaved }) {
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
        toast.error('Failed to load GAM accounts')
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
        toast.error('Failed to load websites')
      })
      .finally(() => {
        setLoadingWebsites(false)
      })
  }, [selectedGamAccountId])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!selectedGamAccountId) {
      toast.error('Please select a GAM Account')
      return
    }
    if (selectedWebsiteIds.length === 0) {
      toast.error('Please select at least one website')
      return
    }
    if (!dateFrom || !dateTo) {
      toast.error('Please select a date range')
      return
    }
    const percent = parseFloat(bonusPercent)
    if (isNaN(percent) || percent < 0 || percent > 100) {
      toast.error('Please enter a valid percentage between 0 and 100')
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
      toast.success(`Successfully applied bonuses. Created ${count} adjustment(s).`)
      onSaved()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to apply bonuses')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 600 }}>
        <div className="modal-header">
          <span className="modal-title">🎁 Apply Bonus Adjustment</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="alert alert-info" style={{ color: 'var(--color-text)', border: '1px solid var(--color-border)', margin: '12px 0 20px 0' }}>
          💡 This tool automatically creates positive pending adjustments (bonuses) for the selected websites based on their total publisher earnings in the selected period.
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label">GAM Account *</label>
            {loadingGamAccounts ? (
              <div className="text-muted">Loading accounts...</div>
            ) : (
              <select
                className="form-select"
                value={selectedGamAccountId}
                onChange={e => setSelectedGamAccountId(e.target.value)}
                required
              >
                <option value="">-- Select GAM Account --</option>
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
              <label className="form-label" style={{ marginBottom: 8 }}>Websites *</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowWebsiteSelector(true)}
                  disabled={loadingWebsites || websites.length === 0}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  🌐 Select Websites...
                </button>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>
                  {loadingWebsites ? (
                    <span className="text-muted">Loading websites...</span>
                  ) : websites.length === 0 ? (
                    <span className="text-danger">No websites linked to this account</span>
                  ) : (
                    <span>{selectedWebsiteIds.length} of {websites.length} selected</span>
                  )}
                </span>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Start Date *</label>
              <input
                type="date"
                className="form-input"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                required
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">End Date *</label>
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
            <label className="form-label">Bonus Percentage (%) *</label>
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
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting || loadingWebsites || (selectedGamAccountId && websites.length === 0)}>
              {submitting ? 'Applying…' : 'Apply Bonus'}
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
