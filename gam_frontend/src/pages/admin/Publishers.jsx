import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { adminApi, publicApi } from '../../api/endpoints'
import { useAuth } from '../../contexts/AuthContext'
import { useSettings } from '../../contexts/SettingsContext'
import { useI18n } from '../../contexts/I18nContext'
import toast from 'react-hot-toast'
import Pagination from '../../components/Pagination'
import CompactAmount from '../../components/CompactAmount'
import { Users, Clock, Plus, Eye, Check, Info, Filter } from 'lucide-react'

export function PublisherModal({ publisher, onClose, onSaved }) {
  const { t } = useI18n()
  const isEdit = !!publisher?.id
  const [form, setForm] = useState({
    name: publisher?.name || '',
    email: publisher?.email || '',
    password: '',
    default_ratio: publisher ? (parseFloat(publisher.default_ratio) * 100).toFixed(0) : '75',
    status: publisher?.status || 'active',
    notes: publisher?.notes || '',
    phone: publisher?.phone || '',
    telegram: publisher?.telegram || '',
    country: publisher?.country || '',
    payment_method: publisher?.payment_info?.method || '',
    payment_account: publisher?.payment_info?.account || '',
  })
  const [loading, setLoading] = useState(false)
  const [paymentMethods, setPaymentMethods] = useState([])

  useEffect(() => {
    publicApi.getSettings().then(res => {
      let methods = res.data?.payment_methods || []
      if (typeof methods === 'string') {
        try { methods = JSON.parse(methods) } catch (e) { methods = [] }
      }
      setPaymentMethods(methods)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!isEdit) {
      adminApi.getSettings().then(res => {
        const ratioSetting = res.data?.find(s => s.key === 'publisher_default_ratio')
        if (ratioSetting?.value) {
          setForm(f => ({ ...f, default_ratio: ratioSetting.value }))
        }
      }).catch(() => {})
    }
  }, [isEdit])

  const methodNames = paymentMethods.map(m => {
    if (typeof m === 'object' && m !== null) return m.name
    return m
  }).filter(Boolean)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        name: form.name,
        email: form.email,
        default_ratio: parseFloat(form.default_ratio) / 100,
        status: form.status,
        notes: form.notes,
        phone: form.phone,
        telegram: form.telegram,
        country: form.country,
        payment_info: {
          method: form.payment_method,
          account: form.payment_account
        }
      }
      if (!isEdit || form.password) payload.password = form.password
      if (isEdit) await adminApi.updatePublisher(publisher.id, payload)
      else         await adminApi.createPublisher(payload)
      toast.success(isEdit ? t('publishers.toast_updated', 'Publisher updated!') : t('publishers.toast_created', 'Publisher created!'))
      onSaved()
    } catch (e) {
      const msg = e.response?.data?.message || t('common.something_wrong', 'Something went wrong')
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '650px' }}>
        <div className="modal-header">
          <span className="modal-title">{isEdit ? t('publishers.edit_title', 'Edit Publisher') : t('publishers.new_title', 'New Publisher')}</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{t('publishers.name_label', 'Name')} *</label>
              <input className="form-input" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">{t('publishers.email_label', 'Email')} *</label>
              <input className="form-input" type="email" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{isEdit ? t('publishers.new_password_opt', 'New Password (optional)') : t('publishers.password_label', 'Password')} *</label>
              <input className="form-input" type="password" value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required={!isEdit} />
            </div>
            <div className="form-group">
              <label className="form-label">{t('publishers.ratio_label', 'Revenue Ratio %')}</label>
              <input className="form-input" type="number" min="1" max="100" value={form.default_ratio}
                onChange={e => setForm(f => ({ ...f, default_ratio: e.target.value }))} />
              <span className="form-hint">{t('publishers.ratio_hint', 'Publisher keeps this % of gross revenue')}</span>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{t('publishers.phone_label', 'Phone')}</label>
              <input className="form-input" value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="e.g. +1 555-0199" />
            </div>
            <div className="form-group">
              <label className="form-label">{t('publishers.telegram_label', 'Telegram')}</label>
              <input className="form-input" value={form.telegram}
                onChange={e => setForm(f => ({ ...f, telegram: e.target.value }))} placeholder="e.g. @username" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{t('publishers.country_label', 'Country')}</label>
              <input className="form-input" value={form.country}
                onChange={e => setForm(f => ({ ...f, country: e.target.value }))} placeholder={t('publishers.country_placeholder', 'e.g. United States')} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{t('publishers.payment_method_label', 'Payment Method')}</label>
              <select 
                className="form-select" 
                value={form.payment_method}
                onChange={e => setForm(f => ({ ...f, payment_method: e.target.value }))}
              >
                <option value="">{t('publishers.select_payment', 'Select Payment Method...')}</option>
                {methodNames.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
                {form.payment_method && !methodNames.some(n => n.toLowerCase() === form.payment_method.toLowerCase()) && (
                  <option value={form.payment_method}>{form.payment_method}</option>
                )}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{t('publishers.payment_account_label', 'Payment Account')}</label>
              <input className="form-input" value={form.payment_account}
                onChange={e => setForm(f => ({ ...f, payment_account: e.target.value }))} placeholder={t('publishers.payment_account_placeholder', 'e.g. routing/account info')} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{t('publishers.status_label', 'Status')}</label>
              <select className="form-select" value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                <option value="active">{t('publishers.status_active', 'Active')}</option>
                <option value="pending">{t('publishers.status_pending', 'Pending')}</option>
                <option value="suspended">{t('publishers.status_suspended', 'Suspended')}</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">{t('publishers.notes_label', 'Internal Notes (admin only)')}</label>
            <textarea className="form-textarea" rows={2} value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>{t('common.cancel', 'Cancel')}</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? t('common.saving', 'Saving…') : t('publishers.save_btn', 'Save Publisher')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function PublishersPage() {
  const { impersonate, hasPermission } = useAuth()
  const { formatDate } = useSettings()
  const { t } = useI18n()
  const canEdit = hasPermission('manage_publishers')
  const [publishers, setPublishers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [adjustBalanceModal, setAdjustBalanceModal] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showFiltersPanel, setShowFiltersPanel] = useState(false)
  const [page, setPage] = useState(1)

  const activeFiltersCount = (search !== '' ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0)

  useEffect(() => { loadPublishers() }, [])

  async function loadPublishers() {
    setLoading(true)
    try {
      const res = await adminApi.getPublishers()
      setPublishers(res.data?.data || [])
    } catch { toast.error(t('publishers.toast_load_fail', 'Failed to load publishers')) }
    finally { setLoading(false) }
  }

  async function handleDelete(pub) {
    if (!confirm(t('publishers.confirm_delete', `Delete publisher "${pub.name}"? This cannot be undone.`))) return
    try {
      await adminApi.deletePublisher(pub.id)
      toast.success(t('publishers.toast_deleted', 'Publisher deleted'))
      loadPublishers()
    } catch { toast.error(t('publishers.toast_delete_fail', 'Delete failed')) }
  }

  async function handleSuspend(pub) {
    try {
      await adminApi.suspendPublisher(pub.id)
      toast.success(t('publishers.toast_suspended', 'Publisher suspended'))
      loadPublishers()
    } catch { toast.error(t('publishers.toast_suspend_fail', 'Failed to suspend')) }
  }

  async function handleActivate(pub) {
    try {
      await adminApi.activatePublisher(pub.id)
      toast.success(t('publishers.toast_activated', `Publisher "${pub.name}" activated! They can now log in.`))
      loadPublishers()
    } catch { toast.error(t('publishers.toast_activate_fail', 'Failed to activate publisher')) }
  }

  async function handleImpersonate(pub) {
    if (!confirm(t('publishers.confirm_impersonate', `Log in as publisher "${pub.name}"?`))) return
    try {
      const res = await adminApi.impersonatePublisher(pub.id)
      const { access_token, user: publisherUser } = res.data
      impersonate(access_token, publisherUser)
      toast.success(t('publishers.toast_impersonated', `Logged in as ${pub.name}`))
    } catch (e) {
      toast.error(e.response?.data?.message || t('publishers.toast_impersonate_fail', 'Failed to impersonate publisher'))
    }
  }

  useEffect(() => { setPage(1) }, [search, statusFilter])

  const pendingCount = publishers.filter(p => p.status === 'pending').length

  const filtered = publishers.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || p.status === statusFilter
    return matchSearch && matchStatus
  })

  const paginated = filtered.slice((page - 1) * 15, page * 15)

  const totalApproved = filtered.reduce((s, p) => s + parseFloat(p.approved_balance || 0), 0)
  const totalPending = filtered.reduce((s, p) => s + parseFloat(p.pending_balance || 0), 0)
  const avgRatio = filtered.length > 0 ? filtered.reduce((s, p) => s + parseFloat(p.default_ratio || 0), 0) / filtered.length : 0

  const statusBadge = s => s === 'active'
    ? 'badge-active'
    : s === 'pending'
      ? 'badge-pending'
      : 'badge-inactive'

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={28} style={{ color: 'var(--br-primary)' }} />
            <span>{t('publishers.title', 'Publishers')}</span>
          </h1>
          <p className="page-subtitle">
            {publishers.length} {t('publishers.total', 'total')}
            {pendingCount > 0 && (
              <span style={{
                marginLeft: 10,
                background: 'rgba(245,158,11,0.18)',
                color: 'var(--color-warning)',
                border: '1px solid rgba(245,158,11,0.35)',
                borderRadius: 20,
                padding: '2px 10px',
                fontSize: 12,
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <Clock size={12} />
                <span>{pendingCount} {t('publishers.pending', 'pending')}</span>
              </span>
            )}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button 
            className="btn btn-secondary" 
            onClick={() => setShowFiltersPanel(!showFiltersPanel)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            <Filter size={16} />
            <span>{showFiltersPanel ? t('common.hide_filters', 'Hide Filters') : t('common.show_filters', 'Show Filters')}</span>
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
          {canEdit && (
            <button id="add-publisher-btn" className="btn btn-primary" onClick={() => setModal('create')}>
              <Plus size={16} /> {t('publishers.add_btn', 'Add Publisher')}
            </button>
          )}
        </div>
      </div>

      {canEdit && publishers.filter(p => p.status === 'pending').length > 0 && (
        <div className="alert alert-warning" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Clock size={20} style={{ color: 'var(--color-warning)', flexShrink: 0 }} />
          <div>
            <strong>{publishers.filter(p => p.status === 'pending').length} {t('publishers.pending_approval', 'publisher(s) pending approval')}</strong>
            <span style={{ marginLeft: 8, fontSize: 13, color: 'var(--color-text-muted)' }}>
              — {t('publishers.click_approve', 'Click "Approve" to activate them')}
            </span>
          </div>
        </div>
      )}

      {showFiltersPanel && (
        <div className="filter-bar" style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
          <input
            className="form-input"
            placeholder={t('publishers.search_placeholder', 'Search name or email…')}
            style={{ flex: 1 }}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select
            id="status-filter"
            className="form-select"
            style={{ width: 180 }}
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="all">{t('publishers.all_statuses', 'All Statuses')}</option>
            <option value="active">{t('publishers.status_active', 'Active')}</option>
            <option value="pending">{t('publishers.status_pending', 'Pending')}</option>
            <option value="suspended">{t('publishers.status_suspended', 'Suspended')}</option>
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
                  <th>{t('publishers.col_publisher', 'Publisher')}</th>
                  <th>{t('publishers.col_status', 'Status')}</th>
                  <th>{t('publishers.col_ratio', 'Ratio')}</th>
                  <th>{t('publishers.col_approved_balance', 'Approved Balance')}</th>
                  <th>{t('publishers.col_pending_balance', 'Pending Balance')}</th>
                  <th>{t('publishers.col_created', 'Created')}</th>
                  <th>{t('publishers.col_actions', 'Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={7}>
                    <div className="empty-state">
                      <div className="empty-state-icon"><Users size={40} style={{ color: 'var(--br-text-2)' }} /></div>
                      <div className="empty-state-text">{t('publishers.no_publishers', 'No publishers yet')}</div>
                      <div className="empty-state-sub">{t('publishers.no_publishers_hint', 'Click "Add Publisher" to create one')}</div>
                    </div>
                  </td></tr>
                )}
                {paginated.map(pub => (
                  <tr key={pub.id}>
                    <td>
                      <Link to={`/admin/publishers/${pub.id}`} className="hover-link" style={{ fontWeight: 600, display: 'block' }}>
                        {pub.name}
                      </Link>
                      <div className="text-muted text-sm">{pub.email}</div>
                      <div className="text-muted" style={{ fontSize: 11, marginTop: 2, userSelect: 'all' }} title="Publisher ID">ID: {pub.id}</div>
                    </td>
                    <td>
                      <span className={`badge ${statusBadge(pub.status)}`}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
                        {pub.status}
                      </span>
                    </td>
                    <td>
                      <span className="money" style={{ fontWeight: 700 }}>
                        {(parseFloat(pub.default_ratio) * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td>
                      <span className="money positive" style={{ fontWeight: 700 }}>
                        <CompactAmount value={pub.approved_balance || 0} />
                      </span>
                    </td>
                    <td>
                      <span className="money" style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>
                        <CompactAmount value={pub.pending_balance || 0} />
                      </span>
                    </td>
                    <td className="text-muted text-sm">
                      {formatDate(pub.created_at)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <Link id={`view-pub-${pub.id}`} to={`/admin/publishers/${pub.id}`} className="btn btn-secondary btn-xs" style={{ background: 'rgba(99,102,241,0.12)', color: 'var(--color-primary)', border: '1px solid rgba(99,102,241,0.3)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Eye size={12} /> {t('common.view', 'View')}
                        </Link>
                        {canEdit && pub.status === 'pending' && (
                          <button
                            id={`activate-pub-${pub.id}`}
                            className="btn btn-success btn-xs"
                            onClick={() => handleActivate(pub)}
                            style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--color-success)', border: '1px solid rgba(16,185,129,0.3)', padding: '4px 10px', borderRadius: '6px', fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          >
                            <Check size={12} /> {t('publishers.approve_btn', 'Approve')}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              {filtered.length > 0 && (
                <tfoot>
                  <tr style={{ background: 'rgba(99,102,241,.07)', fontWeight: 700, borderTop: '2px solid var(--color-border)' }}>
                    <td style={{ padding: '10px 16px', fontSize: 12 }} colSpan={2}>{t('period.totals', 'Totals')} ({filtered.length})</td>
                    <td className="money" style={{ fontWeight: 700 }}>
                      {(avgRatio * 100).toFixed(0)}%
                    </td>
                    <td className="money positive" style={{ fontWeight: 700 }}>
                      <CompactAmount value={totalApproved} />
                    </td>
                    <td className="money" style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>
                      <CompactAmount value={totalPending} />
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
          totalItems={filtered.length}
          pageSize={15}
          onPageChange={setPage}
        />
      </div>

      {modal && (
        <PublisherModal
          publisher={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); loadPublishers() }}
        />
      )}

      {adjustBalanceModal && (
        <AdjustBalanceModal
          publisher={adjustBalanceModal}
          onClose={() => setAdjustBalanceModal(null)}
          onSaved={() => { setAdjustBalanceModal(null); loadPublishers() }}
        />
      )}
    </div>
  )
}

export function AdjustBalanceModal({ publisher, onClose, onSaved }) {
  const { t } = useI18n()
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    const parsedAmount = parseFloat(amount)
    if (!amount || isNaN(parsedAmount) || parsedAmount === 0) {
      toast.error(t('publishers.adjust_amount_error', 'Please enter a non-zero valid amount'))
      return
    }
    setLoading(true)
    try {
      await adminApi.adjustPublisherBalance(publisher.id, parsedAmount, notes)
      toast.success(t('publishers.toast_adjusted', 'Balance adjusted successfully!'))
      onSaved()
    } catch (e) {
      toast.error(e.response?.data?.message || t('publishers.toast_adjust_fail', 'Failed to adjust balance'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">{t('publishers.adjust_balance_title', 'Adjust Balance')} — {publisher.name}</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="alert alert-warning" style={{ color: 'var(--color-text)', border: '1px solid var(--color-border)', margin: '12px 0 20px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Info size={20} style={{ color: 'var(--color-warning)', flexShrink: 0 }} />
          <div>
            {t('publishers.adjust_info', 'This amount will accumulate and automatically apply as a payout adjustment when the current monthly period is closed. Use positive numbers for bonuses and negative numbers for deductions.')}
          </div>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label">{t('publishers.adjustment_amount', 'Adjustment Amount ($)')} *</label>
            <input
              type="number"
              step="0.01"
              className="form-input"
              placeholder="e.g. 150.00 or -25.00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              required
              autoFocus
            />
            <span className="form-hint">{t('publishers.adjustment_hint', 'Use positive for bonus/credit, negative for deductions/debits.')}</span>
          </div>
          <div className="form-group" style={{ marginBottom: 20 }}>
            <label className="form-label">{t('publishers.reason_label', 'Reason / Notes')} *</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder={t('publishers.reason_placeholder', 'Reason for adjustment (will be logged in internal notes & audit log)')}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              required
            />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>{t('common.cancel', 'Cancel')}</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? t('publishers.processing', 'Processing…') : t('publishers.apply_adjustment', 'Apply Adjustment')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
