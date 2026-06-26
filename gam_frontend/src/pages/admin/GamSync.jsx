import { useState, useEffect, useRef } from 'react'
import { adminApi, gamAccountsApi } from '../../api/endpoints'
import toast from 'react-hot-toast'
import { useSettings } from '../../contexts/SettingsContext'
import { RefreshCw, Play, Check, AlertTriangle, X, Cpu, Terminal, History, BarChart2, User } from 'lucide-react'
import { useI18n } from '../../contexts/I18nContext'
import Pagination from '../../components/Pagination'



function fmtDuration(sec) {
  if (sec == null) return '—'
  if (sec < 60) return `${sec}s`
  return `${Math.floor(sec / 60)}m ${sec % 60}s`
}

function StatusBadge({ status }) {
  const map = {
    running:  { icon: <RefreshCw size={12} className="spinner" />, color: '#3b82f6', label: 'Running'  },
    success:  { icon: <Check size={12} />, color: '#10b981', label: 'Success'  },
    partial:  { icon: <AlertTriangle size={12} />, color: '#f59e0b', label: 'Partial'  },
    failed:   { icon: <X size={12} />, color: '#ef4444', label: 'Failed'   },
  }
  const s = map[status] || { icon: null, color: '#64748b', label: status }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600,
      background: s.color + '22', color: s.color, border: `1px solid ${s.color}44`,
    }}>
      {s.icon}
      <span>{s.label}</span>
    </span>
  )
}

function TriggerBadge({ triggeredBy }) {
  const isManual = triggeredBy === 'manual'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600,
      background: isManual ? '#8b5cf622' : '#64748b22',
      color:      isManual ? '#a78bfa'   : '#94a3b8',
      border:     `1px solid ${isManual ? '#8b5cf644' : '#64748b44'}`,
    }}>
      {isManual ? <><User size={11} /> Manual</> : <><Cpu size={11} /> Automatic</>}
    </span>
  )
}

function LastSyncTime({ startedAt, fmt }) {
  const [timeAgo, setTimeAgo] = useState('')

  useEffect(() => {
    if (!startedAt) return

    const updateTime = () => {
      const diff = Date.now() - new Date(startedAt).getTime()
      const s = Math.floor(diff / 1000)
      if (s < 0) {
        setTimeAgo('0s ago')
        return
      }
      if (s < 60) {
        setTimeAgo(`${s}s ago`)
        return
      }
      const m = Math.floor(s / 60)
      if (m < 60) {
        setTimeAgo(`${m}m ago`)
        return
      }
      const h = Math.floor(m / 60)
      if (h < 24) {
        setTimeAgo(`${h}h ago`)
        return
      }
      const d = Math.floor(h / 24)
      if (d < 30) {
        setTimeAgo(`${d}d ago`)
        return
      }
      const mo = Math.floor(d / 30)
      setTimeAgo(`${mo}mo ago`)
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [startedAt])

  return (
    <>
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)' }}>{fmt(startedAt)}</div>
      {timeAgo && (
        <div style={{ fontSize: 12, color: 'var(--color-text-subtle)', marginTop: 2, fontWeight: 400 }}>
          {timeAgo}
        </div>
      )}
    </>
  )
}

function PublisherSelect({ publishers, value, onChange }) {
  const { t } = useI18n()
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [hoveredId, setHoveredId] = useState(null)
  
  const selected = publishers.find(p => String(p.id) === String(value))
  const filtered = publishers.filter(p => 
    (p.name || '').toLowerCase().includes(search.toLowerCase()) || 
    (p.email || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ position: 'relative', width: '100%' }} onBlur={e => { if(!e.currentTarget.contains(e.relatedTarget)) setOpen(false) }}>
      <div 
        className="form-select" 
        style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '38px' }} 
        onClick={() => setOpen(!open)}
        tabIndex={0}
      >
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selected ? selected.name : t('common.all_publishers', 'All Publishers')}</span>
        <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>▼</span>
      </div>
      {open && (
        <div style={{ 
          position: 'absolute', 
          top: 'calc(100% + 4px)', 
          left: 0, 
          right: 0, 
          zIndex: 1000, 
          background: 'var(--color-surface-2)', 
          border: '1px solid var(--color-border-light)', 
          borderRadius: 'var(--radius-md)', 
          marginTop: 4, 
          maxHeight: 250, 
          overflow: 'auto', 
          boxShadow: 'var(--shadow-md)' 
        }}>
          <div style={{ padding: 8, borderBottom: '1px solid var(--color-border-light)', position: 'sticky', top: 0, background: 'var(--color-surface-2)', zIndex: 11 }}>
            <input 
              autoFocus
              className="form-input" 
              placeholder={t('common.search_publisher', 'Search publisher...')} 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              style={{ padding: '4px 8px', height: '30px' }}
            />
          </div>
          <div 
            style={{ 
              padding: '8px 12px', 
              cursor: 'pointer', 
              borderBottom: '1px solid var(--color-border-light)',
              background: hoveredId === 'all' ? 'var(--color-surface-3)' : 'transparent',
              transition: 'background 0.15s'
            }} 
            onMouseDown={() => { onChange(''); setOpen(false); setSearch('') }}
            onMouseEnter={() => setHoveredId('all')}
            onMouseLeave={() => setHoveredId(null)}
          >
            {t('common.all_publishers', 'All Publishers')}
          </div>
          {filtered.map(p => {
            const isSelected = String(value) === String(p.id)
            const isHovered = hoveredId === p.id
            return (
              <div 
                key={p.id} 
                style={{ 
                  padding: '8px 12px', 
                  cursor: 'pointer', 
                  background: isSelected ? 'rgba(0, 242, 254, 0.15)' : (isHovered ? 'var(--color-surface-3)' : 'transparent'), 
                  borderBottom: '1px solid var(--color-border-light)',
                  color: isSelected ? 'var(--color-primary)' : 'var(--color-text)',
                  transition: 'background 0.15s'
                }} 
                onMouseDown={() => { onChange(p.id); setOpen(false); setSearch('') }}
                onMouseEnter={() => setHoveredId(p.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <div style={{ fontWeight: 600 }}>{p.name}</div>
                <div style={{ fontSize: 11, color: isSelected ? 'rgba(0, 242, 254, 0.7)' : 'var(--color-text-muted)' }}>{p.email}</div>
              </div>
            )
          })}
          {filtered.length === 0 && (
            <div style={{ padding: '8px 12px', color: 'var(--color-text-muted)', fontSize: 12, textAlign: 'center' }}>{t('common.no_publishers_found', 'No publishers found')}</div>
          )}
        </div>
      )}
    </div>
  )
}

function GamAccountSelect({ gamAccounts, value, onChange }) {
  const { t } = useI18n()
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [hoveredId, setHoveredId] = useState(null)
  
  const selected = gamAccounts.find(a => String(a.id) === String(value))
  const filtered = gamAccounts.filter(a => 
    (a.name || '').toLowerCase().includes(search.toLowerCase()) || 
    (a.email || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ position: 'relative', width: '100%' }} onBlur={e => { if(!e.currentTarget.contains(e.relatedTarget)) setOpen(false) }}>
      <div 
        className="form-select" 
        style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '38px' }} 
        onClick={() => setOpen(!open)}
        tabIndex={0}
      >
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selected ? `${selected.name} (${selected.email})` : t('common.all_gam_accounts', 'All GAM Accounts')}</span>
        <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>▼</span>
      </div>
      {open && (
        <div style={{ 
          position: 'absolute', 
          top: 'calc(100% + 4px)', 
          left: 0, 
          right: 0, 
          zIndex: 1000, 
          background: 'var(--color-surface-2)', 
          border: '1px solid var(--color-border-light)', 
          borderRadius: 'var(--radius-md)', 
          marginTop: 4, 
          maxHeight: 250, 
          overflow: 'auto', 
          boxShadow: 'var(--shadow-md)' 
        }}>
          <div style={{ padding: 8, borderBottom: '1px solid var(--color-border-light)', position: 'sticky', top: 0, background: 'var(--color-surface-2)', zIndex: 11 }}>
            <input 
              autoFocus
              className="form-input" 
              placeholder={t('common.search_account', 'Search account...')} 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              style={{ padding: '4px 8px', height: '30px' }}
            />
          </div>
          <div 
            style={{ 
              padding: '8px 12px', 
              cursor: 'pointer', 
              borderBottom: '1px solid var(--color-border-light)',
              background: hoveredId === 'all' ? 'var(--color-surface-3)' : 'transparent',
              transition: 'background 0.15s'
            }} 
            onMouseDown={() => { onChange(''); setOpen(false); setSearch('') }}
            onMouseEnter={() => setHoveredId('all')}
            onMouseLeave={() => setHoveredId(null)}
          >
            {t('common.all_gam_accounts', 'All GAM Accounts')}
          </div>
          {filtered.map(a => {
            const isSelected = String(value) === String(a.id)
            const isHovered = hoveredId === a.id
            return (
              <div 
                key={a.id} 
                style={{ 
                  padding: '8px 12px', 
                  cursor: 'pointer', 
                  background: isSelected ? 'rgba(0, 242, 254, 0.15)' : (isHovered ? 'var(--color-surface-3)' : 'transparent'), 
                  borderBottom: '1px solid var(--color-border-light)',
                  color: isSelected ? 'var(--color-primary)' : 'var(--color-text)',
                  transition: 'background 0.15s'
                }} 
                onMouseDown={() => { onChange(a.id); setOpen(false); setSearch('') }}
                onMouseEnter={() => setHoveredId(a.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <div style={{ fontWeight: 600 }}>{a.name}</div>
                <div style={{ fontSize: 11, color: isSelected ? 'rgba(0, 242, 254, 0.7)' : 'var(--color-text-muted)' }}>{a.email}</div>
              </div>
            )
          })}
          {filtered.length === 0 && (
            <div style={{ padding: '8px 12px', color: 'var(--color-text-muted)', fontSize: 12, textAlign: 'center' }}>{t('common.no_accounts_found', 'No accounts found')}</div>
          )}
        </div>
      )}
    </div>
  )
}

export default function GamSyncPage() {
  const { settings, formatDateTime } = useSettings()
  const { t } = useI18n()
  const fmt = (dt) => {
    if (!dt) return '—'
    return formatDateTime(dt, true)
  }

  const getPlatformDateStr = (daysAgo = 0) => {
    const timezone = settings.platform_timezone || 'UTC'
    try {
      const formatter = new Intl.DateTimeFormat('sv-SE', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
      const formatted = formatter.format(new Date())
      if (daysAgo === 0) {
        return formatted
      }
      const parts = formatted.split('-')
      const localDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10) - daysAgo)
      const y = localDate.getFullYear()
      const m = String(localDate.getMonth() + 1).padStart(2, '0')
      const d = String(localDate.getDate()).padStart(2, '0')
      return `${y}-${m}-${d}`
    } catch (err) {
      console.error('Timezone offset error:', err)
      return new Date(Date.now() - daysAgo * 86400000).toISOString().slice(0, 10)
    }
  }

  const today = getPlatformDateStr(0)
  const threeDaysAgo = getPlatformDateStr(2)

  const [syncing,   setSyncing]   = useState(false)
  const [logs,      setLogs]      = useState([])
  const [logsLoading, setLogsLoading] = useState(true)
  const [publishers, setPublishers] = useState([])
  const [gamAccounts, setGamAccounts] = useState([])
  const [output,    setOutput]    = useState('')
  const [showOutput, setShowOutput] = useState(false)
  const [logsPage, setLogsPage] = useState(1)
  const LOGS_PAGE_SIZE = 20

  const [filters, setFilters] = useState({
    preset:         '3d',
    date_from:      threeDaysAgo,
    date_to:        today,
    publisher_id:   '',
    gam_account_id: '',
  })

  const handlePresetChange = (preset) => {
    let from = filters.date_from
    let to = filters.date_to

    if (preset === 'today') {
      from = getPlatformDateStr(0)
      to = getPlatformDateStr(0)
    } else if (preset === 'yesterday') {
      from = getPlatformDateStr(1)
      to = getPlatformDateStr(1)
    } else if (preset === '3d') {
      from = getPlatformDateStr(2)
      to = getPlatformDateStr(0)
    } else if (preset === '7d') {
      from = getPlatformDateStr(6)
      to = getPlatformDateStr(0)
    } else if (preset === '14d') {
      from = getPlatformDateStr(13)
      to = getPlatformDateStr(0)
    } else if (preset === '30d') {
      from = getPlatformDateStr(29)
      to = getPlatformDateStr(0)
    } else if (preset === '60d') {
      from = getPlatformDateStr(59)
      to = getPlatformDateStr(0)
    } else if (preset === '90d') {
      from = getPlatformDateStr(89)
      to = getPlatformDateStr(0)
    }

    setFilters(f => ({
      ...f,
      preset,
      date_from: from,
      date_to: to
    }))
  }

  // Re-align default range when timezone settings load
  useEffect(() => {
    if (settings.platform_timezone) {
      setFilters(f => ({
        ...f,
        preset: '3d',
        date_from: getPlatformDateStr(2),
        date_to: getPlatformDateStr(0)
      }))
    }
  }, [settings.platform_timezone])

  const outputRef = useRef(null)

  useEffect(() => {
    loadAll()
  }, [])

  useEffect(() => {
    if (showOutput && outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [output, showOutput])

  async function loadLogs(showError = true) {
    setLogsLoading(true)
    try {
      const res = await adminApi.getSyncLogs()
      setLogs(res.data || [])
    } catch (err) {
      console.error('sync-logs error:', err)
      if (showError) toast.error(t('sync.toast_load_fail', 'Could not load sync history'))
    } finally {
      setLogsLoading(false)
    }
  }

  async function loadDropdowns() {
    const [pubResult, gamResult] = await Promise.allSettled([
      adminApi.getPublishers(),
      gamAccountsApi.getAll(),
    ])
    if (pubResult.status === 'fulfilled') {
      const raw = pubResult.value.data
      setPublishers(Array.isArray(raw) ? raw : (raw?.data || []))
    } else {
      console.error('publishers error:', pubResult.reason)
    }
    if (gamResult.status === 'fulfilled') {
      setGamAccounts(gamResult.value.data || [])
    } else {
      console.error('gam-accounts error:', gamResult.reason)
    }
  }

  async function loadAll() {
    // Load dropdowns first (fast, non-blocking)
    loadDropdowns()
    // Load logs separately
    loadLogs(false) // suppress toast on initial mount
  }

  async function handleSync() {
    if (filters.date_from && filters.date_to) {
      const fromDate = new Date(filters.date_from)
      const toDate = new Date(filters.date_to)
      const diffTime = Math.abs(toDate - fromDate)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      if (diffDays > 90) {
        toast.error(t('sync.toast_max_days_error', 'Maximum date range is 90 days'))
        return
      }
    }

    setSyncing(true)
    setOutput('')
    setShowOutput(true)
    try {
      const payload = {}
      if (filters.date_from)      payload.date_from      = filters.date_from
      if (filters.date_to)        payload.date_to        = filters.date_to
      if (filters.publisher_id)   payload.publisher_id   = filters.publisher_id
      if (filters.gam_account_id) payload.gam_account_id = filters.gam_account_id

      const res = await adminApi.runSync(payload)
      console.log('Sending sync payload:', payload)
      setOutput(res.data.output || 'Sync completed.')
      toast.success(t('sync.toast_success', 'GAM Sync completed successfully!'))
      // Reload only logs after sync — wait briefly so PHP server is fully free
      setTimeout(() => loadLogs(true), 800)
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Sync failed'
      setOutput(msg)
      toast.error(t('sync.toast_fail', 'Sync failed') + ': ' + msg)
    } finally {
      setSyncing(false)
    }
  }

  const lastSync = logs[0] || null

  const defaultDateFrom = getPlatformDateStr(2)
  const defaultDateTo = getPlatformDateStr(0)

  const isFilterSelected =
    filters.preset !== '3d' ||
    filters.publisher_id !== '' ||
    filters.gam_account_id !== '' ||
    filters.date_from !== defaultDateFrom ||
    filters.date_to !== defaultDateTo

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RefreshCw size={26} style={{ color: 'var(--br-primary)' }} />
            <span>{t('sync.title', 'Manual Sync Center')}</span>
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--color-text-subtle)', fontSize: 14 }}>
            {t('sync.subtitle', 'Trigger targeted GAM data synchronisation with custom filters')}
          </p>
        </div>
      </div>

      {/* Last Sync Banner */}
      {lastSync && (
        <div style={{
          background: 'var(--color-surface-raised)',
          border: '1px solid var(--color-border)',
          borderRadius: 14,
          padding: '18px 24px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 32,
          alignItems: 'center',
        }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--color-text-subtle)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{t('sync.last_sync', 'Last Sync')}</div>
            <LastSyncTime startedAt={lastSync.started_at} fmt={fmt} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--color-text-subtle)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{t('sync.type', 'Type')}</div>
            <TriggerBadge triggeredBy={lastSync.triggered_by} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--color-text-subtle)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{t('common.status', 'Status')}</div>
            <StatusBadge status={lastSync.status} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--color-text-subtle)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{t('sync.duration', 'Duration')}</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)' }}>{fmtDuration(lastSync.duration_sec)}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--color-text-subtle)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{t('sync.rows_matched', 'Rows Matched')}</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#10b981' }}>{lastSync.rows_matched ?? 0}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--color-text-subtle)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{t('sync.rows_skipped', 'Rows Skipped')}</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#f59e0b' }}>{lastSync.rows_skipped ?? 0}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--color-text-subtle)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{t('sync.locked', 'Locked')}</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#64748b' }}>{lastSync.rows_locked ?? 0}</div>
          </div>
        </div>
      )}

      {/* Filter Panel */}
      <div className="card" style={{ padding: 24, position: 'relative', zIndex: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-subtle)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20 }}>
          {t('sync.filters', 'Sync Filters')}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">{t('sync.preset_label', 'Period')}</label>
            <select
              className="form-input"
              value={filters.preset}
              onChange={e => handlePresetChange(e.target.value)}
            >
              <option value="today">{t('sync.presets.today', 'Today')}</option>
              <option value="yesterday">{t('sync.presets.yesterday', 'Yesterday')}</option>
              <option value="3d">{t('sync.presets.last_3_days', 'Last 3 days')}</option>
              <option value="7d">{t('sync.presets.last_7_days', 'Last 7 days')}</option>
              <option value="14d">{t('sync.presets.last_14_days', 'Last 14 days')}</option>
              <option value="30d">{t('sync.presets.last_30_days', 'Last 30 days')}</option>
              <option value="60d">{t('sync.presets.last_60_days', 'Last 60 days')}</option>
              <option value="90d">{t('sync.presets.last_90_days', 'Last 90 days')}</option>
              <option value="custom">{t('sync.presets.custom', 'Custom Range')}</option>
            </select>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">{t('sync.date_from', 'Date From')}</label>
            <input
              id="sync-date-from"
              type="date"
              className="form-input"
              value={filters.date_from}
              max={filters.date_to || today}
              onChange={e => setFilters(f => ({ ...f, date_from: e.target.value, preset: 'custom' }))}
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">{t('sync.date_to', 'Date To')}</label>
            <input
              id="sync-date-to"
              type="date"
              className="form-input"
              value={filters.date_to}
              min={filters.date_from}
              max={today}
              onChange={e => setFilters(f => ({ ...f, date_to: e.target.value, preset: 'custom' }))}
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">{t('sync.publisher_optional', 'Publisher (optional)')}</label>
            <PublisherSelect
              publishers={publishers}
              value={filters.publisher_id}
              onChange={val => setFilters(f => ({ ...f, publisher_id: val }))}
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">{t('sync.gam_account_optional', 'GAM Account (optional)')}</label>
            <GamAccountSelect
              gamAccounts={gamAccounts}
              value={filters.gam_account_id}
              onChange={val => setFilters(f => ({ ...f, gam_account_id: val }))}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: isFilterSelected ? 'space-between' : 'flex-end', alignItems: 'center', marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--color-border)' }}>
          {isFilterSelected && (
            <button
              type="button"
              className="btn btn-secondary btn-xs"
              style={{ color: '#ef4444', height: 38, padding: '0 16px', display: 'inline-flex', alignItems: 'center', borderRadius: 8 }}
              onClick={() => setFilters({ preset: '3d', date_from: getPlatformDateStr(2), date_to: getPlatformDateStr(0), publisher_id: '', gam_account_id: '' })}
            >
              {t('common.reset_filters', 'Reset Filters')}
            </button>
          )}
          <button
            id="btn-run-sync"
            className={`btn btn-primary${syncing ? ' btn-loading' : ''}`}
            disabled={syncing}
            onClick={handleSync}
            style={{ fontSize: 15, padding: '10px 28px', borderRadius: 10, display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            {syncing ? (
              <><RefreshCw size={14} className="spinner" /> {t('common.syncing', 'Syncing…')}</>
            ) : (
              <><Play size={14} /> {t('sync.run_sync_btn', 'Run Sync Now')}</>
            )}
          </button>
        </div>
      </div>

      {/* Output Terminal */}
      {showOutput && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{
            background: 'var(--color-surface-raised)',
            borderBottom: '1px solid var(--color-border)',
            padding: '12px 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-subtle)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Terminal size={14} /> {t('sync.output_title', 'Sync Output')}
            </span>
            <button className="btn btn-secondary btn-xs" onClick={() => setShowOutput(false)}>✕ {t('common.hide', 'Hide')}</button>
          </div>
          <pre
            ref={outputRef}
            style={{
              margin: 0,
              padding: '16px 20px',
              background: '#0a0a1a',
              color: '#a8e6cf',
              fontFamily: "'Fira Code', 'Courier New', monospace",
              fontSize: 12,
              lineHeight: 1.7,
              maxHeight: 320,
              overflowY: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            }}
          >
            {syncing && !output ? '⟳ Connecting to GAM servers…\n' : ''}
            {output || (syncing ? '' : 'No output.')}
          </pre>
        </div>
      )}

      {/* Sync History Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <History size={16} /> {t('sync.history', 'Sync History')}
          </span>
          <button
            className="btn btn-secondary btn-xs"
            onClick={loadAll}
            disabled={logsLoading}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            {logsLoading ? '…' : <><RefreshCw size={12} /> {t('common.refresh', 'Refresh')}</>}
          </button>
        </div>

        {logsLoading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-subtle)' }}>{t('common.loading', 'Loading…')}</div>
        ) : logs.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-subtle)' }}>
            {t('sync.no_history', 'No sync history yet. Run your first sync above.')}
          </div>
        ) : (
          <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
            <table className="table" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>{t('sync.col_type', 'Type')}</th>
                  <th>{t('common.status', 'Status')}</th>
                  <th>{t('sync.col_started', 'Started')}</th>
                  <th>{t('sync.duration', 'Duration')}</th>
                  <th>{t('sync.col_fetched', 'Fetched')}</th>
                  <th>{t('sync.rows_matched', 'Matched')}</th>
                  <th>{t('sync.rows_skipped', 'Skipped')}</th>
                  <th>{t('sync.locked', 'Locked')}</th>
                  <th>{t('sync.col_notes', 'Notes')}</th>
                </tr>
              </thead>
              <tbody>
                {logs.slice((logsPage - 1) * LOGS_PAGE_SIZE, logsPage * LOGS_PAGE_SIZE).map((log, idx) => (
                  <tr key={log.id} style={{ opacity: log.status === 'failed' ? 0.8 : 1 }}>
                    <td style={{ color: 'var(--color-text-subtle)', fontSize: 12 }}>
                      {logs.length - idx}
                    </td>
                    <td><TriggerBadge triggeredBy={log.triggered_by} /></td>
                    <td><StatusBadge status={log.status} /></td>
                    <td style={{ fontSize: 12, color: 'var(--color-text-subtle)' }}>{fmt(log.started_at)}</td>
                    <td style={{ fontWeight: 600 }}>{fmtDuration(log.duration_sec)}</td>
                    <td style={{ color: '#94a3b8' }}>{log.rows_fetched ?? 0}</td>
                    <td style={{ color: '#10b981', fontWeight: 600 }}>{log.rows_matched ?? 0}</td>
                    <td style={{ color: '#f59e0b' }}>{log.rows_skipped ?? 0}</td>
                    <td style={{ color: '#64748b' }}>{log.rows_locked ?? 0}</td>
                    <td style={{ fontSize: 11, color: log.error_message ? '#ef4444' : 'var(--color-text-subtle)', maxWidth: 220 }}>
                      {log.error_message
                        ? <span title={log.error_message} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><AlertTriangle size={12} /> {log.error_message.slice(0, 60)}{log.error_message.length > 60 ? '…' : ''}</span>
                        : '—'
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
              {logs.length > 0 && (
                <tfoot>
                  <tr style={{ background: 'rgba(99,102,241,.07)', fontWeight: 700, borderTop: '2px solid var(--color-border)' }}>
                    <td style={{ padding: '10px 16px', fontSize: 12 }} colSpan={5}>Totals ({logs.length})</td>
                    <td style={{ color: '#94a3b8' }}>
                      {logs.reduce((s, l) => s + (l.rows_fetched || 0), 0).toLocaleString()}
                    </td>
                    <td style={{ color: '#10b981', fontWeight: 600 }}>
                      {logs.reduce((s, l) => s + (l.rows_matched || 0), 0).toLocaleString()}
                    </td>
                    <td style={{ color: '#f59e0b' }}>
                      {logs.reduce((s, l) => s + (l.rows_skipped || 0), 0).toLocaleString()}
                    </td>
                    <td style={{ color: '#64748b' }}>
                      {logs.reduce((s, l) => s + (l.rows_locked || 0), 0).toLocaleString()}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
        <Pagination
          currentPage={logsPage}
          totalItems={logs.length}
          pageSize={LOGS_PAGE_SIZE}
          onPageChange={setLogsPage}
        />
      </div>

      {/* Stats Overview Cards */}
      {logs.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
          {[
            {
              label: t('sync.stat_total', 'Total Syncs'),
              value: logs.length,
              icon: <RefreshCw size={20} />,
              color: '#8b5cf6',
            },
            {
              label: t('sync.stat_manual', 'Manual Syncs'),
              value: logs.filter(l => l.triggered_by === 'manual').length,
              icon: <User size={20} />,
              color: '#a78bfa',
            },
            {
              label: t('sync.stat_auto', 'Auto Syncs'),
              value: logs.filter(l => l.triggered_by === 'scheduler').length,
              icon: <Cpu size={20} />,
              color: '#3b82f6',
            },
            {
              label: t('sync.stat_successful', 'Successful'),
              value: logs.filter(l => l.status === 'success').length,
              icon: <Check size={20} />,
              color: '#10b981',
            },
            {
              label: t('sync.stat_failed', 'Failed'),
              value: logs.filter(l => l.status === 'failed').length,
              icon: <X size={20} />,
              color: '#ef4444',
            },
            {
              label: t('sync.stat_rows_matched', 'Total Rows Matched'),
              value: logs.reduce((s, l) => s + (l.rows_matched || 0), 0).toLocaleString(),
              icon: <BarChart2 size={20} />,
              color: '#f59e0b',
            },
          ].map(stat => (
            <div
              key={stat.label}
              className="card"
              style={{
                padding: '18px 20px',
                display: 'flex', flexDirection: 'column', gap: 6,
                borderLeft: `3px solid ${stat.color}`,
              }}
            >
              <div style={{ color: stat.color }}>{stat.icon}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: 11, color: 'var(--color-text-subtle)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
