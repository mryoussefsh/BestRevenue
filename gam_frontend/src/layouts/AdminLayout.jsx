import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useI18n } from '../contexts/I18nContext'
import { useSettings } from '../contexts/SettingsContext'
import { adminApi } from '../api/endpoints'
import LanguageSwitcher from '../components/LanguageSwitcher'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { LayoutDashboard, Users, Globe, DollarSign, Calendar, CreditCard, Scale, Ticket, Megaphone, FileText, History, Server, RefreshCw, Settings, Mail, Languages, TrendingUp, User, LogOut, Menu, X, ShieldCheck, HelpCircle } from 'lucide-react'

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
  { to: '/admin/email-templates', icon: Mail, label: 'Email Templates', permission: 'manage_email_templates' },
  { to: '/admin/translations', icon: Languages, label: 'Translations', permission: 'manage_translations' },
  { to: '/admin/admins',       icon: ShieldCheck, label: 'Admins', permission: 'manage_admins' },
]

export default function AdminLayout({ children }) {
  const { user, logout, hasPermission } = useAuth()
  const { locale, switchLocale, t } = useI18n()
  const { settings } = useSettings()
  const navigate = useNavigate()
  const location = useLocation()

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [stats, setStats] = useState({ pending_publishers: 0, pending_payouts: 0, pending_tickets: 0 })

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
              <span className="sidebar-logo-text">{settings.site_name || 'BestRevenue'}</span>
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
            if (!item.permission) return true
            if (Array.isArray(item.permission)) {
              return item.permission.some(p => hasPermission(p))
            }
            return hasPermission(item.permission)
          }).map(item => {
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
              'Admins': 'nav.admins'
            }
            const key = translationKeys[item.label] || `nav.${item.label.toLowerCase().replace(/ /g, '_')}`

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                onClick={() => setMobileSidebarOpen(false)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <item.icon className="nav-icon" size={18} />
                  <span>{t(key, item.label)}</span>
                </div>
                {count > 0 && (
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
                )}
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
          <div className="topbar-right">
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
          <div>{t('common.all_rights_reserved', '© {year} {site_name}. All rights reserved.', { year: new Date().getFullYear(), site_name: settings.site_name || 'BestRevenue' })}</div>
          <div style={{ fontWeight: 600, color: 'var(--color-primary-light)' }}>
            {t(`nav.role.${user?.roles_list?.[0]?.toLowerCase().replace(/ /g, '_')}`, user?.roles_list?.[0] || 'Administrator')}
          </div>
        </footer>
      </div>
    </div>
  )
}
