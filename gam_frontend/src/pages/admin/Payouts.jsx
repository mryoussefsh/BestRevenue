import { useState, useEffect, useRef } from 'react'
import { adminApi } from '../../api/endpoints'
import toast from 'react-hot-toast'
import Pagination from '../../components/Pagination'
import CompactAmount from '../../components/CompactAmount'
import { CreditCard, Check, X, Copy, RefreshCw, Clock, DollarSign, Ban } from 'lucide-react'

function ApproveModal({ payout, onClose, onDone }) {
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const final = parseFloat(payout.final_amount).toFixed(2)

  async function handleApprove() {
    setSaving(true)
    try {
      await adminApi.approvePayout(payout.id, { admin_note: note })
      toast.success('Payout approved!')
      onDone()
    } catch { toast.error('Failed to approve') }
    finally { setSaving(false) }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Check size={18} style={{ color: 'var(--br-accent)' }} />
            <span>Approve Payout</span>
          </span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <p style={{ marginBottom: 20, color: 'var(--color-text-muted)', fontSize: 14 }}>
          Publisher: <strong>{payout.publisher?.name}</strong> ·{' '}
          Period: <strong>{payout.period_year}-{String(payout.period_month).padStart(2,'0')}</strong>
        </p>
        <div className="form-group">
          <label className="form-label">Base Amount</label>
          <div className="form-input" style={{ background: 'var(--color-surface-3)', cursor: 'default' }}>
            <CompactAmount value={payout.amount} />
          </div>
        </div>
        {parseFloat(payout.adjustment) !== 0 && (
          <div className="form-group">
            <label className="form-label">Rolled-in Adjustment</label>
            <div className="form-input" style={{
              background: 'var(--color-surface-3)', cursor: 'default',
              color: parseFloat(payout.adjustment) > 0 ? 'var(--color-accent)' : 'var(--color-danger)'
            }}>
              {parseFloat(payout.adjustment) > 0 ? '+' : ''}<CompactAmount value={payout.adjustment} />
            </div>
          </div>
        )}
        <div className="form-group">
          <label className="form-label">Final Amount</label>
          <div className="form-input" style={{ background: 'var(--color-surface-3)', fontWeight: 700, fontSize: 18, color: 'var(--color-accent)' }}>
            <CompactAmount value={payout.final_amount} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Admin Note (internal)</label>
          <textarea className="form-textarea" rows={2} value={note}
            onChange={e => setNote(e.target.value)} placeholder="Optional internal note…" />
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button id="confirm-approve-btn" className="btn btn-success" onClick={handleApprove} disabled={saving} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            {saving ? 'Approving…' : <><Check size={14} /> Approve <CompactAmount value={payout.final_amount} /></>}
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
          <span className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CreditCard size={18} style={{ color: 'var(--br-primary)' }} />
            <span>Mark as Paid</span>
          </span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <p style={{ marginBottom: 20, color: 'var(--color-text-muted)', fontSize: 14 }}>
          Publisher: <strong>{payout.publisher?.name}</strong> ·
          Amount: <strong className="money positive"> <CompactAmount value={payout.final_amount} /></strong>
        </p>
        <div className="form-group">
          <label className="form-label">Payment Reference / Transaction ID *</label>
          <input className="form-input" value={ref} onChange={e => setRef(e.target.value)}
            placeholder="e.g. TXN-12345 or PayPal order ID" required />
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button id="confirm-mark-paid-btn" className="btn btn-primary" onClick={handlePaid} disabled={saving || !ref} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            {saving ? 'Saving…' : <><CreditCard size={14} /> Confirm Payment</>}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Searchable Publisher Select ─────────────────────────────────────────── */
function PublisherSelect({ publishers, value, onChange }) {
  const [search, setSearch]   = useState('')
  const [open, setOpen]       = useState(false)
  const containerRef          = useRef(null)

  const selected = publishers.find(p => p.id === value)

  const filtered = publishers.filter(p =>
    !search || p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.email?.toLowerCase().includes(search.toLowerCase())
  )

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  function handleSelect(pub) {
    onChange(pub ? pub.id : '')
    setOpen(false)
    setSearch('')
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', minWidth: 220 }}>
      <div
        className="form-input"
        style={{
          cursor: 'pointer', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '6px 10px',
          fontSize: 13, userSelect: 'none',
        }}
        onClick={() => setOpen(o => !o)}
      >
        <span style={{ color: selected ? 'var(--color-text)' : 'var(--color-text-muted)' }}>
          {selected ? selected.name : 'All Publishers'}
        </span>
        <span style={{ fontSize: 10, color: 'var(--color-text-muted)', marginLeft: 8 }}>{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 999,
          maxHeight: 280,
          display: 'flex', flexDirection: 'column',
        }}>
          {/* Search input */}
          <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--color-border)' }}>
            <input
              autoFocus
              className="form-input"
              style={{ padding: '5px 8px', fontSize: 12, width: '100%' }}
              placeholder="Search publisher…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onClick={e => e.stopPropagation()}
            />
          </div>
          {/* Options list */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            <div
              style={{
                padding: '8px 12px', fontSize: 13, cursor: 'pointer',
                color: 'var(--color-text-muted)',
                background: !value ? 'rgba(99,102,241,.1)' : 'transparent',
              }}
              onClick={() => handleSelect(null)}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,.08)'}
              onMouseLeave={e => e.currentTarget.style.background = !value ? 'rgba(99,102,241,.1)' : 'transparent'}
            >
              All Publishers
            </div>
            {filtered.length === 0 && (
              <div style={{ padding: '8px 12px', fontSize: 12, color: 'var(--color-text-muted)' }}>No results</div>
            )}
            {filtered.map(pub => (
              <div
                key={pub.id}
                style={{
                  padding: '8px 12px', cursor: 'pointer',
                  background: value === pub.id ? 'rgba(99,102,241,.1)' : 'transparent',
                }}
                onClick={() => handleSelect(pub)}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,.08)'}
                onMouseLeave={e => e.currentTarget.style.background = value === pub.id ? 'rgba(99,102,241,.1)' : 'transparent'}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>{pub.name}</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{pub.email}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Main Page ───────────────────────────────────────────────────────────── */
export default function PayoutsPage() {
  const [payouts,    setPayouts]    = useState([])
  const [publishers, setPublishers] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [modal,      setModal]      = useState(null)
  const [paidModal,  setPaidModal]  = useState(null)
  const [page,       setPage]       = useState(1)

  // Filters — status + publisher go to API; year + month are client-side
  const [filterStatus,    setFilterStatus]    = useState('')
  const [filterPublisher, setFilterPublisher] = useState('')
  const [filterYear,      setFilterYear]      = useState('')
  const [filterMonth,     setFilterMonth]     = useState('')

  // Load publishers list
  async function loadPublishers() {
    try {
      const r = await adminApi.getPublishers({ per_page: 500 })
      setPublishers(r.data?.data || [])
    } catch {}
  }

  useEffect(() => {
    loadPublishers()
  }, [])

  // Reload from API when server-side filters change
  useEffect(() => { load() }, [filterStatus, filterPublisher])

  async function load() {
    setLoading(true)
    setPage(1)
    try {
      const params = {}
      if (filterStatus)    params.status       = filterStatus
      if (filterPublisher) params.publisher_id = filterPublisher
      const res = await adminApi.getPayouts(params)
      setPayouts(res.data?.data || [])
    } catch { toast.error('Failed to load payouts') }
    finally { setLoading(false) }
  }

  // Client-side year + month filter
  const filteredPayouts = payouts.filter(p => {
    if (filterYear  && String(p.period_year)  !== filterYear)  return false
    if (filterMonth && String(p.period_month) !== filterMonth) return false
    return true
  })

  const uniqueYears = [...new Set(payouts.map(p => p.period_year))].sort((a, b) => b - a)

  const paginated  = filteredPayouts.slice((page - 1) * 15, page * 15)
  const totalBase  = filteredPayouts.reduce((s, p) => s + parseFloat(p.amount      || 0), 0)
  const totalAdj   = filteredPayouts.reduce((s, p) => s + parseFloat(p.adjustment  || 0), 0)
  const totalFinal = filteredPayouts.reduce((s, p) => s + parseFloat(p.final_amount|| 0), 0)

  const selectedPub = publishers.find(p => p.id === filterPublisher)
  const totalPaid = selectedPub
    ? parseFloat(selectedPub.total_payout || 0)
    : publishers.reduce((sum, p) => sum + parseFloat(p.total_payout || 0), 0)

  const availableBalance = selectedPub
    ? parseFloat(selectedPub.approved_balance || 0)
    : publishers.reduce((sum, p) => sum + parseFloat(p.approved_balance || 0), 0)

  const hasFilter = filterStatus || filterPublisher || filterYear || filterMonth

  function handleReset() {
    setFilterStatus('')
    setFilterPublisher('')
    setFilterYear('')
    setFilterMonth('')
    setPage(1)
  }

  async function handleReject(p) {
    const note = prompt(`Rejection reason for ${p.publisher?.name}:`)
    if (!note) return
    try {
      await adminApi.rejectPayout(p.id, note)
      toast.success('Payout rejected')
      load()
      loadPublishers()
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
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CreditCard size={28} style={{ color: 'var(--br-primary)' }} />
            <span>Payouts</span>
          </h1>
          <p className="page-subtitle">
            {filteredPayouts.length === payouts.length
               ? `${payouts.length} payouts`
               : `${filteredPayouts.length} of ${payouts.length} payouts`}
          </p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24, padding: '16px 20px' }}>
        <div className="filter-bar">

          {/* Status */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Status</label>
            <select
              className="form-select"
              style={{ padding: '6px 10px', fontSize: 13, minWidth: 150 }}
              value={filterStatus}
              onChange={e => { setFilterStatus(e.target.value) }}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="paid">Paid</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Publisher searchable */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Publisher</label>
            <PublisherSelect
              publishers={publishers}
              value={filterPublisher}
              onChange={v => setFilterPublisher(v)}
            />
          </div>

          {/* Year */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Year</label>
            <select
              className="form-select"
              style={{ padding: '6px 10px', fontSize: 13, minWidth: 110 }}
              value={filterYear}
              onChange={e => { setFilterYear(e.target.value); setFilterMonth(''); setPage(1) }}
            >
              <option value="">All Years</option>
              {uniqueYears.map(y => <option key={y} value={String(y)}>{y}</option>)}
            </select>
          </div>

          {/* Month */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Month</label>
            <select
              className="form-select"
              style={{ padding: '6px 10px', fontSize: 13, minWidth: 130 }}
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

          {/* Reset */}
          {hasFilter && (
            <button className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: 13 }} onClick={handleReset}>
              ✕ Reset
            </button>
          )}
        </div>
      </div>

      {/* ── Summary Cards ──────────────────────────────────────────────── */}
      <div className="stat-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card accent">
          <div className="stat-label">Total Paid Out</div>
          <div className="stat-value money"><CompactAmount value={totalPaid} /></div>
          <div className="stat-sub">
            {selectedPub ? `Paid to ${selectedPub.name}` : 'Across all publishers'}
          </div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--color-success, #10b981)', background: 'linear-gradient(135deg, rgba(16,185,129,.08) 0%, var(--color-surface) 100%)' }}>
          <div className="stat-label">Available Balance</div>
          <div className="stat-value money" style={{ color: 'var(--color-success, #10b981)' }}>
            <CompactAmount value={availableBalance} />
          </div>
          <div className="stat-sub">
            {selectedPub ? `Approved & awaiting next cycle for ${selectedPub.name}` : 'Total approved & awaiting next cycle'}
          </div>
        </div>
      </div>

      {/* ── Table ──────────────────────────────────────────────────────── */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
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
                {filteredPayouts.length === 0 && (
                  <tr><td colSpan={8}>
                    <div className="empty-state">
                      <div className="empty-state-icon"><CreditCard size={40} /></div>
                      <div className="empty-state-text">No payouts found</div>
                      {hasFilter && <div className="empty-state-sub">Try adjusting your filters</div>}
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
                    <td className="money"><CompactAmount value={p.amount} /></td>
                    <td className={`money ${parseFloat(p.adjustment) >= 0 ? 'positive' : 'negative'}`}>
                      {parseFloat(p.adjustment) >= 0 ? '+' : ''}<CompactAmount value={p.adjustment} />
                    </td>
                    <td className="money positive" style={{ fontWeight: 700 }}>
                      <CompactAmount value={p.final_amount} />
                    </td>
                    <td>
                      <span className={`badge ${statusBadge(p.status)}`}>{p.status}</span>
                      {p.admin_note && (
                        <div className="text-xs text-muted" style={{ marginTop: 2 }}>{p.admin_note}</div>
                      )}
                    </td>
                    <td className="text-sm text-muted">
                      <div style={{ fontWeight: 600 }}>{p.payment_method || '—'}</div>
                      {(() => {
                        const publisher = p.publisher
                        if (!publisher) return null
                        let info = publisher.payment_info
                        let account = null
                        if (info) {
                          if (typeof info === 'string') {
                            try { info = JSON.parse(info) } catch { account = info }
                          }
                          if (typeof info === 'object' && info !== null) account = info.account
                        }
                        if (!account) return null
                        return (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                            <code style={{
                              background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)',
                              padding: '2px 8px', borderRadius: 6, fontSize: 11,
                              fontFamily: 'monospace', color: '#e2e8f0',
                              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140,
                            }} title={account}>
                              {account}
                            </code>
                            <button
                              className="btn btn-secondary btn-xs"
                              style={{ padding: '2px 8px', height: 22, fontSize: 10, borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                              onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(account); toast.success('Copied!') }}
                              title="Copy account details"
                            >
                              <Copy size={10} /> Copy
                            </button>
                          </div>
                        )
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
                            <button id={`approve-${p.id}`} className="btn btn-success btn-xs" onClick={() => setModal(p)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Check size={12} /> Approve</button>
                            <button className="btn btn-danger btn-xs" onClick={() => handleReject(p)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><X size={12} /> Reject</button>
                          </>
                        )}
                        {p.status === 'approved' && (
                          <button id={`mark-paid-${p.id}`} className="btn btn-primary btn-xs" onClick={() => setPaidModal(p)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><CreditCard size={12} /> Mark Paid</button>
                        )}
                        {p.status === 'paid' && (
                          <span className="text-sm" style={{ color: 'var(--color-accent)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Check size={14} /> Paid</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              {filteredPayouts.length > 0 && (
                <tfoot>
                  <tr style={{ background: 'rgba(99,102,241,.07)', fontWeight: 700, borderTop: '2px solid var(--color-border)' }}>
                    <td style={{ padding: '10px 16px', fontSize: 12 }} colSpan={2}>Totals ({filteredPayouts.length})</td>
                    <td className="money"><CompactAmount value={totalBase} /></td>
                    <td className={`money ${totalAdj >= 0 ? 'positive' : 'negative'}`}>
                      {totalAdj >= 0 ? '+' : ''}<CompactAmount value={totalAdj} />
                    </td>
                    <td className="money positive" style={{ fontWeight: 700 }}><CompactAmount value={totalFinal} /></td>
                    <td colSpan={3}></td>
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

      {modal && (
        <ApproveModal payout={modal} onClose={() => setModal(null)} onDone={() => { setModal(null); load(); loadPublishers() }} />
      )}
      {paidModal && (
        <MarkPaidModal payout={paidModal} onClose={() => setPaidModal(null)} onDone={() => { setPaidModal(null); load(); loadPublishers() }} />
      )}
    </div>
  )
}
