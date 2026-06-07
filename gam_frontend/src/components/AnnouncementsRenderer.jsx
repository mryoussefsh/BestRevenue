import { useState, useEffect, useCallback } from 'react'
import { publisherApi } from '../api/endpoints'

// Renders active announcements fetched from the backend.
// Banners are shown at the top of the page.
// Modals are shown one at a time, prioritized by priority field.
export default function AnnouncementsRenderer() {
  const [banners, setBanners] = useState([])
  const [modals, setModals] = useState([])
  const [currentModalIdx, setCurrentModalIdx] = useState(0)
  const [closedBanners, setClosedBanners] = useState(new Set())
  const [dontShowAgain, setDontShowAgain] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    try {
      const res = await publisherApi.getAnnouncements()
      const data = res.data?.data || []
      setBanners(data.filter(a => a.type === 'banner'))
      const mods = data.filter(a => a.type === 'modal')
      setModals(mods)
      if (mods.length > 0) {
        // Show the first modal after a brief delay
        setTimeout(() => setModalVisible(true), 600)
      }
    } catch {
      // Silently fail — don't disrupt the dashboard
    }
  }

  const logInteraction = useCallback(async (id, action, buttonIndex = null) => {
    try {
      await publisherApi.interactAnnouncement(id, {
        action,
        button_index: buttonIndex
      })
    } catch {
      // Silently fail
    }
  }, [])

  // Log view when a modal becomes visible
  useEffect(() => {
    if (modalVisible && modals[currentModalIdx]) {
      logInteraction(modals[currentModalIdx].id, 'view')
    }
  }, [modalVisible, currentModalIdx, modals, logInteraction])

  function closeBanner(id) {
    logInteraction(id, 'dismiss')
    setClosedBanners(prev => new Set([...prev, id]))
  }

  function closeModal(announce) {
    if (dontShowAgain && announce.allow_dismiss) {
      logInteraction(announce.id, 'dismiss')
    }
    setModalVisible(false)
    setDontShowAgain(false)
    // Go to next modal if any
    setTimeout(() => {
      if (currentModalIdx + 1 < modals.length) {
        setCurrentModalIdx(i => i + 1)
        setTimeout(() => setModalVisible(true), 200)
      }
    }, 300)
  }

  function handleButtonClick(announce, btn, idx) {
    logInteraction(announce.id, 'click', idx)
    if (btn.new_tab) {
      window.open(btn.url, '_blank', 'noopener noreferrer')
    } else {
      window.location.href = btn.url
    }
  }

  const visibleBanners = banners.filter(b => !closedBanners.has(b.id))
  const currentModal = modals[currentModalIdx]

  return (
    <>
      {/* ── BANNERS ── */}
      {visibleBanners.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {visibleBanners.map(banner => (
            <BannerItem
              key={banner.id}
              banner={banner}
              onClose={() => closeBanner(banner.id)}
              onButtonClick={(btn, idx) => handleButtonClick(banner, btn, idx)}
              onView={() => logInteraction(banner.id, 'view')}
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

function BannerItem({ banner, onClose, onButtonClick, onView }) {
  useEffect(() => { onView() }, [])

  const colors = getBannerColors(banner)

  return (
    <div style={{
      background: colors.bg,
      borderBottom: `1px solid ${colors.border}`,
      padding: '10px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      flexWrap: 'wrap',
      animation: 'slideDown 0.3s ease'
    }}>
      <div style={{ flex: 1, minWidth: 200 }}>
        {banner.title && (
          <span style={{ fontWeight: 700, fontSize: 13, color: colors.text, marginRight: 8 }}>
            {banner.title}:
          </span>
        )}
        <span
          style={{ fontSize: 13, color: colors.text }}
          dangerouslySetInnerHTML={{ __html: banner.content }}
        />
      </div>

      {(banner.buttons || []).length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          {banner.buttons.map((btn, idx) => (
            <button
              key={idx}
              onClick={() => onButtonClick(btn, idx)}
              style={{
                background: colors.btnBg,
                color: colors.btnText,
                border: `1px solid ${colors.btnBorder}`,
                borderRadius: 20,
                padding: '4px 14px',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {btn.text}
            </button>
          ))}
        </div>
      )}

      <button
        onClick={onClose}
        title="Dismiss"
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: colors.text, opacity: 0.7, fontSize: 18, flexShrink: 0,
          lineHeight: 1, padding: '0 4px'
        }}
      >×</button>
    </div>
  )
}

// ── Modal Component ──────────────────────────────────────────────────────────

function ModalItem({ announcement, dontShowAgain, onDontShowAgainChange, onClose, onButtonClick }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, animation: 'fadeIn 0.25s ease'
    }}>
      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 16,
        width: '100%',
        maxWidth: 520,
        boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
        overflow: 'hidden',
        animation: 'slideUp 0.3s ease'
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px 14px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(16,185,129,0.05))'
        }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--color-text)' }}>
            📢 {announcement.title}
          </h3>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: 22, lineHeight: 1 }}
          >×</button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px 24px' }}>
          <div
            className="announcement-content"
            style={{
              fontSize: 14, lineHeight: 1.7, color: 'var(--color-text-secondary)',
              marginBottom: (announcement.buttons || []).length > 0 ? 20 : 0
            }}
            dangerouslySetInnerHTML={{ __html: announcement.content }}
          />

          {/* Action Buttons */}
          {(announcement.buttons || []).length > 0 && (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {announcement.buttons.map((btn, idx) => (
                <button
                  key={idx}
                  onClick={() => onButtonClick(btn, idx)}
                  className="btn btn-primary"
                  style={{ flex: '1 1 auto' }}
                >
                  {btn.text}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 24px',
          borderTop: '1px solid var(--color-border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'var(--color-surface-2)'
        }}>
          {announcement.allow_dismiss ? (
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'var(--color-text-muted)' }}>
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={e => onDontShowAgainChange(e.target.checked)}
                style={{ width: 14, height: 14, cursor: 'pointer' }}
              />
              Don't show this again
            </label>
          ) : (
            <span />
          )}
          <button className="btn btn-secondary" onClick={onClose} style={{ minWidth: 80 }}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getBannerColors() {
  return {
    bg: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(16,185,129,0.08))',
    border: 'rgba(99,102,241,0.3)',
    text: 'var(--color-text)',
    btnBg: 'rgba(99,102,241,0.15)',
    btnText: 'var(--color-primary)',
    btnBorder: 'rgba(99,102,241,0.4)',
  }
}
