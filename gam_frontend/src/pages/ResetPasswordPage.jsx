import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { authApi } from '../api/endpoints'
import toast from 'react-hot-toast'

export default function ResetPasswordPage() {
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
  const strengthColor = ['', '#ef4444', '#f97316', '#eab308', '#10b981', '#6366f1'][strength]

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
        <div className="auth-card">
          <div className="auth-logo">
            <div className="auth-logo-icon">⚠️</div>
            <h1 className="auth-title">Invalid Link</h1>
            <p className="auth-subtitle">This reset link is missing required parameters.</p>
          </div>
          <Link to="/forgot-password" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', display: 'flex', marginTop: 8 }}>
            Request a New Link
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">🔑</div>
          <h1 className="auth-title">Reset Password</h1>
          <p className="auth-subtitle">Choose a strong new password for {email}</p>
        </div>

        {errors.general && (
          <div className="alert alert-danger" style={{ marginBottom: 20 }}>
            ⚠️ {errors.general}
            {errors.general.toLowerCase().includes('expired') && (
              <div style={{ marginTop: 8 }}>
                <Link to="/forgot-password" style={{ color: 'inherit', fontWeight: 700 }}>Request a new reset link →</Link>
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
            {errors.password && <div style={{ color: 'var(--color-danger)', fontSize: 12, marginTop: 4 }}>⚠ {errors.password}</div>}
            {form.password && (
              <div style={{ marginTop: 8 }}>
                <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                  {[1,2,3,4,5].map(i => (
                    <div key={i} style={{
                      flex: 1, height: 4, borderRadius: 4,
                      background: i <= strength ? strengthColor : 'var(--color-border)',
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
            {errors.password_confirmation && <div style={{ color: 'var(--color-danger)', fontSize: 12, marginTop: 4 }}>⚠ {errors.password_confirmation}</div>}
          </div>

          <button
            type="submit"
            id="btn-reset-password"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
            disabled={loading}
          >
            {loading ? (
              <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Updating…</>
            ) : '🔑 Update Password'}
          </button>

          <div style={{ marginTop: 16, textAlign: 'center', fontSize: 13, color: 'var(--color-text-muted)' }}>
            <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
              ← Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
