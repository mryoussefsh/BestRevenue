import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useSettings } from '../contexts/SettingsContext'
import { useI18n } from '../contexts/I18nContext'
import { TrendingUp, Lock, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const { login } = useAuth()
  const { settings } = useSettings()
  const { t } = useI18n()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(email, password, remember)
      toast.success(t('auth.toast.welcome_back', 'Welcome back!'))
      if (user.role === 'admin') {
        const primaryRole = user.roles_list?.[0] || 'Super Admin'
        if (primaryRole === 'Finance Manager') navigate('/admin/finance')
        else if (primaryRole === 'Ad Ops Manager') navigate('/admin/adops')
        else if (primaryRole === 'Support Agent') navigate('/admin/support')
        else if (primaryRole === 'Content Manager') navigate('/admin/content')
        else navigate('/admin')
      } else {
        navigate('/publisher')
      }
    } catch (err) {
      const msg = err.response?.data?.message || t('auth.error.invalid_credentials', 'Invalid credentials. Please try again.')
      setError(msg)
    } finally {
      setLoading(false)
    }
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
                <TrendingUp size={24} />
              </div>
              <h1 className="auth-title">{settings.site_name || 'BestRevenue'}</h1>
            </Link>
          )}
          <p className="auth-subtitle">{t('auth.login_subtitle', 'Sign in to your account')}</p>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">{t('auth.email', 'Email Address')}</label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder={t('auth.email_placeholder', 'you@example.com')}
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label" htmlFor="password">{t('auth.password', 'Password')}</label>
              <Link to="/forgot-password" style={{ fontSize: 12, color: 'var(--br-primary)', fontWeight: 500, textDecoration: 'none' }}>
                {t('auth.forgot_password_link', 'Forgot Password?')}
              </Link>
            </div>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder={t('auth.password_placeholder', '••••••••')}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, marginBottom: 16 }}>
            <input
              id="remember"
              type="checkbox"
              checked={remember}
              onChange={e => setRemember(e.target.checked)}
              style={{ cursor: 'pointer', width: 16, height: 16 }}
            />
            <label htmlFor="remember" style={{ fontSize: 13, color: 'var(--br-text-2)', cursor: 'pointer', userSelect: 'none', marginBottom: 0 }}>
              {t('auth.keep_me_signed_in', 'Keep me signed in')}
            </label>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
            disabled={loading}
          >
            {loading ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></div>
                {t('auth.signing_in', 'Signing in…')}
              </span>
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <Lock size={14} />
                {t('auth.login', 'Sign In')}
              </span>
            )}
          </button>
        </form>

        {settings.registration_status !== 'closed' && (
          <div style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: 'var(--br-text-2)' }}>
            {t('auth.new_to_platform', 'New to {site_name}?', { site_name: settings.site_name || 'BestRevenue' })}{' '}
            <Link to="/register" id="go-to-register" style={{ color: 'var(--br-primary)', fontWeight: 600, textDecoration: 'none' }}>
              {t('auth.create_publisher_account', 'Create a Publisher Account')}
            </Link>
          </div>
        )}

        <div style={{ marginTop: 20, padding: '16px', background: 'rgba(255,255,255,0.015)', border: '0.5px solid var(--br-border)', borderRadius: 'var(--br-radius)', fontSize: 12, color: 'var(--br-text-3)' }}>
          <div style={{ fontWeight: 600, marginBottom: 6, color: 'var(--br-text-2)' }}>{t('auth.demo_credentials', 'Demo Credentials')}</div>
          <div>{t('auth.demo_admin', 'Admin')}: <code style={{ color: 'var(--br-primary)' }}>admin@bestrevenue.com</code> / <code style={{ color: 'var(--br-primary)' }}>admin123456</code></div>
        </div>
      </div>
    </div>
  )
}
