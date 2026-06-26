import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { adminApi, gamAccountsApi } from '../../api/endpoints'
import { useAuth } from '../../contexts/AuthContext'
import { useSettings } from '../../contexts/SettingsContext'
import toast from 'react-hot-toast'
import CompactAmount from '../../components/CompactAmount'
import { PublisherModal, AdjustBalanceModal } from './Publishers'
import { BulkAdUnitGeneratorModal } from '../../components/BulkAdUnitGeneratorModal'
import { WebsiteModal, AdUnitModal } from './Websites'
import { useI18n } from '../../contexts/I18nContext'
import { Edit2, DollarSign, CreditCard, Sparkles, User, Play, Pause, Check, Trash2, Globe, Calendar, FileText, Clipboard, StickyNote, Link as LinkIcon, History, BarChart2, Eye, Info, X, Scale, ExternalLink, Plus, Lock, Clock, Filter, Mail } from 'lucide-react'


export default function PublisherProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { impersonate, hasPermission } = useAuth()
  const { settings, formatDate, formatDateTime } = useSettings()
  const { t } = useI18n()
  const canEdit = hasPermission('manage_publishers')
  const canManageWebsites = hasPermission('manage_websites')
  const canManageAdUnits = hasPermission('manage_ad_units')

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
  const [showFilters, setShowFilters] = useState(false)

  // Modals state
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [adjustBalanceOpen, setAdjustBalanceOpen] = useState(false)
  const [manualPayoutOpen, setManualPayoutOpen] = useState(false)
  const [bulkAdModalOpen, setBulkAdModalOpen] = useState(false)
  const [websiteModal, setWebsiteModal] = useState(null)
  const [adModal, setAdModal] = useState(null)
  const [impersonateModalOpen, setImpersonateModalOpen] = useState(false)
  const [emailModalOpen, setEmailModalOpen] = useState(false)

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
        adminApi.getAdUnits({ publisher_id: id, website_id: selectedWebsite || undefined })
          .catch(() => ({ data: { data: [] } })),
        adminApi.getPayouts({ publisher_id: id, date_from: dateFrom || undefined, date_to: dateTo || undefined })
          .catch(() => ({ data: { data: [] } })),
        adminApi.getRevenue({ publisher_id: id, website_id: selectedWebsite || undefined, date_from: dateFrom || undefined, date_to: dateTo || undefined })
          .catch(() => ({ data: { data: [] } })),
      ]

      if (loadStatic || !publisher) {
        promises.push(
          adminApi.getWebsites({ publisher_id: id }).catch(() => ({ data: { data: [] } })),
          adminApi.getRatioHistory(id).catch(() => ({ data: [] })),
          gamAccountsApi.getAll().catch(() => ({ data: [] }))
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
      toast.error(t('admin.publisher_profile.toast.load_failed', 'Failed to load publisher profile details'))
    } finally {
      setLoading(false)
    }
  }

  const totalPayoutBase = payouts.reduce((s, p) => s + parseFloat(p.amount || 0), 0)
  const totalPayoutAdj = payouts.reduce((s, p) => s + parseFloat(p.adjustment || 0), 0)
  const totalPayoutFinal = payouts.reduce((s, p) => s + parseFloat(p.final_amount || 0), 0)

  const totalRevImpr = revenue.reduce((s, r) => s + parseInt(r.impressions || 0), 0)
  const totalRevGross = revenue.reduce((s, r) => s + parseFloat(r.gross_revenue || 0), 0)
  const totalRevPub = revenue.reduce((s, r) => s + parseFloat(r.publisher_earnings || 0), 0)

  async function handleDelete() {
    if (!confirm(t('admin.publisher_profile.confirm.delete', 'Delete publisher "{name}"? This cannot be undone.', { name: publisher?.name }))) return
    try {
      await adminApi.deletePublisher(publisher.id)
      toast.success(t('admin.publisher_profile.toast.deleted', 'Publisher deleted successfully'))
      navigate('/admin/publishers')
    } catch {
      toast.error(t('admin.publisher_profile.toast.delete_failed', 'Delete failed'))
    }
  }

  async function handleToggleSuspend() {
    const isPending = publisher?.status === 'pending'
    const isSuspended = publisher?.status === 'suspended'
    const isActive = publisher?.status === 'active'

    const action = isActive ? 'suspend' : 'activate'
    
    if (!confirm(t('admin.publisher_profile.confirm.toggle_status', 'Are you sure you want to {action} publisher "{name}"?', { action: t(`admin.publisher_profile.actions.${action}`, action), name: publisher?.name }))) return
    
    try {
      if (isActive) {
        await adminApi.suspendPublisher(publisher.id)
        toast.success(t('admin.publisher_profile.toast.suspended', 'Publisher suspended'))
      } else if (isPending) {
        await adminApi.activatePublisher(publisher.id)
        toast.success(t('admin.publisher_profile.toast.activated', 'Publisher activated'))
      } else if (isSuspended) {
        await adminApi.updatePublisher(publisher.id, { status: 'active' }) // or you can use activatePublisher if backend supports it for suspended too.
        toast.success(t('admin.publisher_profile.toast.activated', 'Publisher activated'))
      }
      loadAllData(true)
    } catch {
      toast.error(t('admin.publisher_profile.toast.toggle_status_failed', 'Failed to {action} publisher', { action: t(`admin.publisher_profile.actions.${action}`, action) }))
    }
  }

  async function handleImpersonate() {
    if (!confirm(t('admin.publisher_profile.confirm.impersonate', 'Log in as publisher "{name}"?', { name: publisher?.name }))) return
    try {
      const res = await adminApi.impersonatePublisher(publisher.id)
      const { access_token, user: publisherUser } = res.data
      impersonate(access_token, publisherUser)
      toast.success(t('admin.publisher_profile.toast.impersonate_success', 'Logged in as {name}', { name: publisher?.name }))
    } catch (e) {
      toast.error(e.response?.data?.message || t('admin.publisher_profile.toast.impersonate_failed', 'Failed to impersonate publisher'))
    }
  }

  if (loading) return (
    <div className="loading-screen"><div className="spinner"></div><span>{t('admin.publisher_profile.loading', 'Loading profile…')}</span></div>
  )

  if (!publisher) return (
    <div className="card text-center" style={{ padding: 40 }}>
      <h3>{t('admin.publisher_profile.not_found', 'Publisher not found')}</h3>
      <Link to="/admin/publishers" className="btn btn-primary" style={{ marginTop: 16 }}>{t('admin.publisher_profile.return_to_list', 'Return to list')}</Link>
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

  const activeFiltersCount = [
    selectedWebsite,
    dateFrom,
    dateTo
  ].filter(Boolean).length

  return (
    <div>
      {/* Top back navigation and Filter */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <Link to="/admin/publishers" className="text-muted hover-link" style={{ fontSize: 14, fontWeight: 500 }}>
          {t('admin.publisher_profile.back_to_list', '← Back to Publishers List')}
        </Link>
        <button 
          className="btn btn-secondary"
          onClick={() => setShowFilters(!showFilters)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
        >
          <Filter size={16} />
          <span>{showFilters ? t('admin.publisher_profile.filters.hide', 'Hide Filters') : t('admin.publisher_profile.filters.show', 'Show Filters')}</span>
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
      </div>

      {/* Filter Bar */}
      {showFilters && (
        <div className="card filter-bar-card" style={{ padding: '16px 20px', marginBottom: 24, background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: 12 
            }}>
              {/* Website Selector */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label className="text-muted text-xs" style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Globe size={12} /> {t('admin.publisher_profile.filters.by_website', 'Filter by Website')}
                </label>
                <select
                  className="form-select"
                  style={{ width: '100%', height: 38 }}
                  value={selectedWebsite}
                  onChange={e => setSelectedWebsite(e.target.value)}
                >
                  <option value="">{t('admin.publisher_profile.filters.all_websites', 'All Websites')}</option>
                  {websites.map(w => (
                    <option key={w.id} value={w.id}>{w.domain}</option>
                  ))}
                </select>
              </div>

              {/* Date From Selector */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label className="text-muted text-xs" style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={12} /> {t('admin.publisher_profile.filters.date_from', 'Date From')}
                </label>
                <input
                  type="date"
                  className="form-input"
                  style={{ width: '100%', height: 38 }}
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                />
              </div>

              {/* Date To Selector */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label className="text-muted text-xs" style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={12} /> {t('admin.publisher_profile.filters.date_to', 'Date To')}
                </label>
                <input
                  type="date"
                  className="form-input"
                  style={{ width: '100%', height: 38 }}
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                />
              </div>
            </div>

            {(selectedWebsite || dateFrom || dateTo) && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', borderTop: '1px solid var(--color-border)', paddingTop: 12 }}>
                <button 
                  className="btn btn-secondary btn-sm" 
                  onClick={() => {
                    setSelectedWebsite('')
                    setDateFrom('')
                    setDateTo('')
                  }}
                  style={{ 
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    color: '#ef4444',
                    padding: '6px 12px',
                    fontWeight: 600,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#ef4444'
                    e.currentTarget.style.color = '#fff'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
                    e.currentTarget.style.color = '#ef4444'
                  }}
                >
                  <X size={12} /> {t('admin.publisher_profile.filters.clear', 'Clear Filters')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

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
                <h1 className="profile-name">{publisher.name}</h1>
                <span className={`badge ${publisher.status === 'active' ? 'badge-active' : publisher.status === 'pending' ? 'badge-pending' : 'badge-inactive'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
                  {t(`admin.publishers.status.${publisher.status}`, publisher.status)}
                </span>
              </div>
              <div className="text-muted" style={{ fontSize: 14, marginTop: 4 }}>{publisher.email}</div>
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="profile-actions-grid">
            {canEdit && (
              <button className="btn btn-secondary" onClick={() => setEditModalOpen(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Edit2 size={14} /> {t('admin.publisher_profile.actions.edit_profile', 'Edit Profile')}
              </button>
            )}
            {canEdit && (
              <button className="btn btn-secondary"
                style={{ background: 'rgba(6,182,212,0.12)', color: '#06b6d4', border: '1px solid rgba(6,182,212,0.3)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                onClick={() => setEmailModalOpen(true)}>
                <Mail size={14} /> {t('admin.publisher_profile.actions.send_email', 'Send Email')}
              </button>
            )}
            {canEdit && (
              <button className="btn btn-secondary"
                style={{ background: 'rgba(16,185,129,0.12)', color: 'var(--color-accent)', border: '1px solid rgba(16,185,129,0.3)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                onClick={() => setAdjustBalanceOpen(true)}>
                <DollarSign size={14} /> {t('admin.publisher_profile.actions.adjust_balance', 'Adjust Balance')}
              </button>
            )}
            {hasPermission('manage_payouts') && (
              <button className="btn btn-secondary"
                style={{
                  background: 'rgba(59,130,246,0.12)',
                  color: '#60a5fa',
                  border: '1px solid rgba(59,130,246,0.3)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  opacity: (publisher.ready_for_payout_balance || 0) <= 0 ? 0.5 : 1,
                  cursor: (publisher.ready_for_payout_balance || 0) <= 0 ? 'not-allowed' : 'pointer'
                }}
                disabled={(publisher.ready_for_payout_balance || 0) <= 0}
                title={(publisher.ready_for_payout_balance || 0) <= 0 ? t('admin.publisher_profile.actions.manual_payout_disabled_tooltip', 'Cannot record a manual payout because the publisher has no approved balance') : t('admin.publisher_profile.actions.manual_payout', 'Manual Payout')}
                onClick={() => setManualPayoutOpen(true)}>
                <CreditCard size={14} /> {t('admin.publisher_profile.actions.manual_payout', 'Manual Payout')}
              </button>
            )}
            {canManageAdUnits && (
              <button className="btn btn-secondary"
                style={{ background: 'rgba(139,92,246,0.12)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.3)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                onClick={() => setBulkAdModalOpen(true)}>
                <Sparkles size={14} /> {t('admin.publisher_profile.actions.generate_ad_units', 'Generate Ad Units')}
              </button>
            )}
            {canEdit && (
              <button className="btn btn-secondary"
                style={{ background: 'rgba(99,102,241,0.12)', color: 'var(--color-primary)', border: '1px solid rgba(99,102,241,0.3)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                onClick={() => setImpersonateModalOpen(true)}>
                <User size={14} /> {t('admin.publisher_profile.actions.login', 'Log In')}
              </button>
            )}
            {canEdit && (
              <button className="btn"
                style={{
                  background: publisher.status === 'active' ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)',
                  color: publisher.status === 'active' ? 'var(--color-warning)' : 'var(--color-accent)',
                  border: publisher.status === 'active' ? '1px solid rgba(245,158,11,0.3)' : '1px solid rgba(16,185,129,0.3)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onClick={handleToggleSuspend}>
                {publisher.status === 'active' ? (
                  <><Pause size={14} /> {t('admin.publisher_profile.actions.suspend_btn', 'Suspend')}</>
                ) : publisher.status === 'pending' ? (
                  <><Check size={14} /> {t('admin.publisher_profile.actions.approve_btn', 'Approve')}</>
                ) : (
                  <><Play size={14} /> {t('admin.publisher_profile.actions.activate_btn', 'Activate')}</>
                )}
              </button>
            )}
            {canEdit && (
              <button className="btn btn-danger" onClick={handleDelete} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Trash2 size={14} /> {t('admin.publisher_profile.actions.delete_btn', 'Delete')}
              </button>
            )}
          </div>
        </div>
      </div>



      {/* Stats Cards */}
      <div className="stat-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card accent" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.02))' }}>
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.15)' }}><DollarSign size={20} /></div>
          <div className="stat-label">{t('admin.publisher_profile.stats.ready_for_payout', 'Ready for Payout')}</div>
          <div className="stat-value money" style={{ color: 'var(--color-accent)' }}>
            <CompactAmount value={publisher.ready_for_payout_balance || 0} />
          </div>
          <div className="stat-change text-muted">{t('admin.publisher_profile.stats.ready_for_payout_sub', 'Total wallet balance')}</div>
        </div>
        <div className="stat-card info">
          <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa' }}><Check size={20} /></div>
          <div className="stat-label">{t('admin.publisher_profile.stats.approved_balance', 'Approved Balance')}</div>
          <div className="stat-value money">
            <CompactAmount value={publisher.approved_balance || 0} />
          </div>
          <div className="stat-change text-muted">{t('admin.publisher_profile.stats.approved_balance_sub', 'Filtered for period')}</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.15)', color: 'var(--color-warning)' }}><Clock size={20} /></div>
          <div className="stat-label">{t('admin.publisher_profile.stats.pending_balance', 'Pending Balance')}</div>
          <div className="stat-value money">
            <CompactAmount value={publisher.pending_balance || 0} />
          </div>
          <div className="stat-change text-muted">{t('admin.publisher_profile.stats.pending_balance_sub', 'Holding period')}</div>
        </div>
        <div className="stat-card primary">
          <div className="stat-icon" style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}><Scale size={20} /></div>
          <div className="stat-label">{t('admin.publisher_profile.stats.upcoming_adjustment', 'Upcoming Adjustment')}</div>
          <div className="stat-value money" style={{
            color: publisher.pending_balance_adjustment > 0 ? 'var(--color-accent)' : publisher.pending_balance_adjustment < 0 ? 'var(--color-danger)' : 'inherit'
          }}>
            {publisher.pending_balance_adjustment > 0 ? '+' : ''}<CompactAmount value={publisher.pending_balance_adjustment} />
          </div>
          <div className="stat-change text-muted">{t('admin.publisher_profile.stats.upcoming_adjustment_sub', 'Pending balance adjust')}</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--color-text-subtle)' }}>
          <div className="stat-icon" style={{ background: 'rgba(255,255,255,0.05)' }}><CreditCard size={20} /></div>
          <div className="stat-label">{t('admin.publisher_profile.stats.total_payouts_paid', 'Total Payouts Paid')}</div>
          <div className="stat-value money">
            <CompactAmount value={publisher.total_payout || 0} />
          </div>
          <div className="stat-change text-muted">{t('admin.publisher_profile.stats.total_payouts_paid_sub', 'Paid to date')}</div>
        </div>
      </div>

      {/* Two Column details section */}
      <div className="profile-grid">
        
        {/* Left Column: Contact and Metadata info */}
        <div style={{ minWidth: 0 }}>
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-header" style={{ paddingBottom: 12, borderBottom: '1px solid var(--color-border)' }}>
              <div className="card-title" style={{ fontSize: 16, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} style={{ color: 'var(--br-primary)' }} />
                <span>{t('admin.publisher_profile.info.title', 'Contact & System Info')}</span>
              </div>
            </div>
            <div style={{ padding: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <span className="text-muted text-sm" style={{ display: 'block' }}>{t('admin.publisher_profile.info.phone', 'Phone / WhatsApp')}</span>
                  {publisher.phone ? (
                    <a href={`https://wa.me/${publisher.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="hover-link" style={{ fontWeight: 500, color: 'var(--color-primary-light)' }}>
                      {publisher.phone}
                    </a>
                  ) : <span>{t('admin.publisher_profile.info.not_set', 'Not Set')}</span>}
                </div>
                <div>
                  <span className="text-muted text-sm" style={{ display: 'block' }}>{t('admin.publisher_profile.info.telegram', 'Telegram Username')}</span>
                  {publisher.telegram ? (
                    <a href={`https://t.me/${publisher.telegram.replace('@', '')}`} target="_blank" rel="noreferrer" className="hover-link" style={{ fontWeight: 500, color: 'var(--color-primary-light)' }}>
                      {publisher.telegram}
                    </a>
                  ) : <span>{t('admin.publisher_profile.info.not_set', 'Not Set')}</span>}
                </div>
                <hr style={{ border: 0, borderTop: '1px solid var(--color-border)' }} />
                <div>
                  <span className="text-muted text-sm" style={{ display: 'block' }}>{t('admin.publisher_profile.info.revenue_ratio', 'Revenue Ratio Split')}</span>
                  <span style={{ fontWeight: 700, color: 'var(--color-accent)' }}>{(parseFloat(publisher.default_ratio) * 100).toFixed(0)}%</span>
                </div>
                <div>
                  <span className="text-muted text-sm" style={{ display: 'block' }}>{t('admin.publisher_profile.info.registration_ip', 'Registration IP')}</span>
                  <code style={{ fontSize: 13, background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: 4 }}>{publisher.reg_ip || 'N/A'}</code>
                </div>
                <div>
                  <span className="text-muted text-sm" style={{ display: 'block' }}>{t('admin.publisher_profile.info.last_login_ip', 'Last Login IP')}</span>
                  <code style={{ fontSize: 13, background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: 4 }}>{publisher.last_ip || 'N/A'}</code>
                </div>
                <div>
                  <span className="text-muted text-sm" style={{ display: 'block' }}>{t('admin.publisher_profile.info.created_account', 'Created Account')}</span>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{formatDateTime(publisher.created_at, true)}</span>
                </div>
                <div>
                  <span className="text-muted text-sm" style={{ display: 'block' }}>{t('admin.publisher_profile.info.country', 'Country')}</span>
                  <span style={{ fontWeight: 500 }}>{publisher.country || t('admin.publisher_profile.info.not_set', 'Not Set')}</span>
                </div>
                {(() => {
                  let paymentMethod = t('admin.publisher_profile.info.not_set', 'Not Set');
                  let paymentAccount = t('admin.publisher_profile.info.not_set', 'Not Set');
                  if (publisher.payment_info) {
                    let info = publisher.payment_info;
                    if (typeof info === 'string') {
                      try {
                        info = JSON.parse(info);
                      } catch (e) {
                        paymentAccount = info;
                      }
                    }
                    if (typeof info === 'object' && info !== null) {
                      paymentMethod = info.method || t('admin.publisher_profile.info.not_set', 'Not Set');
                      paymentAccount = info.account || t('admin.publisher_profile.info.not_set', 'Not Set');
                    }
                  }
                  return (
                    <>
                      <hr style={{ border: 0, borderTop: '1px solid var(--color-border)' }} />
                      <div>
                        <span className="text-muted text-sm" style={{ display: 'block' }}>{t('admin.publisher_profile.info.payment_method', 'Payment Method')}</span>
                        <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{paymentMethod}</span>
                      </div>
                      <div>
                        <span className="text-muted text-sm" style={{ display: 'block' }}>{t('admin.publisher_profile.info.payment_account', 'Payment Account')}</span>
                        {paymentAccount !== t('admin.publisher_profile.info.not_set', 'Not Set') ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                            <code style={{
                              background: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              padding: '2px 8px',
                              borderRadius: 6,
                              fontSize: '11px',
                              fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
                              color: '#e2e8f0',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              maxWidth: '180px'
                            }} title={paymentAccount}>
                              {paymentAccount}
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
                                navigator.clipboard.writeText(paymentAccount);
                                toast.success(t('admin.publisher_profile.toast.copied', 'Copied to clipboard!'));
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                              }}
                              title={t('admin.publisher_profile.info.copy_tooltip', 'Copy account details')}
                            >
                              <Clipboard size={10} /> {t('admin.publisher_profile.info.copy_btn', 'Copy')}
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontWeight: 500 }}>{t('admin.publisher_profile.info.not_set', 'Not Set')}</span>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header" style={{ paddingBottom: 12, borderBottom: '1px solid var(--color-border)' }}>
              <div className="card-title" style={{ fontSize: 16, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <StickyNote size={18} style={{ color: 'var(--br-primary)' }} />
                <span>{t('admin.publisher_profile.notes.title', 'Internal Notes (Admin Only)').replace('📝', '').trim()}</span>
              </div>
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
                <span className="text-muted text-sm">{t('admin.publisher_profile.notes.empty', 'No internal notes added.')}</span>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Tabbed list of resources */}
        <div className="card" style={{ padding: 0, minWidth: 0 }}>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            borderBottom: '1px solid var(--color-border)',
            background: 'rgba(0, 0, 0, 0.05)',
            borderTopLeftRadius: 'var(--radius-md)',
            borderTopRightRadius: 'var(--radius-md)',
          }}>
            {[
              { id: 'websites', label: t('admin.publisher_profile.tabs.websites', 'Websites & Ad Units'), icon: <Globe size={16} /> },
              { id: 'payouts', label: t('admin.publisher_profile.tabs.payouts', 'Payouts History'), icon: <CreditCard size={16} /> },
              { id: 'revenue', label: t('admin.publisher_profile.tabs.revenue', 'Revenue Logs'), icon: <BarChart2 size={16} /> },
              { id: 'history', label: t('admin.publisher_profile.tabs.ratio', 'Ratio Changes'), icon: <History size={16} /> }
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
                  transition: 'all var(--transition)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div style={{ padding: 20 }}>
            {activeTab === 'websites' && (
              <div>
                {websites.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon"><Globe size={40} /></div>
                    <div className="empty-state-text">{t('admin.publisher_profile.websites.empty', 'No websites linked')}</div>
                    <div className="empty-state-sub" style={{ marginBottom: 12 }}>{t('admin.publisher_profile.websites.empty_sub', 'Add websites to this publisher')}</div>
                    {canManageWebsites && (
                      <button className="btn btn-primary" onClick={() => setWebsiteModal('create')} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <Plus size={14} /> {t('admin.publisher_profile.websites.add_btn', 'Add Website')}
                      </button>
                    )}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {canManageWebsites && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button className="btn btn-primary btn-sm" onClick={() => setWebsiteModal('create')} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <Plus size={14} /> {t('admin.publisher_profile.websites.add_btn', 'Add Website')}
                        </button>
                      </div>
                    )}
                    {websites.filter(w => !selectedWebsite || w.id === selectedWebsite).map(web => (
                      <div key={web.id} className="card" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
                        <div className="website-card-header" style={{ marginBottom: 12 }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, wordBreak: 'break-all' }}>
                                <a href={`https://${web.domain}`} target="_blank" rel="noreferrer" className="hover-link" style={{ color: 'var(--color-primary-light)' }}>
                                  {web.domain}
                                </a>
                              </h3>
                              <span className={`badge ${web.is_active ? 'badge-active' : 'badge-inactive'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
                                {web.is_active ? t('admin.publisher_profile.websites.active', 'Active') : t('admin.publisher_profile.websites.inactive', 'Inactive')}
                              </span>
                            </div>
                            <div className="text-muted text-sm" style={{ marginTop: 4, wordBreak: 'break-word' }}>
                              {t('admin.publisher_profile.websites.gam_account_label', 'GAM Account: {account}', { account: web.gam_account_email || t('admin.publisher_profile.websites.not_linked', 'Not Linked') })} {web.gam_network_code && t('admin.publisher_profile.websites.network_label', '(Network: {code})', { code: web.gam_network_code })}
                            </div>
                          </div>
                          <div className="website-card-actions">
                            {web.ratio_override && (
                              <div className="badge badge-active" style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--color-accent)', flexShrink: 0 }}>
                                {t('admin.publisher_profile.websites.ratio_override', 'Ratio Override: {ratio}', { ratio: `${(parseFloat(web.ratio_override) * 100).toFixed(0)}%` })}
                              </div>
                            )}
                            {canManageWebsites && (
                              <button className="btn btn-secondary btn-xs" onClick={() => setWebsiteModal(web)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                                <Edit2 size={12} /> {t('admin.publisher_profile.websites.edit_btn', 'Edit')}
                              </button>
                            )}
                            {canManageWebsites && (
                              <button className="btn btn-danger btn-xs"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}
                                onClick={async () => {
                                  if (!confirm(t('admin.publisher_profile.confirm.delete_website', 'Are you sure you want to delete website "{domain}"? This will also delete all its mapped ad units.', { domain: web.domain }))) return
                                  try {
                                    await adminApi.deleteWebsite(web.id)
                                    toast.success(t('admin.publisher_profile.toast.website_deleted', 'Website deleted successfully'))
                                    loadAllData(true)
                                  } catch {
                                    toast.error(t('admin.publisher_profile.toast.website_delete_failed', 'Failed to delete website'))
                                  }
                                }}
                              >
                                <Trash2 size={12} /> {t('admin.publisher_profile.websites.delete_btn', 'Delete')}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Ad Units list */}
                        <div style={{ marginTop: 12, background: 'rgba(0,0,0,0.1)', borderRadius: 8, padding: '8px 12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <h4 style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: 0.5, margin: 0 }}>
                              {t('admin.publisher_profile.ad_units.title', 'Ad Units ({count})', { count: adUnitsByWebsite[web.id]?.length || 0 })}
                            </h4>
                            {canManageAdUnits && (
                              <button className="btn btn-secondary btn-xs" style={{ padding: '3px 8px', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: '4px' }} onClick={() => setAdModal({ website_id: web.id })}>
                                <Plus size={12} /> {t('admin.publisher_profile.ad_units.add_btn', 'Add Existing Ad Unit')}
                              </button>
                            )}
                          </div>
                          {!adUnitsByWebsite[web.id] || adUnitsByWebsite[web.id].length === 0 ? (
                            <div style={{ color: 'var(--color-text-subtle)', fontSize: 13, fontStyle: 'italic', padding: 8 }}>
                              {t('admin.publisher_profile.ad_units.empty', 'No ad units added to this website.')}
                            </div>
                          ) : (
                            <div className="table-wrap">
                              <table className="table" style={{ background: 'transparent' }}>
                                <thead>
                                  <tr>
                                    <th style={{ fontSize: 11, padding: '6px 8px' }}>{t('admin.publisher_profile.ad_units.table.display_name', 'Display Name')}</th>
                                    <th style={{ fontSize: 11, padding: '6px 8px' }}>{t('admin.publisher_profile.ad_units.table.ratio_split', 'Ratio Split')}</th>
                                    {canManageAdUnits && <th style={{ fontSize: 11, padding: '6px 8px', textAlign: 'right' }}>{t('admin.publisher_profile.ad_units.table.actions', 'Actions')}</th>}
                                  </tr>
                                </thead>
                                <tbody>
                                  {adUnitsByWebsite[web.id].map(ad => (
                                    <tr key={ad.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                      <td style={{ padding: '6px 8px', fontSize: 13 }}>{ad.display_name}</td>
                                      <td style={{ padding: '6px 8px', fontSize: 13, fontWeight: 600 }}>
                                        {ad.ratio_override 
                                          ? t('admin.publisher_profile.ad_units.ratio_override_val', '{ratio} (Override)', { ratio: `${(parseFloat(ad.ratio_override) * 100).toFixed(0)}%` }) 
                                          : t('admin.publisher_profile.ad_units.ratio_inherited', 'Inherited')}
                                      </td>
                                      {canManageAdUnits && (
                                        <td style={{ padding: '6px 8px', fontSize: 13, textAlign: 'right' }}>
                                          <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
                                            <button className="btn btn-secondary btn-xs" style={{ padding: '2px 6px', display: 'inline-flex', alignItems: 'center' }} onClick={() => setAdModal(ad)}><Edit2 size={12} /></button>
                                            <button className="btn btn-xs"
                                              style={{ padding: '2px 6px', background: 'rgba(245, 158, 11, 0.15)', color: 'var(--color-warning)', border: '1px solid rgba(245, 158, 11, 0.3)', display: 'inline-flex', alignItems: 'center' }}
                                              title={t('admin.publisher_profile.ad_units.delete_platform_tooltip', 'Delete from platform only (keep in GAM)')}
                                              onClick={async () => {
                                                if (!confirm(t('admin.publisher_profile.confirm.delete_ad_unit_platform', 'Delete ad unit "{name}" from platform only? It will NOT be archived in Google Ad Manager.', { name: ad.display_name }))) return
                                                try {
                                                  await adminApi.deleteAdUnit(ad.id, { archive: false })
                                                  toast.success(t('admin.publisher_profile.toast.ad_unit_deleted', 'Ad unit deleted successfully'))
                                                  loadAllData(true)
                                                } catch {
                                                  toast.error(t('admin.publisher_profile.toast.ad_unit_delete_failed', 'Failed to delete ad unit'))
                                                }
                                              }}><Trash2 size={12} /></button>
                                            <button className="btn btn-danger btn-xs" style={{ padding: '2px 6px', display: 'inline-flex', alignItems: 'center' }}
                                              title={t('admin.publisher_profile.ad_units.delete_archive_tooltip', 'Delete from platform and archive in GAM')}
                                              onClick={async () => {
                                                if (!confirm(t('admin.publisher_profile.confirm.delete_ad_unit_archive', 'Delete ad unit "{name}" from platform and archive it in Google Ad Manager?', { name: ad.display_name }))) return
                                                try {
                                                  await adminApi.deleteAdUnit(ad.id, { archive: true })
                                                  toast.success(t('admin.publisher_profile.toast.ad_unit_deleted', 'Ad unit deleted successfully'))
                                                  loadAllData(true)
                                                } catch {
                                                  toast.error(t('admin.publisher_profile.toast.ad_unit_delete_failed', 'Failed to delete ad unit'))
                                                }
                                              }}><Trash2 size={12} /></button>
                                          </div>
                                        </td>
                                      )}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
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
                    <div className="empty-state-icon"><CreditCard size={40} /></div>
                    <div className="empty-state-text">{t('admin.publisher_profile.payouts.empty', 'No payout records yet')}</div>
                    <div className="empty-state-sub">{t('admin.publisher_profile.payouts.empty_sub', 'Payouts are generated when closing a monthly period')}</div>
                  </div>
                ) : (
                  <div className="table-wrap">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>{t('admin.publisher_profile.payouts.table.period', 'Period')}</th>
                          <th>{t('admin.publisher_profile.payouts.table.base_amount', 'Base Amount')}</th>
                          <th>{t('admin.publisher_profile.payouts.table.adjustment', 'Adjustment')}</th>
                          <th>{t('admin.publisher_profile.payouts.table.final_amount', 'Final Amount')}</th>
                          <th>{t('admin.publisher_profile.payouts.table.status', 'Status')}</th>
                          <th>{t('admin.publisher_profile.payouts.table.paid_at', 'Paid At')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payouts.map(p => (
                          <tr key={p.id}>
                            <td style={{ fontWeight: 600 }}>{p.period_year}-{String(p.period_month).padStart(2, '0')}</td>
                            <td><CompactAmount value={p.amount} /></td>
                            <td style={{
                              color: parseFloat(p.adjustment) > 0 ? 'var(--color-accent)' : parseFloat(p.adjustment) < 0 ? 'var(--color-danger)' : 'inherit'
                            }}>
                              {parseFloat(p.adjustment) > 0 ? '+' : ''}<CompactAmount value={p.adjustment} />
                            </td>
                            <td style={{ fontWeight: 700 }} className="positive"><CompactAmount value={p.final_amount} /></td>
                            <td>
                              <span className={`badge badge-${p.status}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
                                {t(`admin.payouts.status.${p.status}`, p.status)}
                              </span>
                            </td>
                            <td className="text-muted text-sm">{p.paid_at ? formatDate(p.paid_at) : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr style={{ background: 'rgba(99,102,241,.07)', fontWeight: 700, borderTop: '2px solid var(--color-border)' }}>
                          <td style={{ padding: '10px 16px', fontSize: 12 }}>{t('admin.publisher_profile.payouts.table.totals', 'Totals ({count})', { count: payouts.length })}</td>
                          <td><CompactAmount value={totalPayoutBase} /></td>
                          <td style={{
                            color: totalPayoutAdj > 0 ? 'var(--color-accent)' : totalPayoutAdj < 0 ? 'var(--color-danger)' : 'inherit'
                          }}>
                            {totalPayoutAdj > 0 ? '+' : ''}<CompactAmount value={totalPayoutAdj} />
                          </td>
                          <td className="positive" style={{ fontWeight: 700 }}><CompactAmount value={totalPayoutFinal} /></td>
                          <td colSpan={2}></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'revenue' && (
              <div>
                {revenue.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon"><BarChart2 size={40} /></div>
                    <div className="empty-state-text">{t('admin.publisher_profile.revenue.empty', 'No revenue logs found')}</div>
                    <div className="empty-state-sub">{t('admin.publisher_profile.revenue.empty_sub', 'Revenue records will appear once synchronized from Google Ad Manager')}</div>
                  </div>
                ) : (
                  <div className="table-wrap">
                    <table className="table">
                      <thead>
                        <tr>
                          <th style={{ width: 130 }}>{t('admin.publisher_profile.revenue.table.date', 'Date')}</th>
                          <th>{t('admin.publisher_profile.revenue.table.ad_unit_website', 'Ad Unit / Website')}</th>
                          <th style={{ textAlign: 'right', paddingRight: 24 }}>{t('admin.publisher_profile.revenue.table.impressions', 'Impressions')}</th>
                          <th style={{ textAlign: 'right', paddingRight: 24 }}>{t('admin.publisher_profile.revenue.table.gross_rev', 'Gross Rev.')}</th>
                          <th style={{ textAlign: 'right', paddingRight: 24 }}>{t('admin.publisher_profile.revenue.table.pub_share', 'Pub. Share')}</th>
                          <th style={{ textAlign: 'center', width: 120 }}>{t('admin.publisher_profile.revenue.table.status', 'Status')}</th>
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
                              <CompactAmount value={r.impressions || 0} prefix="" decimals={0} />
                            </td>
                            <td className="money" style={{ textAlign: 'right', paddingRight: 24, verticalAlign: 'middle' }}>
                              <CompactAmount value={r.gross_revenue} />
                            </td>
                            <td className="money positive" style={{ textAlign: 'right', paddingRight: 24, verticalAlign: 'middle', fontWeight: 700 }}>
                              <CompactAmount value={r.publisher_earnings} />
                            </td>
                            <td style={{ textAlign: 'center', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                              <span className={`badge ${r.period_closing_id !== null ? 'badge-inactive' : r.is_approved ? 'badge-active' : 'badge-inactive'}`}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      whiteSpace: 'nowrap',
                                      padding: '4px 8px',
                                      borderRadius: '4px',
                                      fontSize: '11px',
                                      fontWeight: 600,
                                      background: r.period_closing_id !== null ? 'rgba(99,102,241,0.15)' : r.is_approved ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                                      color: r.period_closing_id !== null ? 'var(--color-primary-light)' : r.is_approved ? 'var(--color-accent)' : 'var(--color-warning)',
                                    }}>
                                {r.period_closing_id !== null ? (
                                  <><Lock size={12} /> {t('admin.publisher_profile.revenue.status.closed', 'closed')}</>
                                ) : r.is_approved ? (
                                  <><Check size={12} /> {t('admin.publisher_profile.revenue.status.approved', 'approved')}</>
                                ) : (
                                  <><Clock size={12} /> {t('admin.publisher_profile.revenue.status.pending', 'pending')}</>
                                )}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr style={{ background: 'rgba(99,102,241,.07)', fontWeight: 700, borderTop: '2px solid var(--color-border)' }}>
                          <td style={{ padding: '10px 16px', fontSize: 12 }} colSpan={2}>
                            {t('admin.publisher_profile.revenue.table.totals', 'Totals {all_logs}', { all_logs: revenue.length > 50 ? t('admin.publisher_profile.revenue.table.all_logs_count', '(all {count} logs)', { count: revenue.length }) : '' })}
                          </td>
                          <td style={{ textAlign: 'right', paddingRight: 24, fontFamily: 'monospace' }}>
                            <CompactAmount value={totalRevImpr} prefix="" decimals={0} />
                          </td>
                          <td className="money" style={{ textAlign: 'right', paddingRight: 24 }}>
                            <CompactAmount value={totalRevGross} />
                          </td>
                          <td className="money positive" style={{ textAlign: 'right', paddingRight: 24, fontWeight: 700 }}>
                            <CompactAmount value={totalRevPub} />
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                    {revenue.length > 50 && (
                      <div className="text-muted text-center text-sm" style={{ padding: 12 }}>
                        {t('admin.publisher_profile.revenue.table.showing_latest_50', 'Showing latest 50 records. See all under the Revenue page.')}
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
                    <div className="empty-state-icon"><History size={40} /></div>
                    <div className="empty-state-text">{t('admin.publisher_profile.ratio.empty', 'No ratio changes logged')}</div>
                    <div className="empty-state-sub">{t('admin.publisher_profile.ratio.empty_sub', 'Revenue ratio change logs will show up here')}</div>
                  </div>
                ) : (
                  <div className="table-wrap">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>{t('admin.publisher_profile.ratio.table.date_changed', 'Date Changed')}</th>
                          <th>{t('admin.publisher_profile.ratio.table.target', 'Target')}</th>
                          <th>{t('admin.publisher_profile.ratio.table.old_ratio', 'Old Ratio')}</th>
                          <th>{t('admin.publisher_profile.ratio.table.new_ratio', 'New Ratio')}</th>
                          <th>{t('admin.publisher_profile.ratio.table.changed_by', 'Changed By')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ratioHistory.map(h => (
                          <tr key={h.id}>
                            <td>{formatDateTime(h.changed_at, false)}</td>
                            <td style={{ fontWeight: 600, color: 'var(--color-primary-light)' }}>{h.target || t('admin.publisher_profile.ratio.general_profile', 'General Profile')}</td>
                            <td style={{ fontWeight: 500 }}>
                              {h.old_ratio ? `${(parseFloat(h.old_ratio) * 100).toFixed(0)}%` : '—'}
                            </td>
                            <td style={{ fontWeight: 700, color: 'var(--color-accent)' }}>
                              {(parseFloat(h.new_ratio) * 100).toFixed(0)}%
                            </td>
                            <td className="text-muted">
                              {h.changed_by || t('admin.publisher_profile.ratio.admin_system', 'Admin/System')}
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
      {impersonateModalOpen && (
        <ImpersonateModal
          publisher={publisher}
          onClose={() => setImpersonateModalOpen(false)}
        />
      )}
      {emailModalOpen && (
        <SendEmailModal
          publisher={publisher}
          onClose={() => setEmailModalOpen(false)}
        />
      )}
    </div>
  )
}

function SendEmailModal({ publisher, onClose }) {
  const { t } = useI18n()
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!subject.trim() || !body.trim()) {
      toast.error(t('admin.publisher_profile.send_email_modal.toast.required_fields', 'Please fill in both subject and message.'))
      return
    }
    setSending(true)
    try {
      await adminApi.sendEmail(publisher.id, subject.trim(), body.trim())
      toast.success(t('admin.publisher_profile.send_email_modal.toast.success', 'Email sent successfully!'))
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || t('admin.publisher_profile.send_email_modal.toast.failed', 'Failed to send email'))
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '600px', width: '90vw' }}>
        <div className="modal-header">
          <span className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Mail size={18} style={{ color: 'var(--br-primary)' }} />
            <span>{t('admin.publisher_profile.send_email_modal.title', 'Send Email to Publisher')}</span>
          </span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ padding: '10px 0 16px 0', fontSize: 13, color: 'var(--color-text-muted)' }}>
            {t('admin.publisher_profile.send_email_modal.help_text', 'Send a direct email to {name} ({email}). The message will be formatted with the platform\'s brand design layout.', { name: publisher.name, email: publisher.email })}
          </div>

          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label">{t('admin.publisher_profile.send_email_modal.subject_label', 'Subject *')}</label>
            <input 
              className="form-input" 
              type="text" 
              value={subject}
              onChange={e => setSubject(e.target.value)} 
              placeholder={t('admin.publisher_profile.send_email_modal.subject_placeholder', 'Enter email subject')}
              required 
              autoFocus 
            />
          </div>

          <div className="form-group" style={{ marginBottom: 20 }}>
            <label className="form-label">{t('admin.publisher_profile.send_email_modal.message_label', 'Message Body *')}</label>
            <textarea 
              className="form-textarea" 
              rows={8} 
              value={body}
              onChange={e => setBody(e.target.value)} 
              placeholder={t('admin.publisher_profile.send_email_modal.message_placeholder', 'Type your message here...')}
              required 
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>{t('common.cancel', 'Cancel')}</button>
            <button type="submit" className="btn btn-primary" disabled={sending} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              {sending ? t('admin.publisher_profile.send_email_modal.sending', 'Sending…') : <><Mail size={14} /> {t('admin.publisher_profile.send_email_modal.send_btn', 'Send Email')}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ImpersonateModal({ publisher, onClose }) {
  const [loading, setLoading] = useState(false)
  const { impersonate } = useAuth()
  const { t } = useI18n()

  async function handleImpersonate(newTab) {
    setLoading(true)
    try {
      const res = await adminApi.impersonatePublisher(publisher.id)
      const { access_token, user: publisherUser } = res.data
      
      if (newTab) {
        // Open the publisher dashboard in a new tab, passing the token and user in URL parameters
        const url = `/publisher?impersonate_token=${access_token}&impersonate_user=${encodeURIComponent(JSON.stringify(publisherUser))}`
        window.open(url, '_blank')
        toast.success(t('admin.publisher_profile.toast.impersonate_new_tab', 'Logged in as {name} in a new tab', { name: publisher.name }))
        onClose()
      } else {
        impersonate(access_token, publisherUser)
      }
    } catch (e) {
      toast.error(e.response?.data?.message || t('admin.publisher_profile.toast.impersonate_failed', 'Failed to impersonate publisher'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '480px' }}>
        <div className="modal-header">
          <span className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={18} style={{ color: 'var(--br-primary)' }} />
            <span>{t('admin.publisher_profile.impersonate_modal.title', 'Log In as Publisher')}</span>
          </span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div style={{ padding: '20px 0' }}>
          <p style={{ fontSize: 15 }}>
            {t('admin.publisher_profile.impersonate_modal.message', 'You are about to log in as publisher {name} ({email}).', { name: publisher.name, email: publisher.email })}
          </p>
          <p style={{ marginTop: 12, color: 'var(--color-text-muted)', fontSize: 13, lineHeight: '1.5' }}>
            {t('admin.publisher_profile.impersonate_modal.sub_message', 'Choose whether to open the publisher dashboard in a new tab or redirect the current tab.')}
          </p>
        </div>
        <div className="modal-footer" style={{ justifyContent: 'flex-end', alignItems: 'center', gap: 16 }}>
          <button 
            type="button" 
            className="hover-link" 
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'var(--color-text-muted)', 
              cursor: 'pointer',
              fontSize: 14 
            }} 
            onClick={onClose} 
            disabled={loading}
          >
            {t('admin.publisher_profile.impersonate_modal.cancel_btn', 'Cancel')}
          </button>
          
          <button 
            type="button"
            className="hover-link"
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'var(--color-primary-light)', 
              textDecoration: 'underline', 
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 500
            }}
            onClick={() => handleImpersonate(false)}
            disabled={loading}
          >
            {t('admin.publisher_profile.impersonate_modal.current_tab_btn', 'Open in Current Tab')}
          </button>
          
          <button 
            type="button"
            className="btn btn-primary" 
            onClick={() => handleImpersonate(true)} 
            disabled={loading}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            {loading ? t('admin.publisher_profile.impersonate_modal.logging_in', 'Logging in…') : <><ExternalLink size={14} /> {t('admin.publisher_profile.impersonate_modal.new_tab_btn', 'Open in New Tab')}</>}
          </button>
        </div>
      </div>
    </div>
  )
}

function ManualPayoutModal({ publisher, onClose, onSaved }) {
  const [amount, setAmount] = useState('0.00')
  const [reference, setReference] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const walletBalance = publisher.ready_for_payout_balance || 0.0
  const { t } = useI18n()

  useEffect(() => {
    setAmount(walletBalance.toFixed(2))
  }, [walletBalance])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      toast.error(t('admin.publisher_profile.manual_payout_modal.toast.invalid_amount', 'Please enter a valid payout amount'))
      return
    }
    if (parseFloat(amount) > walletBalance) {
      toast.error(t('admin.publisher_profile.manual_payout_modal.toast.exceeds_balance', "Payout amount cannot exceed the publisher's approved wallet balance"))
      return
    }
    setSaving(true)
    try {
      await adminApi.manualPayment(publisher.id, {
        amount: parseFloat(amount),
        reference: reference.trim() || undefined,
        notes: note.trim() || undefined,
      })
      toast.success(t('admin.publisher_profile.manual_payout_modal.toast.success', 'Manual payment recorded successfully!'))
      onSaved()
    } catch (err) {
      toast.error(err.response?.data?.message || t('admin.publisher_profile.manual_payout_modal.toast.failed', 'Failed to create manual payment'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CreditCard size={18} style={{ color: 'var(--br-primary)' }} />
            <span>{t('admin.publisher_profile.manual_payout_modal.title', 'Record Manual Payment')}</span>
          </span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="alert alert-info" style={{ fontSize: 13, marginBottom: 16, display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <Info size={16} style={{ flexShrink: 0, marginTop: 1, color: 'var(--color-info)' }} />
            <span>{t('admin.publisher_profile.manual_payout_modal.help_text', 'This will record an out-of-cycle manual payout request for {name} without affecting monthly period closings or locking revenue records. The request will enter the queue as a Pending payout. Once approved by an admin, it can then be processed or marked as paid via the standard payout workflow (similar to auto payouts). The amount is deducted from their approved wallet balance immediately.', { name: publisher.name })}</span>
          </div>

          <div className="form-group">
            <label className="form-label">{t('admin.publisher_profile.manual_payout_modal.amount_label', 'Payout Amount ($) *')}</label>
            <input className="form-input" type="number" step="0.01" min="0.01" value={amount}
              onChange={e => setAmount(e.target.value)} required />
            <span className="form-hint">
              {t('admin.publisher_profile.manual_payout_modal.wallet_balance_label', 'Current approved wallet balance:')} <strong><CompactAmount value={walletBalance} /></strong>
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">{t('admin.publisher_profile.manual_payout_modal.reference_label', 'Reference ID (optional)')}</label>
            <input className="form-input" type="text" value={reference}
              onChange={e => setReference(e.target.value)} placeholder={t('admin.publisher_profile.manual_payout_modal.reference_placeholder', 'Transaction hash or ID')} />
          </div>

          <div className="form-group">
            <label className="form-label">{t('admin.publisher_profile.manual_payout_modal.note_label', 'Admin Note / Memo (internal)')}</label>
            <textarea className="form-textarea" rows={2} value={note}
              onChange={e => setNote(e.target.value)} placeholder={t('admin.publisher_profile.manual_payout_modal.note_placeholder', 'e.g. Special manual payout request override…')} />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>{t('admin.publisher_profile.manual_payout_modal.cancel_btn', 'Cancel')}</button>
            <button type="submit" className="btn btn-primary" disabled={saving} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              {saving ? t('admin.publisher_profile.manual_payout_modal.recording', 'Recording…') : <><CreditCard size={14} /> {t('admin.publisher_profile.manual_payout_modal.record_btn', 'Record Payment')}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
