import { useState, useEffect, useRef } from 'react'
import { adminApi } from '../../api/endpoints'
import toast from 'react-hot-toast'
import CompactAmount from '../../components/CompactAmount'
import { useSettings } from '../../contexts/SettingsContext'
import {
  DollarSign, Users, CheckCircle2, Clock, CreditCard, Lock, Calendar, Award, Check, X, Copy
} from 'lucide-react'

// Payout Approval Modal
function ApproveModal({ payout, onClose, onDone }) {
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

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
    <div className="modal-overlay">
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
          <button className="btn btn-success" onClick={handleApprove} disabled={saving} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            {saving ? 'Approving…' : <><Check size={14} /> Approve <CompactAmount value={payout.final_amount} /></>}
          </button>
        </div>
      </div>
    </div>
  )
}

// Mark Paid Modal
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
    <div className="modal-overlay">
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
          <button className="btn btn-primary" onClick={handlePaid} disabled={saving || !ref} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            {saving ? 'Saving…' : <><CreditCard size={14} /> Confirm Payment</>}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function FinanceDashboard() {
  const { formatDate } = useSettings()
  const [stats, setStats] = useState(null)
  const [publishers, setPublishers] = useState([])
  const [closings, setClosings] = useState([])
  const [payouts, setPayouts] = useState([])
  const [topPublishers, setTopPublishers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [paidModal, setPaidModal] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [pubRes, closingsRes, payoutsRes, revenueRes] = await Promise.all([
        adminApi.getPublishers({ per_page: 500 }),
        adminApi.getPeriodClosings(),
        adminApi.getPayouts(),
        adminApi.getRevenue({ limit: 5000 })
      ])

      const allPubs = pubRes.data?.data || []
      const closingsList = closingsRes.data?.data || []
      const payoutsList = payoutsRes.data?.data || []
      const revenueRecords = revenueRes.data?.data || []

      // Financial stats aggregation
      const totalGross = revenueRecords.reduce((s, r) => s + parseFloat(r.gross_revenue || 0), 0)
      const totalEarnings = revenueRecords.reduce((s, r) => s + parseFloat(r.publisher_earnings || 0), 0)
      const totalApproved = allPubs.reduce((sum, p) => sum + parseFloat(p.approved_balance || 0), 0)
      
      const totalPendingAmt = revenueRecords
        .filter(r => r.period_closing_id === null && !r.is_approved)
        .reduce((s, r) => s + parseFloat(r.publisher_earnings || 0), 0)

      const pendingPayoutsList = payoutsList.filter(p => p.status === 'pending')
      const pendingPayoutsSum = pendingPayoutsList.reduce((s, p) => s + parseFloat(p.final_amount || 0), 0)
      const readyForPayout = allPubs.reduce((sum, p) => sum + parseFloat(p.approved_balance || 0), 0)

      setStats({
        totalGross: totalGross.toFixed(2),
        totalEarnings: totalEarnings.toFixed(2),
        totalApproved: totalApproved.toFixed(2),
        totalPending: totalPendingAmt.toFixed(2),
        readyForPayout: readyForPayout.toFixed(2),
        pendingPayoutsCount: pendingPayoutsList.length,
        pendingPayoutsSum: pendingPayoutsSum.toFixed(2),
        closedPeriods: closingsList.filter(c => c.status === 'closed').length
      })

      setClosings(closingsList.slice(0, 5))
      setPayouts(payoutsList.filter(p => p.status === 'pending' || p.status === 'approved').slice(0, 6))

      // Top publishers by earnings from revenue records
      const byPub = {}
      revenueRecords.forEach(r => {
        const pub = r.ad_unit?.website?.publisher
        if (!pub) return
        const key = pub.id || pub.name
        if (!byPub[key]) {
          byPub[key] = { name: pub.name, email: pub.email, earnings: 0, approved: pub.approved_balance || 0 }
        }
        byPub[key].earnings += parseFloat(r.publisher_earnings || 0)
      })

      const top = Object.values(byPub)
        .sort((a, b) => b.earnings - a.earnings)
        .slice(0, 5)
      setTopPublishers(top)

    } catch (err) {
      console.error(err)
      toast.error('Failed to load finance dashboard')
    } finally {
      setLoading(false)
    }
  }

  async function handleReject(p) {
    const note = prompt(`Rejection reason for ${p.publisher?.name}:`)
    if (!note) return
    try {
      await adminApi.rejectPayout(p.id, note)
      toast.success('Payout rejected')
      loadData()
    } catch { toast.error('Failed to reject') }
  }

  if (loading) {
    return <div className="empty-state"><div className="spinner" /></div>
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DollarSign size={28} style={{ color: 'var(--br-primary)' }} />
            <span>Finance Control Center</span>
          </h1>
          <p className="page-subtitle" style={{ color: 'var(--color-text-muted)' }}>
            Workspace for payouts, period closings, and financial analytics
          </p>
        </div>
      </div>

      {/* Revenue Stats Grid */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: .5, color: 'var(--color-text-muted)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          <DollarSign size={14} style={{ color: 'var(--br-primary)' }} /> Finance Metrics
        </div>
        <div className="stat-grid">
          <div className="stat-card primary">
            <div className="stat-icon"><DollarSign size={20} /></div>
            <div className="stat-label">Total Gross Revenue</div>
            <div className="stat-value money"><CompactAmount value={stats?.totalGross} /></div>
            <div className="stat-change up">▲ Platform-wide</div>
          </div>
          <div className="stat-card accent">
            <div className="stat-icon"><Users size={20} /></div>
            <div className="stat-label">Publisher Shares</div>
            <div className="stat-value money"><CompactAmount value={stats?.totalEarnings} /></div>
            <div className="stat-change up">▲ Shared split</div>
          </div>
          <div className="stat-card accent">
            <div className="stat-icon"><CheckCircle2 size={20} /></div>
            <div className="stat-label">Approved Balances</div>
            <div className="stat-value money"><CompactAmount value={stats?.totalApproved} /></div>
            <div className="stat-change up">✓ Wallet totals</div>
          </div>
          <div className="stat-card warning">
            <div className="stat-icon"><Clock size={20} /></div>
            <div className="stat-label">Pending Earnings</div>
            <div className="stat-value money"><CompactAmount value={stats?.totalPending} /></div>
            <div className="stat-change">Awaiting cycle close</div>
          </div>
          <div className="stat-card accent" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.02))', border: '1px solid rgba(16,185,129,0.3)' }}>
            <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.15)' }}><CreditCard size={20} /></div>
            <div className="stat-label">Ready for Payout</div>
            <div className="stat-value money" style={{ color: 'var(--color-accent)' }}><CompactAmount value={stats?.readyForPayout} /></div>
            <div className="stat-change text-muted">Awaiting publisher request</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Pending Payouts & Leaderboard */}
      <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24, marginBottom: 24 }}>
        
        {/* Pending / Actionable Payouts */}
        <div className="card" style={{ padding: 0 }}>
          <div className="card-header" style={{ padding: '16px 20px' }}>
            <div>
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <CreditCard size={16} style={{ color: 'var(--br-primary)' }} /> Actionable Payouts
              </div>
              <div className="card-subtitle">Pending approval or waiting to be marked paid</div>
            </div>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Publisher</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payouts.length === 0 ? (
                  <tr>
                    <td colSpan={4}>
                      <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--color-text-muted)', fontSize: 13 }}>
                        No pending or approved payouts needing action
                      </div>
                    </td>
                  </tr>
                ) : (
                  payouts.map(p => (
                    <tr key={p.id}>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{p.publisher?.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{p.publisher?.email}</div>
                      </td>
                      <td className="money" style={{ fontWeight: 700 }}><CompactAmount value={p.final_amount} /></td>
                      <td>
                        <span className={`badge ${p.status === 'pending' ? 'badge-pending' : 'badge-approved'}`}>{p.status}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {p.status === 'pending' && (
                            <>
                              <button className="btn btn-success btn-xs" onClick={() => setModal(p)} style={{ padding: '3px 8px', fontSize: 11 }}><Check size={11} /> Approve</button>
                              <button className="btn btn-danger btn-xs" onClick={() => handleReject(p)} style={{ padding: '3px 8px', fontSize: 11 }}><X size={11} /> Reject</button>
                            </>
                          )}
                          {p.status === 'approved' && (
                            <button className="btn btn-primary btn-xs" onClick={() => setPaidModal(p)} style={{ padding: '3px 8px', fontSize: 11 }}><CreditCard size={11} /> Mark Paid</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Earning Publishers */}
        <div className="card" style={{ padding: 0 }}>
          <div className="card-header" style={{ padding: '16px 20px' }}>
            <div>
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Award size={16} style={{ color: 'var(--br-primary)' }} /> Top Publishers
              </div>
              <div className="card-subtitle">Highest gross share earnings inside the system</div>
            </div>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Publisher</th>
                  <th style={{ textAlign: 'right' }}>Period Earnings</th>
                  <th style={{ textAlign: 'right' }}>Approved Wallet</th>
                </tr>
              </thead>
              <tbody>
                {topPublishers.length === 0 ? (
                  <tr>
                    <td colSpan={3}>
                      <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--color-text-muted)' }}>
                        No publisher data available
                      </div>
                    </td>
                  </tr>
                ) : (
                  topPublishers.map((p, idx) => (
                    <tr key={p.email}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{p.email}</div>
                      </td>
                      <td className="money positive" style={{ textAlign: 'right', fontWeight: 700 }}><CompactAmount value={p.earnings} /></td>
                      <td className="money" style={{ textAlign: 'right', color: 'var(--color-accent)' }}><CompactAmount value={p.approved} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Closed Periods List */}
      <div className="card" style={{ padding: 0 }}>
        <div className="card-header" style={{ padding: '16px 20px' }}>
          <div>
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Lock size={16} style={{ color: 'var(--br-primary)' }} /> Recent Period Closings
            </div>
            <div className="card-subtitle">History of finalized monthly financial statements</div>
          </div>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Closing Period</th>
                <th>Finalized On</th>
                <th>Total Payouts</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {closings.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--color-text-muted)' }}>
                      No period closings found
                    </div>
                  </td>
                </tr>
              ) : (
                closings.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600 }}>{c.year}-{String(c.month).padStart(2, '0')}</td>
                    <td style={{ color: 'var(--color-text-muted)' }}>{formatDate(c.created_at)}</td>
                    <td className="money"><CompactAmount value={c.total_payouts_sum || 0} /></td>
                    <td>
                      <span className="badge badge-approved" style={{ textTransform: 'uppercase' }}>{c.status}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {modal && (
        <ApproveModal payout={modal} onClose={() => setModal(null)} onDone={() => { setModal(null); loadData() }} />
      )}
      {paidModal && (
        <MarkPaidModal payout={paidModal} onClose={() => setPaidModal(null)} onDone={() => { setPaidModal(null); loadData() }} />
      )}
    </div>
  )
}
