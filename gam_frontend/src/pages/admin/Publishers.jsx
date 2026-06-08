import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { adminApi, publicApi } from '../../api/endpoints'
import { useAuth } from '../../contexts/AuthContext'
import { useSettings } from '../../contexts/SettingsContext'
import toast from 'react-hot-toast'
import Pagination from '../../components/Pagination'
import CompactAmount from '../../components/CompactAmount'

export function PublisherModal({ publisher, onClose, onSaved }) {
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
    skype: publisher?.skype || '',
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
        try {
          methods = JSON.parse(methods)
        } catch (e) {
          methods = []
        }
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
        skype: form.skype,
        country: form.country,
        payment_info: {
          method: form.payment_method,
          account: form.payment_account
        }
      }
      if (!isEdit || form.password) payload.password = form.password
      if (isEdit) await adminApi.updatePublisher(publisher.id, payload)
      else         await adminApi.createPublisher(payload)
      toast.success(isEdit ? 'Publisher updated!' : 'Publisher created!')
      onSaved()
    } catch (e) {
      const msg = e.response?.data?.message || 'Something went wrong'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: '650px' }}>
        <div className="modal-header">
          <span className="modal-title">{isEdit ? '✏️ Edit Publisher' : '➕ New Publisher'}</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Name *</label>
              <input className="form-input" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Email *</label>
              <input className="form-input" type="email" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{isEdit ? 'New Password (optional)' : 'Password *'}</label>
              <input className="form-input" type="password" value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required={!isEdit} />
            </div>
            <div className="form-group">
              <label className="form-label">Revenue Ratio %</label>
              <input className="form-input" type="number" min="1" max="100" value={form.default_ratio}
                onChange={e => setForm(f => ({ ...f, default_ratio: e.target.value }))} />
              <span className="form-hint">Publisher keeps this % of gross revenue</span>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-input" value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="e.g. +1 555-0199" />
            </div>
            <div className="form-group">
              <label className="form-label">Telegram</label>
              <input className="form-input" value={form.telegram}
                onChange={e => setForm(f => ({ ...f, telegram: e.target.value }))} placeholder="e.g. @username" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Skype</label>
              <input className="form-input" value={form.skype}
                onChange={e => setForm(f => ({ ...f, skype: e.target.value }))} placeholder="e.g. live:username" />
            </div>
            <div className="form-group">
              <label className="form-label">Country</label>
              <input className="form-input" value={form.country}
                onChange={e => setForm(f => ({ ...f, country: e.target.value }))} placeholder="e.g. United States" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Payment Method</label>
              <select 
                className="form-select" 
                value={form.payment_method}
                onChange={e => setForm(f => ({ ...f, payment_method: e.target.value }))}
              >
                <option value="">Select Payment Method...</option>
                {methodNames.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
                {form.payment_method && !methodNames.some(n => n.toLowerCase() === form.payment_method.toLowerCase()) && (
                  <option value={form.payment_method}>{form.payment_method}</option>
                )}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Payment Account</label>
              <input className="form-input" value={form.payment_account}
                onChange={e => setForm(f => ({ ...f, payment_account: e.target.value }))} placeholder="e.g. routing/account info" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Internal Notes (admin only)</label>
            <textarea className="form-textarea" rows={2} value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving…' : 'Save Publisher'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function PublishersPage() {
  const { impersonate } = useAuth()
  const { formatDate } = useSettings()
  const [publishers, setPublishers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // null | 'create' | publisher obj
  const [adjustBalanceModal, setAdjustBalanceModal] = useState(null) // null | publisher obj
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)

  useEffect(() => { loadPublishers() }, [])

  async function loadPublishers() {
    setLoading(true)
    try {
      const res = await adminApi.getPublishers()
      setPublishers(res.data?.data || [])
    } catch { toast.error('Failed to load publishers') }
    finally { setLoading(false) }
  }

  async function handleDelete(pub) {
    if (!confirm(`Delete publisher "${pub.name}"? This cannot be undone.`)) return
    try {
      await adminApi.deletePublisher(pub.id)
      toast.success('Publisher deleted')
      loadPublishers()
    } catch { toast.error('Delete failed') }
  }

  async function handleSuspend(pub) {
    try {
      await adminApi.suspendPublisher(pub.id)
      toast.success('Publisher suspended')
      loadPublishers()
    } catch { toast.error('Failed to suspend') }
  }

  async function handleActivate(pub) {
    try {
      await adminApi.activatePublisher(pub.id)
      toast.success(`Publisher "${pub.name}" activated! They can now log in.`)
      loadPublishers()
    } catch { toast.error('Failed to activate publisher') }
  }

  async function handleImpersonate(pub) {
    if (!confirm(`Log in as publisher "${pub.name}"?`)) return
    try {
      const res = await adminApi.impersonatePublisher(pub.id)
      const { access_token, user: publisherUser } = res.data
      impersonate(access_token, publisherUser)
      toast.success(`Logged in as ${pub.name}`)
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to impersonate publisher')
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

  const statusBadge = s => s === 'active'
    ? 'badge-active'
    : s === 'pending'
      ? 'badge-pending'
      : 'badge-inactive'

  const statusIcon = s => s === 'active' ? '🟢' : s === 'pending' ? '🟡' : '🔴'

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">👥 Publishers</h1>
          <p className="page-subtitle">
            {publishers.length} total
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
              }}>
                ⏳ {pendingCount} pending
              </span>
            )}
          </p>
        </div>
        <button id="add-publisher-btn" className="btn btn-primary" onClick={() => setModal('create')}>
          ➕ Add Publisher
        </button>
      </div>

      {publishers.filter(p => p.status === 'pending').length > 0 && (
        <div className="alert alert-warning" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 20 }}>⏳</span>
          <div>
            <strong>{publishers.filter(p => p.status === 'pending').length} publisher(s) pending approval</strong>
            <span style={{ marginLeft: 8, fontSize: 13, color: 'var(--color-text-muted)' }}>
              — Click "✅ Approve" to activate them
            </span>
          </div>
        </div>
      )}

      <div className="filter-bar" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <input
          className="form-input"
          placeholder="🔍 Search name or email…"
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
          <option value="all">All Statuses</option>
          <option value="active">🟢 Active</option>
          <option value="pending">🟡 Pending</option>
          <option value="suspended">🔴 Suspended</option>
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
                  <th>Status</th>
                  <th>Ratio</th>
                  <th>Approved Balance</th>
                  <th>Pending Balance</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={7}>
                    <div className="empty-state">
                      <div className="empty-state-icon">👥</div>
                      <div className="empty-state-text">No publishers yet</div>
                      <div className="empty-state-sub">Click "Add Publisher" to create one</div>
                    </div>
                  </td></tr>
                )}
                {paginated.map(pub => (
                  <tr key={pub.id}>
                    <td>
                      <Link to={`/admin/publishers/${pub.id}`} className="hover-link" style={{ fontWeight: 600, display: 'block' }}>
                        👤 {pub.name}
                      </Link>
                      <div className="text-muted text-sm">{pub.email}</div>
                      <div className="text-muted" style={{ fontSize: 11, marginTop: 2, userSelect: 'all' }} title="Publisher ID">ID: {pub.id}</div>
                    </td>
                    <td>
                      <span className={`badge ${statusBadge(pub.status)}`}>
                        {statusIcon(pub.status)} {pub.status}
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
                        <Link id={`view-pub-${pub.id}`} to={`/admin/publishers/${pub.id}`} className="btn btn-secondary btn-xs" style={{ background: 'rgba(99,102,241,0.12)', color: 'var(--color-primary)', border: '1px solid rgba(99,102,241,0.3)' }}>
                          👁 View
                        </Link>
                        {pub.status === 'pending' && (
                          <button
                            id={`activate-pub-${pub.id}`}
                            className="btn btn-success btn-xs"
                            onClick={() => handleActivate(pub)}
                            style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--color-success)', border: '1px solid rgba(16,185,129,0.3)', padding: '4px 10px', borderRadius: '6px', fontSize: 12, cursor: 'pointer' }}
                          >
                            ✅ Approve
                          </button>
                        )}
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
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    const parsedAmount = parseFloat(amount)
    if (!amount || isNaN(parsedAmount) || parsedAmount === 0) {
      toast.error('Please enter a non-zero valid amount')
      return
    }
    setLoading(true)
    try {
      await adminApi.adjustPublisherBalance(publisher.id, parsedAmount, notes)
      toast.success('Balance adjusted successfully!')
      onSaved()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to adjust balance')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">💰 Adjust Balance — {publisher.name}</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="alert alert-warning" style={{ color: 'var(--color-text)', border: '1px solid var(--color-border)', margin: '12px 0 20px 0' }}>
          💡 This amount will accumulate and automatically apply as a payout adjustment when the current monthly period is closed. Use positive numbers for bonuses and negative numbers for deductions.
        </div>
        <form onSubmit={handleSubmit}>
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
              autoFocus
            />
            <span className="form-hint">Use positive for bonus/credit, negative for deductions/debits.</span>
          </div>
          <div className="form-group" style={{ marginBottom: 20 }}>
            <label className="form-label">Reason / Notes *</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Reason for adjustment (will be logged in internal notes & audit log)"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              required
            />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Processing…' : 'Apply Adjustment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
