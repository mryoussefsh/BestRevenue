import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { adminApi, gamAccountsApi } from '../../api/endpoints'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'
import { PublisherModal, AdjustBalanceModal } from './Publishers'
import { BulkAdUnitGeneratorModal } from '../../components/BulkAdUnitGeneratorModal'
import { WebsiteModal, AdUnitModal } from './Websites'

export default function PublisherProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { impersonate } = useAuth()

  const [publisher, setPublisher] = useState(null)
  const [websites, setWebsites] = useState([])
  const [adUnits, setAdUnits] = useState([])
  const [payouts, setPayouts] = useState([])
  const [revenue, setRevenue] = useState([])
  const [ratioHistory, setRatioHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [gamAccounts, setGamAccounts] = useState([])

  // Filters State
  const [selectedWebsite, setSelectedWebsite] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Modals state
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [adjustBalanceOpen, setAdjustBalanceOpen] = useState(false)
  const [manualPayoutOpen, setManualPayoutOpen] = useState(false)
  const [bulkAdModalOpen, setBulkAdModalOpen] = useState(false)
  const [websiteModal, setWebsiteModal] = useState(null)
  const [adModal, setAdModal] = useState(null)

  // Tab State
  const [activeTab, setActiveTab] = useState('websites')

  // Initial mount load: loads static & dynamic data
  useEffect(() => {
    loadAllData(true)
  }, [id])

  // Debounced live filter changes
  useEffect(() => {
    if (!publisher) return // Skip on initial mount
    const timer = setTimeout(() => {
      loadAllData(false)
    }, 250) // 250ms debounce
    return () => clearTimeout(timer)
  }, [selectedWebsite, dateFrom, dateTo])

  async function loadAllData(loadStatic = false) {
    if (!publisher || loadStatic) setLoading(true)
    try {
      const params = {
        website_id: selectedWebsite || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined
      }

      const promises = [
        adminApi.getPublisher(id, params),
        adminApi.getAdUnits({ publisher_id: id, website_id: selectedWebsite || undefined }),
        adminApi.getPayouts({ publisher_id: id, date_from: dateFrom || undefined, date_to: dateTo || undefined }),
        adminApi.getRevenue({ publisher_id: id, website_id: selectedWebsite || undefined, date_from: dateFrom || undefined, date_to: dateTo || undefined }),
      ]

      if (loadStatic || !publisher) {
        promises.push(
          adminApi.getWebsites({ publisher_id: id }),
          adminApi.getRatioHistory(id),
          gamAccountsApi.getAll()
        )
      }

      const results = await Promise.all(promises)

      setPublisher(results[0].data?.data)
      setAdUnits(results[1].data?.data || [])
      setPayouts(results[2].data?.data || [])
      setRevenue(results[3].data?.data || [])

      if (loadStatic || !publisher) {
        setWebsites(results[4].data?.data || [])
        setRatioHistory(results[5].data || [])
        setGamAccounts(results[6].data || [])
      }
    } catch (e) {
      toast.error('Failed to load publisher profile details')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete publisher "${publisher?.name}"? This cannot be undone.`)) return
    try {
      await adminApi.deletePublisher(publisher.id)
      toast.success('Publisher deleted successfully')
      navigate('/admin/publishers')
    } catch {
      toast.error('Delete failed')
    }
  }

  async function handleToggleSuspend() {
    const isPending = publisher?.status === 'pending'
    const isSuspended = publisher?.status === 'suspended'
    const isActive = publisher?.status === 'active'

    const action = isActive ? 'suspend' : 'activate'
    
    if (!confirm(`Are you sure you want to ${action} publisher "${publisher?.name}"?`)) return
    
    try {
      if (isActive) {
        await adminApi.suspendPublisher(publisher.id)
        toast.success('Publisher suspended')
      } else if (isPending) {
        await adminApi.activatePublisher(publisher.id)
        toast.success('Publisher activated')
      } else if (isSuspended) {
        await adminApi.updatePublisher(publisher.id, { status: 'active' }) // or you can use activatePublisher if backend supports it for suspended too.
        toast.success('Publisher activated')
      }
      loadAllData(true)
    } catch {
      toast.error(`Failed to ${action} publisher`)
    }
  }

  async function handleImpersonate() {
    if (!confirm(`Log in as publisher "${publisher?.name}"?`)) return
    try {
      const res = await adminApi.impersonatePublisher(publisher.id)
      const { access_token, user: publisherUser } = res.data
      impersonate(access_token, publisherUser)
      toast.success(`Logged in as ${publisher?.name}`)
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to impersonate publisher')
    }
  }

  if (loading) return (
    <div className="loading-screen"><div className="spinner"></div><span>Loading profile…</span></div>
  )

  if (!publisher) return (
    <div className="card text-center" style={{ padding: 40 }}>
      <h3>Publisher not found</h3>
      <Link to="/admin/publishers" className="btn btn-primary" style={{ marginTop: 16 }}>Return to list</Link>
    </div>
  )

  // Group ad units by website_id
  const adUnitsByWebsite = {}
  adUnits.forEach(ad => {
    if (!adUnitsByWebsite[ad.website_id]) {
      adUnitsByWebsite[ad.website_id] = []
    }
    adUnitsByWebsite[ad.website_id].push(ad)
  })

  return (
    <div>
      {/* Top back navigation */}
      <div style={{ marginBottom: 16 }}>
        <Link to="/admin/publishers" className="text-muted hover-link" style={{ fontSize: 14, fontWeight: 500 }}>
          ← Back to Publishers List
        </Link>
      </div>

      {/* Profile Header */}
      <div className="card" style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
              fontWeight: 800,
              boxShadow: 'var(--shadow-md)',
              color: '#fff'
            }}>
              {publisher.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h1 className="page-title" style={{ margin: 0, fontSize: 24 }}>{publisher.name}</h1>
                <span className={`badge ${publisher.status === 'active' ? 'badge-active' : publisher.status === 'pending' ? 'badge-pending' : 'badge-inactive'}`}>
                  {publisher.status === 'active' ? '🟢' : publisher.status === 'pending' ? '🟡' : '🔴'} {publisher.status}
                </span>
              </div>
              <div className="text-muted" style={{ fontSize: 14, marginTop: 4 }}>{publisher.email}</div>
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" onClick={() => setEditModalOpen(true)}>
              ✏️ Edit Profile
            </button>
            <button className="btn btn-secondary"
              style={{ background: 'rgba(16,185,129,0.12)', color: 'var(--color-accent)', border: '1px solid rgba(16,185,129,0.3)' }}
              onClick={() => setAdjustBalanceOpen(true)}>
              💰 Adjust Balance
            </button>
            <button className="btn btn-secondary"
              style={{ background: 'rgba(59,130,246,0.12)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.3)' }}
              onClick={() => setManualPayoutOpen(true)}>
              💸 Manual Payout
            </button>
            <button className="btn btn-secondary"
              style={{ background: 'rgba(139,92,246,0.12)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.3)' }}
              onClick={() => setBulkAdModalOpen(true)}>
              ✨ Generate Ad Units
            </button>
            <button className="btn btn-secondary"
              style={{ background: 'rgba(99,102,241,0.12)', color: 'var(--color-primary)', border: '1px solid rgba(99,102,241,0.3)' }}
              onClick={handleImpersonate}>
              👤 Log In
            </button>
            <button className="btn"
              style={{
                background: publisher.status === 'active' ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)',
                color: publisher.status === 'active' ? 'var(--color-warning)' : 'var(--color-accent)',
                border: publisher.status === 'active' ? '1px solid rgba(245,158,11,0.3)' : '1px solid rgba(16,185,129,0.3)'
              }}
              onClick={handleToggleSuspend}>
              {publisher.status === 'active' ? '⏸ Suspend' : publisher.status === 'pending' ? '✅ Approve' : '▶ Activate'}
            </button>
            <button className="btn btn-danger" onClick={handleDelete}>
              🗑 Delete
            </button>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '16px 24px', marginBottom: 24, background: 'var(--color-surface-2)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16, flex: 1 }}>
            
            {/* Website Selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 200 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                🌐 Filter by Website
              </label>
              <select
                className="form-select"
                style={{ width: '100%', padding: '8px 12px', height: 40 }}
                value={selectedWebsite}
                onChange={e => setSelectedWebsite(e.target.value)}
              >
                <option value="">All Websites</option>
                {websites.map(w => (
                  <option key={w.id} value={w.id}>{w.domain}</option>
                ))}
              </select>
            </div>

            {/* Date From Selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 160 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                📅 Date From
              </label>
              <input
                type="date"
                className="form-input"
                style={{ width: '100%', padding: '8px 12px', height: 40 }}
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
              />
            </div>

            {/* Date To Selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 160 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                📅 Date To
              </label>
              <input
                type="date"
                className="form-input"
                style={{ width: '100%', padding: '8px 12px', height: 40 }}
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
              />
            </div>

          </div>

          {/* Reset Filters Button */}
          {(selectedWebsite || dateFrom || dateTo) && (
            <div style={{ display: 'flex', alignSelf: 'flex-end', height: 40 }}>
              <button
                className="btn btn-secondary"
                style={{ height: '100%', display: 'flex', alignItems: 'center', gap: 8 }}
                onClick={() => {
                  setSelectedWebsite('')
                  setDateFrom('')
                  setDateTo('')
                }}
              >
                Clear Filters
              </button>
            </div>
          )}

        </div>
      </div>

      {/* Stats Cards */}
      <div className="stat-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card accent" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.02))' }}>
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.15)' }}>💵</div>
          <div className="stat-label">Ready for Payout</div>
          <div className="stat-value money" style={{ color: 'var(--color-accent)' }}>${(publisher.ready_for_payout_balance || 0).toFixed(2)}</div>
          <div className="stat-change text-muted">Total wallet balance</div>
        </div>
        <div className="stat-card info">
          <div className="stat-icon">🟢</div>
          <div className="stat-label">Approved Balance</div>
          <div className="stat-value money">${(publisher.approved_balance || 0).toFixed(2)}</div>
          <div className="stat-change text-muted">Filtered for period</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-icon">⏳</div>
          <div className="stat-label">Pending Balance</div>
          <div className="stat-value money">${(publisher.pending_balance || 0).toFixed(2)}</div>
          <div className="stat-change text-muted">Holding period</div>
        </div>
        <div className="stat-card primary">
          <div className="stat-icon">⚖️</div>
          <div className="stat-label">Upcoming Adjustment</div>
          <div className="stat-value money" style={{
            color: publisher.pending_balance_adjustment > 0 ? 'var(--color-accent)' : publisher.pending_balance_adjustment < 0 ? 'var(--color-danger)' : 'inherit'
          }}>
            {publisher.pending_balance_adjustment > 0 ? '+' : ''}${publisher.pending_balance_adjustment.toFixed(2)}
          </div>
          <div className="stat-change text-muted">Pending balance adjust</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--color-text-subtle)' }}>
          <div className="stat-icon" style={{ background: 'rgba(255,255,255,0.05)' }}>💳</div>
          <div className="stat-label">Total Payouts Paid</div>
          <div className="stat-value money">${publisher.total_payout.toFixed(2)}</div>
          <div className="stat-change text-muted">Paid to date</div>
        </div>
      </div>

      {/* Two Column details section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24, alignItems: 'start' }}>
        
        {/* Left Column: Contact and Metadata info */}
        <div>
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-header" style={{ paddingBottom: 12, borderBottom: '1px solid var(--color-border)' }}>
              <div className="card-title" style={{ fontSize: 16 }}>📋 Contact & System Info</div>
            </div>
            <div style={{ padding: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <span className="text-muted text-sm" style={{ display: 'block' }}>Country</span>
                  <span style={{ fontWeight: 500 }}>{publisher.country || 'Not Set'}</span>
                </div>
                <div>
                  <span className="text-muted text-sm" style={{ display: 'block' }}>Phone Number</span>
                  <span style={{ fontWeight: 500 }}>{publisher.phone || 'Not Set'}</span>
                </div>
                <div>
                  <span className="text-muted text-sm" style={{ display: 'block' }}>Telegram Username</span>
                  {publisher.telegram ? (
                    <a href={`https://t.me/${publisher.telegram.replace('@', '')}`} target="_blank" rel="noreferrer" className="hover-link" style={{ fontWeight: 500, color: 'var(--color-primary-light)' }}>
                      {publisher.telegram}
                    </a>
                  ) : <span>Not Set</span>}
                </div>
                <div>
                  <span className="text-muted text-sm" style={{ display: 'block' }}>Skype ID</span>
                  <span style={{ fontWeight: 500 }}>{publisher.skype || 'Not Set'}</span>
                </div>
                <hr style={{ border: 0, borderTop: '1px solid var(--color-border)' }} />
                <div>
                  <span className="text-muted text-sm" style={{ display: 'block' }}>Revenue Ratio Split</span>
                  <span style={{ fontWeight: 700, color: 'var(--color-accent)' }}>{(parseFloat(publisher.default_ratio) * 100).toFixed(0)}%</span>
                </div>
                <div>
                  <span className="text-muted text-sm" style={{ display: 'block' }}>Registration IP</span>
                  <code style={{ fontSize: 13, background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: 4 }}>{publisher.reg_ip || 'N/A'}</code>
                </div>
                <div>
                  <span className="text-muted text-sm" style={{ display: 'block' }}>Last Login IP</span>
                  <code style={{ fontSize: 13, background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: 4 }}>{publisher.last_ip || 'N/A'}</code>
                </div>
                <div>
                  <span className="text-muted text-sm" style={{ display: 'block' }}>Created Account</span>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{publisher.created_at?.slice(0, 19).replace('T', ' ')}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header" style={{ paddingBottom: 12, borderBottom: '1px solid var(--color-border)' }}>
              <div className="card-title" style={{ fontSize: 16 }}>📝 Internal Notes (Admin Only)</div>
            </div>
            <div style={{ padding: 16 }}>
              {publisher.notes ? (
                <pre style={{
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'inherit',
                  fontSize: 13,
                  background: 'rgba(0,0,0,0.15)',
                  padding: 12,
                  borderRadius: 6,
                  border: '1px solid var(--color-border)',
                  maxHeight: 200,
                  overflowY: 'auto'
                }}>
                  {publisher.notes}
                </pre>
              ) : (
                <span className="text-muted text-sm">No internal notes added.</span>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Tabbed list of resources */}
        <div className="card" style={{ padding: 0 }}>
          <div style={{
            display: 'flex',
            borderBottom: '1px solid var(--color-border)',
            background: 'rgba(0, 0, 0, 0.05)',
            borderTopLeftRadius: 'var(--radius-md)',
            borderTopRightRadius: 'var(--radius-md)',
            overflow: 'hidden'
          }}>
            {[
              { id: 'websites', label: '🌐 Websites & Ad Units' },
              { id: 'payouts', label: '💳 Payouts History' },
              { id: 'revenue', label: '📊 Revenue Logs' },
              { id: 'history', label: '⏳ Ratio Changes' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '16px 20px',
                  fontWeight: 600,
                  fontSize: 14,
                  color: activeTab === tab.id ? 'var(--color-primary-light)' : 'var(--color-text-muted)',
                  borderBottom: activeTab === tab.id ? '2px solid var(--color-primary)' : 'none',
                  background: activeTab === tab.id ? 'rgba(99, 102, 241, 0.05)' : 'transparent',
                  transition: 'all var(--transition)'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ padding: 20 }}>
            {activeTab === 'websites' && (
              <div>
                {websites.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon">🌐</div>
                    <div className="empty-state-text">No websites linked</div>
                    <div className="empty-state-sub" style={{ marginBottom: 12 }}>Add websites to this publisher</div>
                    <button className="btn btn-primary" onClick={() => setWebsiteModal('create')}>
                      ➕ Add Website
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button className="btn btn-primary btn-sm" onClick={() => setWebsiteModal('create')}>
                        ➕ Add Website
                      </button>
                    </div>
                    {websites.filter(w => !selectedWebsite || w.id === selectedWebsite).map(web => (
                      <div key={web.id} className="card" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
                                <a href={`https://${web.domain}`} target="_blank" rel="noreferrer" className="hover-link" style={{ color: 'var(--color-primary-light)' }}>
                                  {web.domain}
                                </a>
                              </h3>
                              <span className={`badge ${web.is_active ? 'badge-active' : 'badge-inactive'}`}>
                                {web.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            <div className="text-muted text-sm" style={{ marginTop: 4 }}>
                              GAM Account: <strong>{web.gam_account_email || 'Not Linked'}</strong> {web.gam_network_code && `(Network: ${web.gam_network_code})`}
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {web.ratio_override && (
                              <div className="badge badge-active" style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--color-accent)' }}>
                                Ratio Override: <strong>{(parseFloat(web.ratio_override) * 100).toFixed(0)}%</strong>
                              </div>
                            )}
                            <button className="btn btn-secondary btn-xs" onClick={() => setWebsiteModal(web)}>
                              ✏️ Edit
                            </button>
                          </div>
                        </div>

                        {/* Ad Units list */}
                        <div style={{ marginTop: 12, background: 'rgba(0,0,0,0.1)', borderRadius: 8, padding: '8px 12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <h4 style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: 0.5, margin: 0 }}>
                              Ad Units ({adUnitsByWebsite[web.id]?.length || 0})
                            </h4>
                            <button className="btn btn-secondary btn-xs" style={{ padding: '3px 8px', fontSize: 11 }} onClick={() => setAdModal({ website_id: web.id })}>
                              ➕ Add Existing Ad Unit
                            </button>
                          </div>
                          {!adUnitsByWebsite[web.id] || adUnitsByWebsite[web.id].length === 0 ? (
                            <div style={{ color: 'var(--color-text-subtle)', fontSize: 13, fontStyle: 'italic', padding: 8 }}>
                              No ad units added to this website.
                            </div>
                          ) : (
                            <table className="table" style={{ background: 'transparent' }}>
                              <thead>
                                <tr>
                                  <th style={{ fontSize: 11, padding: '6px 8px' }}>Ad Unit Name (GAM)</th>
                                  <th style={{ fontSize: 11, padding: '6px 8px' }}>Display Name</th>
                                  <th style={{ fontSize: 11, padding: '6px 8px' }}>Ratio Split</th>
                                  <th style={{ fontSize: 11, padding: '6px 8px', textAlign: 'right' }}>Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {adUnitsByWebsite[web.id].map(ad => (
                                  <tr key={ad.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                    <td style={{ padding: '6px 8px', fontSize: 13 }}>
                                      <code>{ad.gam_ad_unit_name}</code>
                                      {ad.gam_ad_unit_id && <div className="text-muted" style={{ fontSize: 10 }}>ID: {ad.gam_ad_unit_id}</div>}
                                    </td>
                                    <td style={{ padding: '6px 8px', fontSize: 13 }}>{ad.display_name}</td>
                                    <td style={{ padding: '6px 8px', fontSize: 13, fontWeight: 600 }}>
                                      {ad.ratio_override 
                                        ? `${(parseFloat(ad.ratio_override) * 100).toFixed(0)}% (Override)` 
                                        : 'Inherited'}
                                    </td>
                                    <td style={{ padding: '6px 8px', fontSize: 13, textAlign: 'right' }}>
                                      <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
                                        <button className="btn btn-secondary btn-xs" style={{ padding: '2px 6px' }} onClick={() => setAdModal(ad)}>✏️</button>
                                        <button className="btn btn-danger btn-xs" style={{ padding: '2px 6px' }}
                                          onClick={async () => {
                                            if (!confirm(`Delete ad unit "${ad.display_name}"?`)) return
                                            try {
                                              await adminApi.deleteAdUnit(ad.id)
                                              toast.success('Ad unit deleted successfully')
                                              loadAllData(true)
                                            } catch {
                                              toast.error('Failed to delete ad unit')
                                            }
                                          }}>🗑</button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'payouts' && (
              <div>
                {payouts.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon">💳</div>
                    <div className="empty-state-text">No payout records yet</div>
                    <div className="empty-state-sub">Payouts are generated when closing a monthly period</div>
                  </div>
                ) : (
                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Period</th>
                          <th>Base Amount</th>
                          <th>Adjustment</th>
                          <th>Final Amount</th>
                          <th>Status</th>
                          <th>Paid At</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payouts.map(p => (
                          <tr key={p.id}>
                            <td style={{ fontWeight: 600 }}>{p.period_year}-{String(p.period_month).padStart(2, '0')}</td>
                            <td>${parseFloat(p.amount).toFixed(2)}</td>
                            <td style={{
                              color: parseFloat(p.adjustment) > 0 ? 'var(--color-accent)' : parseFloat(p.adjustment) < 0 ? 'var(--color-danger)' : 'inherit'
                            }}>
                              {parseFloat(p.adjustment) > 0 ? '+' : ''}${parseFloat(p.adjustment).toFixed(2)}
                            </td>
                            <td style={{ fontWeight: 700 }} className="positive">${parseFloat(p.final_amount).toFixed(2)}</td>
                            <td>
                              <span className={`badge badge-${p.status}`}>
                                {p.status}
                              </span>
                            </td>
                            <td className="text-muted text-sm">{p.paid_at ? p.paid_at.slice(0, 10) : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'revenue' && (
              <div>
                {revenue.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon">📊</div>
                    <div className="empty-state-text">No revenue logs found</div>
                    <div className="empty-state-sub">Revenue records will appear once synchronized from Google Ad Manager</div>
                  </div>
                ) : (
                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th style={{ width: 130 }}>Date</th>
                          <th>Ad Unit / Website</th>
                          <th style={{ textAlign: 'right', paddingRight: 24 }}>Impressions</th>
                          <th style={{ textAlign: 'right', paddingRight: 24 }}>Gross Rev.</th>
                          <th style={{ textAlign: 'right', paddingRight: 24 }}>Pub. Share</th>
                          <th style={{ textAlign: 'center', width: 120 }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {revenue.slice(0, 50).map(r => (
                          <tr key={r.id}>
                            <td style={{ whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                              <div style={{ fontWeight: 500, fontSize: 13 }}>{r.date?.slice(0, 10)}</div>
                            </td>
                            <td style={{ verticalAlign: 'middle' }}>
                              <div style={{ fontWeight: 600 }}>{r.ad_unit?.display_name || 'N/A'}</div>
                              <div className="text-muted text-xs">{r.ad_unit?.website?.domain || 'N/A'}</div>
                            </td>
                            <td style={{ textAlign: 'right', paddingRight: 24, verticalAlign: 'middle', fontFamily: 'monospace' }}>
                              {parseInt(r.impressions || 0).toLocaleString()}
                            </td>
                            <td className="money" style={{ textAlign: 'right', paddingRight: 24, verticalAlign: 'middle' }}>
                              ${parseFloat(r.gross_revenue).toFixed(2)}
                            </td>
                            <td className="money positive" style={{ textAlign: 'right', paddingRight: 24, verticalAlign: 'middle', fontWeight: 700 }}>
                              ${parseFloat(r.publisher_earnings).toFixed(2)}
                            </td>
                            <td style={{ textAlign: 'center', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                              <span className={`badge ${r.period_closing_id !== null ? 'badge-inactive' : r.is_approved ? 'badge-active' : 'badge-inactive'}`}
                                    style={{
                                      display: 'inline-block',
                                      whiteSpace: 'nowrap',
                                      padding: '4px 8px',
                                      borderRadius: '4px',
                                      fontSize: '11px',
                                      fontWeight: 600,
                                      background: r.period_closing_id !== null ? 'rgba(99,102,241,0.15)' : r.is_approved ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                                      color: r.period_closing_id !== null ? 'var(--color-primary-light)' : r.is_approved ? 'var(--color-accent)' : 'var(--color-warning)',
                                    }}>
                                {r.period_closing_id !== null ? '🔒 closed' : r.is_approved ? '✓ approved' : '⏳ pending'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {revenue.length > 50 && (
                      <div className="text-muted text-center text-sm" style={{ padding: 12 }}>
                        Showing latest 50 records. See all under the Revenue page.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'history' && (
              <div>
                {ratioHistory.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon">⏳</div>
                    <div className="empty-state-text">No ratio changes logged</div>
                    <div className="empty-state-sub">Revenue ratio change logs will show up here</div>
                  </div>
                ) : (
                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Date Changed</th>
                          <th>Target</th>
                          <th>Old Ratio</th>
                          <th>New Ratio</th>
                          <th>Changed By</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ratioHistory.map(h => (
                          <tr key={h.id}>
                            <td>{h.changed_at?.slice(0, 16).replace('T', ' ')}</td>
                            <td style={{ fontWeight: 600, color: 'var(--color-primary-light)' }}>{h.target || 'General Profile'}</td>
                            <td style={{ fontWeight: 500 }}>
                              {h.old_ratio ? `${(parseFloat(h.old_ratio) * 100).toFixed(0)}%` : '—'}
                            </td>
                            <td style={{ fontWeight: 700, color: 'var(--color-accent)' }}>
                              {(parseFloat(h.new_ratio) * 100).toFixed(0)}%
                            </td>
                            <td className="text-muted">
                              {h.changed_by || 'Admin/System'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>

      {editModalOpen && (
        <PublisherModal
          publisher={publisher}
          onClose={() => setEditModalOpen(false)}
          onSaved={() => { setEditModalOpen(false); loadAllData(true) }}
        />
      )}

      {adjustBalanceOpen && (
        <AdjustBalanceModal
          publisher={publisher}
          onClose={() => setAdjustBalanceOpen(false)}
          onSaved={() => { setAdjustBalanceOpen(false); loadAllData(true) }}
        />
      )}

      {manualPayoutOpen && (
        <ManualPayoutModal
          publisher={publisher}
          onClose={() => setManualPayoutOpen(false)}
          onSaved={() => { setManualPayoutOpen(false); loadAllData(true) }}
        />
      )}
      {bulkAdModalOpen && (
        <BulkAdUnitGeneratorModal
          websites={websites}
          onClose={() => setBulkAdModalOpen(false)}
          onSaved={() => { setBulkAdModalOpen(false); loadAllData(true) }}
        />
      )}
      {websiteModal && (
        <WebsiteModal
          website={websiteModal === 'create' ? { publisher_id: publisher.id } : websiteModal}
          publishers={[publisher]}
          gamAccounts={gamAccounts}
          onClose={() => setWebsiteModal(null)}
          onSaved={() => { setWebsiteModal(null); loadAllData(true) }}
          hidePublisherSelect={true}
        />
      )}
      {adModal && (
        <AdUnitModal
          adUnit={adModal === 'create' ? null : adModal}
          websites={websites}
          onClose={() => setAdModal(null)}
          onSaved={() => { setAdModal(null); loadAllData(true) }}
        />
      )}
    </div>
  )
}

function ManualPayoutModal({ publisher, onClose, onSaved }) {
  const [amount, setAmount] = useState('0.00')
  const [method, setMethod] = useState('')
  const [reference, setReference] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const walletBalance = publisher.approved_balance || 0.0

  useEffect(() => {
    setAmount(walletBalance.toFixed(2))
  }, [walletBalance])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid payout amount')
      return
    }
    if (!method.trim()) {
      toast.error('Please enter a payment method')
      return
    }
    setSaving(true)
    try {
      await adminApi.manualPayment(publisher.id, {
        amount: parseFloat(amount),
        method: method.trim(),
        reference: reference.trim() || undefined,
        notes: note.trim() || undefined,
      })
      toast.success('Manual payment recorded successfully!')
      onSaved()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create manual payment')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">💸 Record Manual Payment</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="alert alert-info" style={{ fontSize: 13, marginBottom: 16 }}>
            💡 This will record an out-of-cycle manual payment for <strong>{publisher.name}</strong> without affecting monthly period closings or locking revenue records. It will be immediately logged as Paid.
          </div>

          <div className="form-group">
            <label className="form-label">Payout Amount ($) *</label>
            <input className="form-input" type="number" step="0.01" min="0.01" value={amount}
              onChange={e => setAmount(e.target.value)} required />
            <span className="form-hint">
              Current approved wallet balance: <strong>${walletBalance.toFixed(2)}</strong>
            </span>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Payment Method *</label>
              <input className="form-input" type="text" value={method}
                onChange={e => setMethod(e.target.value)} placeholder="e.g. Wise, Bank Transfer, PayPal" required />
            </div>
            <div className="form-group">
              <label className="form-label">Reference ID (optional)</label>
              <input className="form-input" type="text" value={reference}
                onChange={e => setReference(e.target.value)} placeholder="Transaction hash or ID" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Admin Note / Memo (internal)</label>
            <textarea className="form-textarea" rows={2} value={note}
              onChange={e => setNote(e.target.value)} placeholder="e.g. Special manual payout request override…" />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Recording…' : '💸 Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
