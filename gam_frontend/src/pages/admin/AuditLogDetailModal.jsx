import { useState } from 'react'
import {
  X, Copy, Check, User, Shield, Globe, Clock,
  Plus, Pencil, Trash2, CheckCircle, XCircle,
  DollarSign, Ban, UserCheck, Lock, Link, AlertTriangle,
  Activity, Settings, CreditCard, Mail, Package,
  ClipboardList, ExternalLink, RotateCcw, RefreshCw, ShieldCheck
} from 'lucide-react'
import { useSettings } from '../../contexts/SettingsContext'
import { useI18n } from '../../contexts/I18nContext'

/* ── Helpers ────────────────────────────────────────────────────── */

const ACTION_CONFIG = {
  created:            { icon: Plus,          color: '#10b981', bg: 'rgba(16,185,129,0.12)',  label: 'Created'        },
  updated:            { icon: Pencil,        color: '#00f2fe', bg: 'rgba(0,242,254,0.10)',   label: 'Updated'        },
  deleted:            { icon: Trash2,        color: '#f43f5e', bg: 'rgba(244,63,94,0.12)',   label: 'Deleted'        },
  approved:           { icon: CheckCircle,   color: '#10b981', bg: 'rgba(16,185,129,0.12)',  label: 'Approved'       },
  rejected:           { icon: XCircle,       color: '#f43f5e', bg: 'rgba(244,63,94,0.12)',   label: 'Rejected'       },
  paid:               { icon: DollarSign,    color: '#10b981', bg: 'rgba(16,185,129,0.12)',  label: 'Paid'           },
  suspended:          { icon: Ban,           color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  label: 'Suspended'      },
  activated:          { icon: UserCheck,     color: '#10b981', bg: 'rgba(16,185,129,0.12)',  label: 'Activated'      },
  registered:         { icon: User,          color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', label: 'Registered'     },
  closed:             { icon: Lock,          color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', label: 'Closed'         },
  close_initiated:    { icon: Lock,          color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: 'Close Initiated'},
  auto_closed:        { icon: Lock,          color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', label: 'Auto Closed'    },
  connected:          { icon: Link,          color: '#00f2fe', bg: 'rgba(0,242,254,0.10)',   label: 'Connected'      },
  revenue_wipe:       { icon: AlertTriangle, color: '#f43f5e', bg: 'rgba(244,63,94,0.15)',   label: 'Revenue Wipe'   },
  audit_wipe:         { icon: AlertTriangle, color: '#f43f5e', bg: 'rgba(244,63,94,0.15)',   label: 'Audit Logs Wipe' },
  danger_prune_traffic: { icon: Trash2,      color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  label: 'Traffic Prune'  },
  danger_flush_cache:   { icon: RefreshCw,   color: '#00f2fe', bg: 'rgba(0,242,254,0.10)',   label: 'Cache Flush'    },
  danger_force_logout:  { icon: ShieldCheck, color: '#f43f5e', bg: 'rgba(244,63,94,0.15)',   label: 'Force Logout'   },
  danger_refresh_tokens:{ icon: RefreshCw,   color: '#10b981', bg: 'rgba(16,185,129,0.12)',  label: 'Tokens Bulk Refresh' },
  danger_reset_config:  { icon: RotateCcw,   color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  label: 'Config Reset'   },
  email_sent:         { icon: Mail,          color: '#00f2fe', bg: 'rgba(0,242,254,0.10)',   label: 'Email Sent'     },
  created_in_gam:     { icon: Package,       color: '#10b981', bg: 'rgba(16,185,129,0.12)',  label: 'Created in GAM' },
  bulk_created_in_gam:{ icon: Package,       color: '#10b981', bg: 'rgba(16,185,129,0.12)',  label: 'Bulk GAM Create'},
  ratio_changed:      { icon: Settings,      color: '#00f2fe', bg: 'rgba(0,242,254,0.10)',   label: 'Ratio Changed'  },
  recovered:          { icon: Activity,      color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', label: 'Recovered'      },
  applied:            { icon: CheckCircle,   color: '#10b981', bg: 'rgba(16,185,129,0.12)',  label: 'Applied'        },
  ivt_deduction:      { icon: AlertTriangle, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: 'IVT Deduction'  },
  bonus_applied:      { icon: DollarSign,    color: '#10b981', bg: 'rgba(16,185,129,0.12)',  label: 'Bonus Applied'  },
  password_reset:     { icon: Shield,        color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', label: 'Password Reset' },
  notes_updated:        { icon: Pencil,        color: '#00f2fe', bg: 'rgba(0,242,254,0.10)',   label: 'Notes Updated'  },
  profile_updated:      { icon: User,          color: '#00f2fe', bg: 'rgba(0,242,254,0.10)',   label: 'Profile Updated'},
  password_changed:     { icon: Lock,          color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  label: 'Password Changed'},
  reset:                { icon: RotateCcw,     color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  label: 'Reset'          },
  resolved:             { icon: CheckCircle,   color: '#10b981', bg: 'rgba(16,185,129,0.12)',  label: 'Resolved'       },
  reply:                { icon: Mail,          color: '#00f2fe', bg: 'rgba(0,242,254,0.10)',   label: 'Replied'        },
  payment_info_updated: { icon: CreditCard,    color: '#10b981', bg: 'rgba(16,185,129,0.12)',  label: 'Payment Method Updated' },
  trigger_sync:         { icon: RotateCcw,     color: '#00f2fe', bg: 'rgba(0,242,254,0.10)',   label: 'Trigger Sync'   },
}

export function getActionConfig(action) {
  if (ACTION_CONFIG[action]) {
    return ACTION_CONFIG[action]
  }
  const label = (action || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  return { icon: Activity, color: '#94a3b8', bg: 'rgba(148,163,184,0.10)', label }
}

// Fields to hide from the diff table (internal/technical fields or complex relation objects)
const HIDDEN_DIFF_FIELDS = new Set([
  'id', 'created_at', 'updated_at', 'deleted_at', 'remember_token',
  'password', 'email_verified_at', 'pivot',
  // Relation objects (show as raw JSON blobs — unhelpful in diffs)
  'user', 'publisher', 'website', 'ad_unit', 'payout', 'adjustment',
  'period_closing', 'gam_account',
  // Encrypted / sensitive
  'payment_info',
])

function shouldShowField(key) {
  return !HIDDEN_DIFF_FIELDS.has(key)
}

function parseSyncOutput(text) {
  if (!text) return null
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  
  let header = ''
  const accounts = []
  const seenEmails = new Set()
  let summary = null
  let statusMessage = ''
  const rawLogs = []

  for (const line of lines) {
    if (line.startsWith('Starting GAM Sync')) {
      header = line
    } else if (line.startsWith('GAM Sync Completed') || line.startsWith('GAM Sync Failed')) {
      statusMessage = line
    } else if (
      line.toLowerCase().includes('fetching report for') || 
      line.toLowerCase().includes('skipping gam account')
    ) {
      let type = 'fetching'
      let email = ''
      let details = ''

      if (line.toLowerCase().includes('skipping')) {
        type = 'skipping'
        const emailMatch = line.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/)
        email = emailMatch ? emailMatch[1] : ''
        const index = line.indexOf(email)
        details = index !== -1 ? line.substring(index + email.length).trim() : line
        details = details.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '').trim()
      } else if (line.toLowerCase().includes('fetching')) {
        type = 'fetching'
        const emailMatch = line.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/)
        email = emailMatch ? emailMatch[1] : ''
        const index = line.indexOf(email)
        details = index !== -1 ? line.substring(index + email.length).trim() : line
        if (details.endsWith('...')) {
          details = details.substring(0, details.length - 3).trim()
        }
        details = details.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '').trim()
      }
      if (email && !seenEmails.has(email)) {
        seenEmails.add(email)
        accounts.push({ type, email, details })
      }
    } else if (!line.startsWith('+') && !line.startsWith('|')) {
      rawLogs.push(line)
    }
  }

  const pipeRows = lines.filter(l => l.startsWith('|') && l.endsWith('|'))
  if (pipeRows.length >= 2) {
    const headers = pipeRows[0].split('|').map(s => s.trim().toLowerCase()).filter(Boolean)
    const valuesRow = pipeRows.find(row => {
      const parts = row.split('|').map(s => s.trim()).filter(Boolean)
      return parts.some(p => /^\d+$/.test(p)) || parts.some(p => p === 'success' || p === 'failed')
    })

    if (valuesRow) {
      const values = valuesRow.split('|').map(s => s.trim()).filter(Boolean)
      summary = {}
      headers.forEach((h, i) => {
        if (values[i] !== undefined) {
          summary[h] = values[i]
        }
      })
    }
  }

  return { header, accounts, summary, statusMessage, rawLogs }
}

function SyncOutputRenderer({ text }) {
  const parsed = parseSyncOutput(text)
  const [showRaw, setShowRaw] = useState(false)

  if (!parsed || (!parsed.header && parsed.accounts.length === 0 && !parsed.summary)) {
    return (
      <pre style={{
        margin: 0, padding: '12px', background: '#090d16', color: '#10b981',
        fontFamily: 'Consolas, Monaco, monospace', fontSize: '11px', lineHeight: '1.5',
        borderRadius: '8px', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        maxHeight: '300px', overflowY: 'auto', border: '1px solid rgba(16, 185, 129, 0.25)',
      }}>
        {text}
      </pre>
    )
  }

  const isSuccess = parsed.statusMessage.toLowerCase().includes('success') || (parsed.summary?.status === 'success')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left', width: '100%' }}>
      {/* Status Banner */}
      <div style={{
        padding: '12px 16px',
        borderRadius: '8px',
        background: isSuccess ? 'rgba(16, 185, 129, 0.06)' : 'rgba(244, 63, 94, 0.06)',
        border: `1px solid ${isSuccess ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}>
        <div style={{
          fontSize: '14px',
          fontWeight: 700,
          color: isSuccess ? '#10b981' : '#f43f5e',
        }}>
          {parsed.statusMessage || (isSuccess ? 'Sync Completed Successfully' : 'Sync Failed')}
        </div>
        {parsed.header && (
          <div style={{ fontSize: '12px', color: 'var(--br-text-3)' }}>
            {parsed.header}
          </div>
        )}
      </div>

      {/* Summary Table */}
      {parsed.summary && (
        <div>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--br-text-3)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.04em' }}>
            Sync Summary
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
            gap: '10px',
            background: 'var(--br-surface)',
            border: '1px solid var(--br-border)',
            borderRadius: '8px',
            padding: '12px'
          }}>
            {Object.entries(parsed.summary).map(([key, val]) => {
              const label = key.charAt(0).toUpperCase() + key.slice(1)
              const isStatus = key === 'status'
              return (
                <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--br-text-3)', fontWeight: 500 }}>{label}</span>
                  {isStatus ? (
                    <span style={{
                      alignSelf: 'flex-start',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '1px 7px',
                      borderRadius: '5px',
                      textTransform: 'uppercase',
                      background: val === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)',
                      color: val === 'success' ? '#10b981' : '#f43f5e',
                    }}>{val}</span>
                  ) : (
                    <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--br-text)' }}>{val}</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* GAM Accounts Status */}
      {parsed.accounts.length > 0 && (
        <div>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--br-text-3)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.04em' }}>
            GAM Accounts Status
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {parsed.accounts.map((acc, index) => {
              const isSkip = acc.type === 'skipping'
              return (
                <div key={index} style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: 'var(--br-surface-2)',
                  border: '1px solid var(--br-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                    <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--br-text)', wordBreak: 'break-all' }}>
                      {acc.email}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--br-text-3)' }}>
                      {acc.details}
                    </span>
                  </div>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '6px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.03em',
                    flexShrink: 0,
                    background: isSkip ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                    color: isSkip ? '#f59e0b' : '#10b981',
                  }}>
                    {isSkip ? 'Skipped' : 'Synced'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Raw Log Details Collapsible */}
      {parsed.rawLogs.length > 0 && (
        <div style={{ marginTop: '8px' }}>
          <button
            onClick={() => setShowRaw(!showRaw)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--br-primary)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: 0
            }}
          >
            {showRaw ? 'Hide Raw Logs ▲' : 'Show Raw Logs (API SOAP details) ▼'}
          </button>
          {showRaw && (
            <pre style={{
              margin: '8px 0 0 0',
              padding: '12px',
              background: '#090d16',
              color: 'var(--br-text-2)',
              fontFamily: 'Consolas, Monaco, monospace',
              fontSize: '11px',
              lineHeight: '1.5',
              borderRadius: '8px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              maxHeight: '200px',
              overflowY: 'auto',
              border: '1px solid var(--br-border)',
              textAlign: 'left'
            }}>
              {parsed.rawLogs.join('\n')}
            </pre>
          )}
        </div>
      )}
    </div>
  )
}

function formatFieldValue(val, key) {
  if (val === null || val === undefined) return <span style={{ color: 'var(--br-text-3)', fontStyle: 'italic' }}>—</span>
  if (typeof val === 'boolean') return val ? '✓ Yes' : '✗ No'

  if (key === 'output' && val) {
    if (String(val).includes('Starting GAM Sync')) {
      return <SyncOutputRenderer text={String(val)} />
    }
    return (
      <pre style={{
        margin: 0,
        padding: '12px',
        background: '#090d16',
        color: '#10b981',
        fontFamily: 'Consolas, Monaco, monospace',
        fontSize: '11px',
        lineHeight: '1.5',
        borderRadius: '8px',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        maxHeight: '300px',
        overflowY: 'auto',
        border: '1px solid rgba(16, 185, 129, 0.25)',
        textAlign: 'left'
      }}>
        {String(val)}
      </pre>
    )
  }

  if (key === 'body' && val) {
    return (
      <div 
        style={{ 
          whiteSpace: 'pre-wrap', 
          background: 'var(--br-surface-2)', 
          padding: '12px', 
          borderRadius: '8px', 
          border: '1px solid var(--br-border)',
          fontFamily: 'inherit',
          fontSize: '13px',
          color: 'var(--br-text-2)',
          textAlign: 'left'
        }}
        dangerouslySetInnerHTML={{ __html: String(val) }}
      />
    )
  }

  if (key === 'filters' && val) {
    try {
      const filterObj = typeof val === 'string' ? JSON.parse(val) : val
      if (filterObj && typeof filterObj === 'object') {
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', textAlign: 'left' }}>
            {Object.entries(filterObj).map(([k, v]) => {
              if (v === null || v === undefined || v === '') return null
              return (
                <div key={k} style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: 'rgba(0, 242, 254, 0.05)',
                  border: '1px solid rgba(0, 242, 254, 0.2)',
                  borderRadius: '6px',
                  padding: '3px 8px',
                  fontSize: '11px'
                }}>
                  <span style={{ color: 'var(--br-text-3)', marginRight: '4px', fontWeight: 600 }}>{humanLabel(k)}:</span>
                  <span style={{ color: 'var(--br-text-2)' }}>{String(v)}</span>
                </div>
              )
            })}
          </div>
        )
      }
    } catch (e) {
      // fallback
    }
  }

  if (typeof val === 'object') return <code style={{ fontSize: 11, wordBreak: 'break-all' }}>{JSON.stringify(val)}</code>
  return String(val)
}

function humanLabel(key) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  function handleCopy() {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    })
  }
  return (
    <button onClick={handleCopy} title="Copy" style={{
      background: 'none', border: 'none', cursor: 'pointer',
      color: copied ? 'var(--br-accent)' : 'var(--br-text-3)',
      padding: '2px 4px', borderRadius: 4, display: 'inline-flex', alignItems: 'center'
    }}>
      {copied ? <Check size={13} /> : <Copy size={13} />}
    </button>
  )
}

function relativeTime(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60)  return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60)  return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24)  return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 30)  return `${d}d ago`
  const mo = Math.floor(d / 30)
  return `${mo}mo ago`
}

/* ── Diff Table ─────────────────────────────────────────────────── */
function DiffTable({ oldValues, newValues }) {
  if (!oldValues && !newValues) return null

  const allKeys = new Set([
    ...Object.keys(oldValues || {}),
    ...Object.keys(newValues || {}),
  ])
  const visibleKeys = [...allKeys].filter(shouldShowField)

  if (visibleKeys.length === 0) return null

  return (
    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', width: '100%' }}>
      <table style={{
        width: '100%', minWidth: '650px', borderCollapse: 'collapse',
        fontSize: 13, tableLayout: 'auto'
      }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--br-border)' }}>
            <th style={{ textAlign: 'left', padding: '10px 12px', color: 'var(--br-text-3)', fontWeight: 600, width: '20%' }}>Field</th>
            <th style={{ textAlign: 'left', padding: '10px 12px', color: '#f43f5e', fontWeight: 600, width: '40%' }}>Before</th>
            <th style={{ textAlign: 'left', padding: '10px 12px', color: '#10b981', fontWeight: 600, width: '40%' }}>After</th>
          </tr>
        </thead>
        <tbody>
          {visibleKeys.map(key => {
            const oldVal = oldValues?.[key]
            const newVal = newValues?.[key]
            const changed = JSON.stringify(oldVal) !== JSON.stringify(newVal)

            if (key === 'output' || key === 'error_message' || key === 'error' || key === 'filters') {
              return (
                <tr key={key} style={{
                  borderBottom: '1px solid var(--br-border)',
                  background: changed ? 'rgba(0,242,254,0.025)' : 'transparent',
                }}>
                  <td colSpan={3} style={{ padding: '12px 12px' }}>
                    <div style={{ color: 'var(--br-text-3)', fontWeight: 600, fontSize: '12px', marginBottom: '8px' }}>
                      {humanLabel(key)}
                      {changed && <span style={{ marginLeft: 5, fontSize: 10, color: 'var(--br-primary)', fontWeight: 700 }}>●</span>}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                      <div>
                        <div style={{ fontSize: '10px', color: '#f43f5e', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.05em' }}>Before</div>
                        {formatFieldValue(oldVal, key)}
                      </div>
                      <div>
                        <div style={{ fontSize: '10px', color: '#10b981', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.05em' }}>After</div>
                        {formatFieldValue(newVal, key)}
                      </div>
                    </div>
                  </td>
                </tr>
              )
            }

            return (
              <tr key={key} style={{
                borderBottom: '1px solid var(--br-border)',
                background: changed ? 'rgba(0,242,254,0.025)' : 'transparent',
              }}>
                <td style={{ padding: '10px 12px', color: 'var(--br-text-3)', fontWeight: 500, wordBreak: 'break-word' }}>
                  {humanLabel(key)}
                  {changed && <span style={{ marginLeft: 5, fontSize: 10, color: 'var(--br-primary)', fontWeight: 700 }}>●</span>}
                </td>
                <td style={{ padding: '10px 12px', color: changed ? '#f43f5e' : 'var(--br-text-2)', wordBreak: 'break-word' }}>
                  {formatFieldValue(oldVal, key)}
                </td>
                <td style={{ padding: '10px 12px', color: changed ? '#10b981' : 'var(--br-text-2)', wordBreak: 'break-word' }}>
                  {formatFieldValue(newVal, key)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

/* ── Main Modal ─────────────────────────────────────────────────── */
export default function AuditLogDetailModal({ log, onClose }) {
  const { formatDateTime, settings } = useSettings()
  const { t } = useI18n()
  const timezone = settings?.platform_timezone || 'UTC'

  if (!log) return null

  const cfg = getActionConfig(log.action)
  const ActionIcon = cfg.icon

  const actorName  = log.user?.name  || 'System'
  const actorEmail = log.user?.email || null
  const actorRole  = log.user_role   || (log.user ? 'admin' : 'system')
  const initial    = actorName[0]?.toUpperCase() || 'S'

  const hasDiff = log.old_values || log.new_values

  // Close on overlay click
  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal" style={{ maxWidth: 660, width: '95vw', padding: 0, overflow: 'hidden' }}>

        {/* ── Header ── */}
        <div className="audit-log-header" style={{
          background: cfg.bg,
          borderBottom: `1px solid ${cfg.color}28`
        }}>
          <div className="audit-log-header-left">
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: cfg.bg, border: `1.5px solid ${cfg.color}55`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0
            }}>
              <ActionIcon size={20} style={{ color: cfg.color }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="audit-log-header-title-container">
                <span style={{
                  fontSize: 12, fontWeight: 700, letterSpacing: '0.06em',
                  padding: '2px 9px', borderRadius: 6,
                  background: cfg.bg, color: cfg.color,
                  border: `1px solid ${cfg.color}44`,
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap'
                }}>
                  {cfg.label}
                </span>
                <span style={{
                  fontSize: 13,
                  color: 'var(--br-text-3)',
                  fontWeight: 500,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {log.entity_type}
                </span>
              </div>
              <div style={{ marginTop: 4, fontSize: 11, color: 'var(--br-text-3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span>ID: {log.entity_id || '—'}</span>
                {log.entity_id && <CopyButton text={log.entity_id} />}
              </div>
            </div>
          </div>
          <button className="modal-close" onClick={onClose} style={{ flexShrink: 0 }}><X size={16} /></button>
        </div>

        {/* ── Scrollable body ── */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', maxHeight: 'calc(90vh - 140px)' }}>

          {/* Description */}
          {log.description && (
            <div style={{
              padding: '12px 16px', borderRadius: 10,
              background: 'rgba(0,242,254,0.04)',
              border: '1px solid var(--br-border-cyan)',
              marginBottom: 16, fontSize: 14,
              color: 'var(--br-text-2)', lineHeight: 1.5,
              display: 'flex', alignItems: 'flex-start', gap: 8
            }}>
              <ClipboardList size={15} style={{ color: 'var(--br-primary)', flexShrink: 0, marginTop: 1 }} />
              <span>{log.description}</span>
            </div>
          )}

          {/* Publisher context */}
          {log.publisher_context && (
            <div style={{
              padding: '12px 16px', borderRadius: 10,
              background: 'rgba(139,92,246,0.07)',
              border: '1px solid rgba(139,92,246,0.22)',
              marginBottom: 16,
              display: 'flex', alignItems: 'center', gap: 12
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                background: 'rgba(139,92,246,0.18)',
                border: '1.5px solid rgba(139,92,246,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 800, color: 'var(--br-violet-hover)'
              }}>
                {log.publisher_context.name?.[0]?.toUpperCase() || 'P'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--br-text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>
                  Publisher
                </div>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--br-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {log.publisher_context.name}
                </div>
                <div style={{ fontSize: 12, color: 'var(--br-text-3)', display: 'flex', alignItems: 'center', gap: 8, marginTop: 2, minWidth: 0, width: '100%' }}>
                  <span style={{
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '185px',
                    display: 'inline-block'
                  }} title={log.publisher_context.email}>
                    {log.publisher_context.email}
                  </span>
                  {log.publisher_context.status && (
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 5,
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                      background: log.publisher_context.status === 'active' ? 'rgba(16,185,129,0.12)' : 'rgba(244,63,94,0.12)',
                      color: log.publisher_context.status === 'active' ? '#10b981' : '#f43f5e',
                      flexShrink: 0
                    }}>
                      {log.publisher_context.status}
                    </span>
                  )}
                </div>
              </div>
              <CopyButton text={log.publisher_context.email} />
            </div>
          )}

          {/* Admin context */}
          {(() => {
            if (log.entity_type !== 'Admin') return null;
            const name = log.admin_context?.name || log.new_values?.name || log.old_values?.name;
            const email = log.admin_context?.email || log.new_values?.email || log.old_values?.email;
            const isActive = typeof log.admin_context?.is_active !== 'undefined'
              ? log.admin_context.is_active
              : (log.new_values?.is_active ?? log.old_values?.is_active);
            
            if (!email) return null;

            return (
              <div style={{
                padding: '12px 16px', borderRadius: 10,
                background: 'rgba(0,242,254,0.05)',
                border: '1px solid rgba(0,242,254,0.22)',
                marginBottom: 16,
                display: 'flex', alignItems: 'center', gap: 12
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                  background: 'rgba(0,242,254,0.18)',
                  border: '1.5px solid rgba(0,242,254,0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 800, color: 'var(--br-primary)'
                }}>
                  {name?.[0]?.toUpperCase() || 'A'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--br-text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>
                    Administrator
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--br-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {name || 'Admin'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--br-text-3)', display: 'flex', alignItems: 'center', gap: 8, marginTop: 2, minWidth: 0, width: '100%' }}>
                    <span style={{
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '185px',
                      display: 'inline-block'
                    }} title={email}>
                      {email}
                    </span>
                    {typeof isActive !== 'undefined' && (
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 5,
                        textTransform: 'uppercase', letterSpacing: '0.05em',
                        background: isActive ? 'rgba(16,185,129,0.12)' : 'rgba(244,63,94,0.12)',
                        color: isActive ? '#10b981' : '#f43f5e',
                        flexShrink: 0
                      }}>
                        {isActive ? 'active' : 'suspended'}
                      </span>
                    )}
                  </div>
                </div>
                <CopyButton text={email} />
              </div>
            );
          })()}

          {/* ── Actor + Meta grid ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 20 }}>

            {/* Actor card */}
            <div style={{
              padding: '14px 16px', borderRadius: 10,
              background: 'var(--br-surface)', border: '1px solid var(--br-border)',
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--br-text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                Actor
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                  background: log.user ? 'var(--br-primary-subtle)' : 'rgba(148,163,184,0.12)',
                  border: `1.5px solid ${log.user ? 'var(--br-primary)' : 'rgba(148,163,184,0.3)'}44`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 700,
                  color: log.user ? 'var(--br-primary)' : 'var(--br-text-3)'
                }}>
                  {log.user ? initial : <Shield size={16} />}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--br-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {actorName}
                  </div>
                  {actorEmail && (
                    <div style={{ fontSize: 11, color: 'var(--br-text-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {actorEmail}
                    </div>
                  )}
                  <div style={{
                    marginTop: 4, display: 'inline-block', fontSize: 10, fontWeight: 700,
                    padding: '1px 7px', borderRadius: 5, textTransform: 'uppercase', letterSpacing: '0.05em',
                    background: log.user ? 'var(--br-violet-subtle)' : 'rgba(148,163,184,0.10)',
                    color: log.user ? 'var(--br-violet-hover)' : 'var(--br-text-3)',
                  }}>
                    {actorRole}
                  </div>
                </div>
              </div>
            </div>

            {/* Timestamp + IP */}
            <div style={{
              padding: '14px 16px', borderRadius: 10,
              background: 'var(--br-surface)', border: '1px solid var(--br-border)',
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--br-text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                Timestamp
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <Clock size={14} style={{ color: 'var(--br-primary)', flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--br-text)' }}>
                    {formatDateTime(log.created_at, true)}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--br-text-3)', marginTop: 2 }}>
                    {relativeTime(log.created_at)}
                  </div>
                  <div style={{
                    marginTop: 5, display: 'inline-flex', alignItems: 'center', gap: 4,
                    fontSize: 10, fontWeight: 600, letterSpacing: '0.04em',
                    padding: '2px 7px', borderRadius: 5,
                    background: 'rgba(0,242,254,0.06)', color: 'var(--br-text-3)',
                    border: '1px solid var(--br-border)'
                  }}>
                    <Globe size={9} />
                    {timezone}
                  </div>
                </div>
              </div>
              {log.ip_address && (
                <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Globe size={13} style={{ color: 'var(--br-text-3)', flexShrink: 0 }} />
                  <code style={{ fontSize: 12, color: 'var(--br-text-2)' }}>{log.ip_address}</code>
                  <CopyButton text={log.ip_address} />
                </div>
              )}
            </div>
          </div>

          {/* ── Changes diff ── */}
          {hasDiff && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--br-text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                Changes
              </div>
              <div style={{
                borderRadius: 10, border: '1px solid var(--br-border)',
                overflow: 'hidden', background: 'var(--br-surface)'
              }}>
                <DiffTable oldValues={log.old_values} newValues={log.new_values} />
              </div>
            </div>
          )}

          {/* ── Footer / Log ID ── */}
          <div style={{
            borderTop: '1px solid var(--br-border)',
            paddingTop: 14, marginTop: 4,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <div style={{ fontSize: 11, color: 'var(--br-text-3)', display: 'flex', alignItems: 'center', gap: 4 }}>
              Log #{log.id}
              <CopyButton text={String(log.id)} />
            </div>
            <button className="btn btn-secondary" onClick={onClose} style={{ fontSize: 13, padding: '6px 16px' }}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
