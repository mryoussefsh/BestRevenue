import { useState, useEffect } from 'react'
import { adminApi } from '../../api/endpoints'
import toast from 'react-hot-toast'
import Pagination from '../../components/Pagination'

function ApproveModal({ payout, onClose, onDone }) {
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const final = parseFloat(payout.final_amount).toFixed(2)

  async function handleApprove() {
    setSaving(true)
    try {
      await adminApi.approvePayout(payout.id, {
        admin_note: note,
      })
      toast.success('Payout approved!')
      onDone()
    } catch { toast.error('Failed to approve') }
    finally { setSaving(false) }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">✅ Approve Payout</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <p style={{ marginBottom: 20, color: 'var(--color-text-muted)', fontSize: 14 }}>
          Publisher: <strong>{payout.publisher?.name}</strong> ·{' '}
          Period: <strong>{payout.period_year}-{String(payout.period_month).padStart(2,'0')}</strong>
        </p>
        <div className="form-group">
          <label className="form-label">Base Amount</label>
          <div className="form-input" style={{ background: 'var(--color-surface-3)', cursor: 'default' }}>
            ${parseFloat(payout.amount).toFixed(2)}
          </div>
        </div>
        {parseFloat(payout.adjustment) !== 0 && (
          <div className="form-group">
            <label className="form-label">Rolled-in Adjustment</label>
            <div className="form-input" style={{
              background: 'var(--color-surface-3)',
              cursor: 'default',
              color: parseFloat(payout.adjustment) > 0 ? 'var(--color-accent)' : 'var(--color-danger)'
            }}>
              {parseFloat(payout.adjustment) > 0 ? '+' : ''}${parseFloat(payout.adjustment).toFixed(2)}
            </div>
          </div>
        )}
        <div className="form-group">
          <label className="form-label">Final Amount</label>
          <div className="form-input" style={{
            background: 'var(--color-surface-3)',
            fontWeight: 700, fontSize: 18,
            color: 'var(--color-accent)'
          }}>
            ${final}
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Admin Note (internal)</label>
          <textarea className="form-textarea" rows={2} value={note}
            onChange={e => setNote(e.target.value)} placeholder="Optional internal note…" />
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button id="confirm-approve-btn" className="btn btn-success" onClick={handleApprove} disabled={saving}>
            {saving ? 'Approving…' : '✅ Approve $' + final}
          </button>
        </div>
      </div>
    </div>
  )
}

function MarkPaidModal({ payout, onClose, onDone }) {
  const [ref, setRef] = useState('')
  const [saving, setSaving] = useState(false)

  async function handlePaid() {
    setSaving(true)
    try {
      await adminApi.markPaid(payout.id, ref)
      toast.success('Payout marked as paid!')
      onDone()
    } catch { toast.error('Failed') }
    finally { setSaving(false) }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">💳 Mark as Paid</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <p style={{ marginBottom: 20, color: 'var(--color-text-muted)', fontSize: 14 }}>
          Publisher: <strong>{payout.publisher?.name}</strong> ·
          Amount: <strong className="money positive"> ${parseFloat(payout.final_amount).toFixed(2)}</strong>
        </p>
        <div className="form-group">
          <label className="form-label">Payment Reference / Transaction ID *</label>
          <input className="form-input" value={ref} onChange={e => setRef(e.target.value)}
            placeholder="e.g. TXN-12345 or PayPal order ID" required />
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button id="confirm-mark-paid-btn" className="btn btn-primary" onClick={handlePaid} disabled={saving || !ref}>
            {saving ? 'Saving…' : '💳 Confirm Payment'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function PayoutsPage() {
  const [payouts, setPayouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [modal, setModal] = useState(null)
  const [paidModal, setPaidModal] = useState(null)
  const [page, setPage] = useState(1)

  useEffect(() => { load() }, [statusFilter])

  async function load() {
    setLoading(true)
    try {
      const params = statusFilter ? { status: statusFilter } : {}
      const res = await adminApi.getPayouts(params)
      setPayouts(res.data?.data || [])
    } catch { toast.error('Failed to load payouts') }
    finally { setLoading(false) }
  }

  useEffect(() => { setPage(1) }, [statusFilter])

  const paginated = payouts.slice((page - 1) * 15, page * 15)

  async function handleReject(p) {
    const note = prompt(`Rejection reason for ${p.publisher?.name}:`)
    if (!note) return
    try {
      await adminApi.rejectPayout(p.id, note)
      toast.success('Payout rejected')
      load()
    } catch { toast.error('Failed to reject') }
  }

  const statusBadge = s => ({
    pending: 'badge-pending', approved: 'badge-approved',
    paid: 'badge-paid', rejected: 'badge-rejected',
  })[s] || 'badge-inactive'

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">💳 Payouts</h1>
          <p className="page-subtitle">{payouts.length} payouts</p>
        </div>
      </div>

      <div className="filter-bar">
        <select className="form-select" value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="paid">Paid</option>
          <option value="rejected">Rejected</option>
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
                  <th>Publisher</th><th>Period</th><th>Base Amount</th>
                  <th>Adjustment</th><th>Final Amount</th><th>Status</th>
                  <th>Payment Method</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payouts.length === 0 && (
                  <tr><td colSpan={8}>
                    <div className="empty-state">
                      <div className="empty-state-icon">💳</div>
                      <div className="empty-state-text">No payouts found</div>
                    </div>
                  </td></tr>
                )}
                {paginated.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{p.publisher?.name}</div>
                      <div className="text-muted text-sm">{p.publisher?.email}</div>
                    </td>
                    <td className="money text-sm">
                      {p.period_year}-{String(p.period_month).padStart(2,'0')}
                    </td>
                    <td className="money">${parseFloat(p.amount).toFixed(2)}</td>
                    <td className={`money ${parseFloat(p.adjustment) >= 0 ? 'positive' : 'negative'}`}>
                      {parseFloat(p.adjustment) >= 0 ? '+' : ''}${parseFloat(p.adjustment).toFixed(2)}
                    </td>
                    <td className="money positive" style={{ fontWeight: 700 }}>
                      ${parseFloat(p.final_amount).toFixed(2)}
                    </td>
                    <td>
                      <span className={`badge ${statusBadge(p.status)}`}>
                        {p.status}
                      </span>
                      {p.admin_note && (
                        <div className="text-xs text-muted" style={{ marginTop: 2 }}>{p.admin_note}</div>
                      )}
                    </td>
                    <td className="text-sm text-muted">
                      <div style={{ fontWeight: 600 }}>{p.payment_method || '—'}</div>
                      {(() => {
                        const publisher = p.publisher;
                        if (!publisher) return null;
                        let info = publisher.payment_info;
                        let account = null;
                        if (info) {
                          if (typeof info === 'string') {
                            try {
                              info = JSON.parse(info);
                            } catch (e) {
                              account = info;
                            }
                          }
                          if (typeof info === 'object' && info !== null) {
                            account = info.account;
                          }
                        }
                        if (!account) return null;
                        return (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                            <code 
                              style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
                                color: '#e2e8f0',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: '140px',
                              }} 
                              title={account}
                            >
                              {account}
                            </code>
                            <button
                              className="btn btn-secondary btn-xs"
                              style={{
                                padding: '2px 8px',
                                height: '22px',
                                lineHeight: '18px',
                                fontSize: '10px',
                                fontWeight: '600',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                borderRadius: '6px',
                                background: 'rgba(255, 255, 255, 0.08)',
                                border: '1px solid rgba(255, 255, 255, 0.12)',
                                color: '#f8fafc',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(account);
                                toast.success('Copied to clipboard!');
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                              }}
                              title="Copy account details"
                            >
                              📋 Copy
                            </button>
                          </div>
                        );
                      })()}
                      {p.payment_reference && (
                        <div style={{ fontFamily: 'monospace', fontSize: 11, marginTop: 4 }}>
                          Ref: {p.payment_reference}
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="flex gap-2">
                        {p.status === 'pending' && (
                          <>
                            <button id={`approve-${p.id}`} className="btn btn-success btn-xs"
                              onClick={() => setModal(p)}>✅ Approve</button>
                            <button className="btn btn-danger btn-xs"
                              onClick={() => handleReject(p)}>✗ Reject</button>
                          </>
                        )}
                        {p.status === 'approved' && (
                          <button id={`mark-paid-${p.id}`} className="btn btn-primary btn-xs"
                            onClick={() => setPaidModal(p)}>💳 Mark Paid</button>
                        )}
                        {p.status === 'paid' && (
                          <span className="text-sm" style={{ color: 'var(--color-accent)' }}>✓ Paid</span>
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
          totalItems={payouts.length}
          pageSize={15}
          onPageChange={setPage}
        />
      </div>

      {modal && (
        <ApproveModal
          payout={modal}
          onClose={() => setModal(null)}
          onDone={() => { setModal(null); load() }}
        />
      )}
      {paidModal && (
        <MarkPaidModal
          payout={paidModal}
          onClose={() => setPaidModal(null)}
          onDone={() => { setPaidModal(null); load() }}
        />
      )}
    </div>
  )
}
