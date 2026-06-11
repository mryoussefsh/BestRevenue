import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { authApi } from '../api/endpoints'
import { useSettings } from '../contexts/SettingsContext'
import toast from 'react-hot-toast'
import { Lock, ArrowLeft, ArrowRight, AlertTriangle } from 'lucide-react'

export default function ResetPasswordPage() {
  const { settings } = useSettings()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') || ''
  const email = searchParams.get('email') || ''

  const [form, setForm] = useState({ password: '', password_confirmation: '' })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const strength = (() => {
    const p = form.password
    if (!p) return 0
    let s = 0
    if (p.length >= 8) s++
    if (p.length >= 12) s++
    if (/[A-Z]/.test(p)) s++
    if (/[0-9]/.test(p)) s++
    if (/[^A-Za-z0-9]/.test(p)) s++
    return s
  })()

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent'][strength]
  const strengthColors = ['', 'var(--br-danger)', 'var(--br-warning)', 'var(--br-warning)', 'var(--br-accent)', 'var(--br-primary)']
  const strengthColor = strengthColors[strength]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})

    if (form.password !== form.password_confirmation) {
      setErrors({ password_confirmation: 'Passwords do not match.' })
      return
    }
    if (form.password.length < 8) {
      setErrors({ password: 'Password must be at least 8 characters.' })
      return
    }

    setLoading(true)
    try {
      await authApi.resetPassword({ token, email, ...form })
      toast.success('Password updated! Please log in.')
      navigate('/login')
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to reset password.'
      const errs = err.response?.data?.errors || {}
      setErrors({ general: msg, ...errs })
    } finally {
      setLoading(false)
    }
  }

  if (!token || !email) {
    return (
      <div className="auth-wrapper">
        <div className="auth-glow-1"></div>
        <div className="auth-glow-2"></div>
        <div className="auth-card">
          <div className="auth-logo">
            <div className="auth-logo-icon">
              <AlertTriangle size={24} style={{ color: 'var(--br-danger)' }} />
            </div>
            <h1 className="auth-title">Invalid Link</h1>
            <p className="auth-subtitle">This reset link is missing required parameters.</p>
          </div>
          <Link to="/forgot-password" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', display: 'flex', marginTop: 8 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              Request a New Link
              <ArrowRight size={14} />
            </span>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-glow-1"></div>
      <div className="auth-glow-2"></div>

      <div className="auth-card">
        <div className="auth-logo">
          {settings.site_logo ? (
            <Link to="/" style={{ display: 'inline-block' }}>
              <img src={settings.site_logo} alt="Logo" className="auth-logo-img" style={{ maxHeight: 50, maxWidth: '100%', objectFit: 'contain', marginBottom: 16 }} />
            </Link>
          ) : (
            <Link to="/" style={{ textDecoration: 'none', display: 'inline-block' }}>
              <div className="auth-logo-icon">
                <Lock size={24} />
              </div>
            </Link>
          )}
          <h1 className="auth-title">Reset Password</h1>
          <p className="auth-subtitle">Choose a strong new password for {email}</p>
        </div>

        {errors.general && (
          <div className="alert alert-danger" style={{ marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={16} style={{ flexShrink: 0 }} />
              <span>{errors.general}</span>
            </div>
            {errors.general.toLowerCase().includes('expired') && (
              <div style={{ marginTop: 4 }}>
                <Link to="/forgot-password" style={{ color: 'inherit', fontWeight: 700, textDecoration: 'underline' }}>Request a new reset link &rarr;</Link>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="reset-password">New Password</label>
            <input
              id="reset-password"
              type="password"
              className={`form-input${errors.password ? ' is-invalid' : ''}`}
              placeholder="Minimum 8 characters"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
              autoFocus
            />
            {errors.password && (
              <div style={{ color: 'var(--br-danger)', fontSize: 12, marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertTriangle size={12} /> {errors.password}
              </div>
            )}
            {form.password && (
              <div style={{ marginTop: 8 }}>
                <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                  {[1,2,3,4,5].map(i => (
                    <div key={i} style={{
                      flex: 1, height: 4, borderRadius: 4,
                      background: i <= strength ? strengthColor : 'rgba(255,255,255,0.06)',
                      transition: 'background 0.3s',
                    }} />
                  ))}
                </div>
                <div style={{ fontSize: 11, color: strengthColor, fontWeight: 600 }}>{strengthLabel}</div>
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reset-confirm">Confirm Password</label>
            <input
              id="reset-confirm"
              type="password"
              className={`form-input${errors.password_confirmation ? ' is-invalid' : ''}`}
              placeholder="Repeat your new password"
              value={form.password_confirmation}
              onChange={e => setForm(f => ({ ...f, password_confirmation: e.target.value }))}
              required
            />
            {errors.password_confirmation && (
              <div style={{ color: 'var(--br-danger)', fontSize: 12, marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertTriangle size={12} /> {errors.password_confirmation}
              </div>
            )}
          </div>

          <button
            type="submit"
            id="btn-reset-password"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
            disabled={loading}
          >
            {loading ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                Updating…
              </span>
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                Update Password
                <ArrowRight size={14} />
              </span>
            )}
          </button>

          <div style={{ marginTop: 16, textAlign: 'center', fontSize: 13, color: 'var(--br-text-2)' }}>
            <Link to="/login" style={{ color: 'var(--br-primary)', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <ArrowLeft size={14} /> Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
