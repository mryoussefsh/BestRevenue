import { useState, useEffect } from 'react'
import { adminApi, gamAccountsApi } from '../../api/endpoints'
import { useI18n } from '../../contexts/I18nContext'
import toast from 'react-hot-toast'
import { AlertTriangle, Trash2, RefreshCw, RotateCcw, Lock, ShieldCheck, Database, LogOut, Info, ShieldAlert } from 'lucide-react'

export default function DangerZone() {
  const { t } = useI18n()
  const [accounts, setAccounts] = useState([])
  const [globalSync, setGlobalSync] = useState(true)
  const [loading, setLoading] = useState(true)
  
  // Modal state for double-confirmation
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    title: '',
    message: '',
    confirmWord: 'WIPE',
    inputVal: '',
    actionKey: '',
    loading: false,
    extraParam: null
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      // Load settings (to get global sync setting) and gam accounts
      const [settingsRes, accountsRes] = await Promise.all([
        adminApi.getSettings(),
        gamAccountsApi.getAll()
      ])
      
      const globalSyncSetting = settingsRes.data.find(s => s.key === 'global_sync_enabled')
      if (globalSyncSetting) {
        setGlobalSync(globalSyncSetting.value === true || globalSyncSetting.value === 'true')
      }
      
      setAccounts(accountsRes.data)
    } catch (err) {
      toast.error(t('danger.toast_load_fail', 'Failed to load system status.'))
    } finally {
      setLoading(false)
    }
  }

  // Toggle Global Sync setting
  async function handleToggleGlobalSync(val) {
    const toastId = toast.loading(t('danger.toggling_global_sync', 'Updating global sync setting...'))
    try {
      await adminApi.updateSetting('global_sync_enabled', val)
      setGlobalSync(val)
      toast.success(
        val 
          ? t('danger.global_sync_enabled_success', 'Global synchronization has been enabled.')
          : t('danger.global_sync_disabled_success', 'Global synchronization has been paused.'), 
        { id: toastId }
      )
    } catch {
      toast.error(t('danger.global_sync_update_failed', 'Failed to update global sync setting.'), { id: toastId })
    }
  }

  // Toggle Per-Account Sync setting
  async function handleToggleAccountSync(accountId, currentVal) {
    const targetVal = !currentVal
    const toastId = toast.loading(t('danger.toggling_account_sync', 'Updating account sync setting...'))
    try {
      await gamAccountsApi.update(accountId, { sync_enabled: targetVal })
      setAccounts(prev => prev.map(a => a.id === accountId ? { ...a, sync_enabled: targetVal } : a))
      toast.success(
        targetVal
          ? t('danger.account_sync_enabled_success', 'Sync enabled for this account.')
          : t('danger.account_sync_disabled_success', 'Sync paused for this account.'),
        { id: toastId }
      )
    } catch {
      toast.error(t('danger.account_sync_update_failed', 'Failed to update account sync setting.'), { id: toastId })
    }
  }

  // Open the double-confirmation modal
  function requestAction(actionKey, title, message, confirmWord = 'WIPE', extraParam = null) {
    setConfirmModal({
      open: true,
      title,
      message,
      confirmWord,
      inputVal: '',
      actionKey,
      loading: false,
      extraParam
    })
  }

  // Execute the confirmed dangerous action
  async function executeConfirmedAction() {
    const { actionKey, extraParam } = confirmModal
    setConfirmModal(prev => ({ ...prev, loading: true }))
    const toastId = toast.loading(t('danger.executing_action', 'Executing request...'))

    try {
      let res
      switch (actionKey) {
        case 'wipeRevenue':
          res = await adminApi.wipeRevenue()
          toast.success(res.data.message || t('danger.wipe_revenue_success', 'Revenue data wiped successfully.'), { id: toastId })
          break
        case 'wipeAuditLogs':
          res = await adminApi.wipeAuditLogs()
          toast.success(res.data.message || t('danger.wipe_audit_success', 'Audit logs wiped successfully.'), { id: toastId })
          break
        case 'pruneTraffic':
          res = await adminApi.pruneTraffic(extraParam)
          toast.success(res.data.message || t('danger.prune_traffic_success', 'Traffic data pruned.'), { id: toastId })
          break
        case 'flushCache':
          res = await adminApi.flushCache()
          toast.success(res.data.message || t('danger.flush_cache_success', 'System cache cleared.'), { id: toastId })
          break
        case 'forceLogout':
          res = await adminApi.forceLogoutSessions()
          toast.success(res.data.message || t('danger.force_logout_success', 'All other sessions invalidated.'), { id: toastId })
          break
        case 'refreshTokens':
          res = await adminApi.refreshAllTokens()
          toast.success(res.data.message || t('danger.refresh_tokens_success', 'Tokens refreshed.'), { id: toastId })
          break
        case 'resetConfig':
          res = await adminApi.resetConfig()
          toast.success(res.data.message || t('danger.reset_config_success', 'Configurations reset.'), { id: toastId })
          // Reload settings and list
          loadData()
          break
        default:
          throw new Error('Unsupported action')
      }
      setConfirmModal({ open: false, title: '', message: '', confirmWord: 'WIPE', inputVal: '', actionKey: '', loading: false, extraParam: null })
    } catch (err) {
      toast.error(err.response?.data?.message || t('danger.action_failed', 'Action execution failed.'), { id: toastId })
      setConfirmModal(prev => ({ ...prev, loading: false }))
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div className="spinner" style={{ borderLeftColor: 'var(--color-primary)' }} />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#f43f5e' }}>
            <ShieldAlert size={28} /> {t('danger.title', 'Danger Zone & Security')}
          </h1>
          <p className="page-subtitle">{t('danger.subtitle', 'Configure system sync settings and execute highly destructive administrator actions.')}</p>
        </div>
      </div>

      {/* Critical Warning Alert Banner */}
      <div style={{
        background: 'rgba(244, 63, 94, 0.12)',
        border: '1px solid rgba(244, 63, 94, 0.3)',
        borderRadius: '12px',
        padding: '16px 20px',
        display: 'flex',
        gap: '16px',
        alignItems: 'flex-start',
        marginBottom: '32px',
        backdropFilter: 'blur(8px)'
      }}>
        <AlertTriangle size={24} style={{ color: '#f43f5e', flexShrink: 0, marginTop: 2 }} />
        <div>
          <h4 style={{ margin: '0 0 6px 0', color: '#f43f5e', fontWeight: 700 }}>
            {t('danger.warning_title', 'ATTENTION: Highly Destructive Operations')}
          </h4>
          <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--color-text-subtle)', lineHeight: 1.5 }}>
            {t('danger.warning_desc', 'The operations listed below are highly destructive. Running these actions can permanently erase financial records, configuration settings, or terminate active sessions. These tools are restricted to Super Administrators only. Please exercise extreme caution.')}
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>
        
        {/* Section 1: Sync Controls */}
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RefreshCw size={18} /> {t('danger.section_sync_title', 'Synchronization Control')}
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            
            {/* Global Sync Controller Card */}
            <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>
                    {t('danger.global_sync_card_title', 'Global Automated Sync')}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ 
                      fontSize: '11px', 
                      fontWeight: 700, 
                      textTransform: 'uppercase', 
                      padding: '2px 8px', 
                      borderRadius: '999px',
                      background: globalSync ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                      color: globalSync ? '#10b981' : '#f43f5e'
                    }}>
                      {globalSync ? t('danger.status_active', 'Active') : t('danger.status_paused', 'Paused')}
                    </span>
                  </div>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--color-text-subtle)', lineHeight: '1.5', margin: '0 0 20px 0' }}>
                  {t('danger.global_sync_card_desc', 'Enable or disable the automatic background fetching of revenue data from all connected Google Ad Manager accounts.')}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--color-border-light)', paddingTop: '16px' }}>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>
                  {globalSync ? t('danger.sync_is_running', 'Background sync runs automatically') : t('danger.sync_is_stopped', 'All automated sync runs are stopped')}
                </span>
                
                {/* Switch Toggle */}
                <label className="toggle-switch" style={{ cursor: 'pointer', display: 'inline-flex', position: 'relative', width: '46px', height: '24px' }}>
                  <input 
                    type="checkbox" 
                    checked={globalSync}
                    onChange={(e) => handleToggleGlobalSync(e.target.checked)}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{
                    position: 'absolute',
                    cursor: 'pointer',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: globalSync ? 'var(--color-primary)' : 'var(--color-surface-3)',
                    transition: '0.3s',
                    borderRadius: '34px',
                    border: '1px solid var(--color-border-light)'
                  }} />
                  <span style={{
                    position: 'absolute',
                    content: '""',
                    height: '18px', width: '18px',
                    left: globalSync ? '24px' : '3px',
                    bottom: '2px',
                    backgroundColor: '#fff',
                    transition: '0.3s',
                    borderRadius: '50%',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                  }} />
                </label>
              </div>
            </div>

            {/* GAM Accounts Sync Status Card */}
            <div className="card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 16px 0' }}>
                {t('danger.account_sync_title', 'Per-Account Sync Toggles')}
              </h3>
              
              {accounts.length === 0 ? (
                <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: 0 }}>
                  {t('danger.no_accounts_connected', 'No GAM accounts connected.')}
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '200px', overflowY: 'auto', paddingRight: '4px' }}>
                  {accounts.map(acc => (
                    <div key={acc.id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 14px',
                      background: 'var(--color-surface-3)',
                      borderRadius: '8px',
                      border: '1px solid var(--color-border-light)'
                    }}>
                      <div style={{ overflow: 'hidden', marginRight: '12px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {acc.name}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {acc.email}
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
                        {/* Switch Toggle for Per-Account */}
                        <label className="toggle-switch" style={{ cursor: 'pointer', display: 'inline-flex', position: 'relative', width: '42px', height: '22px' }}>
                          <input 
                            type="checkbox" 
                            checked={acc.sync_enabled !== false}
                            onChange={() => handleToggleAccountSync(acc.id, acc.sync_enabled !== false)}
                            style={{ opacity: 0, width: 0, height: 0 }}
                          />
                          <span style={{
                            position: 'absolute',
                            cursor: 'pointer',
                            top: 0, left: 0, right: 0, bottom: 0,
                            backgroundColor: (acc.sync_enabled !== false) ? '#10b981' : 'var(--color-surface-4)',
                            transition: '0.3s',
                            borderRadius: '34px',
                            border: '1px solid var(--color-border)'
                          }} />
                          <span style={{
                            position: 'absolute',
                            content: '""',
                            height: '16px', width: '16px',
                            left: (acc.sync_enabled !== false) ? '22px' : '3px',
                            bottom: '2px',
                            backgroundColor: '#fff',
                            transition: '0.3s',
                            borderRadius: '50%'
                          }} />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Section 2: Destructive / Danger Actions */}
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#f43f5e' }}>
            <Lock size={18} /> {t('danger.section_actions_title', 'Destructive Actions')}
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
            
            {/* Action 1: Wipe Revenue Records */}
            <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderLeft: '3px solid #f43f5e' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f43f5e', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Trash2 size={16} /> {t('danger.wipe_revenue_title', 'Wipe All Revenue Data')}
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--color-text-subtle)', lineHeight: 1.5, margin: '0 0 16px 0' }}>
                  {t('danger.wipe_revenue_desc', 'Permanently deletes all daily/hourly revenue records and manual sync logs from the database. Financial periods that are closed or closing will remain locked and untouched.')}
                </p>
              </div>
              <button 
                className="btn btn-danger" 
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => requestAction(
                  'wipeRevenue',
                  t('danger.wipe_revenue_confirm_title', 'Confirm Revenue Data Wipe'),
                  t('danger.wipe_revenue_confirm_msg', 'This will permanently destroy all un-closed revenue records. This action is irreversible. Type WIPE below to proceed:'),
                  'WIPE'
                )}
              >
                {t('danger.wipe_revenue_btn', 'Wipe All Revenue Data')}
              </button>
            </div>

            {/* Action 2: Wipe Audit Logs */}
            <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderLeft: '3px solid #f43f5e' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f43f5e', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Database size={16} /> {t('danger.wipe_audit_title', 'Wipe All Audit Logs')}
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--color-text-subtle)', lineHeight: 1.5, margin: '0 0 16px 0' }}>
                  {t('danger.wipe_audit_desc', 'Clears the entire system activity and audit trail logs. For security purposes, a new log entry recording this wipe operation itself will be immediately inserted.')}
                </p>
              </div>
              <button 
                className="btn btn-danger" 
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => requestAction(
                  'wipeAuditLogs',
                  t('danger.wipe_audit_confirm_title', 'Confirm Audit Logs Wipe'),
                  t('danger.wipe_audit_confirm_msg', 'This will permanently delete the entire admin action audit history log. Type WIPE below to proceed:'),
                  'WIPE'
                )}
              >
                {t('danger.wipe_audit_btn', 'Wipe All Audit Logs')}
              </button>
            </div>

            {/* Action 3: Prune Traffic Data */}
            <PruneTrafficCard requestAction={requestAction} t={t} />

            {/* Action 4: Flush Cache */}
            <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderLeft: '3px solid #f59e0b' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f59e0b', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <RefreshCw size={16} /> {t('danger.flush_cache_title', 'Flush System Cache')}
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--color-text-subtle)', lineHeight: 1.5, margin: '0 0 16px 0' }}>
                  {t('danger.flush_cache_desc', 'Invalidates and clears all cached data, query caches, and temporary settings. Cache will automatically rebuild as users access the platform.')}
                </p>
              </div>
              <button 
                className="btn btn-warning" 
                style={{ width: '100%', justifyContent: 'center', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)' }}
                onClick={() => requestAction(
                  'flushCache',
                  t('danger.flush_cache_confirm_title', 'Confirm Cache Flush'),
                  t('danger.flush_cache_confirm_msg', 'This will clear all application and Redis caches. The platform may temporarily run slower while the cache is rebuilding. Type FLUSH below to proceed:'),
                  'FLUSH'
                )}
              >
                {t('danger.flush_cache_btn', 'Flush System Cache')}
              </button>
            </div>

            {/* Action 5: Force Logout Sessions */}
            <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderLeft: '3px solid #ef4444' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#ef4444', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <LogOut size={16} /> {t('danger.force_logout_title', 'Force Logout Sessions')}
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--color-text-subtle)', lineHeight: 1.5, margin: '0 0 16px 0' }}>
                  {t('danger.force_logout_desc', 'Terminates all active login sessions and invalidates Sanctum tokens for all publishers and administrators. Your current session will remain active.')}
                </p>
              </div>
              <button 
                className="btn btn-danger" 
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => requestAction(
                  'forceLogout',
                  t('danger.force_logout_confirm_title', 'Confirm Bulk Session Invalidation'),
                  t('danger.force_logout_confirm_msg', 'This will immediately log out every single active publisher and administrator from the platform. Your active session will be spared. Type LOGOUT below to proceed:'),
                  'LOGOUT'
                )}
              >
                {t('danger.force_logout_btn', 'Force Logout All Sessions')}
              </button>
            </div>

            {/* Action 6: Bulk Refresh Tokens */}
            <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderLeft: '3px solid #f59e0b' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f59e0b', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={16} /> {t('danger.refresh_tokens_title', 'Force Token Refresh')}
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--color-text-subtle)', lineHeight: 1.5, margin: '0 0 16px 0' }}>
                  {t('danger.refresh_tokens_desc', 'Forces an immediate OAuth access token refresh request for all connected GAM accounts with Google API, verifying client credentials and OAuth status.')}
                </p>
              </div>
              <button 
                className="btn btn-warning" 
                style={{ width: '100%', justifyContent: 'center', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)' }}
                onClick={() => requestAction(
                  'refreshTokens',
                  t('danger.refresh_tokens_confirm_title', 'Confirm Bulk Token Refresh'),
                  t('danger.refresh_tokens_confirm_msg', 'This will call Google OAuth APIs to refresh keys for all accounts. Invalid or expired accounts will be flagged. Type REFRESH below to proceed:'),
                  'REFRESH'
                )}
              >
                {t('danger.refresh_tokens_btn', 'Bulk Refresh Tokens')}
              </button>
            </div>

            {/* Action 7: Reset Config to Default */}
            <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderLeft: '3px solid #f43f5e' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f43f5e', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <RotateCcw size={16} /> {t('danger.reset_config_title', 'Reset System Settings')}
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--color-text-subtle)', lineHeight: 1.5, margin: '0 0 16px 0' }}>
                  {t('danger.reset_config_desc', 'Resets all settings configurations (payout parameters, currency settings, email configurations, etc.) back to system defaults by re-running settings seeders.')}
                </p>
              </div>
              <button 
                className="btn btn-danger" 
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => requestAction(
                  'resetConfig',
                  t('danger.reset_config_confirm_title', 'Confirm Config Settings Reset'),
                  t('danger.reset_config_confirm_msg', 'This will wipe out all customized settings and restore defaults. Site layout, logos, API secrets, and layout options will be overwritten. Type RESET below to proceed:'),
                  'RESET'
                )}
              >
                {t('danger.reset_config_btn', 'Reset Config to Default')}
              </button>
            </div>

          </div>
        </div>

      </div>

      {/* Reusable Double-Confirmation Modal Component */}
      {confirmModal.open && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 2000,
          padding: '20px'
        }}>
          <div className="card" style={{
            maxWidth: '480px',
            width: '100%',
            padding: '28px',
            background: 'var(--color-surface-2)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            boxShadow: 'var(--shadow-xl)',
            borderRadius: '16px'
          }}>
            <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '16px' }}>
              <AlertTriangle size={24} style={{ color: '#f43f5e' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>
                {confirmModal.title}
              </h3>
            </div>
            
            <p style={{ fontSize: '13.5px', color: 'var(--color-text-subtle)', lineHeight: 1.5, margin: '0 0 20px 0' }}>
              {confirmModal.message}
            </p>

            <div style={{ marginBottom: '24px' }}>
              <input 
                type="text" 
                className="form-control"
                placeholder={t('danger.confirm_placeholder', 'Type confirmation word...')}
                value={confirmModal.inputVal}
                onChange={(e) => setConfirmModal(prev => ({ ...prev, inputVal: e.target.value }))}
                style={{
                  width: '100%',
                  background: 'var(--color-surface-3)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text)',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  textAlign: 'center',
                  letterSpacing: '1px'
                }}
                disabled={confirmModal.loading}
                autoFocus
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => setConfirmModal({ open: false, title: '', message: '', confirmWord: 'WIPE', inputVal: '', actionKey: '', loading: false, extraParam: null })}
                disabled={confirmModal.loading}
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <button 
                className="btn btn-danger" 
                onClick={executeConfirmedAction}
                disabled={confirmModal.loading || confirmModal.inputVal !== confirmModal.confirmWord}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  opacity: confirmModal.inputVal === confirmModal.confirmWord ? 1 : 0.65
                }}
              >
                {confirmModal.loading ? t('common.loading', 'Processing...') : t('common.confirm', 'Confirm Action')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

// Sub-component for Prune Traffic Data to encapsulate the input state
function PruneTrafficCard({ requestAction, t }) {
  const [retentionDays, setRetentionDays] = useState(30)

  return (
    <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderLeft: '3px solid #f59e0b' }}>
      <div>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f59e0b', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Info size={16} /> {t('danger.prune_traffic_title', 'Prune Old Traffic Data')}
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--color-text-subtle)', lineHeight: 1.5, margin: '0 0 16px 0' }}>
          {t('danger.prune_traffic_desc', 'Prunes old hourly/daily traffic stats, anomalies, and quality scores to clean database storage space.')}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600 }}>
            {t('danger.retention_label', 'Retention Period (Days):')}
          </label>
          <select 
            className="form-select"
            value={retentionDays}
            onChange={(e) => setRetentionDays(parseInt(e.target.value))}
            style={{ width: '100px', height: '32px', fontSize: '13px', padding: '0 8px' }}
          >
            <option value={7}>7</option>
            <option value={15}>15</option>
            <option value={30}>30</option>
            <option value={60}>60</option>
            <option value={90}>90</option>
            <option value={180}>180</option>
          </select>
        </div>
      </div>
      <button 
        className="btn btn-warning" 
        style={{ width: '100%', justifyContent: 'center', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)' }}
        onClick={() => requestAction(
          'pruneTraffic',
          t('danger.prune_traffic_confirm_title', 'Confirm Traffic Pruning'),
          t('danger.prune_traffic_confirm_msg', 'This will permanently delete all traffic history records older than {days} days from the database. Type PRUNE below to proceed:', { days: retentionDays }),
          'PRUNE',
          retentionDays
        )}
      >
        {t('danger.prune_traffic_btn', 'Prune Traffic Data')}
      </button>
    </div>
  )
}
