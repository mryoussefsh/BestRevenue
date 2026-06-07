import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authApi } from '../api/endpoints'
import toast from 'react-hot-toast'
import PhoneInput from 'react-phone-input-2'
import 'react-phone-input-2/lib/style.css'

export default function RegisterPage() {

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    phone: '',
    telegram: '',
    skype: '',
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
  const strengthColors = ['var(--color-border)', 'var(--color-danger)', 'var(--color-warning)', 'var(--color-primary)', 'var(--color-success)']
  const strengthLabels = ['Too short', 'Weak', 'Fair', 'Good', 'Strong']

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }))
    setErrors((er) => ({ ...er, [field]: '', contact: '' }))
  }

  const hasAtLeastOneContact = form.phone || form.telegram || form.skype

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    setPendingMessage('')

    if (!hasAtLeastOneContact) {
      setErrors({ contact: 'Please fill in at least one contact method (Phone, Telegram, or Skype).' })
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
        skype: form.skype || undefined,
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
        <div className="auth-card" style={{ maxWidth: 500 }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 64, marginBottom: 12 }}>⏳</div>
            <h1 className="auth-title" style={{ fontSize: 22 }}>Registration Received!</h1>
            <p className="auth-subtitle">Your account is under review</p>
          </div>

          <div className="alert alert-info" style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>📋 Account Pending Review</div>
            <p style={{ margin: 0, lineHeight: 1.6 }}>
              {pendingMessage}
            </p>
          </div>

          <div style={{
            background: 'var(--color-surface-3)',
            borderRadius: 'var(--radius-md)',
            padding: 16,
            fontSize: 13,
            color: 'var(--color-text-muted)',
            marginBottom: 24
          }}>
            <div style={{ fontWeight: 600, marginBottom: 6, color: 'var(--color-text-secondary)' }}>
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
            🔑 Back to Login
          </Link>
        </div>
      </div>
    )
  }

  // ── Registration Form ────────────────────────────────────────────────
  return (
    <div className="auth-wrapper">
      <div className="auth-card" style={{ maxWidth: 520 }}>
        <div className="auth-logo">
          <div className="auth-logo-icon">💹</div>
          <h1 className="auth-title">Create Publisher Account</h1>
          <p className="auth-subtitle">Join BestRevenue and start monetizing your traffic</p>
        </div>

        {errors.general && (
          <div className="alert alert-danger" style={{ marginBottom: 20 }}>
            ⚠️ {errors.general}
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
            {errors.name && <div style={{ color: 'var(--color-danger)', fontSize: 12, marginTop: 4 }}>⚠ {errors.name}</div>}
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
            {errors.email && <div style={{ color: 'var(--color-danger)', fontSize: 12, marginTop: 4 }}>⚠ {errors.email}</div>}
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
            {errors.password && <div style={{ color: 'var(--color-danger)', fontSize: 12, marginTop: 4 }}>⚠ {errors.password}</div>}
            
            {form.password && (
              <div style={{ marginTop: 8 }}>
                <div style={{ display: 'flex', gap: 4, height: 6, marginBottom: 4 }}>
                  {[1, 2, 3, 4].map(level => (
                    <div key={level} style={{
                      flex: 1,
                      borderRadius: 4,
                      background: strength >= level ? strengthColors[strength] : 'var(--color-surface-3)',
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
            {errors.password_confirmation && <div style={{ color: 'var(--color-danger)', fontSize: 12, marginTop: 4 }}>⚠ {errors.password_confirmation}</div>}
          </div>

          {/* Contact Info */}
          <div style={{
            border: `1px solid ${errors.contact ? 'var(--color-danger)' : 'var(--color-border)'}`,
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            marginBottom: 20,
            background: 'var(--color-surface-2)',
          }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4, color: 'var(--color-text-secondary)' }}>
              📞 Contact Information <span style={{ color: 'var(--color-danger)' }}>*</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 12 }}>
              At least one contact method is required
            </div>

            {errors.contact && (
              <div style={{ color: 'var(--color-danger)', fontSize: 12, marginBottom: 10, fontWeight: 500 }}>
                ⚠ {errors.contact}
              </div>
            )}

            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label" htmlFor="reg-phone" style={{ fontSize: 12 }}>📱 Phone / WhatsApp</label>
              <div className="phone-input-wrapper">
                {(() => {
                  const PhoneInputComp = PhoneInput.default || PhoneInput;
                  return (
                    <PhoneInputComp
                      country={'us'}
                      value={form.phone}
                      onChange={phone => setForm(f => ({ ...f, phone: phone ? '+' + phone : '' }))}
                      inputClass="form-input"
                      containerStyle={{ width: '100%' }}
                      inputStyle={{ width: '100%', height: '42px', paddingLeft: '48px', background: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}
                      buttonStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRight: '1px solid var(--color-border)', borderRadius: 'var(--radius-md) 0 0 var(--radius-md)' }}
                      dropdownStyle={{ background: 'var(--color-surface-2)', color: 'var(--color-text)' }}
                    />
                  );
                })()}
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label" htmlFor="reg-telegram" style={{ fontSize: 12 }}>✈️ Telegram Username</label>
              <input
                id="reg-telegram"
                type="text"
                className="form-input"
                placeholder="@username"
                value={form.telegram}
                onChange={set('telegram')}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="reg-skype" style={{ fontSize: 12 }}>💬 Skype ID</label>
              <input
                id="reg-skype"
                type="text"
                className="form-input"
                placeholder="live:username"
                value={form.skype}
                onChange={set('skype')}
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
              { label: 'Phone', val: form.phone, icon: '📱' },
              { label: 'Telegram', val: form.telegram, icon: '✈️' },
              { label: 'Skype', val: form.skype, icon: '💬' },
            ].map(({ label, val, icon }) => (
              <div
                key={label}
                style={{
                  flex: 1,
                  padding: '6px 10px',
                  borderRadius: 'var(--radius-sm)',
                  background: val ? 'rgba(16,185,129,0.1)' : 'var(--color-surface-3)',
                  border: `1px solid ${val ? 'rgba(16,185,129,0.3)' : 'var(--color-border)'}`,
                  color: val ? 'var(--color-success)' : 'var(--color-text-muted)',
                  textAlign: 'center',
                  transition: 'all 0.2s',
                }}
              >
                {icon} {val ? `✓ ${label}` : label}
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
              <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></div> Creating Account…</>
            ) : '🚀 Create Publisher Account'}
          </button>
        </form>

        <div style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: 'var(--color-text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  )
}
