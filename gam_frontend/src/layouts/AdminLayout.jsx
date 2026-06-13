import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useI18n } from '../contexts/I18nContext'
import { useSettings } from '../contexts/SettingsContext'
import { adminApi } from '../api/endpoints'
import { 
  LayoutDashboard, 
  Users, 
  Globe, 
  DollarSign, 
  Calendar, 
  CreditCard, 
  Scale, 
  Ticket, 
  Megaphone, 
  FileText, 
  History, 
  Server, 
  RefreshCw, 
  Settings, 
  Mail, 
  Languages,
  TrendingUp,
  User,
  LogOut,
  Menu,
  X,
  ShieldCheck
} from 'lucide-react'

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
            <img src={settings.site_logo} alt="Logo" style={{ height: 32, maxWidth: '100%', objectFit: 'contain' }} />
          ) : (
            <>
              <div className="sidebar-logo-icon">
                <TrendingUp size={20} style={{ color: '#fff' }} />
              </div>
              <span className="sidebar-logo-text">{settings.site_name || 'BestRevenue'}</span>
            </>
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
          <div className="nav-section-label">Main Menu</div>
          {updatedNavItems.filter(item => {
            if (!item.permission) return true
            if (Array.isArray(item.permission)) {
              return item.permission.some(p => hasPermission(p))
            }
            return hasPermission(item.permission)
          }).map(item => {
            const count = stats[item.countKey] || 0
            const displayCount = count > 9 ? '+9' : count

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
                  <span>{item.label}</span>
                </div>
                {count > 0 && (
                  <span style={{
                    background: 'var(--color-warning)',
                    color: '#fff',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    padding: '2px 6px',
                    borderRadius: '12px',
                    lineHeight: 1
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
              <div style={{ fontSize: 11, color: 'var(--color-text-subtle)' }}>{user?.roles_list?.[0] || 'Administrator'}</div>
            </div>
          </NavLink>
          <button
            className="btn btn-secondary"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={handleLogout}
          >
            <LogOut size={16} /> Logout
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
            {/* Language switcher */}
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <select
                className="form-select"
                value={locale}
                onChange={e => switchLocale(e.target.value)}
                style={{ 
                  padding: '6px 28px 6px 12px', 
                  fontSize: 13, 
                  background: 'var(--br-surface)', 
                  border: '0.5px solid var(--br-border)', 
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--br-text)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  outline: 'none',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23f1f5f9' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'calc(100% - 10px) center',
                  minWidth: 70
                }}
              >
                <option value="en" style={{ background: 'var(--br-bg-2)', color: 'var(--br-text)' }}>EN</option>
                <option value="ar" style={{ background: 'var(--br-bg-2)', color: 'var(--br-text)' }}>AR</option>
              </select>
            </div>
          </div>
        </header>

        <main className="page-container">
          {children}
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
          <div>© {new Date().getFullYear()} {settings.site_name || 'BestRevenue'}. All rights reserved.</div>
          <div style={{ fontWeight: 600, color: 'var(--color-primary-light)' }}>
            {user?.roles_list?.[0] || 'Administrator'}
          </div>
        </footer>
      </div>
    </div>
  )
}
