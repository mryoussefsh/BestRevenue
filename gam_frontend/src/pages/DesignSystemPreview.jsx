import { useState } from 'react'
import { TrendingUp, Plus, Filter, Check, Ban, Download, DollarSign, Users, CreditCard, Eye, Info, CheckCircle2, AlertTriangle, XCircle, Bell, LayoutDashboard, Globe, Settings, User, LayoutGrid, Sparkles, Clock } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const chartData = [
  { date: '05-12', gross: 45, approved: 34, pending: null },
  { date: '05-14', gross: 33, approved: 25, pending: null },
  { date: '05-16', gross: 63, approved: 52, pending: null },
  { date: '05-18', gross: 38, approved: 28, pending: null },
  { date: '05-20', gross: 30, approved: 23, pending: null },
  { date: '05-22', gross: 34, approved: 26, pending: null },
  { date: '05-24', gross: 46, approved: 36, pending: null },
  { date: '05-26', gross: 33, approved: 24, pending: null },
  { date: '05-28', gross: 18, approved: 13, pending: null },
  { date: '05-30', gross: 36, approved: 28, pending: null },
  { date: '06-01', gross: 40, approved: 30, pending: 30 },
  { date: '06-03', gross: 22, approved: null, pending: 18 },
  { date: '06-05', gross: 20, approved: null, pending: 15 },
  { date: '06-07', gross: 28, approved: null, pending: 22 },
  { date: '06-09', gross: 36, approved: null, pending: 28 },
  { date: '06-11', gross: 10, approved: null, pending: 8 },
]

export default function DesignSystemPreview() {
  const [selectedNav, setSelectedNav] = useState('Dashboard')
  const [selectedSidebar, setSelectedSidebar] = useState('Dashboard')

  return (
    <div className="ds-root">
      {/* Brand Header */}
      <div className="page-brand">
        <div className="page-brand-logo">
          <TrendingUp size={18} style={{ color: '#fff' }} />
        </div>
        <div>
          <div className="page-brand-name">BestRevenue</div>
          <div className="page-brand-tag">Design System v1.0 — React Preview</div>
        </div>
        <span className="badge badge-info" style={{ marginLeft: 'auto' }}>
          <span className="dot"></span> Active Redesign
        </span>
      </div>

      {/* Colors */}
      <div className="ds-section">
        <div className="ds-section-title">Color System</div>
        <div className="ds-grid">
          <div className="swatch">
            <div className="swatch-color" style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)' }}></div>
            <div className="swatch-info">
              <div className="swatch-name">Primary</div>
              <div className="swatch-hex">#6366f1 · #4f46e5</div>
            </div>
          </div>
          <div className="swatch">
            <div className="swatch-color" style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}></div>
            <div className="swatch-info">
              <div className="swatch-name">Accent</div>
              <div className="swatch-hex">#10b981 · #059669</div>
            </div>
          </div>
          <div className="swatch">
            <div className="swatch-color" style={{ background: 'linear-gradient(135deg,#f43f5e,#e11d48)' }}></div>
            <div className="swatch-info">
              <div className="swatch-name">Danger</div>
              <div className="swatch-hex">#f43f5e · #e11d48</div>
            </div>
          </div>
          <div className="swatch">
            <div className="swatch-color" style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}></div>
            <div className="swatch-info">
              <div className="swatch-name">Warning</div>
              <div className="swatch-hex">#f59e0b · #d97706</div>
            </div>
          </div>
          <div className="swatch">
            <div className="swatch-color" style={{ background: '#090a0f', borderBottom: '1px solid rgba(255,255,255,0.1)' }}></div>
            <div className="swatch-info">
              <div className="swatch-name">Background</div>
              <div className="swatch-hex">#090a0f · #030712</div>
            </div>
          </div>
          <div className="swatch">
            <div className="swatch-color" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}></div>
            <div className="swatch-info">
              <div className="swatch-name">Surface</div>
              <div className="swatch-hex">rgba(255,255,255,0.04)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Typography */}
      <div className="ds-section">
        <div className="ds-section-title">Typography — Inter</div>
        <div style={{ background: 'var(--br-surface)', border: '0.5px solid var(--br-border)', borderRadius: 'var(--br-radius-lg)', padding: '24px' }}>
          <div className="type-display">Display / 32px 700</div>
          <div className="type-h1">Heading 1 / 24px 600</div>
          <div className="type-h2">Heading 2 / 20px 600</div>
          <div className="type-h3">Heading 3 / 16px 500</div>
          <div className="type-body">
            Body text / 14px 400 — Revenue sharing platform for Google Ad Manager publishers. Track earnings, manage payouts, and monitor performance.
          </div>
          <div className="type-caption">Caption / 12px — Last updated 3 minutes ago</div>
          <div style={{ marginTop: '8px' }}>
            <span className="type-mono">$42,810.00</span>
          </div>
          <div style={{ marginTop: '8px' }}>
            <span className="type-label">Revenue Share</span>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="ds-section">
        <div className="ds-section-title">Buttons</div>
        <div className="ds-row" style={{ marginBottom: '12px' }}>
          <button className="btn btn-primary btn-md">
            <Plus size={14} /> New Payout
          </button>
          <button className="btn btn-secondary btn-md">
            <Filter size={14} /> Filter
          </button>
          <button className="btn btn-accent btn-md">
            <Check size={14} /> Approve
          </button>
          <button className="btn btn-danger btn-md">
            <Ban size={14} /> Reject
          </button>
          <button className="btn btn-ghost btn-md">
            <Download size={14} /> Export
          </button>
        </div>
        <div className="ds-row">
          <button className="btn btn-primary btn-sm">Small</button>
          <button className="btn btn-primary btn-md">Medium</button>
          <button className="btn btn-primary btn-lg">Large</button>
          <button className="btn btn-primary btn-md" disabled>Disabled</button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="ds-section">
        <div className="ds-section-title">Metric Cards</div>
        <div className="ds-grid">
          <div className="glass-card">
            <div className="glass-card-label">
              <DollarSign size={13} /> Total Revenue
            </div>
            <div className="glass-card-value">$84,210</div>
            <div className="glass-card-meta">
              <span className="badge-up">
                <TrendingUp size={10} /> +12.4%
              </span>{' '}
              vs last month
            </div>
          </div>
          <div className="glass-card">
            <div className="glass-card-label">
              <Users size={13} /> Publishers
            </div>
            <div className="glass-card-value">138</div>
            <div className="glass-card-meta">
              <span className="badge-up">+3</span> new this week
            </div>
          </div>
          <div className="glass-card">
            <div className="glass-card-label">
              <CreditCard size={13} /> Pending Payouts
            </div>
            <div className="glass-card-value">$12,450</div>
            <div className="glass-card-meta">
              <span className="badge-down">7 pending</span>
            </div>
          </div>
          <div className="glass-card">
            <div className="glass-card-label">
              <Eye size={13} /> Impressions
            </div>
            <div className="glass-card-value">4.2M</div>
            <div className="glass-card-meta">
              <span className="badge-up">+8.1%</span> this week
            </div>
          </div>
        </div>
      </div>

      {/* Badges */}
      <div className="ds-section">
        <div className="ds-section-title">Badges & Status</div>
        <div className="ds-row">
          <span className="badge badge-success">
            <span className="dot"></span>Active
          </span>
          <span className="badge badge-warning">
            <span className="dot"></span>Pending
          </span>
          <span className="badge badge-danger">
            <span className="dot"></span>Rejected
          </span>
          <span className="badge badge-info">
            <span className="dot"></span>Processing
          </span>
          <span className="badge badge-neutral">
            <span className="dot"></span>Inactive
          </span>
        </div>
      </div>

      {/* Alerts */}
      <div className="ds-section">
        <div className="ds-section-title">Alerts</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div className="alert alert-info">
            <Info size={16} className="alert-icon" />
            <div>
              <div className="alert-title">Revenue sync in progress</div>
              <div className="alert-body">GAM data is being pulled for the last 24 hours. This may take a few moments.</div>
            </div>
          </div>
          <div className="alert alert-success">
            <CheckCircle2 size={16} className="alert-icon" />
            <div>
              <div className="alert-title">Payout approved</div>
              <div className="alert-body">$3,240.00 has been approved and queued for processing.</div>
            </div>
          </div>
          <div className="alert alert-warning">
            <AlertTriangle size={16} className="alert-icon" />
            <div>
              <div className="alert-title">Minimum threshold not met</div>
              <div className="alert-body">Publisher earnings of $18.40 are below the $50 payout minimum.</div>
            </div>
          </div>
          <div className="alert alert-danger">
            <XCircle size={16} className="alert-icon" />
            <div>
              <div className="alert-title">GAM sync failed</div>
              <div className="alert-body">Connection to Google Ad Manager timed out. Retrying in 5 minutes.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Forms */}
      <div className="ds-section">
        <div className="ds-section-title">Form Controls</div>
        <div className="ds-grid-2" style={{ gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">Publisher Name</label>
            <input className="form-input" type="text" placeholder="e.g. Acme Media LLC" />
            <span className="form-hint">Used for payout records and reports.</span>
          </div>
          <div className="form-group">
            <label className="form-label">Revenue Share %</label>
            <input className="form-input" type="text" placeholder="e.g. 70" />
            <span className="form-hint">Percentage paid to publisher. Hidden from publisher view.</span>
          </div>
          <div className="form-group">
            <label className="form-label">Payout Method</label>
            <select className="form-select">
              <option>Bank Transfer</option>
              <option>PayPal</option>
              <option>Wise</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" placeholder="publisher@domain.com" />
            <span className="form-error">This email is already registered.</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="ds-section">
        <div className="ds-section-title">Table</div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Publisher</th>
                <th>Website</th>
                <th>Earnings</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="td-primary">Acme Media</td>
                <td>acmemedia.com</td>
                <td className="td-amount">$4,812.00</td>
                <td>
                  <span className="badge badge-success">
                    <span className="dot"></span>Active
                  </span>
                </td>
                <td>
                  <button className="btn btn-ghost btn-sm">
                    <Eye size={12} />
                  </button>
                </td>
              </tr>
              <tr>
                <td className="td-primary">Cairo Digital</td>
                <td>cairodigital.net</td>
                <td className="td-amount">$1,230.50</td>
                <td>
                  <span className="badge badge-warning">
                    <span className="dot"></span>Pending
                  </span>
                </td>
                <td>
                  <button className="btn btn-ghost btn-sm">
                    <Eye size={12} />
                  </button>
                </td>
              </tr>
              <tr>
                <td className="td-primary">Gulf News Hub</td>
                <td>gnhub.com</td>
                <td className="td-amount">$8,041.20</td>
                <td>
                  <span className="badge badge-success">
                    <span className="dot"></span>Active
                  </span>
                </td>
                <td>
                  <button className="btn btn-ghost btn-sm">
                    <Eye size={12} />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Skeleton */}
      <div className="ds-section">
        <div className="ds-section-title">Loading States</div>
        <div className="ds-grid">
          <div className="glass-card">
            <div className="skeleton" style={{ height: '10px', width: '60%', marginBottom: '14px' }}></div>
            <div className="skeleton" style={{ height: '28px', width: '80%', marginBottom: '10px' }}></div>
            <div className="skeleton" style={{ height: '10px', width: '40%' }}></div>
          </div>
          <div className="glass-card">
            <div className="skeleton" style={{ height: '10px', width: '50%', marginBottom: '14px' }}></div>
            <div className="skeleton" style={{ height: '28px', width: '70%', marginBottom: '10px' }}></div>
            <div className="skeleton" style={{ height: '10px', width: '35%' }}></div>
          </div>
          <div className="glass-card">
            <div className="skeleton" style={{ height: '10px', width: '65%', marginBottom: '14px' }}></div>
            <div className="skeleton" style={{ height: '28px', width: '55%', marginBottom: '10px' }}></div>
            <div className="skeleton" style={{ height: '10px', width: '45%' }}></div>
          </div>
        </div>
      </div>

      {/* Navigation Preview */}
      <div className="ds-section">
        <div className="ds-section-title">Navigation — Top Bar</div>
        <div className="nav-preview">
          <div className="nav-logo">
            <div className="nav-logo-dot"></div>BestRevenue
          </div>
          <div className="nav-links">
            {['Dashboard', 'Reports', 'Payouts', 'Publishers'].map((item) => (
              <div 
                key={item}
                className={`nav-link ${selectedNav === item ? 'active' : ''}`}
                onClick={() => setSelectedNav(item)}
              >
                {item}
              </div>
            ))}
          </div>
          <div className="nav-right">
            <button className="btn btn-ghost btn-sm" style={{ padding: '6px 10px' }}>
              <Bell size={14} />
            </button>
            <div className="avatar">YA</div>
          </div>
        </div>
      </div>

      {/* Sidebar Preview */}
      <div className="ds-section">
        <div className="ds-section-title">Navigation — Sidebar</div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div className="sidebar-preview">
            <div className="sidebar-section">Main</div>
            <div 
              className={`sidebar-item ${selectedSidebar === 'Dashboard' ? 'active' : ''}`}
              onClick={() => setSelectedSidebar('Dashboard')}
            >
              <LayoutDashboard size={14} /> Dashboard
            </div>
            <div 
              className={`sidebar-item ${selectedSidebar === 'Reports' ? 'active' : ''}`}
              onClick={() => setSelectedSidebar('Reports')}
            >
              <TrendingUp size={14} /> Reports
            </div>
            <div 
              className={`sidebar-item ${selectedSidebar === 'Payouts' ? 'active' : ''}`}
              onClick={() => setSelectedSidebar('Payouts')}
            >
              <CreditCard size={14} /> Payouts
            </div>
            <div className="sidebar-section">Manage</div>
            <div 
              className={`sidebar-item ${selectedSidebar === 'Publishers' ? 'active' : ''}`}
              onClick={() => setSelectedSidebar('Publishers')}
            >
              <Users size={14} /> Publishers
            </div>
            <div 
              className={`sidebar-item ${selectedSidebar === 'Websites' ? 'active' : ''}`}
              onClick={() => setSelectedSidebar('Websites')}
            >
              <Globe size={14} /> Websites
            </div>
            <div 
              className={`sidebar-item ${selectedSidebar === 'AdUnits' ? 'active' : ''}`}
              onClick={() => setSelectedSidebar('AdUnits')}
            >
              <LayoutGrid size={14} /> Ad Units
            </div>
            <div className="sidebar-section">System</div>
            <div 
              className={`sidebar-item ${selectedSidebar === 'Settings' ? 'active' : ''}`}
              onClick={() => setSelectedSidebar('Settings')}
            >
              <Settings size={14} /> Settings
            </div>
          </div>
          <div style={{ flex: '1 1 240px', background: 'var(--br-bg-2)', border: '0.5px solid var(--br-border)', borderRadius: 'var(--br-radius-lg)', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '180px' }}>
            <div style={{ textAlign: 'center' }}>
              <Sparkles size={32} style={{ color: 'var(--br-text-3)' }} />
              <div style={{ fontSize: '13px', color: 'var(--br-text-3)', marginTop: '8px' }}>Page content area preview</div>
            </div>
          </div>
        </div>
      </div>

      {/* Spacing Tokens */}
      <div className="ds-section">
        <div className="ds-section-title">Spacing Tokens</div>
        <div style={{ background: 'var(--br-surface)', border: '0.5px solid var(--br-border)', borderRadius: 'var(--br-radius-lg)', padding: '20px' }}>
          {[
            { label: 'space-1', val: '4px', w: '4px' },
            { label: 'space-2', val: '8px', w: '8px' },
            { label: 'space-3', val: '12px', w: '12px' },
            { label: 'space-4', val: '16px (base)', w: '16px' },
            { label: 'space-6', val: '24px', w: '24px' },
            { label: 'space-8', val: '32px', w: '32px' },
            { label: 'space-12', val: '48px', w: '48px' },
          ].map((item) => (
            <div key={item.label} className="spacing-item">
              <div className="spacing-bar" style={{ width: item.w }}></div>
              <div className="spacing-label">{item.label}</div>
              <div className="spacing-value">{item.val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="ds-section">
        <div className="ds-section-title">Chart — Revenue Trend</div>
        <div style={{ background: 'var(--br-surface)', border: '0.5px solid var(--br-border)', borderRadius: 'var(--br-radius-lg)', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: 700, color: 'var(--br-text)' }}>
                <TrendingUp size={16} style={{ color: '#f43f5e' }} /> Revenue Trend
              </div>
              <div style={{ fontSize: '12px', color: 'var(--br-text-3)', marginTop: '4px' }}>2026-05-12 → 2026-06-11</div>
            </div>
            
            {/* Custom Premium Legend Pills */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span className="badge" style={{ border: '1px solid rgba(99, 102, 241, 0.4)', color: '#c7d2fe', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '20px', padding: '4px 12px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#6366f1' }}></span>
                Gross Revenue
              </span>
              <span className="badge" style={{ border: '1px solid rgba(16, 185, 129, 0.4)', color: '#a7f3d0', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '20px', padding: '4px 12px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></span>
                Pub. Earnings
              </span>
              <span className="badge" style={{ border: '1px solid rgba(6, 182, 212, 0.4)', color: '#c5f2f7', background: 'rgba(6, 182, 212, 0.1)', borderRadius: '20px', padding: '4px 12px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
                <Check size={11} style={{ color: '#06b6d4' }} />
                Approved
              </span>
              <span className="badge" style={{ border: '1px solid rgba(245, 158, 11, 0.4)', color: '#fef08a', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '20px', padding: '4px 12px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
                <Clock size={11} style={{ color: '#f59e0b' }} />
                Pending
              </span>
            </div>
          </div>
          
          <div style={{ width: '100%', height: '260px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="grossGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.08}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="approvedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="pendingGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.18}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis dataKey="date" stroke="#475569" tick={{ fontSize: 11 }} />
                <YAxis stroke="#475569" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                <Tooltip 
                  contentStyle={{ background: '#161b27', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ color: '#94a3b8' }}
                  labelStyle={{ color: '#f1f5f9', fontWeight: 600 }}
                  formatter={(value, name) => {
                    const formattedValue = `$${value.toLocaleString()}`;
                    if (name === 'gross') return [formattedValue, 'Gross Revenue'];
                    if (name === 'approved') return [formattedValue, 'Approved Earnings'];
                    if (name === 'pending') return [formattedValue, 'Pending Earnings'];
                    return [formattedValue, name];
                  }}
                />
                {/* Gross Revenue Area Line */}
                <Area type="monotone" dataKey="gross" stroke="#6366f1" strokeWidth={2} fill="url(#grossGrad)" dot={false} />
                {/* Approved Area Line (Solid Emerald) */}
                <Area type="monotone" dataKey="approved" stroke="#10b981" strokeWidth={2} fill="url(#approvedGrad)" dot={false} connectNulls={false} />
                {/* Pending Area Line (Dashed Orange) */}
                <Area type="monotone" dataKey="pending" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 4" fill="url(#pendingGrad)" dot={false} connectNulls={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Border Radius */}
      <div className="ds-section">
        <div className="ds-section-title">Border Radius</div>
        <div className="ds-row">
          {[
            { label: '4px', radius: '4px' },
            { label: '8px', radius: '8px' },
            { label: '10px (default)', radius: '10px' },
            { label: '14px (card)', radius: '14px' },
            { label: '50% (avatar)', radius: '50%' },
          ].map((item) => (
            <div key={item.label} style={{ textAlign: 'center' }}>
              <div style={{ width: '56px', height: '56px', background: 'var(--br-primary-subtle)', border: '1px solid var(--br-primary)', borderRadius: item.radius, margin: '0 auto 6px' }}></div>
              <div className="type-caption">{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer note */}
      <div style={{ textAlign: 'center', paddingTop: '16px', borderTop: '0.5px solid var(--br-border)' }}>
        <div className="type-caption">BestRevenue Design System v1.0 · Interactive React Preview</div>
      </div>
    </div>
  )
}
