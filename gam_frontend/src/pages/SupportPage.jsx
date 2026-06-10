import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useSettings } from '../contexts/SettingsContext'
import { publicApi } from '../api/endpoints'
import toast from 'react-hot-toast'
import './SupportPage.css'

export default function SupportPage() {
  const { user } = useAuth()
  const { settings } = useSettings()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  // Form State
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleDashboardRedirect = () => {
    if (user.role === 'admin') navigate('/admin')
    else navigate('/publisher')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name || !email || !subject || !message) {
      toast.error('Please fill in all fields.')
      return
    }

    setSubmitting(true)
    try {
      const res = await publicApi.submitContact({ name, email, subject, message })
      toast.success(res.data?.message || 'Message sent successfully!')
      setSubmitted(true)
      setName('')
      setEmail('')
      setSubject('')
      setMessage('')
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to send message. Please try again.'
      toast.error(errMsg)
    } finally {
      setSubmitting(false)
    }
  }

  // Fallbacks for support info
  const supportEmail = settings.support_email || 'support@bestrevenue.local'
  const supportTelegram = settings.support_telegram || 'https://t.me/bestrevenue_support'
  const supportWhatsapp = settings.support_whatsapp || 'https://wa.me/1234567890'

  return (
    <div className="support-wrapper">
      <div className="support-glow"></div>

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
            <Link to="/" className="landing-nav-link">Home</Link>
            <a href="/#features" className="landing-nav-link">Features</a>
            <a href="/#calculator" className="landing-nav-link">Earnings Calculator</a>
            <a href="/#proofs" className="landing-nav-link">Payments Proof</a>
            <Link to="/support" className="landing-nav-link active" style={{ color: 'var(--color-primary-light)' }}>Support</Link>
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

      {/* Hero Section */}
      <section className="support-hero">
        <h1 className="support-hero-title">Support Hub</h1>
        <p className="support-hero-desc">
          Have a question about Google Ad Manager setup, payment channels, or custom layouts? Send us a message or connect directly via Telegram or WhatsApp.
        </p>
      </section>

      {/* Support Layout Grid */}
      <section className="support-grid">
        {/* Contact Info Column */}
        <div className="support-info-col">
          <div className="support-info-card">
            <h3 className="support-card-title">💬 Live Channels</h3>
            
            <div className="support-channel-list">
              {/* Telegram */}
              <a href={supportTelegram} target="_blank" rel="noreferrer" className="support-channel-item">
                <div className="support-channel-icon">✈️</div>
                <div className="support-channel-details">
                  <span className="support-channel-label">Telegram Channel</span>
                  <span className="support-channel-value">@BestRevenueSupport</span>
                  <span className="support-channel-link">Open Telegram ↗</span>
                </div>
              </a>

              {/* WhatsApp */}
              <a href={supportWhatsapp} target="_blank" rel="noreferrer" className="support-channel-item whatsapp">
                <div className="support-channel-icon">📞</div>
                <div className="support-channel-details">
                  <span className="support-channel-label">WhatsApp Support</span>
                  <span className="support-channel-value">Direct Chat Integration</span>
                  <span className="support-channel-link">Start Chatting ↗</span>
                </div>
              </a>

              {/* Email */}
              <a href={`mailto:${supportEmail}`} className="support-channel-item">
                <div className="support-channel-icon">📧</div>
                <div className="support-channel-details">
                  <span className="support-channel-label">Official Email</span>
                  <span className="support-channel-value">{supportEmail}</span>
                  <span className="support-channel-link">Send Mail ↗</span>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Contact Form Column */}
        <div className="support-form-col">
          <div className="support-form-card">
            <h3 className="support-card-title">✉️ Send Message</h3>
            
            {submitted ? (
              <div className="alert alert-success" style={{ margin: '16px 0', padding: 24, borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>✅</div>
                <h4 style={{ fontWeight: 700, marginBottom: 8 }}>Thank You!</h4>
                <p style={{ fontSize: 13, color: '#047857', lineHeight: 1.5 }}>
                  Your message has been sent successfully. Our support desk will reach out to you at the email provided shortly.
                </p>
                <button onClick={() => setSubmitted(false)} className="btn btn-secondary btn-sm" style={{ marginTop: 20 }}>
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <p className="support-form-desc">
                  Fill in the details below to open a ticket. Your request will be routed directly to our administration team.
                </p>
                
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Subject</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ad unit generation, Payments delay, etc."
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Message Details</label>
                  <textarea
                    rows={5}
                    className="form-textarea"
                    placeholder="Describe your issue or question in details..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center', marginTop: 12 }}
                  disabled={submitting}
                >
                  {submitting ? (
                    <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></div> Dispatching message…</>
                  ) : '✉️ Submit Ticket'}
                </button>
              </form>
            )}
          </div>
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
              A premium, automated optimization suite for publishers using Google Ad Manager. Harness advanced tag generation, robust syncing, and instant payouts.
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
              <h5 className="footer-link-title">Help Desk</h5>
              <div className="footer-links-list">
                <Link to="/support" className="footer-link">Support Hub</Link>
                <Link to="/login" className="footer-link">Sign In</Link>
                <a href="https://support.google.com/admanager" target="_blank" rel="noreferrer" className="footer-link">Google Ad Manager Help</a>
              </div>
            </div>
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
