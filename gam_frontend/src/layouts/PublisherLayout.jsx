import { NavLink, useNavigate, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useI18n } from '../contexts/I18nContext'
import { useSettings } from '../contexts/SettingsContext'
import { 
  LayoutDashboard, Globe, DollarSign, CreditCard, HelpCircle, 
  Settings, LogOut, User, TrendingUp, Menu, X 
} from 'lucide-react'

const navItems = [
  { to: '/publisher',          icon: <LayoutDashboard size={18} />, label: 'Dashboard',   end: true },
  { to: '/publisher/websites', icon: <Globe size={18} />,           label: 'My Websites' },
  { to: '/publisher/revenue',  icon: <DollarSign size={18} />,      label: 'Revenue'     },
  { to: '/publisher/payouts',  icon: <CreditCard size={18} />,      label: 'Payouts'     },
  { to: '/publisher/tickets',  icon: <HelpCircle size={18} />,      label: 'Support Tickets' },
  { to: '/publisher/settings', icon: <Settings size={18} />,        label: 'Settings'    },
]

export default function PublisherLayout({ children }) {
  const { user, logout, stopImpersonating } = useAuth()
  const { locale, switchLocale } = useI18n()
  const { settings } = useSettings()
  const navigate = useNavigate()

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [isImpersonating, setIsImpersonating] = useState(false)
  useEffect(() => {
    setIsImpersonating(!!(sessionStorage.getItem('admin_token') || localStorage.getItem('admin_token')))
  }, [])

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

      <aside className={`sidebar ${mobileSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {settings.site_logo ? (
            <Link to="/publisher" style={{ display: 'inline-flex', alignItems: 'center' }} onClick={() => setMobileSidebarOpen(false)}>
              <img src={settings.site_logo} alt="Logo" style={{ height: 32, maxWidth: '100%', objectFit: 'contain' }} />
            </Link>
          ) : (
            <Link to="/publisher" style={{ display: 'inline-flex', alignItems: 'center', gap: 12, textDecoration: 'none' }} onClick={() => setMobileSidebarOpen(false)}>
              <div className="sidebar-logo-icon">
                <TrendingUp size={20} />
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
          <div className="nav-section-label">Publisher Portal</div>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              onClick={() => setMobileSidebarOpen(false)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer" style={{ borderTop: '1px solid var(--br-border)', padding: '16px 12px' }}>
          <Link 
            to="/publisher/settings"
            onClick={() => setMobileSidebarOpen(false)}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 12, 
              padding: '11px 12px', 
              marginBottom: 8, 
              color: 'var(--br-text)',
              textDecoration: 'none',
              borderRadius: 'var(--br-radius)',
              transition: 'var(--br-transition)',
              cursor: 'pointer'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--br-surface-hover)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent'
            }}
          >
            <div className="avatar">
              <User size={16} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name || 'Publisher'}</div>
              <div style={{ fontSize: 11, color: 'var(--br-text-3)' }}>Publisher Account</div>
            </div>
          </Link>
          <button
            className="btn btn-secondary"
            style={{ width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 8 }}
            onClick={handleLogout}
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      <div className="main-content">
        {isImpersonating && (
          <div style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '999px',
            padding: '6px 6px 6px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
            animation: 'slideUp 0.3s ease',
            whiteSpace: 'nowrap'
          }}>
            <span style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#10b981',
              display: 'inline-block'
            }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8' }}>
              Viewing as <strong style={{ color: '#e2e8f0' }}>{user?.name}</strong>
            </span>
            <button
              onClick={stopImpersonating}
              style={{
                background: '#ef4444',
                color: '#ffffff',
                borderRadius: '999px',
                padding: '6px 16px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                border: 'none',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => e.target.style.background = '#dc2626'}
              onMouseLeave={(e) => e.target.style.background = '#ef4444'}
            >
              <span style={{ fontSize: 13, fontWeight: 'bold' }}>✕</span> Exit
            </button>
          </div>
        )}
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
          <div>© {new Date().getFullYear()} {settings.site_name || 'BestRevenue'} Platform. All rights reserved.</div>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <Link to="/" style={{ color: 'var(--color-text-muted)', textDecoration: 'none', transition: 'var(--transition)' }} onMouseEnter={(e) => e.target.style.color = 'var(--color-text)'} onMouseLeave={(e) => e.target.style.color = 'var(--color-text-muted)'}>Home Page</Link>
            <a href="https://support.google.com/admanager" target="_blank" rel="noreferrer" style={{ color: 'var(--color-text-muted)', textDecoration: 'none', transition: 'var(--transition)' }} onMouseEnter={(e) => e.target.style.color = 'var(--color-text)'} onMouseLeave={(e) => e.target.style.color = 'var(--color-text-muted)'}>Google Ad Manager Help</a>
            {settings.pages && settings.pages.filter(p => p.show_in_publisher_footer).map(p => (
              <Link key={p.slug} to={`/page/${p.slug}`} style={{ color: 'var(--color-text-muted)', textDecoration: 'none', transition: 'var(--transition)' }} onMouseEnter={(e) => e.target.style.color = 'var(--color-text)'} onMouseLeave={(e) => e.target.style.color = 'var(--color-text-muted)'}>{p.title}</Link>
            ))}
            {settings.social_facebook && (
              <a href={settings.social_facebook} target="_blank" rel="noreferrer" style={{ color: 'var(--color-text-muted)', textDecoration: 'none', transition: 'var(--transition)', display: 'inline-flex', alignItems: 'center', gap: '6px' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-text)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#1877F2">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Facebook
              </a>
            )}
            {settings.social_instagram && (
              <a href={settings.social_instagram} target="_blank" rel="noreferrer" style={{ color: 'var(--color-text-muted)', textDecoration: 'none', transition: 'var(--transition)', display: 'inline-flex', alignItems: 'center', gap: '6px' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-text)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}>
                <svg width="14" height="14" viewBox="0 0 24 24">
                  <defs>
                    <linearGradient id="instagram-grad-pub" x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#f09433" />
                      <stop offset="25%" stopColor="#e6683c" />
                      <stop offset="50%" stopColor="#dc2743" />
                      <stop offset="75%" stopColor="#cc2366" />
                      <stop offset="100%" stopColor="#bc1888" />
                    </linearGradient>
                  </defs>
                  <path fill="url(#instagram-grad-pub)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
                </svg>
                Instagram
              </a>
            )}
            {settings.social_x && (
              <a href={settings.social_x} target="_blank" rel="noreferrer" style={{ color: 'var(--color-text-muted)', textDecoration: 'none', transition: 'var(--transition)', display: 'inline-flex', alignItems: 'center', gap: '6px' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-text)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#FFFFFF">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                X
              </a>
            )}
            {settings.social_telegram && (
              <a href={settings.social_telegram} target="_blank" rel="noreferrer" style={{ color: 'var(--color-text-muted)', textDecoration: 'none', transition: 'var(--transition)', display: 'inline-flex', alignItems: 'center', gap: '6px' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-text)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#26A5E4">
                  <path d="M11.944 0C5.352 0 0 5.352 0 12s5.352 12 12 12 12-5.352 12-12S18.592 0 11.944 0zm5.89 8.578l-1.928 9.07c-.145.642-.525.801-1.062.5l-2.938-2.165-1.417 1.364c-.157.157-.29.29-.594.29l.21-2.985 5.432-4.909c.236-.21-.052-.326-.368-.116l-6.713 4.225-2.894-.906c-.63-.2-.643-.63.13-.93l11.312-4.36c.525-.2 1 .124.848.887z"/>
                </svg>
                Telegram
              </a>
            )}
          </div>
        </footer>
      </div>
    </div>
  )
}
