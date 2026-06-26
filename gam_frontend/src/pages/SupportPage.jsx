import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useSettings } from '../contexts/SettingsContext'
import { publicApi } from '../api/endpoints'
import toast from 'react-hot-toast'
import { useI18n } from '../contexts/I18nContext'
import LanguageSwitcher from '../components/LanguageSwitcher'
import { 
  TrendingUp, Lock, LayoutDashboard, ArrowRight, X, Menu, Phone, Mail, 
  MessageSquare, Send, CheckCircle2, Globe
} from 'lucide-react'
import './LandingPage.css'
import './SupportPage.css'

export default function SupportPage() {
  const { user } = useAuth()
  const { settings } = useSettings()
  const { locale, t } = useI18n()
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
      toast.error(t('support.toast.fill_all_fields', 'Please fill in all fields.'))
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
  const supportEmail = settings.support_email || 'support@mindorax.local'
  const supportTelegram = settings.support_telegram || 'https://t.me/mindorax_support'
  const supportWhatsapp = settings.support_whatsapp || 'https://wa.me/1234567890'

  return (
    <div className="support-wrapper">
      {/* ── Aurora Background Layer ── */}
      <div className="aurora-layer" aria-hidden="true">
        {/* Large drifting color orbs */}
        <div className="landing-glow-1"></div>
        <div className="landing-glow-2"></div>
        <div className="landing-glow-3"></div>
        <div className="landing-glow-4"></div>
        <div className="landing-glow-5"></div>

        {/* Small floating particle dots */}
        <span className="aurora-particle" style={{ top:'18%',  left:'12%',  width:5,  height:5,  background:'#00f2fe', animationDelay:'0s',   animationDuration:'6s'  }}></span>
        <span className="aurora-particle" style={{ top:'42%',  left:'28%',  width:3,  height:3,  background:'#8b5cf6', animationDelay:'1.4s', animationDuration:'8s'  }}></span>
        <span className="aurora-particle" style={{ top:'72%',  left:'18%',  width:4,  height:4,  background:'#10b981', animationDelay:'2.8s', animationDuration:'7s'  }}></span>
        <span className="aurora-particle" style={{ top:'25%',  left:'58%',  width:3,  height:3,  background:'#f59e0b', animationDelay:'0.7s', animationDuration:'9s'  }}></span>
        <span className="aurora-particle" style={{ top:'60%',  left:'70%',  width:5,  height:5,  background:'#00f2fe', animationDelay:'3.5s', animationDuration:'5.5s'}}></span>
        <span className="aurora-particle" style={{ top:'85%',  left:'50%',  width:3,  height:3,  background:'#8b5cf6', animationDelay:'1.9s', animationDuration:'10s' }}></span>
        <span className="aurora-particle" style={{ top:'10%',  left:'80%',  width:4,  height:4,  background:'#f43f5e', animationDelay:'4.2s', animationDuration:'7.5s'}}></span>
        <span className="aurora-particle" style={{ top:'50%',  left:'88%',  width:3,  height:3,  background:'#10b981', animationDelay:'2.1s', animationDuration:'11s' }}></span>
        <span className="aurora-particle" style={{ top:'35%',  left:'45%',  width:6,  height:6,  background:'#00f2fe', animationDelay:'5.0s', animationDuration:'8.5s'}}></span>
      </div>

      {/* Header */}
      <header className={`landing-header ${menuOpen ? 'menu-open' : ''}`}>
        <div className="landing-nav-container">
          <Link to="/" className="landing-logo">
            {settings.site_logo ? (
              <img src={settings.site_logo} alt={settings.site_name || 'Mindora X'} />
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={18} style={{ color: 'var(--br-primary)' }} />
                <span>{settings.site_name || 'Mindora X'}</span>
              </span>
            )}
          </Link>

          <nav className="landing-nav-links">
            <Link to="/" className="landing-nav-link" onClick={() => setMenuOpen(false)}>{t('common.home_page', 'Home')}</Link>
            <a href="/#features" className="landing-nav-link" onClick={() => setMenuOpen(false)}>{t('landing.nav.features', 'Features')}</a>
            <a href="/#calculator" className="landing-nav-link" onClick={() => setMenuOpen(false)}>{t('landing.nav.calculator', 'Calculator')}</a>
            <a href="/#proofs" className="landing-nav-link" onClick={() => setMenuOpen(false)}>{t('landing.nav.payouts_proof', 'Payouts Proof')}</a>
            <Link to="/support" className="landing-nav-link active" onClick={() => setMenuOpen(false)}>{t('landing.nav.support', 'Support Hub')}</Link>
            {settings.pages && settings.pages.filter(p => p.show_in_landing_menu).map(p => (
              <Link key={p.slug} to={`/page/${p.slug}`} className="landing-nav-link" onClick={() => setMenuOpen(false)}>
                {(locale === 'ar' && p.title_ar) ? p.title_ar : p.title}
              </Link>
            ))}
            
            {/* Mobile CTAs placed at the end of the dropdown menu list */}
            <div className="mobile-menu-ctas">
              {user ? (
                <button onClick={() => { setMenuOpen(false); handleDashboardRedirect(); }} className="btn btn-primary btn-md" style={{ width: '100%', justifyContent: 'center' }}>
                  <LayoutDashboard size={14} /> {t('common.dashboard', 'Dashboard')}
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
                  {settings.registration_status !== 'closed' ? (
                    <Link to="/register" className="btn btn-primary btn-md" onClick={() => setMenuOpen(false)} style={{ justifyContent: 'center' }}>
                      {t('common.get_started', 'Get Started')} <ArrowRight size={14} />
                    </Link>
                  ) : (
                    <span className="badge badge-neutral" style={{ justifyContent: 'center', padding: '10px' }}>{t('common.registration_closed', 'Registration Closed')}</span>
                  )}
                  <Link to="/login" className="btn btn-secondary btn-md" onClick={() => setMenuOpen(false)} style={{ justifyContent: 'center' }}>
                    <Lock size={14} /> {t('common.sign_in', 'Sign In')}
                  </Link>
                </div>
              )}
              <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'center' }}>
                <LanguageSwitcher />
              </div>
            </div>
          </nav>

          <div className="landing-nav-ctas">
            <LanguageSwitcher style={{ marginInlineEnd: '12px' }} />
            {user ? (
              <button onClick={handleDashboardRedirect} className="btn btn-primary btn-sm">
                <LayoutDashboard size={14} /> {t('common.dashboard', 'Dashboard')}
              </button>
            ) : (
              <>
                <Link to="/login" className="btn btn-secondary btn-sm">
                  <Lock size={12} /> {t('common.sign_in', 'Sign In')}
                </Link>
                {settings.registration_status !== 'closed' ? (
                  <Link to="/register" className="btn btn-primary btn-sm">
                    {t('common.get_started', 'Get Started')} <ArrowRight size={12} />
                  </Link>
                ) : (
                  <span className="badge badge-neutral">{t('common.registration_closed', 'Registration Closed')}</span>
                )}
              </>
            )}
          </div>

          <button className="mobile-nav-toggle" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="support-hero">
        <h1 className="support-hero-title">{t('landing.nav.support', 'Support Hub')}</h1>
        <p className="support-hero-desc">
          {t('support.hero_desc', 'Have a question about Google Ad Manager setup, payment channels, or custom layouts? Send us a message or connect directly via Telegram or WhatsApp.')}
        </p>
      </section>

      {/* Support Layout Grid */}
      <section className="support-grid">
        {/* Contact Info Column */}
        <div className="support-info-col">
          <div className="support-info-card">
            <h3 className="support-card-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <MessageSquare size={20} style={{ color: 'var(--br-primary)' }} /> {t('support.live_channels', 'Live Channels')}
            </h3>
            
            <div className="support-channel-list">
              {/* Telegram */}
              <a href={supportTelegram} target="_blank" rel="noreferrer" className="support-channel-item">
                <div className="support-channel-icon">
                  <Send size={20} />
                </div>
                <div className="support-channel-details">
                  <span className="support-channel-label">{t('support.telegram_channel', 'Telegram Channel')}</span>
                  <span className="support-channel-value">@MindoraXSupport</span>
                  <span className="support-channel-link">{t('support.open_telegram', 'Open Telegram ↗')}</span>
                </div>
              </a>

              {/* WhatsApp */}
              <a href={supportWhatsapp} target="_blank" rel="noreferrer" className="support-channel-item whatsapp">
                <div className="support-channel-icon">
                  <Phone size={20} />
                </div>
                <div className="support-channel-details">
                  <span className="support-channel-label">{t('support.whatsapp_support', 'WhatsApp Support')}</span>
                  <span className="support-channel-value">{t('support.whatsapp_value', 'Direct Chat Integration')}</span>
                  <span className="support-channel-link">{t('support.start_chatting', 'Start Chatting ↗')}</span>
                </div>
              </a>

              {/* Email */}
              <a href={`mailto:${supportEmail}`} className="support-channel-item">
                <div className="support-channel-icon">
                  <Mail size={20} />
                </div>
                <div className="support-channel-details">
                  <span className="support-channel-label">{t('support.official_email', 'Official Email')}</span>
                  <span className="support-channel-value">{supportEmail}</span>
                  <span className="support-channel-link">{t('support.send_mail', 'Send Mail ↗')}</span>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Contact Form Column */}
        <div className="support-form-col">
          <div className="support-form-card">
            <h3 className="support-card-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Mail size={20} style={{ color: 'var(--br-primary)' }} /> {t('support.send_message', 'Send Message')}
            </h3>
            
            {submitted ? (
              <div className="alert alert-success" style={{ margin: '16px 0', padding: 24, borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                <CheckCircle2 size={32} style={{ color: 'var(--br-accent)', display: 'block', margin: '0 auto 12px' }} />
                <h4 style={{ fontWeight: 700, marginBottom: 8 }}>{t('support.thank_you', 'Thank You!')}</h4>
                <p style={{ fontSize: 13, color: '#047857', lineHeight: 1.5 }}>
                  {t('support.success_desc', 'Your message has been sent successfully. Our support desk will reach out to you at the email provided shortly.')}
                </p>
                <button onClick={() => setSubmitted(false)} className="btn btn-secondary btn-sm" style={{ marginTop: 20 }}>
                  {t('support.send_another', 'Send Another Message')}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <p className="support-form-desc">
                  {t('support.form_desc', 'Fill in the details below to open a ticket. Your request will be routed directly to our administration team.')}
                </p>
                
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">{t('support.full_name', 'Full Name')}</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder={t('support.name_placeholder', 'Enter your name')}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">{t('auth.email', 'Email Address')}</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder={t('auth.email_placeholder', 'you@example.com')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">{t('support.subject', 'Subject')}</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder={t('support.subject_placeholder', 'Ad unit generation, Payments delay, etc.')}
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">{t('support.message_details', 'Message Details')}</label>
                  <textarea
                    rows={5}
                    className="form-textarea"
                    placeholder={t('support.message_placeholder', 'Describe your issue or question in details...')}
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
                    <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></div> {t('support.dispatching', 'Dispatching message…')}</>
                  ) : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><Mail size={16} /> {t('support.submit_ticket', 'Submit Ticket')}</span>}
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
            <Link to="/" className="footer-logo">
              {settings.site_logo ? (
                <img src={settings.site_logo} alt={settings.site_name || 'Mindora X'} style={{ maxHeight: 50 }} />
              ) : (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <TrendingUp size={20} style={{ color: 'var(--br-primary)' }} />
                  <span>{settings.site_name || 'Mindora X'}</span>
                </span>
              )}
            </Link>
            <p className="footer-desc">
              {t('landing.footer.desc', 'A premium, ad optimization suite for publishers using Google Ad Manager. Harness advanced tag generation, robust syncing, and instant payouts.')}
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
                        <linearGradient id="instagram-grad-support" x1="0%" y1="100%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#f09433" />
                          <stop offset="25%" stopColor="#e6683c" />
                          <stop offset="50%" stopColor="#dc2743" />
                          <stop offset="75%" stopColor="#cc2366" />
                          <stop offset="100%" stopColor="#bc1888" />
                        </linearGradient>
                      </defs>
                      <path fill="url(#instagram-grad-support)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
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
              <h5 className="footer-link-title">{t('landing.footer.platform', 'Platform')}</h5>
              <div className="footer-links-list">
                <Link to="/" className="footer-link">{t('common.home_page', 'Home Page')}</Link>
                <a href="/#features" className="footer-link">{t('landing.nav.features', 'Features')}</a>
                <a href="/#calculator" className="footer-link">{t('landing.nav.calculator', 'Calculator')}</a>
                <a href="/#proofs" className="footer-link">{t('landing.nav.payouts_proof', 'Payments Proof')}</a>
              </div>
            </div>
            <div className="footer-link-group">
              <h5 className="footer-link-title">{t('landing.footer.access', 'Access')}</h5>
              <div className="footer-links-list">
                <Link to="/support" className="footer-link">{t('landing.nav.support', 'Support Hub')}</Link>
                <Link to="/login" className="footer-link">{t('common.sign_in', 'Sign In')}</Link>
                <a href="https://support.google.com/admanager" target="_blank" rel="noreferrer" className="footer-link">{t('common.gam_help', 'Google Ad Manager Help')}</a>
              </div>
            </div>
            {settings.pages && settings.pages.some(p => p.show_in_public_footer) && (
              <div className="footer-link-group">
                <h5 className="footer-link-title">{t('landing.footer.info', 'Information')}</h5>
                <div className="footer-links-list">
                  {settings.pages.filter(p => p.show_in_public_footer).map(p => (
                    <Link key={p.slug} to={`/page/${p.slug}`} className="footer-link">
                      {(locale === 'ar' && p.title_ar) ? p.title_ar : p.title}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="footer-bottom">
          <div>{t('common.all_rights_reserved', '© {year} {site_name}. All rights reserved.', { year: new Date().getFullYear(), site_name: settings.site_name || 'Mindora X' })}</div>
          <div>{t('landing.footer.subtext', 'Empowering publishers through transparent ad metrics.')}</div>
        </div>
      </footer>
    </div>
  )
}
