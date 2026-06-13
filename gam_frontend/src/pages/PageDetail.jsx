import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useSettings } from '../contexts/SettingsContext'
import { publicApi } from '../api/endpoints'
import toast from 'react-hot-toast'
import { TrendingUp, Lock, LayoutDashboard, ArrowRight, X, Menu } from 'lucide-react'
import './LandingPage.css'
import './PageDetail.css'

export default function PageDetail() {
  const { slug } = useParams()
  const { user } = useAuth()
  const { settings } = useSettings()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [page, setPage] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    publicApi.getPage(slug)
      .then(res => {
        setPage(res.data)
        setLoading(false)
        const siteName = settings.site_name || 'BestRevenue'
        document.title = `${res.data.title} - ${siteName}`
      })
      .catch(() => {
        toast.error('Page not found')
        navigate('/')
      })
  }, [slug, navigate, settings.site_name])

  const handleDashboardRedirect = () => {
    if (user.role === 'admin') navigate('/admin')
    else navigate('/publisher')
  }

  if (loading) {
    return (
      <div className="loading-screen"><div className="spinner" /><span>Loading page…</span></div>
    )
  }

  return (
    <div className="page-detail-wrapper">
      <div className="page-detail-glow"></div>

      {/* Header */}
      <header className={`landing-header ${menuOpen ? 'menu-open' : ''}`}>
        <div className="landing-nav-container">
          <Link to="/" className="landing-logo">
            {settings.site_logo ? (
              <img src={settings.site_logo} alt={settings.site_name || 'BestRevenue'} />
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={18} style={{ color: 'var(--br-primary)' }} />
                <span>{settings.site_name || 'BestRevenue'}</span>
              </span>
            )}
          </Link>

          <nav className="landing-nav-links">
            <Link to="/" className="landing-nav-link" onClick={() => setMenuOpen(false)}>Home</Link>
            <a href="/#features" className="landing-nav-link" onClick={() => setMenuOpen(false)}>Features</a>
            <a href="/#calculator" className="landing-nav-link" onClick={() => setMenuOpen(false)}>Calculator</a>
            <a href="/#proofs" className="landing-nav-link" onClick={() => setMenuOpen(false)}>Payouts Proof</a>
            <Link to="/support" className="landing-nav-link" onClick={() => setMenuOpen(false)}>Support</Link>
            {settings.pages && settings.pages.filter(p => p.show_in_landing_menu).map(p => (
              <Link
                key={p.slug}
                to={`/page/${p.slug}`}
                className={`landing-nav-link ${p.slug === slug ? 'active' : ''}`}
                onClick={() => setMenuOpen(false)}
              >
                {p.title}
              </Link>
            ))}
            
            {/* Mobile CTAs placed at the end of the dropdown menu list */}
            <div className="mobile-menu-ctas">
              {user ? (
                <button onClick={() => { setMenuOpen(false); handleDashboardRedirect(); }} className="btn btn-primary btn-md" style={{ width: '100%', justifyContent: 'center' }}>
                  <LayoutDashboard size={14} /> Dashboard
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
                  {settings.registration_status !== 'closed' ? (
                    <Link to="/register" className="btn btn-primary btn-md" onClick={() => setMenuOpen(false)} style={{ justifyContent: 'center' }}>
                      Get Started <ArrowRight size={14} />
                    </Link>
                  ) : (
                    <span className="badge badge-neutral" style={{ justifyContent: 'center', padding: '10px' }}>Registration Closed</span>
                  )}
                  <Link to="/login" className="btn btn-secondary btn-md" onClick={() => setMenuOpen(false)} style={{ justifyContent: 'center' }}>
                    <Lock size={14} /> Sign In
                  </Link>
                </div>
              )}
            </div>
          </nav>

          <div className="landing-nav-ctas">
            {user ? (
              <button onClick={handleDashboardRedirect} className="btn btn-primary btn-sm">
                <LayoutDashboard size={14} /> Dashboard
              </button>
            ) : (
              <>
                <Link to="/login" className="btn btn-secondary btn-sm">
                  <Lock size={12} /> Sign In
                </Link>
                {settings.registration_status !== 'closed' ? (
                  <Link to="/register" className="btn btn-primary btn-sm">
                    Get Started <ArrowRight size={12} />
                  </Link>
                ) : (
                  <span className="badge badge-neutral">Registration Closed</span>
                )}
              </>
            )}
          </div>

          <button className="mobile-nav-toggle" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Hero Header */}
      <section className="page-detail-hero">
        <h1 className="page-detail-hero-title">{page.title}</h1>
        <p className="page-detail-hero-desc">
          Last updated: {new Date(page.updated_at).toLocaleDateString()}
        </p>
      </section>

      {/* Content Area */}
      <section className="page-detail-container">
        <div className="page-detail-card">
          <div
            className="page-detail-content"
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              {settings.site_logo ? (
                <img src={settings.site_logo} alt={settings.site_name || 'BestRevenue'} style={{ maxHeight: 50 }} />
              ) : (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <TrendingUp size={20} style={{ color: 'var(--br-primary)' }} />
                  <span>{settings.site_name || 'BestRevenue'}</span>
                </span>
              )}
            </Link>
            <p className="footer-desc">
              A premium, automated ad optimization suite for publishers using Google Ad Manager. Harness advanced tag generation, robust syncing, and instant payouts.
            </p>
            {(settings.social_facebook || settings.social_instagram || settings.social_x || settings.social_telegram) && (
              <div className="footer-socials" style={{ display: 'flex', gap: 14, marginTop: 18 }}>
                {settings.social_facebook && (
                  <a href={settings.social_facebook} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', transition: 'transform 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.15)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'} title="Facebook">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>
                )}
                {settings.social_instagram && (
                  <a href={settings.social_instagram} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', transition: 'transform 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.15)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'} title="Instagram">
                    <svg width="20" height="20" viewBox="0 0 24 24">
                      <defs>
                        <linearGradient id="instagram-grad-pagedetail" x1="0%" y1="100%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#f09433" />
                          <stop offset="25%" stopColor="#e6683c" />
                          <stop offset="50%" stopColor="#dc2743" />
                          <stop offset="75%" stopColor="#cc2366" />
                          <stop offset="100%" stopColor="#bc1888" />
                        </linearGradient>
                      </defs>
                      <path fill="url(#instagram-grad-pagedetail)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
                    </svg>
                  </a>
                )}
                {settings.social_x && (
                  <a href={settings.social_x} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', transition: 'transform 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.15)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'} title="X (Twitter)">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#FFFFFF" style={{ alignSelf: 'center' }}>
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </a>
                )}
                {settings.social_telegram && (
                  <a href={settings.social_telegram} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', transition: 'transform 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.15)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'} title="Telegram">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#26A5E4">
                      <path d="M11.944 0C5.352 0 0 5.352 0 12s5.352 12 12 12 12-5.352 12-12S18.592 0 11.944 0zm5.89 8.578l-1.928 9.07c-.145.642-.525.801-1.062.5l-2.938-2.165-1.417 1.364c-.157.157-.29.29-.594.29l.21-2.985 5.432-4.909c.236-.21-.052-.326-.368-.116l-6.713 4.225-2.894-.906c-.63-.2-.643-.63.13-.93l11.312-4.36c.525-.2 1 .124.848.887z"/>
                    </svg>
                  </a>
                )}
              </div>
            )}
          </div>

          <div className="footer-links-grid">
            <div className="footer-link-group">
              <h5 className="footer-link-title">Platform</h5>
              <div className="footer-links-list">
                <Link to="/" className="footer-link">Home Page</Link>
                <a href="/#features" className="footer-link">Features</a>
                <a href="/#calculator" className="footer-link">Calculator</a>
                <a href="/#proofs" className="footer-link">Payments Proof</a>
              </div>
            </div>
            <div className="footer-link-group">
              <h5 className="footer-link-title">Access</h5>
              <div className="footer-links-list">
                <Link to="/support" className="footer-link">Support Hub</Link>
                <Link to="/login" className="footer-link">Sign In</Link>
                <a href="https://support.google.com/admanager" target="_blank" rel="noreferrer" className="footer-link">Google Ad Manager Help</a>
              </div>
            </div>
            {settings.pages && settings.pages.some(p => p.show_in_public_footer) && (
              <div className="footer-link-group">
                <h5 className="footer-link-title">Information</h5>
                <div className="footer-links-list">
                  {settings.pages.filter(p => p.show_in_public_footer).map(p => (
                    <Link
                      key={p.slug}
                      to={`/page/${p.slug}`}
                      className="footer-link"
                      style={p.slug === slug ? { color: 'var(--color-primary-light)', fontWeight: 600 } : {}}
                    >
                      {p.title}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="footer-bottom">
          <div>© {new Date().getFullYear()} {settings.site_name || 'BestRevenue'}. All rights reserved.</div>
          <div>Empowering publishers through transparent ad metrics.</div>
        </div>
      </footer>
    </div>
  )
}
