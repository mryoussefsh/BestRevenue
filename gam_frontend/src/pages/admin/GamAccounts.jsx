import { useState, useEffect } from 'react'
import { gamAccountsApi, adminApi } from '../../api/endpoints'
import toast from 'react-hot-toast'
import { useSearchParams } from 'react-router-dom'

export default function GamAccountsPage() {
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingSettings, setSavingSettings] = useState(false)
  const [credentials, setCredentials] = useState({
    google_client_id: '',
    google_client_secret: ''
  })
  const [editingAccount, setEditingAccount] = useState(null)
  const [editForm, setEditForm] = useState({ name: '', network_code: '' })
  const [syncing, setSyncing] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    loadAccounts()

    // Handle OAuth callback messages in URL
    const oauthStatus = searchParams.get('oauth')
    const message = searchParams.get('message')
    
    if (oauthStatus) {
      if (oauthStatus === 'connected') toast.success('GAM Account connected successfully!')
      if (oauthStatus === 'reconnected') toast.success('GAM Account tokens refreshed!')
      if (oauthStatus === 'error') toast.error(`Connection failed: ${message || 'Unknown error'}`)
      
      // Clean up URL
      setSearchParams({})
    }
  }, [searchParams, setSearchParams])

  async function loadAccounts() {
    try {
      const [accRes, setRes] = await Promise.all([
        gamAccountsApi.getAll(),
        adminApi.getSettings()
      ])
      
      setAccounts(accRes.data)
      
      const settings = setRes.data || []
      const clientId = settings.find(s => s.key === 'google_client_id')?.value || ''
      const clientSecret = settings.find(s => s.key === 'google_client_secret')?.value || ''
      
      setCredentials({
        google_client_id: clientId,
        google_client_secret: clientSecret
      })
      
    } catch {
      toast.error('Failed to load GAM accounts & settings')
    } finally {
      setLoading(false)
    }
  }

  async function handleConnect() {
    if (!credentials.google_client_id || !credentials.google_client_secret) {
      return toast.error('Please configure your Google OAuth Client ID and Secret first.')
    }
    
    try {
      const res = await gamAccountsApi.getOAuthUrl()
      window.location.href = res.data.url
    } catch (err) {
      toast.error('Failed to get OAuth URL')
    }
  }

  async function handleSaveSettings(e) {
    e.preventDefault()
    setSavingSettings(true)
    try {
      await adminApi.updateSetting('google_client_id', credentials.google_client_id)
      await adminApi.updateSetting('google_client_secret', credentials.google_client_secret)
      toast.success('Google API Credentials saved!')
    } catch (err) {
      toast.error('Failed to save credentials')
    } finally {
      setSavingSettings(false)
    }
  }

  async function handleManualSync() {
    if (!window.confirm('This will trigger an immediate fetch of revenue data from all connected GAM accounts. Continue?')) return
    setSyncing(true)
    const t = toast.loading('Running GAM sync...')
    try {
      const res = await gamAccountsApi.triggerSync()
      toast.success(res.data.message, { id: t })
      console.log('Sync Output:', res.data.output)
    } catch {
      toast.error('Failed to trigger GAM sync', { id: t })
    } finally {
      setSyncing(false)
    }
  }

  async function handleRefresh(id) {
    try {
      await gamAccountsApi.refreshToken(id)
      toast.success('Token refreshed successfully')
      loadAccounts()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to refresh token')
      loadAccounts()
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to disconnect this account? Websites using it will fail to sync.')) return
    try {
      await gamAccountsApi.remove(id)
      toast.success('Account disconnected')
      loadAccounts()
    } catch {
      toast.error('Failed to disconnect account')
    }
  }

  function openEditModal(acc) {
    setEditingAccount(acc)
    setEditForm({
      name: acc.name || '',
      network_code: acc.network_code || ''
    })
  }

  async function handleEditSave(e) {
    e.preventDefault()
    try {
      await gamAccountsApi.update(editingAccount.id, editForm)
      toast.success('Account updated successfully')
      setEditingAccount(null)
      loadAccounts()
    } catch {
      toast.error('Failed to update account')
    }
  }

  async function handleWipeData() {
    if (!window.confirm('WARNING: This will permanently delete ALL revenue records and sync logs from the database. Are you absolutely sure?')) return
    const t = toast.loading('Wiping revenue data...')
    try {
      const res = await adminApi.wipeRevenue()
      toast.success(res.data.message, { id: t })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to wipe data', { id: t })
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">📡 GAM Accounts</h1>
          <p className="page-subtitle">Connect Google Ad Manager accounts via OAuth</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-danger" onClick={handleWipeData} disabled={syncing}>
            🗑️ Wipe All Revenue
          </button>
          <button className="btn btn-secondary" onClick={handleManualSync} disabled={syncing}>
            {syncing ? 'Syncing...' : '🔄 Run GAM Sync Now'}
          </button>
          <button className="btn btn-primary" onClick={handleConnect} disabled={loading || !credentials.google_client_id}>
            + Connect with Google
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div className="card-title">🔑 Google API Configuration</div>
        </div>
        <form onSubmit={handleSaveSettings} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Google OAuth Client ID *</label>
            <input 
              className="form-input" 
              placeholder="e.g. 123456789.apps.googleusercontent.com"
              value={credentials.google_client_id}
              onChange={e => setCredentials(c => ({...c, google_client_id: e.target.value}))}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Google OAuth Client Secret *</label>
            <input 
              className="form-input" 
              type="password"
              placeholder="e.g. GOCSPX-12345abcdef"
              value={credentials.google_client_secret}
              onChange={e => setCredentials(c => ({...c, google_client_secret: e.target.value}))}
              required
            />
          </div>
          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 16 }}>
            <div className="text-muted text-sm">
              Redirect URI must be configured as: <code style={{ userSelect: 'all' }}>http://127.0.0.1:8000/api/v1/gam-accounts/oauth/callback</code>
            </div>
            <button className="btn btn-secondary" type="submit" disabled={savingSettings}>
              {savingSettings ? 'Saving...' : 'Save API Keys'}
            </button>
          </div>
        </form>
      </div>

      {loading ? (
        <div className="loading-screen"><div className="spinner"></div></div>
      ) : accounts.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔌</div>
          <h3>No GAM Accounts Connected</h3>
          <p className="text-muted">Connect a Google account to start syncing revenue data.</p>
          <button className="btn btn-primary" onClick={handleConnect} style={{ marginTop: 16 }}>
            Connect Now
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 20 }}>
          {accounts.map(acc => (
            <div key={acc.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{acc.name}</h3>
                  <div className="text-sm text-muted">{acc.email}</div>
                </div>
                <span className={`badge badge-${acc.status === 'active' ? 'success' : 'danger'}`}>
                  {acc.status.toUpperCase()}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
                <div>
                  <div className="text-muted" style={{ marginBottom: 4 }}>Network Code</div>
                  <code style={{ fontSize: 12 }}>{acc.network_code || 'N/A'}</code>
                </div>
                <div>
                  <div className="text-muted" style={{ marginBottom: 4 }}>Linked Websites</div>
                  <div style={{ fontWeight: 500 }}>{acc.websites_count}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--color-border)' }}>
                <button 
                  className="btn btn-secondary btn-sm" 
                  style={{ flex: 1 }}
                  onClick={() => openEditModal(acc)}
                >
                  ✏️ Edit
                </button>
                <button 
                  className="btn btn-secondary btn-sm" 
                  onClick={() => handleRefresh(acc.id)}
                  title="Refresh Token"
                >
                  🔄
                </button>
                <button 
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDelete(acc.id)}
                  title="Disconnect"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Account Modal */}
      {editingAccount && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h2>Edit GAM Account</h2>
              <button className="btn btn-secondary btn-sm" onClick={() => setEditingAccount(null)}>✕</button>
            </div>
            <form onSubmit={handleEditSave} className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Account Name</label>
                <input 
                  className="form-input" 
                  value={editForm.name}
                  onChange={e => setEditForm(f => ({...f, name: e.target.value}))}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Network Code</label>
                <input 
                  className="form-input" 
                  placeholder="e.g. 12345678"
                  value={editForm.network_code}
                  onChange={e => setEditForm(f => ({...f, network_code: e.target.value}))}
                />
                <div className="text-muted text-xs" style={{ marginTop: 4 }}>
                  Found in your Google Ad Manager URL: <br/><code>admanager.google.com/YOUR_NETWORK_CODE</code>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditingAccount(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
