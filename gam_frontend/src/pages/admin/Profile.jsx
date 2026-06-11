import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { adminApi } from '../../api/endpoints'
import toast from 'react-hot-toast'
import { User, Lock, Save } from 'lucide-react'

export default function AdminProfilePage() {
  const { user, updateUser } = useAuth()

  const [activeTab, setActiveTab] = useState('profile')

  // Profile Form States
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [savingProfile, setSavingProfile] = useState(false)

  // Password Form States
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPasswordConfirmation, setNewPasswordConfirmation] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)

  // Sync state with user context on load/change
  useEffect(() => {
    if (user) {
      setName(user.name || '')
      setEmail(user.email || '')
    }
  }, [user])

  async function handleUpdateProfile(e) {
    e.preventDefault()
    setSavingProfile(true)
    try {
      const res = await adminApi.updateProfile({ name, email })
      toast.success('Admin profile updated successfully!')
      updateUser(res.data.user)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update admin profile.')
    } finally {
      setSavingProfile(false)
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
      await adminApi.changePassword({
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

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={28} style={{ color: 'var(--br-primary)' }} />
            <span>Admin Profile</span>
          </h1>
          <p className="page-subtitle">Manage your administrator profile details and security preferences.</p>
        </div>
      </div>

      {/* Tabs Selection */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 24, borderBottom: '1px solid var(--color-border)', paddingBottom: 12 }}>
        <button
          className={`btn ${activeTab === 'profile' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('profile')}
          style={{ padding: '8px 16px', fontSize: 13, borderRadius: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <User size={14} />
          Profile Details
        </button>
        <button
          className={`btn ${activeTab === 'password' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('password')}
          style={{ padding: '8px 16px', fontSize: 13, borderRadius: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <Lock size={14} />
          Security & Password
        </button>
      </div>

      {/* Profile Details Tab */}
      {activeTab === 'profile' && (
        <div className="card" style={{ maxWidth: 650 }}>
          <div className="card-header" style={{ marginBottom: 16 }}>
            <h3 className="card-title">Personal Settings</h3>
          </div>
          <form onSubmit={handleUpdateProfile}>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Full Name</label>
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

            <div className="form-group" style={{ marginBottom: 24 }}>
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="Enter email address"
                style={{ width: '100%' }}
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={savingProfile} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Save size={14} />
              {savingProfile ? 'Saving Changes...' : 'Save Profile'}
            </button>
          </form>
        </div>
      )}

      {/* Password Tab */}
      {activeTab === 'password' && (
        <div className="card" style={{ maxWidth: 650 }}>
          <div className="card-header" style={{ marginBottom: 16 }}>
            <h3 className="card-title">Security Settings</h3>
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
              <Lock size={14} />
              {savingPassword ? 'Changing Password...' : 'Change Password'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
