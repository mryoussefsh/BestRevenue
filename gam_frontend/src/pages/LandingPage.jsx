import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useSettings } from '../contexts/SettingsContext'
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
              <span>💹 {settings.site_name || 'BestRevenue'}</span>
            )}
          </Link>

          <nav className="landing-nav-links">
            <a href="#features" className="landing-nav-link" onClick={() => setMenuOpen(false)}>Features</a>
            <a href="#calculator" className="landing-nav-link" onClick={() => setMenuOpen(false)}>Earnings Calculator</a>
            <a href="#how-it-works" className="landing-nav-link" onClick={() => setMenuOpen(false)}>How It Works</a>
            <a href="#proofs" className="landing-nav-link" onClick={() => setMenuOpen(false)}>Payments Proof</a>
            <a href="#faqs" className="landing-nav-link" onClick={() => setMenuOpen(false)}>FAQs</a>
            <Link to="/support" className="landing-nav-link">Support</Link>
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
      <section className="hero-section">
        <div className="hero-badge">
          ⚡ Automated Google Ad Manager Optimization
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
              💻 Access Dashboard
            </button>
          ) : (
            <>
              {settings.registration_status !== 'closed' ? (
                <Link to="/register" className="btn btn-primary btn-lg">🚀 Create Free Account</Link>
              ) : (
                <button className="btn btn-secondary btn-lg" disabled>🔒 Registration Closed</button>
              )}
              <Link to="/login" className="btn btn-secondary btn-lg">🔑 Sign In</Link>
            </>
          )}
        </div>
      </section>

      {/* Platform Performance Stats Banner */}
      <section className="landing-section" style={{ paddingTop: 0, paddingBottom: 40 }}>
        <div className="stats-banner">
          <div>
            <div className="banner-stat-value">
              {settings.stats_impressions !== undefined ? formatNumber(settings.stats_impressions) : '5.4B+'}
            </div>
            <div className="banner-stat-label">Ad Impressions Served</div>
          </div>
          <div>
            <div className="banner-stat-value">
              {settings.stats_total_paid !== undefined ? formatCurrency(settings.stats_total_paid) : '$12.4M+'}
            </div>
            <div className="banner-stat-label">Total Paid to Publishers</div>
          </div>
          <div>
            <div className="banner-stat-value">
              {settings.stats_publishers !== undefined ? settings.stats_publishers : '250+'}
            </div>
            <div className="banner-stat-label">Active Global Publishers</div>
          </div>
          <div>
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
            <div className="feature-icon-wrapper">🔄</div>
            <h3 className="feature-card-title">GAM Auto-Sync</h3>
            <p className="feature-card-desc">
              Connect Google Ad Manager directly. Automatically fetch billing data, impressions, clicks, gross revenues, and views hourly.
            </p>
          </div>

          <div className="feature-card accent">
            <div className="feature-icon-wrapper">📈</div>
            <h3 className="feature-card-title">Granular Performance Reports</h3>
            <p className="feature-card-desc">
              Track daily metrics like CPM, CTR, and unfilled impressions. Dive deep into analytics filterable by website and specific ad units.
            </p>
          </div>

          <div className="feature-card info">
            <div className="feature-icon-wrapper">🛡️</div>
            <h3 className="feature-card-title">Anti-Tamper Tag Generator</h3>
            <p className="feature-card-desc">
              Instantly generate clean GPT header and body codes. Customize refresh rates, anchor/float triggers, and anti-adblock tools.
            </p>
          </div>

          <div className="feature-card primary">
            <div className="feature-icon-wrapper">💳</div>
            <h3 className="feature-card-title">Automated Period Closings</h3>
            <p className="feature-card-desc">
              Never worry about payment schedules. Verified earnings are locked at month-end, generating statements and clear billing PDFs.
            </p>
          </div>

          <div className="feature-card accent">
            <div className="feature-icon-wrapper">🔒</div>
            <h3 className="feature-card-title">Fraud & IVT Protection</h3>
            <p className="feature-card-desc">
              Comprehensive balance adjustments support deducting Invalid Traffic (IVT) or applying bonuses fairly with details logged in your portal.
            </p>
          </div>

          <div className="feature-card info">
            <div className="feature-icon-wrapper">💬</div>
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
            <p className="step-desc">Register a publisher account and submit your target domains for approval checks.</p>
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

        <div style={{ overflowX: 'auto', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
          <table className="table" style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                <th style={{ padding: '16px 24px', textAlign: 'left' }}>Publisher</th>
                <th style={{ textAlign: 'left' }}>Amount</th>
                <th style={{ textAlign: 'left' }}>Date</th>
                <th style={{ textAlign: 'left' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {(settings.recent_payouts || paymentProofs).map((proof, idx) => (
                <tr 
                  key={idx} 
                  onClick={() => setSelectedProof(proof)}
                  style={{ cursor: 'pointer', transition: 'background 0.2s' }}
                  className="clickable-payout-row"
                >
                  <td style={{ padding: '20px 24px', fontWeight: 700, color: 'var(--color-text)' }}>
                    {proof.publisher}
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--color-primary-light)' }}>
                    {formatCurrency(proof.amount)}
                  </td>
                  <td style={{ color: 'var(--color-text-muted)' }}>
                    {proof.date}
                  </td>
                  <td>
                    <span className="badge" style={{ background: '#d1fae5', color: '#065f46', fontSize: 13, padding: '4px 12px', fontWeight: 600 }}>
                      Paid successfully
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
                <span className="faq-toggle-icon">▼</span>
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
                💻 Go to Dashboard
              </button>
            ) : (
              <>
                {settings.registration_status !== 'closed' ? (
                  <Link to="/register" className="btn btn-primary btn-lg">🚀 Get Started Now</Link>
                ) : (
                  <button className="btn btn-secondary btn-lg" disabled>🔒 Registration Closed</button>
                )}
                <Link to="/login" className="btn btn-secondary btn-lg">🔑 Sign In</Link>
              </>
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
                <a href="#features" className="footer-link">Features</a>
                <a href="#calculator" className="footer-link">Calculator</a>
                <a href="#how-it-works" className="footer-link">How it Works</a>
                <a href="#proofs" className="footer-link">Payments Proof</a>
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
          </div>
        </div>

        <div className="footer-bottom">
          <div>© {new Date().getFullYear()} {settings.site_name || 'BestRevenue'}. All rights reserved.</div>
          <div>Empowering publishers through transparent ad metrics.</div>
        </div>
      </footer>

      {/* Verification Receipt Modal */}
      {selectedProof && (
        <div className="modal-overlay" onClick={() => setSelectedProof(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460, border: '1px solid rgba(16, 185, 129, 0.4)' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: 'var(--color-accent)' }}>✅</span> Payment Receipt
              </h3>
              <button className="modal-close" onClick={() => setSelectedProof(null)}>✕</button>
            </div>
            
            <div style={{ background: 'var(--color-surface-2)', padding: 24, borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', margin: '8px 0 24px' }}>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                {settings.site_logo ? (
                  <img src={settings.site_logo} alt="Logo" style={{ maxHeight: 36, marginBottom: 8 }} />
                ) : (
                  <div style={{ fontSize: 24, marginBottom: 4 }}>💹</div>
                )}
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Transaction Certified</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--color-border)', paddingBottom: 8 }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Issue Date:</span>
                  <span>{selectedProof.date}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--color-border)', paddingBottom: 8 }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Recipient:</span>
                  <span>{selectedProof.publisher}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--color-border)', paddingBottom: 8 }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Payment Route:</span>
                  <span>{selectedProof.method}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--color-border)', paddingBottom: 8 }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Transaction Ref:</span>
                  <span style={{ fontFamily: 'monospace' }}>{selectedProof.ref}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8 }}>
                  <span style={{ fontSize: 16, fontWeight: 700 }}>Total Disbursed:</span>
                  <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-accent)' }}>{formatCurrency(selectedProof.amount)}</span>
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--color-text-subtle)' }}>
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
