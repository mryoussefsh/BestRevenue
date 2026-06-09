import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSettings } from '../../contexts/SettingsContext'
import { publisherApi } from '../../api/endpoints'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const { user, updateUser, updatePaymentInfo } = useAuth()
  const { settings } = useSettings()

  const [activeTab, setActiveTab] = useState('profile')

  // Profile Form States
  const [name, setName] = useState(user?.name || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [telegram, setTelegram] = useState(user?.telegram || '')
  const [skype, setSkype] = useState(user?.skype || '')
  const [country, setCountry] = useState(user?.country || '')
  const [savingProfile, setSavingProfile] = useState(false)

  // Payment Form States
  const [method, setMethod] = useState(user?.payment_info?.method || '')
  const [account, setAccount] = useState(user?.payment_info?.account || '')
  const [savingPayment, setSavingPayment] = useState(false)

  // Password Form States
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPasswordConfirmation, setNewPasswordConfirmation] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)

  // Update form states when user context changes
  useEffect(() => {
    if (user) {
      setName(user.name || '')
      setPhone(user.phone || '')
      setTelegram(user.telegram || '')
      setSkype(user.skype || '')
      setCountry(user.country || '')
      setMethod(user.payment_info?.method || '')
      setAccount(user.payment_info?.account || '')
    }
  }, [user])

  // Get allowed payment methods from platform settings
  const rawMethods = settings.payment_methods || []
  const paymentMethods = Array.isArray(rawMethods) ? rawMethods : []

  async function handleUpdateProfile(e) {
    e.preventDefault()
    setSavingProfile(true)
    try {
      const res = await publisherApi.updateProfile({
        name,
        phone,
        telegram,
        skype,
        country,
      })
      toast.success('Contact information updated successfully!')
      updateUser(res.data.user)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update contact info.')
    } finally {
      setSavingProfile(false)
    }
  }

  async function handleUpdatePayment(e) {
    e.preventDefault()
    if (!method || !account) {
      toast.error('Both payment method and account details are required.')
      return
    }
    setSavingPayment(true)
    try {
      const res = await publisherApi.updatePaymentInfo({ method, account })
      toast.success('Payment method settings updated!')
      updatePaymentInfo(res.data.payment_info)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update payment settings.')
    } finally {
      setSavingPayment(false)
    }
  }

  async function handleUpdatePassword(e) {
    e.preventDefault()
    if (newPassword !== newPasswordConfirmation) {
      toast.error('New password and confirmation do not match.')
      return
    }
    setSavingPassword(true)
    try {
      await publisherApi.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: newPasswordConfirmation,
      })
      toast.success('Password changed successfully!')
      setCurrentPassword('')
      setNewPassword('')
      setNewPasswordConfirmation('')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password.')
    } finally {
      setSavingPassword(false)
    }
  }

  const selectedMethodObj = paymentMethods.find(
    m => typeof m === 'object' && m !== null && m.name === method
  )

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">⚙️ Settings</h1>
          <p className="page-subtitle">Manage your profile contact details, payment information, and security preferences.</p>
        </div>
      </div>

      {/* Tabs Selection */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, borderBottom: '1px solid var(--color-border)', paddingBottom: 12 }}>
        <button
          className={`btn ${activeTab === 'profile' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('profile')}
          style={{ padding: '8px 16px', fontSize: 13, borderRadius: 8 }}
        >
          👤 Profile Info
        </button>
        <button
          className={`btn ${activeTab === 'payment' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('payment')}
          style={{ padding: '8px 16px', fontSize: 13, borderRadius: 8 }}
        >
          💳 Payment Method
        </button>
        <button
          className={`btn ${activeTab === 'password' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('password')}
          style={{ padding: '8px 16px', fontSize: 13, borderRadius: 8 }}
        >
          🔒 Security
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'profile' && (
        <div className="card" style={{ maxWidth: 650 }}>
          <div className="card-header" style={{ marginBottom: 16 }}>
            <h3 className="card-title">Profile &amp; Contact Details</h3>
          </div>
          <form onSubmit={handleUpdateProfile}>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Email Address (Read-only)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="email"
                  className="form-input"
                  value={user?.email || ''}
                  disabled
                  style={{
                    background: 'var(--color-surface-3)',
                    cursor: 'not-allowed',
                    color: 'var(--color-text-muted)',
                    width: '100%',
                  }}
                />
                <span title="Email address cannot be changed" style={{ fontSize: 16 }}>🔒</span>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Full Name / Company Name</label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                placeholder="Enter your name"
                style={{ width: '100%' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Phone Number</label>
              <input
                type="text"
                className="form-input"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="e.g. +123456789"
                style={{ width: '100%' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Telegram Handle</label>
              <input
                type="text"
                className="form-input"
                value={telegram}
                onChange={e => setTelegram(e.target.value)}
                placeholder="e.g. @myhandle"
                style={{ width: '100%' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Skype Username</label>
              <input
                type="text"
                className="form-input"
                value={skype}
                onChange={e => setSkype(e.target.value)}
                placeholder="e.g. live:myskypename"
                style={{ width: '100%' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 24 }}>
              <label className="form-label">Country</label>
              <input
                type="text"
                className="form-input"
                value={country}
                onChange={e => setCountry(e.target.value)}
                placeholder="e.g. United States"
                style={{ width: '100%' }}
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={savingProfile}>
              {savingProfile ? 'Saving Changes...' : '💾 Save Profile'}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'payment' && (
        <div className="card" style={{ maxWidth: 650 }}>
          <div className="card-header" style={{ marginBottom: 16 }}>
            <h3 className="card-title">Payment Account Information</h3>
          </div>
          <form onSubmit={handleUpdatePayment}>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Preferred Payout Method</label>
              <select
                className="form-select"
                value={method}
                onChange={e => setMethod(e.target.value)}
                required
                style={{ width: '100%' }}
              >
                <option value="">Select a payment method...</option>
                {paymentMethods.map((m, idx) => {
                  const nameVal = typeof m === 'object' && m !== null ? m.name : m
                  return (
                    <option key={idx} value={nameVal}>
                      {nameVal}
                    </option>
                  )
                })}
              </select>
            </div>

            {selectedMethodObj && (
              <div
                style={{
                  background: 'rgba(99,102,241,.08)',
                  border: '1px solid rgba(99,102,241,.2)',
                  padding: 12,
                  borderRadius: 8,
                  marginBottom: 16,
                  fontSize: 12,
                  color: 'var(--color-text)',
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: 4 }}>
                  ⚙️ Minimum Threshold:{' '}
                  <span style={{ color: 'var(--color-accent)' }}>
                    ${selectedMethodObj.minimum || 0}
                  </span>
                </div>
                {selectedMethodObj.guidance && (
                  <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.4, color: 'var(--color-text-muted)' }}>
                    {selectedMethodObj.guidance}
                  </div>
                )}
              </div>
            )}

            <div className="form-group" style={{ marginBottom: 24 }}>
              <label className="form-label">Payment Destination Account details</label>
              <textarea
                className="form-textarea"
                rows={4}
                value={account}
                onChange={e => setAccount(e.target.value)}
                required
                placeholder="Enter bank account info, IBAN, PayPal email, or crypto address details exactly as required by the platform instructions."
                style={{ width: '100%' }}
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={savingPayment}>
              {savingPayment ? 'Saving Settings...' : '💳 Update Payment Info'}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'password' && (
        <div className="card" style={{ maxWidth: 650 }}>
          <div className="card-header" style={{ marginBottom: 16 }}>
            <h3 className="card-title">Security &amp; Password Preferences</h3>
          </div>
          <form onSubmit={handleUpdatePassword}>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Current Password</label>
              <input
                type="password"
                className="form-input"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                required
                placeholder="••••••••"
                style={{ width: '100%' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">New Password</label>
              <input
                type="password"
                className="form-input"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                placeholder="•••••••• (Min. 8 characters)"
                style={{ width: '100%' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 24 }}>
              <label className="form-label">Confirm New Password</label>
              <input
                type="password"
                className="form-input"
                value={newPasswordConfirmation}
                onChange={e => setNewPasswordConfirmation(e.target.value)}
                required
                placeholder="••••••••"
                style={{ width: '100%' }}
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={savingPassword}>
              {savingPassword ? 'Changing Password...' : '🔒 Change Password'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
