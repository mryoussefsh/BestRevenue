import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useSettings } from '../contexts/SettingsContext'
import { publicApi } from '../api/endpoints'
import toast from 'react-hot-toast'
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
      })
      .catch(() => {
        toast.error('Page not found')
        navigate('/')
      })
  }, [slug, navigate])

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
              <span>💹 {settings.site_name || 'BestRevenue'}</span>
            )}
          </Link>

          <nav className="landing-nav-links">
            <Link to="/" className="landing-nav-link" onClick={() => setMenuOpen(false)}>Home</Link>
            <a href="/#features" className="landing-nav-link" onClick={() => setMenuOpen(false)}>Features</a>
            <a href="/#calculator" className="landing-nav-link" onClick={() => setMenuOpen(false)}>Earnings Calculator</a>
            <a href="/#proofs" className="landing-nav-link" onClick={() => setMenuOpen(false)}>Payments Proof</a>
            <Link to="/support" className="landing-nav-link" onClick={() => setMenuOpen(false)}>Support</Link>
            {settings.pages && settings.pages.filter(p => p.show_in_landing_menu).map(p => (
              <Link
                key={p.slug}
                to={`/page/${p.slug}`}
                className={`landing-nav-link ${p.slug === slug ? 'active' : ''}`}
                onClick={() => setMenuOpen(false)}
                style={p.slug === slug ? { color: 'var(--color-primary-light)' } : {}}
              >
                {p.title}
              </Link>
            ))}
          </nav>

          <div className="landing-nav-ctas">
            {user ? (
              <button onClick={handleDashboardRedirect} className="btn btn-primary">
                💻 Go to Dashboard
              </button>
            ) : (
              <>
                <Link to="/login" className="btn btn-secondary btn-sm">🔑 Sign In</Link>
                {settings.registration_status !== 'closed' ? (
                  <Link to="/register" className="btn btn-primary btn-sm">🚀 Get Started</Link>
                ) : (
                  <span className="badge badge-inactive">Registration Closed</span>
                )}
              </>
            )}
          </div>

          <button className="mobile-nav-toggle" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? '✕' : '☰'}
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
            <Link to="/" className="landing-logo" style={{ fontSize: 24 }}>
              {settings.site_logo ? (
                <img src={settings.site_logo} alt={settings.site_name || 'BestRevenue'} style={{ maxHeight: 50 }} />
              ) : (
                <span>💹 {settings.site_name || 'BestRevenue'}</span>
              )}
            </Link>
            <p className="footer-desc">
              A premium, automated ad optimization suite for publishers using Google Ad Manager. Harness advanced tag generation, robust syncing, and instant payouts.
            </p>
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
