import { useState, useEffect } from 'react'
import { publisherApi } from '../../api/endpoints'
import toast from 'react-hot-toast'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function PublisherDashboard() {
  const [payouts, setPayouts] = useState([])
  const [revenue, setRevenue] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const [payRes, revRes] = await Promise.all([
        publisherApi.getPayouts(),
        publisherApi.getRevenue({
          date_from: new Date(Date.now() - 30 * 86400000).toISOString().slice(0,10)
        }),
      ])
      setPayouts(payRes.data?.data || [])
      setRevenue(revRes.data?.data || [])
    } catch { toast.error('Failed to load dashboard') }
    finally { setLoading(false) }
  }

  const totalApprovedEarnings = revenue
    .filter(r => r.is_closed || r.is_approved)
    .reduce((s, r) => s + parseFloat(r.publisher_earnings || 0), 0)

  const totalPendingEarnings = revenue
    .filter(r => !r.is_closed && !r.is_approved)
    .reduce((s, r) => s + parseFloat(r.publisher_earnings || 0), 0)

  const totalImpressions = revenue.reduce((s, r) => s + parseInt(r.impressions || 0), 0)
  const lastPayout      = payouts[0]

  // Chart data
  const byDate = {}
  revenue.forEach(r => {
    const d = r.date?.slice?.(0,10) || r.date
    if (!byDate[d]) byDate[d] = { date: d, earnings: 0, impressions: 0 }
    byDate[d].earnings    += parseFloat(r.publisher_earnings || 0)
    byDate[d].impressions += parseInt(r.impressions || 0)
  })
  const chart = Object.values(byDate)
    .sort((a,b) => a.date < b.date ? -1 : 1).slice(-14)
    .map(d => ({ ...d, earnings: +d.earnings.toFixed(2) }))

  if (loading) return (
    <div className="loading-screen"><div className="spinner"></div></div>
  )

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">📊 My Dashboard</h1>
          <p className="page-subtitle">Your earnings overview — last 30 days</p>
        </div>
        <a
          className="btn btn-secondary"
          href="/api/v1/publisher/revenue/pdf"
          target="_blank"
          rel="noreferrer"
        >
          📄 Export PDF Statement
        </a>
      </div>

      <div className="stat-grid">
        <div className="stat-card accent">
          <div className="stat-icon">💰</div>
          <div className="stat-label">Approved Earnings (30d)</div>
          <div className="stat-value money">${totalApprovedEarnings.toFixed(2)}</div>
          <div className="stat-change up">▲ Approved</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-icon">⏳</div>
          <div className="stat-label">Pending Earnings (30d)</div>
          <div className="stat-value money">${totalPendingEarnings.toFixed(2)}</div>
          <div className="stat-change">⏳ Holding</div>
        </div>
        <div className="stat-card info">
          <div className="stat-icon">👀</div>
          <div className="stat-label">Total Impressions</div>
          <div className="stat-value">{totalImpressions.toLocaleString()}</div>
        </div>
        <div className="stat-card primary">
          <div className="stat-icon">💳</div>
          <div className="stat-label">Last Payout</div>
          <div className="stat-value money">
            {lastPayout ? `$${parseFloat(lastPayout.final_amount).toFixed(2)}` : '—'}
          </div>
          <div className="stat-change">
            {lastPayout ? (
              <span className={`badge badge-${lastPayout.status}`}>{lastPayout.status}</span>
            ) : 'No payouts yet'}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">📈 Earnings Trend (Last 14 Days)</div>
        </div>
        {chart.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={chart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="pubGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a4a" />
              <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }}
                tickFormatter={d => d.slice(5)} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }}
                tickFormatter={v => `$${v}`} />
              <Tooltip
                contentStyle={{ background: '#1a1a2e', border: '1px solid #2a2a4a', borderRadius: 8 }}
                formatter={(v) => [`$${v}`, 'Earnings']}
              />
              <Area type="monotone" dataKey="earnings" stroke="#10b981"
                fill="url(#pubGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">📊</div>
            <div className="empty-state-text">No earnings data yet</div>
          </div>
        )}
      </div>

      {/* Recent Payouts */}
      {payouts.length > 0 && (
        <div className="card" style={{ marginTop: 24 }}>
          <div className="card-header">
            <div className="card-title">💳 Recent Payouts</div>
          </div>
          <table className="table">
            <thead><tr><th>Period</th><th>Amount</th><th>Status</th><th>Paid At</th></tr></thead>
            <tbody>
              {payouts.slice(0, 5).map(p => (
                <tr key={p.id}>
                  <td className="money">{p.period_year}-{String(p.period_month).padStart(2,'0')}</td>
                  <td className="money positive" style={{ fontWeight: 700 }}>
                    ${parseFloat(p.final_amount).toFixed(2)}
                  </td>
                  <td>
                    <span className={`badge badge-${p.status}`}>{p.status}</span>
                  </td>
                  <td className="text-muted text-sm">
                    {p.paid_at ? p.paid_at.slice(0,10) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
