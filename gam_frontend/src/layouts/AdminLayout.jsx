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
  X
} from 'lucide-react'

const navItems = [
  { to: '/admin',              icon: LayoutDashboard, label: 'Dashboard',      end: true },
  { to: '/admin/publishers',   icon: Users, label: 'Publishers', countKey: 'pending_publishers' },
  { to: '/admin/websites',     icon: Globe, label: 'Websites'    },
  { to: '/admin/revenue',      icon: DollarSign, label: 'Revenue'     },
  { to: '/admin/closings',     icon: Calendar, label: 'Period Closings' },
  { to: '/admin/payouts',      icon: CreditCard, label: 'Payouts',    countKey: 'pending_payouts' },
  { to: '/admin/adjustments',  icon: Scale, label: 'Adjustments' },
  { to: '/admin/tickets',      icon: Ticket, label: 'Support Tickets', countKey: 'pending_tickets' },
  { to: '/admin/announcements',icon: Megaphone, label: 'Announcements' },
  { to: '/admin/pages',        icon: FileText, label: 'Pages'         },
  { to: '/admin/audit-logs',   icon: History, label: 'Audit Logs'  },
  { to: '/admin/gam-accounts', icon: Server, label: 'GAM Accounts'},
  { to: '/admin/gam-sync',     icon: RefreshCw, label: 'Manual Sync' },
  { to: '/admin/settings',     icon: Settings,  label: 'Settings'   },
  { to: '/admin/email-templates', icon: Mail, label: 'Email Templates' },
  { to: '/admin/translations', icon: Languages, label: 'Translations' },
]

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth()
  const { locale, switchLocale, t } = useI18n()
  const { settings } = useSettings()
  const navigate = useNavigate()
  const location = useLocation()

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [stats, setStats] = useState({ pending_publishers: 0, pending_payouts: 0, pending_tickets: 0 })

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
          {navItems.map(item => {
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
              <div style={{ fontSize: 11, color: 'var(--color-text-subtle)' }}>Administrator</div>
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
            <div>
              <div className="topbar-title">Admin Panel</div>
              <div className="topbar-subtitle">BestRevenue Management</div>
            </div>
          </div>
          <div className="topbar-right">
            {/* Language switcher */}
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                className={`btn btn-xs ${locale === 'en' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => switchLocale('en')}
              >EN</button>
              <button
                className={`btn btn-xs ${locale === 'ar' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => switchLocale('ar')}
              >AR</button>
            </div>
            <div className="badge badge-active">
              <span style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'currentColor'
              }} />
              Online
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
            Administrator
          </div>
        </footer>
      </div>
    </div>
  )
}
