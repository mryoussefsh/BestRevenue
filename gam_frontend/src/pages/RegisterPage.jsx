import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authApi } from '../api/endpoints'
import toast from 'react-hot-toast'
import PhoneInput from 'react-phone-input-2'
import 'react-phone-input-2/lib/style.css'
import { useSettings } from '../contexts/SettingsContext'
import { 
  TrendingUp, Lock, ArrowRight, ArrowLeft, Phone, Send, Clock, 
  AlertTriangle, Check, FileText 
} from 'lucide-react'

export default function RegisterPage() {
  const { settings } = useSettings()

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    phone: '',
    telegram: '',
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [pendingMessage, setPendingMessage] = useState('')

  const calculatePasswordStrength = (password) => {
    let score = 0
    if (!password) return 0
    if (password.length >= 8) score += 1
    if (password.length >= 12) score += 1
    if (/[A-Z]/.test(password)) score += 1
    if (/[0-9]/.test(password)) score += 1
    if (/[^A-Za-z0-9]/.test(password)) score += 1
    return Math.min(score, 4)
  }
  const strength = calculatePasswordStrength(form.password)
  const strengthColors = ['var(--br-border)', 'var(--br-danger)', 'var(--br-warning)', 'var(--br-primary)', 'var(--br-accent)']
  const strengthLabels = ['Too short', 'Weak', 'Fair', 'Good', 'Strong']

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }))
    setErrors((er) => ({ ...er, [field]: '', contact: '' }))
  }

  const hasAtLeastOneContact = form.phone || form.telegram

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    setPendingMessage('')

    if (!hasAtLeastOneContact) {
      setErrors({ contact: 'Please fill in at least one contact method (Phone or Telegram).' })
      return
    }

    setLoading(true)
    try {
      const res = await authApi.register({
        name: form.name,
        email: form.email,
        password: form.password,
        password_confirmation: form.password_confirmation,
        phone: form.phone || undefined,
        telegram: form.telegram || undefined,
      })

      const data = res.data

      if (data.status === 'active') {
        // Store token using same keys as AuthContext
        localStorage.setItem('token', data.access_token)
        localStorage.setItem('user', JSON.stringify(data.user))
        toast.success('Welcome to BestRevenue! 🎉')
        // Use full page reload so AuthContext picks up the new token
        window.location.href = '/publisher'
      } else {
        // Pending
        setPendingMessage(data.message || 'Your account is pending admin review.')
      }
    } catch (err) {
      const resp = err.response?.data
      if (resp?.errors) {
        const fieldErrors = {}
        Object.entries(resp.errors).forEach(([key, msgs]) => {
          fieldErrors[key] = Array.isArray(msgs) ? msgs[0] : msgs
        })
        setErrors(fieldErrors)
      } else {
        setErrors({ general: resp?.message || 'Registration failed. Please try again.' })
      }
    } finally {
      setLoading(false)
    }
  }

  // ── Pending confirmation screen ──────────────────────────────────────
  if (pendingMessage) {
    return (
      <div className="auth-wrapper">
        <div className="auth-glow-1"></div>
        <div className="auth-glow-2"></div>
        <div className="auth-card" style={{ maxWidth: 500 }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <Clock size={40} style={{ color: 'var(--br-warning)', marginBottom: 12 }} />
            <h1 className="auth-title" style={{ fontSize: 22 }}>Registration Received!</h1>
            <p className="auth-subtitle">Your account is under review</p>
          </div>

          <div className="alert alert-info" style={{ marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <FileText size={18} style={{ color: 'var(--br-primary)', flexShrink: 0, marginTop: 2 }} />
            <div style={{ margin: 0, lineHeight: 1.6 }}>
              {pendingMessage}
            </div>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.015)',
            border: '0.5px solid var(--br-border)',
            borderRadius: 'var(--br-radius)',
            padding: 16,
            fontSize: 13,
            color: 'var(--br-text-2)',
            marginBottom: 24
          }}>
            <div style={{ fontWeight: 600, marginBottom: 6, color: 'var(--br-text)' }}>
              What happens next?
            </div>
            <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
              <li>Our team will review your registration</li>
              <li>Once approved, you'll be able to log in</li>
              <li>You may be contacted via the contact info you provided</li>
            </ul>
          </div>

          <Link
            to="/login"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', display: 'flex' }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <ArrowLeft size={16} />
              Back to Login
            </span>
          </Link>
        </div>
      </div>
    )
  }

  if (settings.registration_status === 'closed') {
    return (
      <div className="auth-wrapper">
        <div className="auth-glow-1"></div>
        <div className="auth-glow-2"></div>
        <div className="auth-card" style={{ maxWidth: 500 }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <Lock size={40} style={{ color: 'var(--br-danger)', marginBottom: 12 }} />
            <h1 className="auth-title" style={{ fontSize: 22 }}>Registration Closed</h1>
            <p className="auth-subtitle">We are not accepting new publisher registrations at this time.</p>
          </div>
          <Link
            to="/login"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', display: 'flex' }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <ArrowLeft size={16} />
              Back to Login
            </span>
          </Link>
        </div>
      </div>
    )
  }

  // ── Registration Form ────────────────────────────────────────────────
  return (
    <div className="auth-wrapper">
      <div className="auth-glow-1"></div>
      <div className="auth-glow-2"></div>

      <div className="auth-card" style={{ maxWidth: 520 }}>
        <div className="auth-logo">
          {settings.site_logo ? (
            <Link to="/" style={{ display: 'inline-block' }}>
              <img src={settings.site_logo} alt="Logo" className="auth-logo-img" style={{ maxHeight: 50, maxWidth: '100%', objectFit: 'contain', marginBottom: 16 }} />
            </Link>
          ) : (
            <Link to="/" style={{ textDecoration: 'none', display: 'inline-block' }}>
              <div className="auth-logo-icon">
                <TrendingUp size={24} />
              </div>
            </Link>
          )}
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Join {settings.site_name || 'BestRevenue'} and start monetizing your traffic</p>
        </div>

        {errors.general && (
          <div className="alert alert-danger" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={16} style={{ flexShrink: 0 }} />
            <span>{errors.general}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="reg-name">Full Name *</label>
            <input
              id="reg-name"
              type="text"
              className={`form-input${errors.name ? ' is-invalid' : ''}`}
              placeholder="Your full name"
              pattern="^[a-zA-Z\s]+$"
              title="Name must only contain English letters and spaces."
              value={form.name}
              onChange={set('name')}
              required
              autoFocus
            />
            {errors.name && (
              <div style={{ color: 'var(--br-danger)', fontSize: 12, marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertTriangle size={12} /> {errors.name}
              </div>
            )}
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">Email Address *</label>
            <input
              id="reg-email"
              type="email"
              className={`form-input${errors.email ? ' is-invalid' : ''}`}
              placeholder="you@example.com"
              value={form.email}
              onChange={set('email')}
              required
            />
            {errors.email && (
              <div style={{ color: 'var(--br-danger)', fontSize: 12, marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertTriangle size={12} /> {errors.email}
              </div>
            )}
          </div>

          {/* Password */}
          <div className="form-group" style={{ marginBottom: 24 }}>
            <label className="form-label" htmlFor="reg-password">Password *</label>
            <input
              id="reg-password"
              type="password"
              className={`form-input${errors.password ? ' is-invalid' : ''}`}
              placeholder="Min 8 characters"
              value={form.password}
              onChange={set('password')}
              required
            />
            {errors.password && (
              <div style={{ color: 'var(--br-danger)', fontSize: 12, marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertTriangle size={12} /> {errors.password}
              </div>
            )}
            
            {form.password && (
              <div style={{ marginTop: 8 }}>
                <div style={{ display: 'flex', gap: 4, height: 6, marginBottom: 4 }}>
                  {[1, 2, 3, 4].map(level => (
                    <div key={level} style={{
                      flex: 1,
                      borderRadius: 4,
                      background: strength >= level ? strengthColors[strength] : 'rgba(255,255,255,0.06)',
                      transition: 'background 0.3s'
                    }} />
                  ))}
                </div>
                <div style={{ fontSize: 11, textAlign: 'right', color: strengthColors[strength], fontWeight: 600 }}>
                  {strengthLabels[strength]}
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="reg-password-confirm">Confirm Password *</label>
            <input
              id="reg-password-confirm"
              type="password"
              className={`form-input${errors.password_confirmation ? ' is-invalid' : ''}`}
              placeholder="Repeat your password"
              value={form.password_confirmation}
              onChange={set('password_confirmation')}
              required
            />
            {errors.password_confirmation && (
              <div style={{ color: 'var(--br-danger)', fontSize: 12, marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertTriangle size={12} /> {errors.password_confirmation}
              </div>
            )}
          </div>

          {/* Contact Info */}
          <div style={{
            border: `0.5px solid ${errors.contact ? 'var(--br-danger)' : 'var(--br-border)'}`,
            borderRadius: 'var(--br-radius)',
            padding: '16px',
            marginBottom: 20,
            background: 'rgba(255,255,255,0.01)',
          }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4, color: 'var(--br-text)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Phone size={14} style={{ color: 'var(--br-primary)' }} /> Contact Information <span style={{ color: 'var(--br-danger)' }}>*</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--br-text-3)', marginBottom: 12 }}>
              At least one contact method is required
            </div>

            {errors.contact && (
              <div style={{ color: 'var(--br-danger)', fontSize: 12, marginBottom: 10, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertTriangle size={12} /> {errors.contact}
              </div>
            )}

            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label" htmlFor="reg-phone" style={{ fontSize: 12 }}>Phone / WhatsApp</label>
              <div className="phone-input-wrapper">
                {(() => {
                  const PhoneInputComp = PhoneInput.default || PhoneInput;
                  return (
                    <PhoneInputComp
                      country={'us'}
                      value={form.phone}
                      onChange={phone => setForm(f => ({ ...f, phone: phone ? '+' + phone : '' }))}
                      enableSearch={true}
                      searchPlaceholder="Search country..."
                      inputClass="form-input"
                    />
                  );
                })()}
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="reg-telegram" style={{ fontSize: 12 }}>Telegram Username</label>
              <input
                id="reg-telegram"
                type="text"
                className="form-input"
                placeholder="@username"
                value={form.telegram}
                onChange={set('telegram')}
              />
            </div>
          </div>

          {/* Contact progress indicator */}
          <div style={{
            display: 'flex',
            gap: 8,
            marginBottom: 20,
            fontSize: 12,
          }}>
            {[
              { label: 'Phone', val: form.phone, Icon: Phone },
              { label: 'Telegram', val: form.telegram, Icon: Send },
            ].map(({ label, val, Icon }) => (
              <div
                key={label}
                style={{
                  flex: 1,
                  padding: '6px 10px',
                  borderRadius: 'var(--br-radius-sm)',
                  background: val ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.015)',
                  border: `0.5px solid ${val ? 'rgba(16,185,129,0.3)' : 'var(--br-border)'}`,
                  color: val ? 'var(--br-accent)' : 'var(--br-text-3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  transition: 'all 0.2s',
                }}
              >
                <Icon size={12} />
                <span>{val ? `✓ ${label}` : label}</span>
              </div>
            ))}
          </div>

          <button
            id="register-submit"
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
            disabled={loading}
          >
            {loading ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></div>
                Creating Account…
              </span>
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                Create Publisher Account
                <ArrowRight size={14} />
              </span>
            )}
          </button>
        </form>

        <div style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: 'var(--br-text-2)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--br-primary)', fontWeight: 600, textDecoration: 'none' }}>
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  )
}
