import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useI18n } from '../contexts/I18nContext'
import { useSettings } from '../contexts/SettingsContext'
import { adminApi } from '../api/endpoints'
import LanguageSwitcher from '../components/LanguageSwitcher'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { LayoutDashboard, Users, Globe, DollarSign, Calendar, CreditCard, Scale, Ticket, Megaphone, FileText, History, Server, RefreshCw, Settings, Mail, Languages, TrendingUp, User, LogOut, Menu, X, ShieldCheck, HelpCircle, Activity, Wifi, AlertTriangle, Shield, Bell, Wrench } from 'lucide-react'

const navItems = [
  { to: '/admin',              icon: LayoutDashboard, label: 'Dashboard',      end: true },
  { to: '/admin/publishers',   icon: Users, label: 'Publishers', countKey: 'pending_publishers', permission: ['manage_publishers', 'view_publishers'] },
  { to: '/admin/websites',     icon: Globe, label: 'Websites', permission: 'manage_websites' },
  { to: '/admin/revenue',      icon: DollarSign, label: 'Revenue', permission: 'manage_revenue' },
  { to: '/admin/closings',     icon: Calendar, label: 'Period Closings', permission: 'manage_closings' },
  { to: '/admin/payouts',      icon: CreditCard, label: 'Payouts', countKey: 'pending_payouts', permission: 'manage_payouts' },
  { to: '/admin/adjustments',  icon: Scale, label: 'Adjustments', permission: 'manage_publishers' }, // adjustments are publishers-linked
  { to: '/admin/tickets',      icon: Ticket, label: 'Support Tickets', countKey: 'pending_tickets', permission: 'manage_tickets' },
  { to: '/admin/announcements',icon: Megaphone, label: 'Announcements', permission: 'manage_announcements' },
  { to: '/admin/pages',        icon: FileText, label: 'Pages', permission: 'manage_pages' },
  { to: '/admin/faqs',         icon: HelpCircle, label: 'FAQ', permission: 'manage_pages' },
  { to: '/admin/audit-logs',   icon: History, label: 'Audit Logs', permission: 'manage_admins' },
  { to: '/admin/gam-accounts', icon: Server, label: 'GAM Accounts', permission: 'manage_gam_accounts' },
  { to: '/admin/gam-sync',     icon: RefreshCw, label: 'Manual Sync', permission: 'manage_gam_accounts' },
  { to: '/admin/settings',     icon: Settings,  label: 'Settings', permission: 'manage_settings' },
  { to: '/admin/tools',        icon: Wrench,    label: 'Tools',    permission: 'manage_settings' },
  { to: '/admin/email-templates', icon: Mail, label: 'Email Templates', permission: 'manage_email_templates' },
  { to: '/admin/translations', icon: Languages, label: 'Translations', permission: 'manage_translations' },
  { to: '/admin/admins',       icon: ShieldCheck, label: 'Admins', permission: 'manage_admins' },

  // ── Traffic Intelligence ────────────────────────────────────────────────
  { sectionLabel: 'Traffic Intelligence' },
  { to: '/admin/traffic',                icon: Activity,      label: 'Traffic Overview' },
  { to: '/admin/traffic/realtime',       icon: Wifi,          label: 'Realtime Monitor' },
  { to: '/admin/traffic/anomalies',      icon: AlertTriangle, label: 'Anomalies' },
  { to: '/admin/traffic/quality-scores', icon: Shield,        label: 'Quality Scores' },
  { sectionLabel: 'System Security' },
  { to: '/admin/danger-zone',            icon: AlertTriangle, label: 'Danger Zone', permission: 'manage_admins', isDanger: true },
]

export default function AdminLayout({ children }) {
  const { user, logout, hasPermission } = useAuth()
  const { locale, switchLocale, t } = useI18n()
  const { settings } = useSettings()
  const navigate = useNavigate()
  const location = useLocation()

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [stats, setStats] = useState({ pending_publishers: 0, pending_payouts: 0, pending_tickets: 0 })
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [bellOpen, setBellOpen] = useState(false)

  const fetchNotifications = () => {
    adminApi.getNotifications()
      .then(res => {
        setNotifications(res.data.notifications || [])
        setUnreadCount(res.data.unread_count || 0)
      })
      .catch(() => {})
  }

  const handleMarkAllRead = async () => {
    try {
      await adminApi.markAllNotificationsRead()
      setUnreadCount(0)
      setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })))
    } catch {}
  }

  const handleNotificationClick = async (n) => {
    setBellOpen(false)
    if (!n.read_at) {
      try {
        await adminApi.markNotificationRead(n.id)
        setUnreadCount(prev => Math.max(0, prev - 1))
        setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, read_at: new Date().toISOString() } : item))
      } catch {}
    }
    
    if (n.data?.type === 'tracking_code_removed') {
      navigate('/admin/websites')
    } else if (n.data?.type === 'traffic_anomaly') {
      navigate('/admin/traffic/anomalies')
    }
  }

  function formatTimeAgo(dateStr) {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const now = new Date()
    const seconds = Math.floor((now - date) / 1000)
    if (seconds < 60) return t('notifications.time.just_now', 'Just now')
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h`
    const days = Math.floor(hours / 24)
    return `${days}d`
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 60000) // poll every 60s
    return () => clearInterval(interval)
  }, [])

  const getDashboardPath = () => {
    const primaryRole = user?.roles_list?.[0] || 'Super Admin'
    if (primaryRole === 'Finance Manager') return '/admin/finance'
    if (primaryRole === 'Ad Ops Manager') return '/admin/adops'
    if (primaryRole === 'Support Agent') return '/admin/support'
    if (primaryRole === 'Content Manager') return '/admin/content'
    return '/admin'
  }

  const updatedNavItems = navItems.map(item => {
    if (item.to === '/admin') {
      return { ...item, to: getDashboardPath() }
    }
    return item
  })

  useEffect(() => {
    // Fetch stats initially and whenever location changes (cheap way to keep them somewhat updated)
    adminApi.getSidebarStats()
      .then(res => setStats(res.data))
      .catch(() => {})
  }, [location.pathname])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="app-shell">
      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setMobileSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${mobileSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {settings.site_logo ? (
            <Link to="/admin" style={{ display: 'inline-flex', alignItems: 'center' }} onClick={() => setMobileSidebarOpen(false)}>
              <img src={settings.site_logo} alt="Logo" style={{ height: 32, maxWidth: '100%', objectFit: 'contain' }} />
            </Link>
          ) : (
            <Link to="/admin" style={{ display: 'inline-flex', alignItems: 'center', gap: 12, textDecoration: 'none' }} onClick={() => setMobileSidebarOpen(false)}>
              <div className="sidebar-logo-icon">
                <TrendingUp size={20} style={{ color: '#fff' }} />
              </div>
              <span className="sidebar-logo-text">{settings.site_name || 'Mindora X'}</span>
            </Link>
          )}
          <button
            className="mobile-sidebar-close"
            onClick={() => setMobileSidebarOpen(false)}
            style={{ display: 'none' }}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">{t('nav.main_menu', 'Main Menu')}</div>
          {updatedNavItems.filter(item => {
            if (item.sectionLabel) return true   // always show section dividers
            if (!item.permission) return true
            if (Array.isArray(item.permission)) {
              return item.permission.some(p => hasPermission(p))
            }
            return hasPermission(item.permission)
          }).map((item, idx) => {
            // ── Section divider ──────────────────────────────────
            if (item.sectionLabel) {
              const secKey = `nav.${item.sectionLabel.toLowerCase().replace(/ /g, '_')}`
              const isSecDanger = item.sectionLabel === 'System Security'
              return (
                <div 
                  key={`section-${idx}`} 
                  className="nav-section-label" 
                  style={{ 
                    marginTop: 16,
                    color: isSecDanger ? '#ef4444' : undefined,
                    fontWeight: isSecDanger ? 800 : undefined,
                    letterSpacing: isSecDanger ? '1px' : undefined
                  }}
                >
                  {t(secKey, item.sectionLabel)}
                </div>
              )
            }

            const count = stats[item.countKey] || 0
            const displayCount = count > 9 ? '+9' : count
            const translationKeys = {
              'Dashboard': 'nav.dashboard',
              'Publishers': 'nav.publishers',
              'Websites': 'nav.websites',
              'Revenue': 'nav.revenue',
              'Period Closings': 'nav.closings',
              'Payouts': 'nav.payouts',
              'Adjustments': 'nav.adjustments',
              'Support Tickets': 'nav.support_tickets',
              'Announcements': 'nav.announcements',
              'Pages': 'nav.pages',
              'FAQ': 'nav.faq',
              'Audit Logs': 'nav.audit_log',
              'GAM Accounts': 'nav.gam_accounts',
              'Manual Sync': 'nav.manual_sync',
              'Settings': 'nav.settings',
              'Email Templates': 'nav.email_templates',
              'Translations': 'nav.translations',
              'Admins': 'nav.admins',
              'Tools': 'nav.tools',
              'Danger Zone': 'nav.danger_zone'
            }
            const key = translationKeys[item.label] || `nav.${item.label.toLowerCase().replace(/ /g, '_')}`

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}${item.isDanger ? ' nav-item-danger' : ''}`}
                style={({ isActive }) => ({
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  color: item.isDanger ? '#ef4444' : undefined,
                })}
                onClick={() => setMobileSidebarOpen(false)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <item.icon 
                    className="nav-icon" 
                    size={18} 
                    style={item.isDanger ? { color: '#ef4444' } : undefined} 
                  />
                  <span style={item.isDanger ? { color: '#ef4444', fontWeight: 600 } : undefined}>
                    {t(key, item.label)}
                  </span>
                </div>
                {item.isDanger ? (
                  <span style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    color: '#ef4444',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    fontSize: '9px',
                    fontWeight: '800',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    lineHeight: 1.2,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    boxShadow: '0 0 8px rgba(239, 68, 68, 0.15)'
                  }}>
                    {t('nav.danger_badge', 'Danger')}
                  </span>
                ) : count > 0 ? (
                  <span style={{
                    background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
                    color: '#fff',
                    fontSize: '10px',
                    fontWeight: '800',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    lineHeight: 1.2,
                    boxShadow: '0 0 10px rgba(245, 158, 11, 0.4)',
                    textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '20px',
                    height: '20px',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    {displayCount}
                  </span>
                ) : null}
              </NavLink>
            )
          })}
        </nav>

        <div className="sidebar-footer">
          <NavLink
            to="/admin/profile"
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            style={{ marginBottom: 8, display: 'flex', gap: 12, alignItems: 'center', textDecoration: 'none' }}
            onClick={() => setMobileSidebarOpen(false)}
          >
            <User className="nav-icon" size={18} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{user?.name || 'Admin'}</div>
              <div style={{ fontSize: 11, color: 'var(--color-text-subtle)' }}>{t(`nav.role.${user?.roles_list?.[0]?.toLowerCase().replace(/ /g, '_')}`, user?.roles_list?.[0] || 'Administrator')}</div>
            </div>
          </NavLink>
          <button
            className="btn btn-secondary"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={handleLogout}
          >
            <LogOut size={16} /> {t('nav.logout', 'Logout')}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="main-content">
        <header className="topbar">
          <div className="topbar-left" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              className="mobile-sidebar-toggle"
              onClick={() => setMobileSidebarOpen(true)}
              style={{ display: 'none' }}
            >
              <Menu size={20} />
            </button>
          </div>
          <div className="topbar-right" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Bell Notification Icon */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setBellOpen(!bellOpen)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-text)',
                  cursor: 'pointer',
                  position: 'relative',
                  padding: 8,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: 2,
                    right: 2,
                    background: '#ef4444',
                    color: '#fff',
                    fontSize: '9px',
                    fontWeight: '800',
                    minWidth: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 2px',
                    boxShadow: '0 0 10px rgba(239, 68, 68, 0.6)',
                  }}>
                    {unreadCount > 9 ? '+9' : unreadCount}
                  </span>
                )}
              </button>

              {bellOpen && (
                <>
                  <div
                    style={{
                      position: 'fixed',
                      inset: 0,
                      zIndex: 998,
                      cursor: 'default',
                    }}
                    onClick={() => setBellOpen(false)}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: '120%',
                      width: '320px',
                      background: 'rgba(30, 41, 59, 0.95)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)',
                      zIndex: 999,
                      overflow: 'hidden',
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 16px',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    }}>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{t('notifications.title', 'Notifications')}</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--br-primary)',
                            fontSize: '11px',
                            fontWeight: 500,
                            cursor: 'pointer',
                          }}
                        >
                          {t('notifications.mark_all_read', 'Mark all read')}
                        </button>
                      )}
                    </div>
                    <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                      {notifications.length === 0 ? (
                        <div style={{
                          padding: '32px 16px',
                          textAlign: 'center',
                          color: 'var(--color-text-subtle)',
                          fontSize: '13px',
                        }}>
                          {t('notifications.empty', 'No notifications yet')}
                        </div>
                      ) : (
                        notifications.map(n => {
                          const isUnread = !n.read_at;
                          const nType = n.data?.type;
                          return (
                            <div
                              key={n.id}
                              onClick={() => handleNotificationClick(n)}
                              style={{
                                display: 'flex',
                                gap: 12,
                                padding: '12px 16px',
                                borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                                cursor: 'pointer',
                                transition: 'background 0.2s',
                                background: isUnread ? 'rgba(59, 130, 246, 0.05)' : 'none',
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = isUnread ? 'rgba(59,130,246,0.08)' : 'rgba(255,255,255,0.02)'}
                              onMouseLeave={e => e.currentTarget.style.background = isUnread ? 'rgba(59,130,246,0.05)' : 'none'}
                            >
                              <div style={{ marginTop: 2 }}>
                                {nType === 'tracking_code_removed' ? (
                                  <AlertTriangle size={16} style={{ color: '#f59e0b' }} />
                                ) : (
                                  <AlertTriangle size={16} style={{ color: '#ef4444' }} />
                                )}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '12px', fontWeight: isUnread ? 600 : 400, color: 'var(--color-text)', lineHeight: 1.4, textAlign: 'left' }}>
                                  {n.data?.message || (nType === 'tracking_code_removed'
                                    ? t('notifications.tracking_missing', 'Tracking missing on {domain}', { domain: n.data?.domain })
                                    : t('notifications.traffic_anomaly', 'Traffic anomaly: {type}', { type: t('traffic.anomaly_type.' + n.data?.anomaly_type, n.data?.type_label) }))}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                                  <span style={{ fontSize: '10px', color: 'var(--color-text-subtle)' }}>
                                    {n.data?.publisher_name}
                                  </span>
                                  <span style={{ fontSize: '10px', color: 'var(--color-text-subtle)' }}>
                                    {formatTimeAgo(n.created_at)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
            <LanguageSwitcher />
          </div>
        </header>

        <main className="page-container">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>

        <footer style={{
          marginTop: 'auto',
          padding: '20px 32px',
          borderTop: '1px solid var(--color-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          fontSize: '12px',
          color: 'var(--color-text-subtle)',
        }}>
          <div>{t('common.all_rights_reserved', '© {year} {site_name}. All rights reserved.', { year: new Date().getFullYear(), site_name: settings.site_name || 'Mindora X' })}</div>
          <div style={{ fontWeight: 600, color: 'var(--color-primary-light)' }}>
            {t(`nav.role.${user?.roles_list?.[0]?.toLowerCase().replace(/ /g, '_')}`, user?.roles_list?.[0] || 'Administrator')}
          </div>
        </footer>
      </div>
    </div>
  )
}
