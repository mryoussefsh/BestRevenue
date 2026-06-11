import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSettings } from '../../contexts/SettingsContext'
import { publisherApi } from '../../api/endpoints'
import toast from 'react-hot-toast'
import PhoneInput from 'react-phone-input-2'
import 'react-phone-input-2/lib/style.css'
import { 
  Settings, User, CreditCard, Lock, Info, AlertTriangle, Save, Key 
} from 'lucide-react'

export default function SettingsPage() {
  const { user, updateUser, updatePaymentInfo } = useAuth()
  const { settings } = useSettings()

  const [activeTab, setActiveTab] = useState('profile')

  // Profile Form States
  const [name, setName] = useState(user?.name || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [telegram, setTelegram] = useState(user?.telegram || '')
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

  const savedMethodName = user?.payment_info?.method || ''
  const savedMethodAccount = user?.payment_info?.account || ''
  const savedMethodObj = paymentMethods.find(
    m => typeof m === 'object' && m !== null && m.name === savedMethodName
  )

  const PhoneInputComp = PhoneInput.default || PhoneInput

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <Settings size={24} style={{ color: 'var(--br-primary)' }} />
            Settings
          </h1>
          <p className="page-subtitle">Manage your profile contact details, payment information, and security preferences.</p>
        </div>
      </div>

      {/* Tabs Selection */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, borderBottom: '1px solid var(--color-border)', paddingBottom: 12 }}>
        <button
          className={`btn ${activeTab === 'profile' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('profile')}
          style={{ padding: '8px 16px', fontSize: 13, borderRadius: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <User size={14} />
          Profile Info
        </button>
        <button
          className={`btn ${activeTab === 'payment' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('payment')}
          style={{ padding: '8px 16px', fontSize: 13, borderRadius: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <CreditCard size={14} />
          Payment Method
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'profile' && (
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          {/* Left Card: Profile & Contact Details */}
          <div className="glass-card" style={{ flex: '1 1 450px', maxWidth: 650 }}>
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
                      background: 'var(--br-bg-3)',
                      border: '0.5px solid var(--br-border)',
                      cursor: 'not-allowed',
                      color: 'var(--br-text-2)',
                      width: '100%',
                    }}
                  />
                  <span title="Email address cannot be changed" style={{ display: 'inline-flex', alignItems: 'center' }}>
                    <Lock size={14} style={{ color: 'var(--br-text-3)' }} />
                  </span>
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
                <label className="form-label">Phone / WhatsApp</label>
                <div className="phone-input-wrapper">
                  <PhoneInputComp
                    country={'us'}
                    value={phone}
                    onChange={phoneVal => setPhone(phoneVal ? '+' + phoneVal : '')}
                    enableSearch={true}
                    searchPlaceholder="Search country..."
                    inputClass="form-input"
                  />
                </div>
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

              <div className="form-group" style={{ marginBottom: 24 }}>
                <label className="form-label">Country (Read-only)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="text"
                    className="form-input"
                    value={country || '—'}
                    disabled
                    style={{
                      background: 'var(--br-bg-3)',
                      border: '0.5px solid var(--br-border)',
                      cursor: 'not-allowed',
                      color: 'var(--br-text-2)',
                      width: '100%',
                    }}
                  />
                  <span title="Country cannot be changed" style={{ display: 'inline-flex', alignItems: 'center' }}>
                    <Lock size={14} style={{ color: 'var(--br-text-3)' }} />
                  </span>
                </div>
              </div>

              <button type="submit" className="btn btn-primary" disabled={savingProfile} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                {savingProfile ? 'Saving Changes...' : <><Save size={16} /> Save Profile</>}
              </button>
            </form>
          </div>

          {/* Right Card: Security & Password Preferences */}
          <div className="glass-card" style={{ flex: '1 1 350px', maxWidth: 450 }}>
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

              <button type="submit" className="btn btn-primary" disabled={savingPassword} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                {savingPassword ? 'Changing Password...' : <><Key size={16} /> Change Password</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'payment' && (
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          {/* Left Card: Form */}
          <div className="glass-card" style={{ flex: '1 1 450px', maxWidth: 650 }}>
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
                    border: '0.5px solid rgba(99,102,241,.2)',
                    padding: 12,
                    borderRadius: 8,
                    marginBottom: 16,
                    fontSize: 12,
                    color: 'var(--color-text)',
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: 4, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Settings size={12} style={{ color: 'var(--br-primary)' }} />
                    Minimum Threshold:{' '}
                    <span style={{ color: 'var(--color-accent)' }}>
                      ${selectedMethodObj.minimum || 0}
                    </span>
                  </div>
                  {selectedMethodObj.guidance && (
                    <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.4, color: 'var(--color-text-muted)', marginTop: 4 }}>
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

              <button type="submit" className="btn btn-primary" disabled={savingPayment} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                {savingPayment ? 'Saving Settings...' : <><CreditCard size={16} /> Update Payment Info</>}
              </button>
            </form>
          </div>

          {/* Right Card: Active Settings Display */}
          <div className="glass-card" style={{ flex: '1 1 300px', maxWidth: 400 }}>
            <div className="card-header" style={{ marginBottom: 16 }}>
              <h3 className="card-title">Active Payout Setup</h3>
            </div>
            
            {!savedMethodName ? (
              <div style={{ textAlign: 'center', padding: '24px 16px', color: 'var(--color-text-muted)' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                  <AlertTriangle size={32} style={{ color: 'var(--br-warning)' }} />
                </div>
                <div style={{ fontWeight: 600, color: 'var(--color-text)', marginBottom: 4 }}>No Payment Method Configured</div>
                <p style={{ fontSize: 13, margin: 0 }}>Please configure your payment details on the left to receive payouts.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Method */}
                <div style={{
                  background: 'var(--br-bg-3)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  border: '0.5px solid var(--br-border)',
                }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>
                    Payout Method
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <CreditCard size={20} style={{ color: 'var(--br-primary)' }} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--color-text)' }}>
                        {savedMethodName}
                      </div>
                      {savedMethodObj?.minimum !== undefined && (
                        <div style={{ fontSize: 12, color: 'var(--color-success)', marginTop: 2 }}>
                          Min. Threshold: <strong>${savedMethodObj.minimum}</strong>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Account details */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>
                    Destination Details
                  </div>
                  <div style={{
                    background: 'var(--br-bg-2)',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px',
                    border: '0.5px solid var(--br-border)',
                    fontSize: 13,
                    fontFamily: 'monospace',
                    color: 'var(--color-text)',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                    lineHeight: 1.5
                  }}>
                    {savedMethodAccount}
                  </div>
                </div>

                {/* Info Tip */}
                <div style={{
                  display: 'flex',
                  gap: 10,
                  fontSize: 12,
                  color: 'var(--color-text-muted)',
                  lineHeight: 1.5,
                  padding: '0 4px',
                  alignItems: 'flex-start'
                }}>
                  <Info size={16} style={{ color: 'var(--br-primary)', flexShrink: 0, marginTop: 2 }} />
                  <span>
                    Payouts are processed automatically according to our schedule once your available balance meets the minimum threshold.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
