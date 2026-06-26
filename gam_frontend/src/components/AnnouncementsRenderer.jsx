import { useState, useEffect, useCallback, memo } from 'react'
import { publisherApi } from '../api/endpoints'
import { useI18n } from '../contexts/I18nContext'
import { X, Info, CheckCircle, AlertTriangle, AlertCircle, ChevronUp, ChevronDown } from 'lucide-react'

// Client-side memory cache for announcements to prevent redundant fetches on route changes
let announcementsCache = null
let cacheTimestamp = 0
const CACHE_TTL = 60000 // 1 minute

// Renders active announcements fetched from the backend.
// Banners are shown at the top of the page.
// Modals are shown one at a time, prioritized by priority field.
export default function AnnouncementsRenderer() {
  const [banners, setBanners]               = useState([])
  const [modals, setModals]                 = useState([])
  const [currentModalIdx, setCurrentModalIdx] = useState(0)
  const [closedBanners, setClosedBanners]   = useState(new Set())
  const [dontShowAgain, setDontShowAgain]   = useState(false)
  const [modalVisible, setModalVisible]     = useState(false)
  const [collapsedBanners, setCollapsedBanners] = useState(new Set())

  const setAnnouncementsData = useCallback((data) => {
    setBanners(data.filter(a => a.type === 'banner'))
    const mods = data.filter(a => a.type === 'modal')
    setModals(mods)
    if (mods.length > 0) setTimeout(() => setModalVisible(true), 400)
  }, [])

  const load = useCallback(async () => {
    const now = Date.now()
    if (announcementsCache && (now - cacheTimestamp < CACHE_TTL)) {
      setAnnouncementsData(announcementsCache)
      return
    }

    try {
      const res  = await publisherApi.getAnnouncements()
      const data = res.data?.data || []
      announcementsCache = data
      cacheTimestamp = now
      setAnnouncementsData(data)
    } catch {
      // Silently fail — don't disrupt the dashboard
    }
  }, [setAnnouncementsData])

  useEffect(() => {
    load()
  }, [load])

  const logInteraction = useCallback(async (id, action, buttonIndex = null) => {
    try {
      await publisherApi.interactAnnouncement(id, { action, button_index: buttonIndex })
    } catch { /* silent */ }
  }, [])

  const toggleCollapse = useCallback((id) => {
    setCollapsedBanners(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  const dismissBanner = useCallback((id) => {
    logInteraction(id, 'dismiss')
    setClosedBanners(prev => new Set([...prev, id]))
    if (announcementsCache) {
      announcementsCache = announcementsCache.filter(a => a.id !== id)
    }
  }, [logInteraction])

  const closeModal = useCallback((announce) => {
    if (dontShowAgain && announce.allow_dismiss) {
      logInteraction(announce.id, 'dismiss')
      if (announcementsCache) {
        announcementsCache = announcementsCache.filter(a => a.id !== announce.id)
      }
    }
    setModalVisible(false)
    setDontShowAgain(false)
    if (currentModalIdx + 1 < modals.length) {
      setTimeout(() => {
        setCurrentModalIdx(i => i + 1)
        setTimeout(() => setModalVisible(true), 200)
      }, 300)
    }
  }, [dontShowAgain, logInteraction, currentModalIdx, modals.length])

  const handleButtonClick = useCallback((announce, btn, idx) => {
    logInteraction(announce.id, 'click', idx)
    if (btn.new_tab) window.open(btn.url, '_blank', 'noopener noreferrer')
    else window.location.href = btn.url
  }, [logInteraction])

  const visibleBanners = banners.filter(b => !closedBanners.has(b.id))
  const currentModal   = modals[currentModalIdx]

  return (
    <>
      {/* ── BANNERS ── */}
      {visibleBanners.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {visibleBanners.map(banner => (
            <BannerItem
              key={banner.id}
              banner={banner}
              isCollapsed={collapsedBanners.has(banner.id)}
              onToggleCollapse={toggleCollapse}
              onDismiss={dismissBanner}
              onButtonClick={handleButtonClick}
            />
          ))}
        </div>
      )}

      {/* ── MODAL ── */}
      {currentModal && modalVisible && (
        <ModalItem
          announcement={currentModal}
          dontShowAgain={dontShowAgain}
          onDontShowAgainChange={setDontShowAgain}
          onClose={() => closeModal(currentModal)}
          onButtonClick={(btn, idx) => handleButtonClick(currentModal, btn, idx)}
        />
      )}
    </>
  )
}

// ── Banner Component ────────────────────────────────────────────────────────

const BannerItem = memo(function BannerItem({ banner, isCollapsed, onToggleCollapse, onDismiss, onButtonClick }) {
  const { t, locale } = useI18n()

  const styleKey     = banner.style || 'info'
  const styleCfg     = STYLE_CONFIG[styleKey] || STYLE_CONFIG.info
  const IconComponent = styleCfg.icon

  const displayTitle   = (locale === 'ar' && banner.title_ar) ? banner.title_ar : (banner.title || t('announcements.announcement', 'Announcement'))
  const displayContent = (locale === 'ar' && banner.content_ar) ? banner.content_ar : banner.content

  const handleToggle = () => onToggleCollapse(banner.id)

  if (isCollapsed) {
    return (
      <div
        className={`glass-card announcement-banner-collapsed ${styleCfg.cssClass}`}
        onClick={handleToggle}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
          <div style={{
            width: '26px', height: '26px', borderRadius: '6px',
            background: styleCfg.bgSubtle, color: styleCfg.color,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <IconComponent size={14} />
          </div>
          <span style={{
            fontSize: '13.5px', fontWeight: 700, color: 'var(--br-text)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
          }}>
            {displayTitle}
          </span>
        </div>
        <div className="announcement-show-btn">
          <span>{t('common.show', 'Show')}</span>
          <ChevronDown size={14} />
        </div>
      </div>
    )
  }

  return (
    <div className={`glass-card announcement-banner ${styleCfg.cssClass}`}>
      <div className="announcement-banner-body">
        <div className="announcement-banner-icon">
          <IconComponent size={18} />
        </div>
        <div className="announcement-banner-text">
          {displayTitle && (
            <h4 className="announcement-banner-title">{displayTitle}</h4>
          )}
          <div
            className="announcement-content text-sm"
            style={{ color: 'var(--br-text-2)', lineHeight: 1.5 }}
            dangerouslySetInnerHTML={{ __html: displayContent }}
          />
        </div>
      </div>

      {(banner.buttons || []).length > 0 && (
        <div className="announcement-banner-actions">
          {banner.buttons.map((btn, idx) => (
            <button
              key={idx}
              onClick={() => onButtonClick(banner, btn, idx)}
              className={`btn btn-xs announcement-banner-btn announcement-btn announcement-btn-${styleKey}`}
            >
              {(locale === 'ar' && btn.text_ar) ? btn.text_ar : btn.text}
            </button>
          ))}
        </div>
      )}

      <button
        onClick={handleToggle}
        title={t('common.collapse', 'Collapse')}
        className="announcement-banner-close"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <ChevronUp size={18} />
      </button>
    </div>
  )
})

// ── Modal Component ──────────────────────────────────────────────────────────

function ModalItem({ announcement, dontShowAgain, onDontShowAgainChange, onClose, onButtonClick }) {
  const { t, locale } = useI18n()
  const isRtl         = locale === 'ar'
  const styleKey      = announcement.style || 'info'
  const styleCfg      = STYLE_CONFIG[styleKey] || STYLE_CONFIG.info
  const IconComponent = styleCfg.icon

  const displayTitle   = (locale === 'ar' && announcement.title_ar) ? announcement.title_ar : announcement.title
  const displayContent = (locale === 'ar' && announcement.content_ar) ? announcement.content_ar : announcement.content

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, animation: 'fadeIn 0.25s ease'
    }}>
      <div style={{
        background: 'var(--br-bg-2)',
        border: '1px solid var(--br-border)',
        borderLeft: isRtl ? 'none' : `4px solid ${styleCfg.color}`,
        borderRight: isRtl ? `4px solid ${styleCfg.color}` : 'none',
        borderRadius: 'var(--br-radius-lg)',
        width: '100%', maxWidth: 500,
        boxShadow: `0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 20px ${styleCfg.shadowColor}`,
        overflow: 'hidden', animation: 'slideUp 0.3s ease'
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px', borderBottom: '1px solid var(--br-border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.06), rgba(0, 0, 0, 0))'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 6,
              background: styleCfg.bgSubtle, color: styleCfg.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <IconComponent size={15} />
            </div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--br-text)' }}>
              {displayTitle}
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--br-text-3)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', padding: 4, borderRadius: 6,
              transition: 'var(--br-transition)'
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--br-text)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--br-text-3)'}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          <div
            className="announcement-content"
            style={{
              fontSize: 14, lineHeight: 1.6, color: 'var(--br-text-2)',
              marginBottom: (announcement.buttons || []).length > 0 ? 24 : 0
            }}
            dangerouslySetInnerHTML={{ __html: displayContent }}
          />

          {(announcement.buttons || []).length > 0 && (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {announcement.buttons.map((btn, idx) => (
                <button
                  key={idx}
                  onClick={() => onButtonClick(btn, idx)}
                  className={`btn announcement-btn announcement-btn-${styleKey}`}
                  style={{ flex: '1 1 auto', justifyContent: 'center', padding: '10px 20px', borderRadius: 8 }}
                >
                  {(locale === 'ar' && btn.text_ar) ? btn.text_ar : btn.text}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px', borderTop: '1px solid var(--br-border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'var(--br-bg-3)'
        }}>
          {announcement.allow_dismiss ? (
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'var(--br-text-2)' }}>
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={e => onDontShowAgainChange(e.target.checked)}
                style={{ width: 14, height: 14, cursor: 'pointer', accentColor: 'var(--br-primary)' }}
              />
              {t('announcements.dont_show_again', "Don't show this again")}
            </label>
          ) : (
            <span />
          )}
          <button
            className="btn btn-secondary"
            onClick={onClose}
            style={{ padding: '8px 16px', fontSize: 13, borderRadius: 8 }}
          >
            {t('common.close', 'Close')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Style Config ──────────────────────────────────────────────────────────────

const STYLE_CONFIG = {
  info: {
    color: 'var(--br-primary)', bgSubtle: 'var(--br-primary-subtle)',
    shadowColor: 'rgba(99, 102, 241, 0.15)', icon: Info, cssClass: 'announcement-info'
  },
  success: {
    color: 'var(--br-accent)', bgSubtle: 'var(--br-accent-subtle)',
    shadowColor: 'rgba(16, 185, 129, 0.15)', icon: CheckCircle, cssClass: 'announcement-success'
  },
  warning: {
    color: 'var(--br-warning)', bgSubtle: 'var(--br-warning-subtle)',
    shadowColor: 'rgba(245, 158, 11, 0.15)', icon: AlertTriangle, cssClass: 'announcement-warning'
  },
  danger: {
    color: 'var(--br-danger)', bgSubtle: 'var(--br-danger-subtle)',
    shadowColor: 'rgba(244, 63, 94, 0.15)', icon: AlertCircle, cssClass: 'announcement-danger'
  },
}
