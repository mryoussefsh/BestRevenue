import { useState, useEffect, useRef } from 'react'
import { adminApi, gamAccountsApi } from '../../api/endpoints'
import toast from 'react-hot-toast'
import { useSettings } from '../../contexts/SettingsContext'



function fmtDuration(sec) {
  if (sec == null) return '—'
  if (sec < 60) return `${sec}s`
  return `${Math.floor(sec / 60)}m ${sec % 60}s`
}

function StatusBadge({ status }) {
  const map = {
    running:  { color: '#3b82f6', label: '⟳ Running'  },
    success:  { color: '#10b981', label: '✓ Success'  },
    partial:  { color: '#f59e0b', label: '⚠ Partial'  },
    failed:   { color: '#ef4444', label: '✗ Failed'   },
  }
  const s = map[status] || { color: '#64748b', label: status }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600,
      background: s.color + '22', color: s.color, border: `1px solid ${s.color}44`,
    }}>
      {s.label}
    </span>
  )
}

function TriggerBadge({ triggeredBy }) {
  const isManual = triggeredBy === 'manual'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600,
      background: isManual ? '#8b5cf622' : '#64748b22',
      color:      isManual ? '#a78bfa'   : '#94a3b8',
      border:     `1px solid ${isManual ? '#8b5cf644' : '#64748b44'}`,
    }}>
      {isManual ? '🖱 Manual' : '🤖 Automatic'}
    </span>
  )
}

export default function GamSyncPage() {
  const { settings, formatDateTime } = useSettings()
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
  const threeDaysAgo = getPlatformDateStr(3)

  const [syncing,   setSyncing]   = useState(false)
  const [logs,      setLogs]      = useState([])
  const [logsLoading, setLogsLoading] = useState(true)
  const [publishers, setPublishers] = useState([])
  const [gamAccounts, setGamAccounts] = useState([])
  const [output,    setOutput]    = useState('')
  const [showOutput, setShowOutput] = useState(false)

  const [filters, setFilters] = useState({
    date_from:      threeDaysAgo,
    date_to:        today,
    publisher_id:   '',
    gam_account_id: '',
  })

  // Re-align default range when timezone settings load
  useEffect(() => {
    if (settings.platform_timezone) {
      setFilters(f => ({
        ...f,
        date_from: getPlatformDateStr(3),
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
      if (showError) toast.error('Could not load sync history')
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
      toast.success('GAM Sync completed successfully!')
      // Reload only logs after sync — wait briefly so PHP server is fully free
      setTimeout(() => loadLogs(true), 800)
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Sync failed'
      setOutput(msg)
      toast.error('Sync failed: ' + msg)
    } finally {
      setSyncing(false)
    }
  }

  const lastSync = logs[0] || null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: 'var(--color-text-primary)' }}>
            🔄 Manual Sync Center
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--color-text-subtle)', fontSize: 14 }}>
            Trigger targeted GAM data synchronisation with custom filters
          </p>
        </div>
        <button
          id="btn-run-sync"
          className={`btn btn-primary${syncing ? ' btn-loading' : ''}`}
          disabled={syncing}
          onClick={handleSync}
          style={{ fontSize: 15, padding: '10px 28px', borderRadius: 10 }}
        >
          {syncing ? '⟳ Syncing…' : '▶ Run Sync Now'}
        </button>
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
            <div style={{ fontSize: 11, color: 'var(--color-text-subtle)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Last Sync</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)' }}>{fmt(lastSync.started_at)}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--color-text-subtle)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Type</div>
            <TriggerBadge triggeredBy={lastSync.triggered_by} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--color-text-subtle)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Status</div>
            <StatusBadge status={lastSync.status} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--color-text-subtle)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Duration</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)' }}>{fmtDuration(lastSync.duration_sec)}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--color-text-subtle)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Rows Matched</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#10b981' }}>{lastSync.rows_matched ?? 0}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--color-text-subtle)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Rows Skipped</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#f59e0b' }}>{lastSync.rows_skipped ?? 0}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--color-text-subtle)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Locked</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#64748b' }}>{lastSync.rows_locked ?? 0}</div>
          </div>
        </div>
      )}

      {/* Filter Panel */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-subtle)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20 }}>
          🎯 Sync Filters
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Date From</label>
            <input
              id="sync-date-from"
              type="date"
              className="form-input"
              value={filters.date_from}
              max={filters.date_to || today}
              onChange={e => setFilters(f => ({ ...f, date_from: e.target.value }))}
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Date To</label>
            <input
              id="sync-date-to"
              type="date"
              className="form-input"
              value={filters.date_to}
              min={filters.date_from}
              max={today}
              onChange={e => setFilters(f => ({ ...f, date_to: e.target.value }))}
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Publisher (optional)</label>
            <select
              id="sync-publisher"
              className="form-input"
              value={filters.publisher_id}
              onChange={e => setFilters(f => ({ ...f, publisher_id: e.target.value }))}
            >
              <option value="">All Publishers</option>
              {publishers.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">GAM Account (optional)</label>
            <select
              id="sync-gam-account"
              className="form-input"
              value={filters.gam_account_id}
              onChange={e => setFilters(f => ({ ...f, gam_account_id: e.target.value }))}
            >
              <option value="">All GAM Accounts</option>
              {gamAccounts.map(a => (
                <option key={a.id} value={a.id}>{a.name} ({a.email})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick range buttons */}
        <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
          {[
            { label: 'Today',      days: 0 },
            { label: 'Last 3 days', days: 2 },
            { label: 'Last 7 days', days: 6 },
            { label: 'Last 14 days', days: 13 },
            { label: 'Last 30 days', days: 29 },
          ].map(({ label, days }) => (
            <button
              key={label}
              className="btn btn-secondary btn-xs"
              onClick={() => {
                const from = getPlatformDateStr(days)
                setFilters(f => ({ ...f, date_from: from, date_to: today }))
              }}
            >
              {label}
            </button>
          ))}
          <button
            className="btn btn-secondary btn-xs"
            style={{ color: '#ef4444' }}
            onClick={() => setFilters(f => ({ ...f, publisher_id: '', gam_account_id: '', date_from: threeDaysAgo, date_to: today }))}
          >
            Reset Filters
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
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-subtle)' }}>
              💻 Sync Output
            </span>
            <button className="btn btn-secondary btn-xs" onClick={() => setShowOutput(false)}>✕ Hide</button>
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
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)' }}>
            📋 Sync History
          </span>
          <button
            className="btn btn-secondary btn-xs"
            onClick={loadAll}
            disabled={logsLoading}
          >
            {logsLoading ? '…' : '↻ Refresh'}
          </button>
        </div>

        {logsLoading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-subtle)' }}>Loading…</div>
        ) : logs.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-subtle)' }}>
            No sync history yet. Run your first sync above.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Started</th>
                  <th>Duration</th>
                  <th>Fetched</th>
                  <th>Matched</th>
                  <th>Skipped</th>
                  <th>Locked</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, idx) => (
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
                        ? <span title={log.error_message}>⚠ {log.error_message.slice(0, 60)}{log.error_message.length > 60 ? '…' : ''}</span>
                        : '—'
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stats Overview Cards */}
      {logs.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
          {[
            {
              label: 'Total Syncs',
              value: logs.length,
              icon: '🔄',
              color: '#8b5cf6',
            },
            {
              label: 'Manual Syncs',
              value: logs.filter(l => l.triggered_by === 'manual').length,
              icon: '🖱',
              color: '#a78bfa',
            },
            {
              label: 'Auto Syncs',
              value: logs.filter(l => l.triggered_by === 'scheduler').length,
              icon: '🤖',
              color: '#3b82f6',
            },
            {
              label: 'Successful',
              value: logs.filter(l => l.status === 'success').length,
              icon: '✅',
              color: '#10b981',
            },
            {
              label: 'Failed',
              value: logs.filter(l => l.status === 'failed').length,
              icon: '❌',
              color: '#ef4444',
            },
            {
              label: 'Total Rows Matched',
              value: logs.reduce((s, l) => s + (l.rows_matched || 0), 0).toLocaleString(),
              icon: '📊',
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
              <div style={{ fontSize: 22 }}>{stat.icon}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: 11, color: 'var(--color-text-subtle)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
