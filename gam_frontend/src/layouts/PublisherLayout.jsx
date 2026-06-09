import { NavLink, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useI18n } from '../contexts/I18nContext'
import { useSettings } from '../contexts/SettingsContext'

const navItems = [
  { to: '/publisher',          icon: '📊', label: 'Dashboard',   end: true },
  { to: '/publisher/websites', icon: '🌐', label: 'My Websites' },
  { to: '/publisher/revenue',  icon: '💰', label: 'Revenue'     },
  { to: '/publisher/payouts',  icon: '💳', label: 'Payouts'     },
  { to: '/publisher/settings', icon: '⚙️', label: 'Settings'    },
]

export default function PublisherLayout({ children }) {
  const { user, logout, stopImpersonating } = useAuth()
  const { locale, switchLocale } = useI18n()
  const { settings } = useSettings()
  const navigate = useNavigate()

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
      <aside className="sidebar">
        <div className="sidebar-logo">
          {settings.site_logo ? (
            <img src={settings.site_logo} alt="Logo" style={{ height: 32, maxWidth: '100%', objectFit: 'contain' }} />
          ) : (
            <>
              <div className="sidebar-logo-icon">💹</div>
              <span className="sidebar-logo-text">{settings.site_name || 'BestRevenue'}</span>
            </>
          )}
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Publisher Portal</div>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="nav-item" style={{ marginBottom: 8 }}>
            <span className="nav-icon">👤</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{user?.name || 'Publisher'}</div>
              <div style={{ fontSize: 11, color: 'var(--color-text-subtle)' }}>Publisher Account</div>
            </div>
          </div>
          <button
            className="btn btn-secondary"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={handleLogout}
          >
            🚪 Logout
          </button>
        </div>
      </aside>

      <div className="main-content">
        {isImpersonating && (
          <div style={{
            background: 'linear-gradient(90deg, #f59e0b, #d97706)',
            color: '#1a1a2e',
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 700,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
          }}>
            <span>👁️ You are currently viewing as publisher: <strong>{user?.name}</strong> (Impersonation Mode)</span>
            <button
              className="btn btn-secondary btn-xs"
              style={{ background: '#1a1a2e', color: '#f59e0b', border: '1px solid #f59e0b', fontWeight: 700 }}
              onClick={stopImpersonating}
            >
              ↩ Return to Admin
            </button>
          </div>
        )}
        <header className="topbar">
          <div className="topbar-left">
            <div>
              <div className="topbar-title">Publisher Portal</div>
              <div className="topbar-subtitle">{user?.email}</div>
            </div>
          </div>
          <div className="topbar-right">
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
          </div>
        </header>
        <main className="page-container">
          {children}
        </main>
      </div>
    </div>
  )
}
