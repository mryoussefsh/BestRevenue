import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authApi } from '../api/endpoints'
import { useSettings } from '../contexts/SettingsContext'
import { useI18n } from '../contexts/I18nContext'
import toast from 'react-hot-toast'
import { Lock, Mail, ArrowLeft, ArrowRight } from 'lucide-react'

export default function ForgotPasswordPage() {
  const { settings } = useSettings()
  const { t } = useI18n()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await authApi.forgotPassword(email)
      setSent(true)
      toast.success(t('auth.toast.reset_link_sent', 'Reset link sent!'))
    } catch (err) {
      toast.error(err.response?.data?.message || t('auth.error.failed_send_reset_email', 'Failed to send reset email.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-wrapper">
      {/* Aurora Background */}
      <div className="auth-glow-1"></div>
      <div className="auth-glow-2"></div>
      <div className="auth-glow-3"></div>
      <div className="auth-glow-4"></div>
      <div className="auth-glow-5"></div>
      <span className="auth-particle" style={{ top:'15%', left:'10%',  width:4, height:4, background:'#00f2fe', animationDelay:'0s',   animationDuration:'6s'  }}></span>
      <span className="auth-particle" style={{ top:'70%', left:'15%',  width:3, height:3, background:'#8b5cf6', animationDelay:'2.1s', animationDuration:'8s'  }}></span>
      <span className="auth-particle" style={{ top:'25%', left:'85%',  width:4, height:4, background:'#10b981', animationDelay:'1.4s', animationDuration:'7s'  }}></span>
      <span className="auth-particle" style={{ top:'80%', left:'78%',  width:3, height:3, background:'#f59e0b', animationDelay:'3.5s', animationDuration:'9s'  }}></span>

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
          <h1 className="auth-title">{t('auth.forgot_password', 'Forgot Password')}</h1>
          <p className="auth-subtitle">{t('auth.forgot_password_desc', 'Enter your email to receive a reset link')}</p>
        </div>

        {sent ? (
          <div>
            <div className="alert alert-info" style={{ marginBottom: 20, padding: '16px 20px', borderRadius: 10, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <Mail size={18} style={{ color: 'var(--br-primary)', flexShrink: 0, marginTop: 2 }} />
              <div style={{ fontSize: 13 }}>
                <strong>{t('auth.check_inbox', 'Check your inbox')}</strong>
                <div style={{ marginTop: 4, color: 'var(--br-text-2)', lineHeight: 1.5 }}>
                  {t('auth.forgot_password_sent_msg', 'If an account with {email} exists, a password reset link has been sent. Please check your email (and spam folder).', { email })}
                </div>
              </div>
            </div>
            <Link
              to="/login"
              className="btn btn-secondary"
              style={{ width: '100%', justifyContent: 'center', display: 'flex' }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <ArrowLeft size={16} />
                {t('auth.back_to_login', 'Back to Login')}
              </span>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="forgot-email">{t('auth.email', 'Email Address')}</label>
              <input
                id="forgot-email"
                type="email"
                className="form-input"
                placeholder={t('auth.email_placeholder', 'you@example.com')}
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <button
              type="submit"
              id="btn-send-reset"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
              disabled={loading}
            >
              {loading ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                  {t('auth.sending', 'Sending…')}
                </span>
              ) : (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  {t('auth.send_reset_link_btn', 'Send Reset Link')}
                  <ArrowRight size={14} />
                </span>
              )}
            </button>

            <div style={{ marginTop: 16, textAlign: 'center', fontSize: 13, color: 'var(--br-text-2)' }}>
              <Link to="/login" style={{ color: 'var(--br-primary)', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <ArrowLeft size={14} /> {t('auth.back_to_login', 'Back to Login')}
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
