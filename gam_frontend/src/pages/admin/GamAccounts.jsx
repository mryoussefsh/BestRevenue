import { useState, useEffect } from 'react'
import { gamAccountsApi, adminApi } from '../../api/endpoints'
import toast from 'react-hot-toast'
import { useSearchParams } from 'react-router-dom'
import { X, Radio, Trash2, RefreshCw, Plus, Key, Edit, Check, Copy } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useI18n } from '../../contexts/I18nContext'


export default function GamAccountsPage() {
  const { hasPermission } = useAuth()
  const { t } = useI18n()
  const hasSettingsPermission = hasPermission('manage_settings')
  const hasRevenuePermission = hasPermission('manage_revenue')
  const canConfigureGoogleApi = hasSettingsPermission || hasPermission('manage_gam_accounts')

  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingSettings, setSavingSettings] = useState(false)
  const [showConfig, setShowConfig] = useState(false)
  const [credentials, setCredentials] = useState({
    google_client_id: '',
    google_client_secret: ''
  })
  const [editingAccount, setEditingAccount] = useState(null)
  const [editForm, setEditForm] = useState({ name: '', network_code: '', ads_txt: '' })
  const [syncing, setSyncing] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    loadAccounts()

    // Handle OAuth callback messages in URL
    const oauthStatus = searchParams.get('oauth')
    const message = searchParams.get('message')
    
    if (oauthStatus) {
      if (oauthStatus === 'connected') toast.success(t('gam.toast_connected', 'GAM Account connected successfully!'))
      if (oauthStatus === 'reconnected') toast.success(t('gam.toast_reconnected', 'GAM Account tokens refreshed!'))
      if (oauthStatus === 'error') toast.error(`${t('gam.toast_conn_fail', 'Connection failed')}: ${message || t('common.unknown_error', 'Unknown error')}`)
      
      // Clean up URL
      setSearchParams({})
    }
  }, [searchParams, setSearchParams])

  async function loadAccounts() {
    try {
      if (canConfigureGoogleApi) {
        const [accRes, setRes] = await Promise.all([
          gamAccountsApi.getAll().catch(() => ({ data: [] })),
          adminApi.getSettings().catch(() => ({ data: [] }))
        ])
        
        setAccounts(accRes.data || [])
        
        const settings = setRes.data || []
        const clientId = settings.find(s => s.key === 'google_client_id')?.value || ''
        const clientSecret = settings.find(s => s.key === 'google_client_secret')?.value || ''
        
        setCredentials({
          google_client_id: clientId,
          google_client_secret: clientSecret
        })
      } else {
        const accRes = await gamAccountsApi.getAll().catch(() => ({ data: [] }))
        setAccounts(accRes.data || [])
      }
    } catch {
      toast.error(t('gam.toast_load_fail', 'Failed to load GAM accounts & settings'))
    } finally {
      setLoading(false)
    }
  }

  async function handleConnect() {
    if (canConfigureGoogleApi && (!credentials.google_client_id || !credentials.google_client_secret)) {
      return toast.error(t('gam.toast_configure_first', 'Please configure your Google OAuth Client ID and Secret first.'))
    }
    
    try {
      const res = await gamAccountsApi.getOAuthUrl()
      window.location.href = res.data.url
    } catch (err) {
      toast.error(t('gam.toast_oauth_fail', 'Failed to get OAuth URL'))
    }
  }

  async function handleSaveSettings(e) {
    e.preventDefault()
    setSavingSettings(true)
    try {
      await adminApi.updateSetting('google_client_id', credentials.google_client_id)
      await adminApi.updateSetting('google_client_secret', credentials.google_client_secret)
      toast.success(t('gam.toast_credentials_saved', 'Google API Credentials saved!'))
      setShowConfig(false)
    } catch (err) {
      toast.error(t('gam.toast_save_credentials_fail', 'Failed to save credentials'))
    } finally {
      setSavingSettings(false)
    }
  }

  async function handleManualSync() {
    if (!window.confirm(t('gam.confirm_manual_sync', 'This will trigger an immediate fetch of revenue data from all connected GAM accounts. Continue?'))) return
    setSyncing(true)
    const toastId = toast.loading(t('gam.syncing', 'Running GAM sync...'))
    try {
      const res = await gamAccountsApi.triggerSync()
      const { rows_fetched = 0, rows_matched = 0 } = res.data
      const detail = rows_fetched > 0 ? ` (${rows_fetched} rows fetched, ${rows_matched} matched)` : ''
      toast.success(res.data.message + detail, { id: toastId })
    } catch (err) {
      // Backend returns 422 for partial errors, 500 for full failures — both land here
      const serverMessage = err.response?.data?.message
      toast.error(serverMessage || t('gam.toast_sync_fail', 'GAM sync failed. Check sync logs for details.'), { id: toastId })
    } finally {
      setSyncing(false)
    }
  }

  async function handleRefresh(id) {
    try {
      await gamAccountsApi.refreshToken(id)
      toast.success(t('gam.toast_token_refreshed', 'Token refreshed successfully'))
      loadAccounts()
    } catch (err) {
      toast.error(err.response?.data?.message || t('gam.toast_refresh_fail', 'Failed to refresh token'))
      loadAccounts()
    }
  }

  async function handleDelete(id) {
    if (!window.confirm(t('gam.confirm_disconnect', 'Are you sure you want to disconnect this account? Websites using it will fail to sync.'))) return
    try {
      await gamAccountsApi.remove(id)
      toast.success(t('gam.toast_disconnected', 'Account disconnected'))
      loadAccounts()
    } catch {
      toast.error(t('gam.toast_disconnect_fail', 'Failed to disconnect account'))
    }
  }

  function openEditModal(acc) {
    setEditingAccount(acc)
    setEditForm({
      name: acc.name || '',
      network_code: acc.network_code || '',
      ads_txt: acc.ads_txt || ''
    })
  }

  async function handleEditSave(e) {
    e.preventDefault()
    try {
      await gamAccountsApi.update(editingAccount.id, editForm)
      toast.success(t('gam.toast_account_updated', 'Account updated successfully'))
      setEditingAccount(null)
      loadAccounts()
    } catch {
      toast.error(t('gam.toast_account_update_fail', 'Failed to update account'))
    }
  }

  async function handleWipeData() {
    if (!window.confirm(t('gam.confirm_wipe', 'WARNING: This will permanently delete ALL revenue records and sync logs from the database. Are you absolutely sure?'))) return
    const toastId2 = toast.loading(t('gam.wiping', 'Wiping revenue data...'))
    try {
      const res = await adminApi.wipeRevenue()
      toast.success(res.data.message, { id: toastId2 })
    } catch (err) {
      toast.error(err.response?.data?.message || t('gam.toast_wipe_fail', 'Failed to wipe data'), { id: toastId2 })
    }
  }

  const redirectUri = window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
    ? 'http://127.0.0.1:8000/api/v1/gam-accounts/oauth/callback'
    : `${window.location.origin}/api/v1/gam-accounts/oauth/callback`

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Radio size={24} style={{ color: 'var(--color-primary)' }} /> {t('gam.title', 'GAM Accounts')}
          </h1>
          <p className="page-subtitle">{t('gam.subtitle', 'Connect Google Ad Manager accounts via OAuth')}</p>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {hasRevenuePermission && (
            <button className="btn btn-danger" onClick={handleWipeData} disabled={syncing} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Trash2 size={14} /> {t('gam.wipe_all_revenue', 'Wipe All Revenue')}
            </button>
          )}
          <button className="btn btn-secondary" onClick={handleManualSync} disabled={syncing} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            {syncing ? t('gam.syncing_label', 'Syncing...') : <><RefreshCw size={14} /> {t('gam.run_sync_btn', 'Run GAM Sync Now')}</>}
          </button>
          <button className="btn btn-primary" onClick={handleConnect} disabled={loading || (canConfigureGoogleApi && !credentials.google_client_id)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={14} /> {t('gam.connect_google', 'Connect with Google')}
          </button>
        </div>
      </div>

      {canConfigureGoogleApi && (
        credentials.google_client_id && credentials.google_client_secret && !showConfig ? (
          <div style={{ marginBottom: 24 }}>
            <button 
              className="btn"
              style={{
                background: 'rgba(16, 185, 129, 0.15)',
                color: 'var(--color-success)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '12px 20px',
                borderRadius: '8px',
                fontWeight: '600',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onClick={() => setShowConfig(true)}
            >
              <Check size={16} /> {t('gam.api_configured', 'Google API Configured (Click to edit)')}
            </button>
          </div>
        ) : (
          <div className="card" style={{ marginBottom: 24, padding: 24 }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 0, marginBottom: 20 }}>
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Key size={18} style={{ color: 'var(--br-primary)' }} /> {t('gam.api_config_title', 'Google API Configuration')}
            </div>
            {credentials.google_client_id && credentials.google_client_secret && (
              <button 
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowConfig(false)}
              >
                Hide
              </button>
            )}
          </div>
          <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">{t('gam.client_id_label', 'Google OAuth Client ID')} *</label>
                <input 
                  className="form-input" 
                  placeholder="e.g. 123456789.apps.googleusercontent.com"
                  value={credentials.google_client_id}
                  onChange={e => setCredentials(c => ({...c, google_client_id: e.target.value}))}
                  required
                />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">{t('gam.client_secret_label', 'Google OAuth Client Secret')} *</label>
                <input 
                  className="form-input" 
                  type="password"
                  placeholder="e.g. GOCSPX-12345abcdef"
                  value={credentials.google_client_secret}
                  onChange={e => setCredentials(c => ({...c, google_client_secret: e.target.value}))}
                  required
                />
              </div>
            </div>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              marginTop: 12
            }}>
              <div className="text-muted text-sm" style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
                <div>{t('gam.redirect_uri_label', 'Redirect URI must be configured as:')}</div>
                <div style={{ display: 'flex', alignItems: 'stretch', gap: 8, flexWrap: 'wrap', width: '100%' }}>
                  <code style={{
                    background: 'rgba(255,255,255,.05)', border: '1px solid var(--color-border)',
                    padding: '8px 12px', borderRadius: 6, fontSize: 12,
                    fontFamily: 'monospace', color: '#e2e8f0',
                    wordBreak: 'break-all', display: 'block', flex: 1, minWidth: '200px'
                  }}>
                    {redirectUri}
                  </code>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '8px 16px', height: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0 }}
                    onClick={() => {
                      navigator.clipboard.writeText(redirectUri)
                      toast.success(t('gam.toast_redirect_copied', 'Redirect URI copied!'))
                    }}
                  >
                    <Copy size={14} /> {t('common.copy', 'Copy')}
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%', marginTop: 8 }}>
                <button className="btn btn-primary" type="submit" disabled={savingSettings} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  {savingSettings ? t('common.saving', 'Saving...') : <><Check size={14} /> {t('gam.save_api_keys', 'Save API Keys')}</>}
                </button>
              </div>
            </div>
          </form>
        </div>
      ))}

      {loading ? (
        <div className="loading-screen"><div className="spinner"></div></div>
      ) : accounts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon" style={{ marginBottom: 16 }}><Radio size={40} /></div>
          <h3>{t('gam.no_accounts', 'No GAM Accounts Connected')}</h3>
          <p className="text-muted">{t('gam.no_accounts_hint', 'Connect a Google account to start syncing revenue data.')}</p>
          <button className="btn btn-primary" onClick={handleConnect} style={{ marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={14} /> {t('gam.connect_now', 'Connect Now')}
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 20 }}>
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
                  <div className="text-muted" style={{ marginBottom: 4 }}>{t('gam.network_code_label', 'Network Code')}</div>
                  <code style={{ fontSize: 12 }}>{acc.network_code || 'N/A'}</code>
                </div>
                <div>
                  <div className="text-muted" style={{ marginBottom: 4 }}>{t('gam.linked_websites', 'Linked Websites')}</div>
                  <div style={{ fontWeight: 500 }}>{acc.websites_count}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--color-border)' }}>
                <button 
                  className="btn btn-secondary btn-sm" 
                  style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                  onClick={() => openEditModal(acc)}
                >
                  <Edit size={12} /> {t('common.edit', 'Edit')}
                </button>
                <button 
                  className="btn btn-secondary btn-sm" 
                  onClick={() => handleRefresh(acc.id)}
                  title="Refresh Token"
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <RefreshCw size={12} />
                </button>
                <button 
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDelete(acc.id)}
                  title="Disconnect"
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Trash2 size={12} />
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
              <span className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit size={18} style={{ color: 'var(--br-primary)' }} /> {t('gam.edit_account', 'Edit GAM Account')}
              </span>
              <button
                onClick={() => setEditingAccount(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--br-text-3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 4,
                  borderRadius: 6,
                  transition: 'var(--br-transition)'
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--br-text)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--br-text-3)'}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleEditSave} className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">{t('gam.account_name', 'Account Name')}</label>
                <input 
                  className="form-input" 
                  value={editForm.name}
                  onChange={e => setEditForm(f => ({...f, name: e.target.value}))}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t('gam.network_code_label', 'Network Code')}</label>
                <input 
                  className="form-input" 
                  placeholder="e.g. 12345678"
                  value={editForm.network_code}
                  onChange={e => setEditForm(f => ({...f, network_code: e.target.value}))}
                />
                <div className="text-muted text-xs" style={{ marginTop: 4 }}>
                  {t('gam.network_code_hint', 'Found in your Google Ad Manager URL:')} <br/><code>admanager.google.com/YOUR_NETWORK_CODE</code>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">{t('gam.ads_txt_label', 'Ads.txt Content')}</label>
                <textarea 
                  className="form-input" 
                  style={{ minHeight: '120px', fontFamily: 'monospace', fontSize: '13px' }}
                  placeholder="e.g. google.com, pub-1234567890, DIRECT, f08c47fec0942fa0"
                  value={editForm.ads_txt}
                  onChange={e => setEditForm(f => ({...f, ads_txt: e.target.value}))}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditingAccount(null)}>{t('common.cancel', 'Cancel')}</button>
                <button type="submit" className="btn btn-primary">{t('common.save_changes', 'Save Changes')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
