import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useSettings } from '../contexts/SettingsContext'
import { 
  TrendingUp, Plus, Filter, Check, Ban, Download, DollarSign, Users, 
  CreditCard, Eye, Info, CheckCircle2, AlertTriangle, XCircle, Bell, 
  LayoutDashboard, Globe, Settings, User, LayoutGrid, Sparkles, Lock,
  ArrowRight, RefreshCw, LineChart, Shield, ShieldAlert, MessageSquare,
  ChevronDown, X, Menu, Calendar, HelpCircle
} from 'lucide-react'
import './LandingPage.css'

export default function LandingPage() {
  const { user } = useAuth()
  const { settings } = useSettings()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  
  // Calculator state
  const [pageviews, setPageviews] = useState(100000)
  const [cpm, setCpm] = useState(1.50)
  const [adUnitsPerPage, setAdUnitsPerPage] = useState(3)
  const shareRatio = 0.80 // 80% Publisher revenue share

  // FAQ accordion state
  const [activeFaq, setActiveFaq] = useState(null)

  // Payment proof modal state
  const [selectedProof, setSelectedProof] = useState(null)

  const paymentProofs = [
    {
      id: "PAY-2026-9041",
      date: "2026-06-05",
      publisher: "AlphaMedia Group (US)",
      method: "Wire Transfer",
      amount: 14850.00,
      ref: "WT-FED-8492048",
      status: "Completed"
    },
    {
      id: "PAY-2026-9039",
      date: "2026-06-03",
      publisher: "Cairo Tech Blog (EG)",
      method: "USDT (ERC-20)",
      amount: 4120.50,
      ref: "0x8fa92...e1a49f",
      status: "Completed"
    },
    {
      id: "PAY-2026-9036",
      date: "2026-06-02",
      publisher: "ByteDev Solutions (UK)",
      method: "PayPal",
      amount: 890.00,
      ref: "PP-REF-6582910",
      status: "Completed"
    },
    {
      id: "PAY-2026-9032",
      date: "2026-05-30",
      publisher: "Riyadh News Hub (SA)",
      method: "Wire Transfer",
      amount: 22400.00,
      ref: "WT-SIB-9283741",
      status: "Completed"
    },
    {
      id: "PAY-2026-9028",
      date: "2026-05-28",
      publisher: "Munich Auto Forum (DE)",
      method: "USDC (TRC-20)",
      amount: 6780.00,
      ref: "TKh82fs...9d2ka",
      status: "Completed"
    }
  ]

  const faqs = [
    {
      q: "Do I need my own Google Ad Manager (GAM) account to join?",
      a: "No, you do not need a personal GAM account. We manage the ad exchange bidding and setup. If you do have a GAM account, our platform can synchronize and deliver customized tags directly to your inventory."
    },
    {
      q: "What is the revenue-sharing ratio on BestRevenue?",
      a: "Our standard revenue share is 80% to the publisher. For high-volume publishers, custom revenue-sharing ratios can be configured directly by administrators in the platform settings."
    },
    {
      q: "When and how do I receive my earnings payouts?",
      a: "Payouts are calculated at the end of each monthly period closing. Approved balances are paid out via your configured payment method (Wire Transfer, Crypto, PayPal) once they meet your payment method's minimum threshold."
    },
    {
      q: "How do I implement ads.txt on my websites?",
      a: "Once your domain is approved, you can view and copy the ads.txt entries directly from your 'My Websites' dashboard. Simply copy these lines and host them at yourdomain.com/ads.txt."
    },
    {
      q: "What ad formats and placements are supported?",
      a: "We support standard Banners, Interstitials, Reward ads, top/bottom Anchors, and highly customizable Floating ad formats with advanced display triggers and anti-tamper security configurations."
    }
  ]

  // Calculate earnings
  const dailyImpressions = pageviews * adUnitsPerPage
  const dailyGross = (dailyImpressions / 1000) * cpm
  const dailyEarnings = dailyGross * shareRatio
  const monthlyEarnings = dailyEarnings * 30
  const yearlyEarnings = dailyEarnings * 365

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(val)
  }

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(0) + 'k'
    }
    return num
  }

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index)
  }

  const handleDashboardRedirect = () => {
    if (user.role === 'admin') navigate('/admin')
    else navigate('/publisher')
  }

  return (
    <div className="landing-wrapper">
      <div className="landing-glow-1"></div>
      <div className="landing-glow-2"></div>

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
            <a href="#features" className="landing-nav-link" onClick={() => setMenuOpen(false)}>Features</a>
            <a href="#calculator" className="landing-nav-link" onClick={() => setMenuOpen(false)}>Calculator</a>
            <a href="#how-it-works" className="landing-nav-link" onClick={() => setMenuOpen(false)}>How It Works</a>
            <a href="#proofs" className="landing-nav-link" onClick={() => setMenuOpen(false)}>Payouts Proof</a>
            <a href="#faqs" className="landing-nav-link" onClick={() => setMenuOpen(false)}>FAQs</a>
            <Link to="/support" className="landing-nav-link" onClick={() => setMenuOpen(false)}>Support</Link>
            {settings.pages && settings.pages.filter(p => p.show_in_landing_menu).map(p => (
              <Link key={p.slug} to={`/page/${p.slug}`} className="landing-nav-link" onClick={() => setMenuOpen(false)}>{p.title}</Link>
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

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-badge">
          <Sparkles size={13} style={{ color: 'var(--br-accent)' }} /> Automated Google Ad Manager Optimization
        </div>
        <h1 className="hero-title">
          Scale Your Publisher Earnings <br />
          With <span className="hero-gradient-text">{settings.site_name || 'BestRevenue'}</span>
        </h1>
        <p className="hero-description">
          A premium, high-performance platform for smart publishers. Seamlessly synchronize with Google Ad Manager, generate secure GPT codes, track real-time analytics, and secure payouts.
        </p>

        <div className="hero-ctas">
          {user ? (
            <button onClick={handleDashboardRedirect} className="btn btn-primary btn-lg">
              <LayoutDashboard size={16} /> Access Dashboard
            </button>
          ) : (
            <>
              {settings.registration_status !== 'closed' ? (
                <Link to="/register" className="btn btn-primary btn-lg">
                  Create Free Account <ArrowRight size={16} />
                </Link>
              ) : (
                <button className="btn btn-secondary btn-lg" disabled>
                  <Lock size={16} /> Registration Closed
                </button>
              )}
              <Link to="/login" className="btn btn-secondary btn-lg">
                Sign In
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Platform Performance Stats Banner */}
      <section className="landing-section" style={{ paddingTop: 0, paddingBottom: 40 }}>
        <div className="stats-banner">
          <div>
            <div className="banner-stat-icon" style={{ background: 'rgba(99, 102, 241, 0.12)', color: '#6366f1' }}>
              <Eye size={20} />
            </div>
            <div className="banner-stat-value">
              {settings.stats_impressions !== undefined ? formatNumber(settings.stats_impressions) : '5.4B+'}
            </div>
            <div className="banner-stat-label">Ad Impressions Served</div>
          </div>
          <div>
            <div className="banner-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
              <DollarSign size={20} />
            </div>
            <div className="banner-stat-value">
              {settings.stats_total_paid !== undefined ? formatCurrency(settings.stats_total_paid) : '$12.4M+'}
            </div>
            <div className="banner-stat-label">Total Paid to Publishers</div>
          </div>
          <div>
            <div className="banner-stat-icon" style={{ background: 'rgba(6, 182, 212, 0.12)', color: '#06b6d4' }}>
              <Users size={20} />
            </div>
            <div className="banner-stat-value">
              {settings.stats_publishers !== undefined ? settings.stats_publishers : '250+'}
            </div>
            <div className="banner-stat-label">Active Global Publishers</div>
          </div>
          <div>
            <div className="banner-stat-icon" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
              <Globe size={20} />
            </div>
            <div className="banner-stat-value">
              {settings.stats_websites !== undefined ? settings.stats_websites : '180+'}
            </div>
            <div className="banner-stat-label">Approved Domains</div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="landing-section">
        <div className="section-header">
          <span className="section-tag">Features</span>
          <h2 className="section-title">Built For Professional Publishers</h2>
          <p className="section-subtitle">
            Our platform offers industry-leading tools and seamless configurations so you can focus entirely on producing high-quality content.
          </p>
        </div>

        <div className="features-grid">
          <div className="feature-card primary">
            <div className="feature-icon-wrapper">
              <RefreshCw size={20} />
            </div>
            <h3 className="feature-card-title">GAM Auto-Sync</h3>
            <p className="feature-card-desc">
              Connect Google Ad Manager directly. Automatically fetch billing data, impressions, clicks, gross revenues, and views hourly.
            </p>
          </div>

          <div className="feature-card accent">
            <div className="feature-icon-wrapper">
              <LineChart size={20} />
            </div>
            <h3 className="feature-card-title">Granular Performance Reports</h3>
            <p className="feature-card-desc">
              Track daily metrics like CPM, CTR, and unfilled impressions. Dive deep into analytics filterable by website and specific ad units.
            </p>
          </div>

          <div className="feature-card info">
            <div className="feature-icon-wrapper">
              <Shield size={20} />
            </div>
            <h3 className="feature-card-title">Anti-Tamper Tag Generator</h3>
            <p className="feature-card-desc">
              Instantly generate clean GPT header and body codes. Customize refresh rates, anchor/float triggers, and anti-adblock tools.
            </p>
          </div>

          <div className="feature-card primary">
            <div className="feature-icon-wrapper">
              <CreditCard size={20} />
            </div>
            <h3 className="feature-card-title">Automated Period Closings</h3>
            <p className="feature-card-desc">
              Never worry about payment schedules. Verified earnings are locked at month-end, generating statements and clear billing PDFs.
            </p>
          </div>

          <div className="feature-card accent">
            <div className="feature-icon-wrapper">
              <ShieldAlert size={20} />
            </div>
            <h3 className="feature-card-title">Fraud & IVT Protection</h3>
            <p className="feature-card-desc">
              Comprehensive balance adjustments support deducting Invalid Traffic (IVT) or applying bonuses fairly with details logged in your portal.
            </p>
          </div>

          <div className="feature-card info">
            <div className="feature-icon-wrapper">
              <Bell size={20} />
            </div>
            <h3 className="feature-card-title">Real-Time Notifications</h3>
            <p className="feature-card-desc">
              Receive updates on payouts, policy updates, and critical maintenance notices instantly via integrated announcements and emails.
            </p>
          </div>
        </div>
      </section>

      {/* Revenue Estimator Calculator */}
      <section id="calculator" className="landing-section">
        <div className="section-header">
          <span className="section-tag">Estimator</span>
          <h2 className="section-title">Calculate Your Revenue Potential</h2>
          <p className="section-subtitle">
            Slide the parameters to estimate how much revenue you can generate with our 80% baseline revenue share structure.
          </p>
        </div>

        <div className="calc-container">
          <div className="calc-inputs">
            <div className="calc-slider-group">
              <div className="calc-slider-header">
                <span className="calc-label">Daily Pageviews</span>
                <span className="calc-slider-val">{formatNumber(pageviews)}</span>
              </div>
              <input
                type="range"
                min="10000"
                max="5000000"
                step="10000"
                value={pageviews}
                onChange={(e) => setPageviews(Number(e.target.value))}
                className="calc-range-slider"
              />
              <div className="calc-slider-labels">
                <span>10k</span>
                <span>1M</span>
                <span>2M</span>
                <span>3M</span>
                <span>4M</span>
                <span>5M</span>
              </div>
            </div>

            <div className="calc-slider-group">
              <div className="calc-slider-header">
                <span className="calc-label">Average Monetized CPM</span>
                <span className="calc-slider-val accent">${cpm.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.20"
                max="10.00"
                step="0.10"
                value={cpm}
                onChange={(e) => setCpm(Number(e.target.value))}
                className="calc-range-slider accent"
              />
              <div className="calc-slider-labels">
                <span>$0.20</span>
                <span>$2.50</span>
                <span>$5.00</span>
                <span>$7.50</span>
                <span>$10.00</span>
              </div>
            </div>

            <div className="calc-slider-group">
              <div className="calc-slider-header">
                <span className="calc-label">Ads Per Page</span>
                <span className="calc-slider-val">{adUnitsPerPage}</span>
              </div>
              <input
                type="range"
                min="1"
                max="6"
                step="1"
                value={adUnitsPerPage}
                onChange={(e) => setAdUnitsPerPage(Number(e.target.value))}
                className="calc-range-slider"
              />
              <div className="calc-slider-labels">
                <span>1</span>
                <span>2</span>
                <span>3</span>
                <span>4</span>
                <span>5</span>
                <span>6</span>
              </div>
            </div>
          </div>

          <div className="calc-results">
            <div className="calc-results-title">Estimated Monthly Earnings</div>
            <div className="calc-big-revenue">{formatCurrency(monthlyEarnings)}</div>
            
            <div className="calc-breakdown">
              <div className="calc-breakdown-row">
                <span className="label">Daily Earnings</span>
                <span className="value">{formatCurrency(dailyEarnings)}</span>
              </div>
              <div className="calc-breakdown-row">
                <span className="label">Yearly Earnings</span>
                <span className="value">{formatCurrency(yearlyEarnings)}</span>
              </div>
              <div className="calc-breakdown-row">
                <span className="label">Daily Impressions</span>
                <span className="value">{formatNumber(dailyImpressions)}</span>
              </div>
            </div>

            <div className="calc-note">
              *Estimates are calculated based on an 80% baseline revenue share. Actual CPMs and earnings depend on geographic traffic, niche, and content viewability.
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Pipeline */}
      <section id="how-it-works" className="landing-section">
        <div className="section-header">
          <span className="section-tag">Pipeline</span>
          <h2 className="section-title">Start Monetizing In 4 Steps</h2>
          <p className="section-subtitle">
            Getting set up is incredibly simple. You can transition from registration to fully monetized traffic within a matter of minutes.
          </p>
        </div>

        <div className="steps-pipeline">
          <div className="step-card">
            <div className="step-number">1</div>
            <h4 className="step-title">Join Platform</h4>
            <p className="step-desc">Register a publisher account and submit your domains for approval checks.</p>
          </div>
          <div className="step-card">
            <div className="step-number">2</div>
            <h4 className="step-title">Deploy Ads.txt</h4>
            <p className="step-desc">Copy our structured lines to your domain's ads.txt directory to authenticate the inventory.</p>
          </div>
          <div className="step-card">
            <div className="step-number">3</div>
            <h4 className="step-title">Generate GPT Codes</h4>
            <p className="step-desc">Pick your desired ad placements and inject the secure scripts into your page templates.</p>
          </div>
          <div className="step-card">
            <div className="step-number">4</div>
            <h4 className="step-title">Collect Payouts</h4>
            <p className="step-desc">Monitor performance daily. Receive payments at period close directly to your bank account.</p>
          </div>
        </div>
      </section>

      {/* Payment Proofs Section */}
      <section id="proofs" className="landing-section">
        <div className="section-header">
          <span className="section-tag">Transfers</span>
          <h2 className="section-title">Verified Payout Proofs</h2>
          <p className="section-subtitle">
            Transparency is our core value. View the ledger of our most recent publisher payouts processed during the monthly closing cycles.
          </p>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Publisher</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(settings.recent_payouts || paymentProofs).map((proof, idx) => (
                <tr 
                  key={idx} 
                  onClick={() => setSelectedProof(proof)}
                  className="clickable-payout-row"
                >
                  <td className="td-primary" style={{ fontWeight: 600 }}>
                    {proof.publisher}
                  </td>
                  <td className="td-amount">
                    {formatCurrency(proof.amount)}
                  </td>
                  <td>
                    {proof.date}
                  </td>
                  <td>
                    <span className="badge badge-success">
                      <span className="dot"></span> Paid
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ Accordions */}
      <section id="faqs" className="landing-section">
        <div className="section-header">
          <span className="section-tag">FAQ</span>
          <h2 className="section-title">Frequently Asked Questions</h2>
          <p className="section-subtitle">
            Everything you need to know about setting up, revenue ratios, payouts, and Google Ad Manager sync rules.
          </p>
        </div>

        <div className="faq-list">
          {faqs.map((item, index) => (
            <div key={index} className={`faq-item ${activeFaq === index ? 'active' : ''}`}>
              <button className="faq-question-btn" onClick={() => toggleFaq(index)}>
                <span>{item.q}</span>
                <ChevronDown size={14} className="faq-toggle-icon" />
              </button>
              <div className="faq-answer-panel">
                <p className="faq-answer-text">{item.a}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="landing-section">
        <div className="cta-banner">
          <h2 className="cta-banner-title">Ready to Maximize Your Revenues?</h2>
          <p className="cta-banner-desc">
            Sign up today to configure your websites, generate tags, and watch your monetization metrics climb.
          </p>
          <div className="cta-banner-buttons">
            {user ? (
              <button onClick={handleDashboardRedirect} className="btn btn-primary btn-lg">
                <LayoutDashboard size={16} /> Dashboard
              </button>
            ) : (
              <>
                {settings.registration_status !== 'closed' ? (
                  <Link to="/register" className="btn btn-primary btn-lg">
                    Get Started Now <ArrowRight size={16} />
                  </Link>
                ) : (
                  <button className="btn btn-secondary btn-lg" disabled>
                    <Lock size={16} /> Registration Closed
                  </button>
                )}
                <Link to="/login" className="btn btn-secondary btn-lg">
                  Sign In
                </Link>
              </>
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
                <img src={settings.site_logo} alt={settings.site_name || 'BestRevenue'} style={{ maxHeight: 50 }} />
              ) : (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <TrendingUp size={20} style={{ color: 'var(--br-primary)' }} />
                  <span>{settings.site_name || 'BestRevenue'}</span>
                </span>
              )}
            </Link>
            <p className="footer-desc">
              A premium, ad optimization suite for publishers using Google Ad Manager. Harness advanced tag generation, robust syncing, and instant payouts.
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
                        <linearGradient id="instagram-grad-landing" x1="0%" y1="100%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#f09433" />
                          <stop offset="25%" stopColor="#e6683c" />
                          <stop offset="50%" stopColor="#dc2743" />
                          <stop offset="75%" stopColor="#cc2366" />
                          <stop offset="100%" stopColor="#bc1888" />
                        </linearGradient>
                      </defs>
                      <path fill="url(#instagram-grad-landing)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
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
                <a href="#features" className="footer-link">Features</a>
                <a href="#calculator" className="footer-link">Calculator</a>
                <a href="#how-it-works" className="footer-link">How it Works</a>
                <a href="#proofs" className="footer-link">Payouts Proof</a>
                <a href="#faqs" className="footer-link">FAQs</a>
              </div>
            </div>
            <div className="footer-link-group">
              <h5 className="footer-link-title">Access</h5>
              <div className="footer-links-list">
                <Link to="/support" className="footer-link">Support Hub</Link>
                <Link to="/login" className="footer-link">Sign In</Link>
                {settings.registration_status !== 'closed' && (
                  <Link to="/register" className="footer-link">Register</Link>
                )}
                <a href="https://support.google.com/admanager" target="_blank" rel="noreferrer" className="footer-link">Google Ad Manager Help</a>
              </div>
            </div>
            {settings.pages && settings.pages.some(p => p.show_in_public_footer) && (
              <div className="footer-link-group">
                <h5 className="footer-link-title">Information</h5>
                <div className="footer-links-list">
                  {settings.pages.filter(p => p.show_in_public_footer).map(p => (
                    <Link key={p.slug} to={`/page/${p.slug}`} className="footer-link">{p.title}</Link>
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

      {/* Verification Receipt Modal */}
      {selectedProof && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 460, border: '0.5px solid rgba(16, 185, 129, 0.4)', background: 'var(--br-bg-2)', backdropFilter: 'blur(20px)' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <CheckCircle2 size={18} style={{ color: 'var(--br-accent)' }} /> Payment Receipt
              </h3>
              <button className="modal-close" onClick={() => setSelectedProof(null)}>
                <X size={16} />
              </button>
            </div>
            
            <div style={{ background: 'var(--br-bg-3)', padding: 24, borderRadius: 'var(--br-radius)', border: '0.5px solid var(--br-border)', margin: '8px 0 24px' }}>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                {settings.site_logo ? (
                  <img src={settings.site_logo} alt="Logo" style={{ maxHeight: 36, marginBottom: 8 }} />
                ) : (
                  <TrendingUp size={32} style={{ color: 'var(--br-primary)', marginBottom: 8 }} />
                )}
                <div style={{ fontSize: 11, color: 'var(--br-text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>Transaction Certified</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13.5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--br-border)', paddingBottom: 8 }}>
                  <span style={{ color: 'var(--br-text-2)' }}>Issue Date:</span>
                  <span style={{ color: 'var(--br-text)' }}>{selectedProof.date}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--br-border)', paddingBottom: 8 }}>
                  <span style={{ color: 'var(--br-text-2)' }}>Recipient:</span>
                  <span style={{ color: 'var(--br-text)' }}>{selectedProof.publisher}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--br-border)', paddingBottom: 8 }}>
                  <span style={{ color: 'var(--br-text-2)' }}>Payment Route:</span>
                  <span style={{ color: 'var(--br-text)' }}>{selectedProof.method}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--br-text)' }}>Total Disbursed:</span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--br-accent)' }}>{formatCurrency(selectedProof.amount)}</span>
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--br-text-3)', lineHeight: 1.4 }}>
              This payout was verified via banking network records and signed by {settings.site_name || 'BestRevenue'} Treasury.
            </div>

            <div className="modal-footer" style={{ marginTop: 24 }}>
              <button className="btn btn-secondary" onClick={() => setSelectedProof(null)} style={{ width: '100%', justifyContent: 'center' }}>
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
