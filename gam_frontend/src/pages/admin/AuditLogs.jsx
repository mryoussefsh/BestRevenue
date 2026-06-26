import { useState, useEffect, useCallback, useRef } from 'react'
import { adminApi } from '../../api/endpoints'
import toast from 'react-hot-toast'
import Pagination from '../../components/Pagination'
import { useSettings } from '../../contexts/SettingsContext'
import { useI18n } from '../../contexts/I18nContext'
import {
  ClipboardList, Filter, X, Search, ChevronRight,
  Activity, Calendar, User as UserIcon, RefreshCw, Building2
} from 'lucide-react'
import AuditLogDetailModal, { getActionConfig } from './AuditLogDetailModal'


/* ── Helpers ───────────────────────────────────────────────────── */
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
  return `${Math.floor(d / 30)}mo ago`
}

/* ── Filter constants ──────────────────────────────────────────── */
const ACTION_OPTIONS = [
  { value: '',                 label: 'All Actions'        },
  { value: 'created',          label: 'Created'            },
  { value: 'updated',          label: 'Updated'            },
  { value: 'deleted',          label: 'Deleted'            },
  { value: 'approved',         label: 'Approved'           },
  { value: 'rejected',         label: 'Rejected'           },
  { value: 'paid',             label: 'Paid'               },
  { value: 'suspended',        label: 'Suspended'          },
  { value: 'activated',        label: 'Activated'          },
  { value: 'registered',       label: 'Registered'         },
  { value: 'closed',           label: 'Closed'             },
  { value: 'close_initiated',  label: 'Close Initiated'    },
  { value: 'auto_closed',      label: 'Auto Closed'        },
  { value: 'connected',        label: 'Connected'          },
  { value: 'revenue_wipe',     label: 'Revenue Wipe'       },
  { value: 'audit_wipe',       label: 'Audit Logs Wipe'    },
  { value: 'danger_prune_traffic',   label: 'Traffic Prune'         },
  { value: 'danger_flush_cache',     label: 'Cache Flush'           },
  { value: 'danger_force_logout',    label: 'Force Logout'          },
  { value: 'danger_refresh_tokens',  label: 'Tokens Bulk Refresh'   },
  { value: 'danger_reset_config',    label: 'Config Reset'          },
  { value: 'email_sent',       label: 'Email Sent'         },
  { value: 'created_in_gam',   label: 'Created in GAM'     },
  { value: 'bulk_created_in_gam', label: 'Bulk GAM Create' },
  { value: 'applied',          label: 'Applied'            },
  { value: 'ivt_deduction',    label: 'IVT Deduction'      },
  { value: 'bonus_applied',    label: 'Bonus Applied'      },
  { value: 'ratio_changed',    label: 'Ratio Changed'      },
  { value: 'password_reset',   label: 'Password Reset'     },
  { value: 'notes_updated',    label: 'Notes Updated'      },
]

const ENTITY_OPTIONS = [
  { value: '',             label: 'All Entities'   },
  { value: 'Publisher',    label: 'Publisher'      },
  { value: 'Website',      label: 'Website'        },
  { value: 'AdUnit',       label: 'Ad Unit'        },
  { value: 'Payout',       label: 'Payout'         },
  { value: 'Adjustment',   label: 'Adjustment'     },
  { value: 'PeriodClosing',label: 'Period Closing' },
  { value: 'GamAccount',   label: 'GAM Account'    },
  { value: 'Setting',      label: 'Setting'        },
  { value: 'RevenueRecord',label: 'Revenue Record' },
]

const EMPTY_FILTERS = { action: '', entity_type: '', date_from: '', date_to: '', search: '', publisher_id: '' }

/* ── Publisher Picker (searchable dropdown) ────────────────────── */
function PublisherPicker({ value, onChange }) {
  const [query, setQuery]         = useState('')
  const [open, setOpen]           = useState(false)
  const [publishers, setPublishers] = useState([])
  const [loading, setLoading]     = useState(false)
  const [selected, setSelected]   = useState(null)
  const wrapRef = useRef(null)

  // Load matching publishers when query changes
  useEffect(() => {
    if (!open) return
    setLoading(true)
    const timer = setTimeout(async () => {
      try {
        const res = await adminApi.getPublishers({ search: query, per_page: 20 })
        setPublishers(res.data?.data || [])
      } catch { /* silent */ }
      finally { setLoading(false) }
    }, 250)
    return () => clearTimeout(timer)
  }, [query, open])

  // Close on outside click
  useEffect(() => {
    function handler(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function select(pub) {
    setSelected(pub)
    setQuery(pub.name)
    setOpen(false)
    onChange(pub.id, pub)
  }

  function clear() {
    setSelected(null)
    setQuery('')
    onChange('', null)
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <Building2 size={14} style={{
          position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
          color: 'var(--br-text-3)', pointerEvents: 'none'
        }} />
        <input
          className="form-input"
          style={{ paddingLeft: 32, paddingRight: value ? 32 : 12 }}
          placeholder="Search publisher by name or email…"
          value={query}
          onFocus={() => setOpen(true)}
          onChange={e => { setQuery(e.target.value); if (!open) setOpen(true) }}
        />
        {value && (
          <button onClick={clear} style={{
            position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--br-text-3)', display: 'flex', alignItems: 'center'
          }}><X size={14} /></button>
        )}
      </div>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 200,
          background: 'var(--br-bg-2)', border: '1px solid var(--br-border-cyan)',
          borderRadius: 10, boxShadow: 'var(--shadow-md)',
          maxHeight: 240, overflowY: 'auto'
        }}>
          {loading ? (
            <div style={{ padding: '12px 16px', color: 'var(--br-text-3)', fontSize: 13 }}>Searching…</div>
          ) : publishers.length === 0 ? (
            <div style={{ padding: '12px 16px', color: 'var(--br-text-3)', fontSize: 13 }}>No publishers found</div>
          ) : publishers.map(pub => (
            <div key={pub.id}
              onClick={() => select(pub)}
              style={{
                padding: '10px 16px', cursor: 'pointer',
                borderBottom: '1px solid var(--br-border)',
                transition: 'background 0.12s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--br-surface-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--br-text)' }}>{pub.name}</div>
              <div style={{ fontSize: 11, color: 'var(--br-text-3)', marginTop: 1 }}>{pub.email}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Row Component ─────────────────────────────────────────────── */
function LogRow({ log, onViewDetails }) {
  const { formatDateTime } = useSettings()
  const cfg    = getActionConfig(log.action)
  const Icon   = cfg.icon
  const actor  = log.user?.name || 'System'
  const isSystem = !log.user

  return (
    <div
      onClick={() => onViewDetails(log)}
      style={{
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '14px 20px',
        borderBottom: '1px solid var(--br-border)',
        cursor: 'pointer',
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--br-surface-hover)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {/* Action icon */}
      <div style={{
        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
        background: cfg.bg, border: `1px solid ${cfg.color}44`,
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <Icon size={17} style={{ color: cfg.color }} />
      </div>

      {/* Main content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Description or fallback */}
        <div style={{
          fontSize: 13.5, fontWeight: 500, color: 'var(--br-text)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          marginBottom: 4
        }}>
          {log.description || `${cfg.label} — ${log.entity_type}`}
        </div>

        {/* Meta row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {/* Entity badge */}
          <span style={{
            fontSize: 11, fontWeight: 600, letterSpacing: '0.04em',
            padding: '2px 8px', borderRadius: 5,
            background: 'var(--br-surface)', color: 'var(--br-text-3)',
            border: '1px solid var(--br-border)'
          }}>
            {log.entity_type}
          </span>

          {/* Actor */}
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--br-text-3)' }}>
            <UserIcon size={11} />
            <span style={{ color: isSystem ? 'var(--br-text-3)' : 'var(--br-text-2)', fontStyle: isSystem ? 'italic' : 'normal' }}>
              {actor}
            </span>
          </span>
        </div>
      </div>

      {/* Right side: timestamp + chevron */}
      <div style={{ flexShrink: 0, textAlign: 'right', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--br-text-2)', whiteSpace: 'nowrap' }}>
            {relativeTime(log.created_at)}
          </div>
          <div className="exact-time" style={{ fontSize: 10, color: 'var(--br-text-3)', marginTop: 2, whiteSpace: 'nowrap' }}>
            {formatDateTime(log.created_at)}
          </div>
        </div>
        <ChevronRight size={16} style={{ color: 'var(--br-text-3)' }} />
      </div>
    </div>
  )
}

/* ── Main Page ─────────────────────────────────────────────────── */
export default function AuditLogsPage() {
  const { t } = useI18n()

  const [logs, setLogs]               = useState([])
  const [meta, setMeta]               = useState(null)
  const [loading, setLoading]         = useState(true)
  const [page, setPage]               = useState(1)
  const [filters, setFilters]         = useState(EMPTY_FILTERS)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedLog, setSelectedLog] = useState(null)
  // Tracks the full publisher object for the active publisher_id filter (for banner display)
  const [activePublisher, setActivePublisher] = useState(null)

  // Local state for search text to support debouncing
  const [searchText, setSearchText] = useState(filters.search)

  // Sync local search text with active filter (important for clearing)
  useEffect(() => {
    setSearchText(filters.search)
  }, [filters.search])

  // Debounce search filter updates to prevent excessive backend calls
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchText !== filters.search) {
        setFilters(f => ({ ...f, search: searchText }))
        setPage(1)
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [searchText])

  const activeCount = Object.values(filters).filter(Boolean).length

  const load = useCallback(async (p = page, f = filters) => {
    setLoading(true)
    try {
      const params = { page: p }
      if (f.action)       params.action       = f.action
      if (f.entity_type)  params.entity_type  = f.entity_type
      if (f.date_from)    params.date_from    = f.date_from
      if (f.date_to)      params.date_to      = f.date_to
      if (f.search)       params.search       = f.search
      if (f.publisher_id) params.publisher_id = f.publisher_id

      const res = await adminApi.getAuditLogs(params)
      const payload = res.data
      setLogs(payload?.data || [])
      // Laravel paginate() puts pagination info at the ROOT level (not inside a 'meta' key)
      setMeta(payload?.current_page != null ? payload : null)
    } catch {
      toast.error('Failed to load audit logs')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(page, filters) }, [page, filters])

  function clearFilters() {
    setFilters(EMPTY_FILTERS)
    setActivePublisher(null)
    setPage(1)
  }

  function handlePageChange(p) {
    setPage(p)
    load(p, filters)
  }

  return (
    <div>
      {/* ── Page Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ClipboardList size={22} style={{ color: 'var(--br-primary)' }} />
            {t('audit.title', 'Audit Logs')}
          </h1>
          <p className="page-subtitle">
            {t('audit.subtitle', 'Full activity trail for every important action on the platform')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            className="btn btn-secondary"
            onClick={() => load(page, filters)}
            title="Refresh"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <RefreshCw size={15} />
            <span>Refresh</span>
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => setShowFilters(v => !v)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, position: 'relative' }}
          >
            <Filter size={15} />
            <span>{showFilters ? 'Hide Filters' : 'Filters'}</span>
            {activeCount > 0 && (
              <span style={{
                background: 'var(--br-primary)', color: '#030712',
                borderRadius: '50%', width: 18, height: 18,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 800
              }}>{activeCount}</span>
            )}
          </button>
        </div>
      </div>

      <style>{`
        .audit-filters-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          margin-bottom: 12px;
        }
        .col-span-2 {
          grid-column: span 2;
        }
        .card.audit-filters-card {
          padding: 18px 24px;
          margin-bottom: 20px;
          background: rgba(8, 15, 29, 0.6);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(0, 242, 254, 0.12);
          box-shadow: var(--shadow-md);
        }
        .audit-filters-footer {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
          margin-top: 12px;
        }
        .publisher-banner {
          padding: 14px 20px;
          margin-bottom: 16px;
          border-radius: 12px;
          background: rgba(139, 92, 246, 0.08);
          border: 1px solid rgba(139, 92, 246, 0.25);
          display: flex;
          align-items: center;
          gap: 14px;
        }
        @media (max-width: 1024px) {
          .audit-filters-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .col-span-2 {
            grid-column: span 2;
          }
        }
        @media (max-width: 640px) {
          .audit-filters-grid {
            grid-template-columns: 1fr;
            gap: 10px;
          }
          .col-span-2 {
            grid-column: span 1;
          }
          .card.audit-filters-card {
            padding: 14px 16px;
            margin-bottom: 16px;
          }
          .audit-filters-footer {
            justify-content: stretch;
          }
          .audit-filters-footer .btn {
            width: 100%;
            justify-content: center;
          }
          .publisher-banner {
            padding: 12px 16px;
            flex-wrap: wrap;
            gap: 10px;
          }
          .publisher-banner-avatar {
            width: 36px !important;
            height: 36px !important;
            font-size: 14px !important;
          }
          .publisher-banner-clear {
            width: 100% !important;
            justify-content: center !important;
          }
          .exact-time {
            display: none !important;
          }
        }
      `}</style>

      {/* ── Filters Panel ── */}
      {showFilters && (
        <div className="card audit-filters-card">
          <div className="audit-filters-grid">

            {/* Search */}
            <div className="col-span-2">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Search size={13} /> Search
              </label>
              <input
                className="form-input"
                placeholder="Search descriptions, entity IDs, actor names…"
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
              />
            </div>

            {/* Publisher filter */}
            <div className="col-span-2">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Building2 size={13} /> Publisher (show all activity for a specific publisher)
              </label>
              <PublisherPicker
                value={filters.publisher_id}
                onChange={(id, pub) => {
                  setFilters(f => ({ ...f, publisher_id: id }))
                  setActivePublisher(pub)
                  setPage(1)
                }}
              />
            </div>

            {/* Action */}
            <div>
              <label className="form-label">Action</label>
              <select className="form-select" value={filters.action}
                onChange={e => {
                  setFilters(f => ({ ...f, action: e.target.value }))
                  setPage(1)
                }}>
                {ACTION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {/* Entity Type */}
            <div>
              <label className="form-label">Entity Type</label>
              <select className="form-select" value={filters.entity_type}
                onChange={e => {
                  setFilters(f => ({ ...f, entity_type: e.target.value }))
                  setPage(1)
                }}>
                {ENTITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {/* Date From */}
            <div>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Calendar size={13} /> Date From
              </label>
              <input type="date" className="form-input" value={filters.date_from}
                onChange={e => {
                  setFilters(f => ({ ...f, date_from: e.target.value }))
                  setPage(1)
                }} />
            </div>

            {/* Date To */}
            <div>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Calendar size={13} /> Date To
              </label>
              <input type="date" className="form-input" value={filters.date_to}
                onChange={e => {
                  setFilters(f => ({ ...f, date_to: e.target.value }))
                  setPage(1)
                }} />
            </div>
          </div>

          {activeCount > 0 && (
            <div className="audit-filters-footer">
              <button className="btn btn-secondary" onClick={clearFilters}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 13,
                  padding: '6px 14px',
                  border: '1px solid rgba(244, 63, 94, 0.2)',
                  color: 'var(--br-text-2)',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(244, 63, 94, 0.08)'
                  e.currentTarget.style.borderColor = 'rgba(244, 63, 94, 0.4)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.borderColor = 'rgba(244, 63, 94, 0.2)'
                }}
              >
                <X size={14} style={{ color: 'var(--br-danger)' }} />
                <span>Clear All Filters</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Active filter chips ── */}
      {activeCount > 0 && !showFilters && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--br-text-3)', fontWeight: 600 }}>Active filters:</span>
          {filters.action && (
            <span className="badge badge-active" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              Action: {filters.action}
              <button onClick={() => { setFilters(f => ({ ...f, action: '' })); setPage(1) }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, lineHeight: 1 }}>
                <X size={11} />
              </button>
            </span>
          )}
          {filters.entity_type && (
            <span className="badge badge-pending" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              Entity: {filters.entity_type}
              <button onClick={() => { setFilters(f => ({ ...f, entity_type: '' })); setPage(1) }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, lineHeight: 1 }}>
                <X size={11} />
              </button>
            </span>
          )}
          {filters.date_from && (
            <span className="badge badge-inactive" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              From: {filters.date_from}
              <button onClick={() => { setFilters(f => ({ ...f, date_from: '' })); setPage(1) }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, lineHeight: 1 }}>
                <X size={11} />
              </button>
            </span>
          )}
          {filters.date_to && (
            <span className="badge badge-inactive" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              To: {filters.date_to}
              <button onClick={() => { setFilters(f => ({ ...f, date_to: '' })); setPage(1) }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, lineHeight: 1 }}>
                <X size={11} />
              </button>
            </span>
          )}
          {filters.search && (
            <span className="badge badge-pending" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              Search: "{filters.search}"
              <button onClick={() => { setFilters(f => ({ ...f, search: '' })); setPage(1) }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, lineHeight: 1 }}>
                <X size={11} />
              </button>
            </span>
          )}
          {filters.publisher_id && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12,
              padding: '3px 10px', borderRadius: 6, fontWeight: 600,
              background: 'rgba(139,92,246,0.15)', color: 'var(--br-violet-hover)',
              border: '1px solid rgba(139,92,246,0.3)'
            }}>
              <Building2 size={11} />
              {activePublisher ? `${activePublisher.name} — ${activePublisher.email}` : 'Publisher filter'}
              <button onClick={() => { setFilters(f => ({ ...f, publisher_id: '' })); setActivePublisher(null); setPage(1) }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, lineHeight: 1 }}>
                <X size={11} />
              </button>
            </span>
          )}
        </div>
      )}

      {/* ── Publisher context banner ── */}
      {filters.publisher_id && activePublisher && (
        <div className="publisher-banner">
          <div className="publisher-banner-avatar" style={{
            width: 44, height: 44, borderRadius: 11, flexShrink: 0,
            background: 'rgba(139,92,246,0.15)',
            border: '1.5px solid rgba(139,92,246,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 17, fontWeight: 800, color: 'var(--br-violet-hover)'
          }}>
            {activePublisher.name[0]?.toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--br-text)' }}>
              Showing all activity for: <span style={{ color: 'var(--br-violet-hover)' }}>{activePublisher.name}</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--br-text-3)', marginTop: 2 }}>
              {activePublisher.email}
              {activePublisher.status && (
                <span style={{
                  marginLeft: 10, fontSize: 11, fontWeight: 700,
                  padding: '1px 7px', borderRadius: 5,
                  background: activePublisher.status === 'active' ? 'rgba(16,185,129,0.12)' : 'rgba(244,63,94,0.12)',
                  color: activePublisher.status === 'active' ? '#10b981' : '#f43f5e'
                }}>
                  {activePublisher.status}
                </span>
              )}
            </div>
            <div style={{ fontSize: 11, color: 'var(--br-text-3)', marginTop: 3 }}>
              Includes: Publisher profile · Websites · Ad Units · Payouts · Adjustments
            </div>
          </div>
          <button className="btn btn-secondary publisher-banner-clear" onClick={() => { setFilters(f => ({ ...f, publisher_id: '' })); setActivePublisher(null); setPage(1) }}
            style={{ fontSize: 12, padding: '5px 12px', display: 'inline-flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
            <X size={13} /> Clear
          </button>
        </div>
      )}

      {/* ── Activity Feed Card ── */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>

        {/* Summary bar */}
        {meta && !loading && (
          <div style={{
            padding: '12px 20px',
            borderBottom: '1px solid var(--br-border)',
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 12, color: 'var(--br-text-3)',
            background: 'rgba(0,242,254,0.02)'
          }}>
            <Activity size={13} style={{ color: 'var(--br-primary)' }} />
            <span>
              Showing <strong style={{ color: 'var(--br-text-2)' }}>{meta.from}–{meta.to}</strong> of{' '}
              <strong style={{ color: 'var(--br-text-2)' }}>{meta.total}</strong> events
            </span>
          </div>
        )}

        {/* Feed */}
        {loading ? (
          <div className="empty-state">
            <div className="spinner" />
          </div>
        ) : logs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><ClipboardList size={40} /></div>
            <div className="empty-state-text">No audit logs found</div>
            {activeCount > 0 && (
              <button className="btn btn-secondary" onClick={clearFilters} style={{ marginTop: 12 }}>
                Clear filters
              </button>
            )}
          </div>
        ) : (
          logs.map(log => (
            <LogRow key={log.id} log={log} onViewDetails={setSelectedLog} />
          ))
        )}

        {/* Pagination */}
        {meta && (
          <div style={{ borderTop: '1px solid var(--br-border)' }}>
            <Pagination
              currentPage={meta.current_page}
              totalItems={meta.total}
              pageSize={meta.per_page}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>

      {/* ── Detail Modal ── */}
      {selectedLog && (
        <AuditLogDetailModal
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
        />
      )}
    </div>
  )
}
