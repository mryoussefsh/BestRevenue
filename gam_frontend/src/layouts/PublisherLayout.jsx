import { NavLink, useNavigate, Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useI18n } from '../contexts/I18nContext'
import { useSettings } from '../contexts/SettingsContext'
import { publisherApi } from '../api/endpoints'
import LanguageSwitcher from '../components/LanguageSwitcher'
import MinPayoutAlertBanner from '../components/MinPayoutAlertBanner'
import { LayoutDashboard, Globe, DollarSign, CreditCard, HelpCircle, Settings, LogOut, User, TrendingUp, Menu, X } from 'lucide-react'

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
  const { locale, switchLocale, t } = useI18n()
  const { settings } = useSettings()
  const navigate = useNavigate()
  const location = useLocation()

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [isImpersonating, setIsImpersonating] = useState(false)
  const [unreadTicketsCount, setUnreadTicketsCount] = useState(0)

  useEffect(() => {
    setIsImpersonating(!!(sessionStorage.getItem('admin_token') || localStorage.getItem('admin_token')))
  }, [])

  useEffect(() => {
    publisherApi.getTickets()
      .then(res => {
        setUnreadTicketsCount(res.data.unread_replies_count || 0)
      })
      .catch(() => {})
  }, [location.pathname])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="app-shell">
      {/* Portal Aurora Background */}
      <div className="aurora-layer" aria-hidden="true" style={{ zIndex: 0 }}>
        <div className="portal-glow-1"></div>
        <div className="portal-glow-2"></div>
        <div className="portal-glow-3"></div>
        <div className="portal-glow-4"></div>
        <div className="portal-glow-5"></div>
        
        <span className="portal-particle" style={{ top:'12%', left:'18%',  width:4, height:4, background:'#00f2fe', animationDelay:'0s',   animationDuration:'7s'  }}></span>
        <span className="portal-particle" style={{ top:'48%', left:'32%',  width:3, height:3, background:'#8b5cf6', animationDelay:'1.5s', animationDuration:'9s'  }}></span>
        <span className="portal-particle" style={{ top:'78%', left:'22%',  width:4, height:4, background:'#10b981', animationDelay:'3.0s', animationDuration:'8s'  }}></span>
        <span className="portal-particle" style={{ top:'28%', left:'68%',  width:3, height:3, background:'#f59e0b', animationDelay:'0.8s', animationDuration:'10s' }}></span>
        <span className="portal-particle" style={{ top:'65%', left:'78%',  width:5, height:5, background:'#00f2fe', animationDelay:'3.8s', animationDuration:'6.5s'}}></span>
        <span className="portal-particle" style={{ top:'88%', left:'55%',  width:3, height:3, background:'#8b5cf6', animationDelay:'2.2s', animationDuration:'11s' }}></span>
        <span className="portal-particle" style={{ top:'15%', left:'85%',  width:4, height:4, background:'#f43f5e', animationDelay:'4.5s', animationDuration:'8.5s'}}></span>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setMobileSidebarOpen(false)} style={{ zIndex: 99 }} />
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
          <div className="nav-section-label">{t('nav.publisher_portal', 'Publisher Portal')}</div>
          {navItems.map(item => {
            const translationKeys = {
              'Dashboard': 'nav.dashboard',
              'My Websites': 'nav.my_websites',
              'Revenue': 'nav.my_earnings',
              'Payouts': 'nav.my_payouts',
              'Support Tickets': 'nav.support_tickets',
              'Settings': 'nav.settings'
            }
            const key = translationKeys[item.label] || `nav.${item.label.toLowerCase().replace(/ /g, '_')}`
            const count = item.to === '/publisher/tickets' ? unreadTicketsCount : 0
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
                  <span className="nav-icon">{item.icon}</span>
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
                    {count}
                  </span>
                )}
              </NavLink>
            )
          })}
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
              <div style={{ fontSize: 11, color: 'var(--br-text-3)' }}>{t('nav.publisher_account', 'Publisher Account')}</div>
            </div>
          </Link>
          <button
            className="btn btn-secondary"
            style={{ width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 8 }}
            onClick={handleLogout}
          >
            <LogOut size={16} />
            {t('nav.logout', 'Logout')}
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
              {t('common.viewing_as', 'Viewing as')} <strong style={{ color: '#e2e8f0' }}>{user?.name}</strong>
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
              <span style={{ fontSize: 13, fontWeight: 'bold' }}>✕</span> {t('common.exit', 'Exit')}
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
            <LanguageSwitcher />
          </div>
        </header>
        {['/publisher', '/publisher/payouts', '/publisher/settings'].includes(location.pathname) && (
          <MinPayoutAlertBanner />
        )}
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
          <div>{t('common.all_rights_reserved', '© {year} {site_name} Platform. All rights reserved.', { year: new Date().getFullYear(), site_name: settings.site_name || 'Mindora X' })}</div>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <Link to="/" style={{ color: 'var(--color-text-muted)', textDecoration: 'none', transition: 'var(--transition)' }} onMouseEnter={(e) => e.target.style.color = 'var(--color-text)'} onMouseLeave={(e) => e.target.style.color = 'var(--color-text-muted)'}>{t('common.home_page', 'Home Page')}</Link>
            <a href="https://support.google.com/admanager" target="_blank" rel="noreferrer" style={{ color: 'var(--color-text-muted)', textDecoration: 'none', transition: 'var(--transition)' }} onMouseEnter={(e) => e.target.style.color = 'var(--color-text)'} onMouseLeave={(e) => e.target.style.color = 'var(--color-text-muted)'}>{t('common.gam_help', 'Google Ad Manager Help')}</a>
            {settings.pages && settings.pages.filter(p => p.show_in_publisher_footer).map(p => (
              <Link key={p.slug} to={`/page/${p.slug}`} style={{ color: 'var(--color-text-muted)', textDecoration: 'none', transition: 'var(--transition)' }} onMouseEnter={(e) => e.target.style.color = 'var(--color-text)'} onMouseLeave={(e) => e.target.style.color = 'var(--color-text-muted)'}>
                {(locale === 'ar' && p.title_ar) ? p.title_ar : p.title}
              </Link>
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
