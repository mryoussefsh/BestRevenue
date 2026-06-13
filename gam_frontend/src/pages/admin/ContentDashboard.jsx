import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { adminApi } from '../../api/endpoints'
import toast from 'react-hot-toast'
import {
  FileText, Languages, Mail, Megaphone, Edit, RefreshCw, Eye, ArrowRight
} from 'lucide-react'

export default function ContentDashboard() {
  const [stats, setStats] = useState(null)
  const [pages, setPages] = useState([])
  const [templates, setTemplates] = useState([])
  const [translationsCount, setTranslationsCount] = useState(0)
  const [announcementsCount, setAnnouncementsCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [pagesRes, templatesRes, translationsRes, announcementsRes] = await Promise.all([
        adminApi.getPages(),
        adminApi.getEmailTemplates(),
        adminApi.getTranslations('en'),
        adminApi.getAnnouncements()
      ])

      const pagesList = pagesRes.data?.data || []
      const templatesList = templatesRes.data || []
      const transData = translationsRes.data || {}
      const announcementsList = announcementsRes.data?.data || []

      const transKeysCount = Object.keys(transData).length

      setStats({
        activePages: pagesList.filter(p => p.is_active).length,
        templatesCount: templatesList.length,
        translationsCount: transKeysCount,
        announcementsCount: announcementsList.length
      })

      setPages(pagesList.slice(0, 5))
      setTemplates(templatesList.slice(0, 5))
      setTranslationsCount(transKeysCount)
      setAnnouncementsCount(announcementsList.length)

    } catch (err) {
      console.error(err)
      toast.error('Failed to load content dashboard data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="empty-state"><div className="spinner" /></div>
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={28} style={{ color: 'var(--br-primary)' }} />
            <span>Content Management desk</span>
          </h1>
          <p className="page-subtitle" style={{ color: 'var(--color-text-muted)' }}>
            Workspace for maintaining static page descriptions, dynamic notification templates, and translations
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: .5, color: 'var(--color-text-muted)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          <FileText size={14} style={{ color: 'var(--br-primary)' }} /> Platform Content & Localization
        </div>
        <div className="stat-grid">
          <div className="stat-card primary">
            <div className="stat-icon"><FileText size={20} /></div>
            <div className="stat-label">Active Static Pages</div>
            <div className="stat-value">{stats?.activePages}</div>
            <div className="stat-change">Published site pages</div>
          </div>
          <div className="stat-card accent">
            <div className="stat-icon"><Languages size={20} /></div>
            <div className="stat-label">Translation Keys</div>
            <div className="stat-value">{stats?.translationsCount}</div>
            <div className="stat-change">English (en) language dictionary</div>
          </div>
          <div className="stat-card info">
            <div className="stat-icon"><Mail size={20} /></div>
            <div className="stat-label">Email Templates</div>
            <div className="stat-value">{stats?.templatesCount}</div>
            <div className="stat-change">Automated system emails</div>
          </div>
          <div className="stat-card warning">
            <div className="stat-icon"><Megaphone size={20} /></div>
            <div className="stat-label">Broadcast Announcements</div>
            <div className="stat-value">{stats?.announcementsCount}</div>
            <div className="stat-change">Total notices sent</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Static Pages & Email Templates */}
      <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24, marginBottom: 24 }}>
        
        {/* Static Pages List */}
        <div className="card" style={{ padding: 0 }}>
          <div className="card-header" style={{ padding: '16px 20px' }}>
            <div>
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <FileText size={16} style={{ color: 'var(--br-primary)' }} /> Recent Static Pages
              </div>
              <div className="card-subtitle">Manage pages such as Terms, Privacy, or custom landing pages</div>
            </div>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Page Title</th>
                  <th>Slug Path</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pages.length === 0 ? (
                  <tr>
                    <td colSpan={4}>
                      <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--color-text-muted)' }}>
                        No pages created
                      </div>
                    </td>
                  </tr>
                ) : (
                  pages.map(page => (
                    <tr key={page.id}>
                      <td style={{ fontWeight: 600, fontSize: 13 }}>{page.title}</td>
                      <td><code>/{page.slug}</code></td>
                      <td>
                        <span className={`badge ${page.is_active ? 'badge-approved' : 'badge-inactive'}`}>
                          {page.is_active ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td>
                        <Link to="/admin/pages" className="btn btn-secondary btn-xs" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Edit size={10} /> Edit
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Email Templates list */}
        <div className="card" style={{ padding: 0 }}>
          <div className="card-header" style={{ padding: '16px 20px' }}>
            <div>
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Mail size={16} style={{ color: 'var(--br-primary)' }} /> System Email Templates
              </div>
              <div className="card-subtitle">Notification templates sent on user trigger events</div>
            </div>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Event Template</th>
                  <th>Subject Title</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {templates.length === 0 ? (
                  <tr>
                    <td colSpan={3}>
                      <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--color-text-muted)' }}>
                        No templates loaded
                      </div>
                    </td>
                  </tr>
                ) : (
                  templates.map(t => (
                    <tr key={t.key}>
                      <td style={{ fontWeight: 600, fontSize: 13 }}>
                        {t.key.replace(/_/g, ' ').toUpperCase()}
                      </td>
                      <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.subject}
                      </td>
                      <td>
                        <Link to="/admin/email-templates" className="btn btn-secondary btn-xs" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Edit size={10} /> Customize
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Translations Overview widget */}
      <div className="card" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(99,102,241,0.01))', border: '1px solid rgba(99,102,241,0.2)' }}>
        <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <Languages size={16} style={{ color: 'var(--br-primary)' }} /> Translations Progress
        </div>
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 16 }}>
          Currently active translation dictionaries inside the platform. Ensure key mappings are completed to prevent empty fields in the user interfaces.
        </p>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200, padding: 16, background: 'rgba(0,0,0,0.2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontWeight: 600 }}>English (en)</span>
              <span style={{ color: 'var(--color-accent)', fontWeight: 'bold' }}>100% complete</span>
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: 'var(--color-accent)', width: '100%' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--color-text-muted)', marginTop: 8 }}>
              <span>{translationsCount} mappings active</span>
              <Link to="/admin/translations" style={{ color: 'var(--br-primary)', display: 'inline-flex', alignItems: 'center', gap: '2px', textDecoration: 'none' }}>Edit <ArrowRight size={10} /></Link>
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 200, padding: 16, background: 'rgba(0,0,0,0.2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontWeight: 600 }}>Arabic (ar)</span>
              <span style={{ color: 'var(--color-warning)', fontWeight: 'bold' }}>Pending Translation</span>
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: '#ef4444', width: '0%' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--color-text-muted)', marginTop: 8 }}>
              <span>Awaiting localisation sync</span>
              <Link to="/admin/translations" style={{ color: 'var(--br-primary)', display: 'inline-flex', alignItems: 'center', gap: '2px', textDecoration: 'none' }}>Initialize <ArrowRight size={10} /></Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
