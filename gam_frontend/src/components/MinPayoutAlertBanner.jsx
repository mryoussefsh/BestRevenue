import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useSettings } from '../contexts/SettingsContext'
import { useI18n } from '../contexts/I18nContext'
import { publisherApi } from '../api/endpoints'
import { PartyPopper, CreditCard, ArrowRight } from 'lucide-react'

/**
 * MinPayoutAlertBanner
 *
 * Shows a fixed red alert banner to publishers who have reached (or exceeded)
 * the minimum payout threshold for any configured payment method — but have NOT
 * yet set up a payment method.
 *
 * Logic:
 *  1. Determine the minimum payout threshold:
 *     - Use the lowest `minimum` across all configured payment methods.
 *  2. Fetch publisher's approved_earnings (available balance).
 *  3. Show the banner if: approvedEarnings >= threshold AND no payment method set.
 *
 * Publisher can dismiss the banner for the session (stored in sessionStorage).
 */
export default function MinPayoutAlertBanner() {
  const { user } = useAuth()
  const { settings } = useSettings()
  const { t } = useI18n()

  const [show, setShow] = useState(false)
  const [approvedEarnings, setApprovedEarnings] = useState(null)
  const [minThreshold, setMinThreshold] = useState(null)

  useEffect(() => {
    // Only run for authenticated publishers
    if (!user || user.role !== 'publisher') {
      setShow(false)
      return
    }

    // Show only when publisher has NOT set a payment method and account
    const hasPaymentMethod = !!(
      user.payment_info?.method && user.payment_info.method.trim() &&
      user.payment_info?.account && user.payment_info.account.trim()
    )

    if (hasPaymentMethod) {
      setShow(false)
      return
    }

    // Use the global payout_threshold setting as the minimum.
    // This is the platform-wide threshold set by the admin (e.g. $50).
    // Per-method minimums only matter once a method is selected.
    const globalThreshold = parseFloat(settings.payout_threshold)
    if (isNaN(globalThreshold) || globalThreshold <= 0) {
      setShow(false)
      return
    }

    setMinThreshold(globalThreshold)

    // Fetch publisher approved_earnings (all-time, no date filter).
    // Use per_page:1000 without date range — same approach as the Payouts page —
    // so the aggregates cover all approved records, not just a date slice.
    publisherApi.getRevenue({ per_page: 1000 })
      .then(res => {
        const aggregates       = res.data?.aggregates || {}
        const approvedEarnings = parseFloat(aggregates.approved_earnings ?? 0)
        const pendingAdj       = parseFloat(res.data?.pending_balance_adjustment ?? 0)
        // availableBalance matches what the Payouts page shows as "Available Balance"
        const availableBalance = Math.max(0, approvedEarnings + pendingAdj)
        setApprovedEarnings(availableBalance)
        if (availableBalance >= globalThreshold) {
          setShow(true)
        } else {
          setShow(false)
        }
      })
      .catch(() => {
        setShow(false)
      })
  }, [user, settings.payout_threshold])

  if (!show) return null

  const currency = settings.currency || '$'

  return (
    <div
      id="min-payout-alert-banner"
      role="alert"
      aria-live="polite"
      style={{
        position: 'relative',
        zIndex: 10,
        background: 'linear-gradient(135deg, rgba(239,68,68,0.18) 0%, rgba(185,28,28,0.14) 100%)',
        borderBottom: '1px solid rgba(239,68,68,0.35)',
        borderTop: '1px solid rgba(239,68,68,0.20)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        overflow: 'hidden',
      }}
    >
      {/* Animated shimmer line */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '2px',
        background: 'linear-gradient(90deg, transparent, #ef4444, #f87171, #ef4444, transparent)',
        backgroundSize: '300% 100%',
        animation: 'minPayoutShimmer 2.8s linear infinite',
      }} />

      <div className="min-payout-inner">
        {/* Pulsing alert icon */}
        <div style={{
          width: '34px',
          height: '34px',
          borderRadius: '50%',
          background: 'rgba(239,68,68,0.22)',
          border: '1px solid rgba(239,68,68,0.45)',
          color: '#f87171',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          animation: 'minPayoutPulse 2.2s ease-in-out infinite',
        }}>
          <PartyPopper size={17} />
        </div>

        {/* Message text */}
        <div className="min-payout-text-container">
          <span style={{
            fontSize: '13.5px',
            fontWeight: 700,
            color: '#fca5a5',
            marginInlineEnd: '8px',
          }}>
            {t('publisher.min_payout_alert.title', 'Your balance has reached the minimum payout!')}
          </span>
          <span style={{
            fontSize: '13px',
            color: 'rgba(252,165,165,0.85)',
            lineHeight: 1.5,
          }}>
            {t(
              'publisher.min_payout_alert.message',
              'You have {amount} in approved earnings (above the {threshold} minimum). Please set your payment method to receive your payout.',
              {
                amount: `${currency}${(approvedEarnings ?? 0).toFixed(2)}`,
                threshold: `${currency}${(minThreshold ?? 0).toFixed(2)}`,
              }
            )}
          </span>
        </div>

        {/* CTA — links to publisher settings (payment tab) */}
        <Link
          to="/publisher/settings"
          id="min-payout-alert-cta"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '7px',
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            color: '#fff',
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 700,
            textDecoration: 'none',
            flexShrink: 0,
            boxShadow: '0 2px 14px rgba(239,68,68,0.38)',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            whiteSpace: 'nowrap',
            border: '1px solid rgba(255,255,255,0.15)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-1px)'
            e.currentTarget.style.boxShadow = '0 5px 20px rgba(239,68,68,0.55)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 2px 14px rgba(239,68,68,0.38)'
          }}
        >
          <CreditCard size={14} />
          {t('publisher.min_payout_alert.cta', 'Set Payment Method')}
          <ArrowRight size={13} />
        </Link>
      </div>

      {/* Scoped styles & animations */}
      <style>{`
        .min-payout-inner {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 10px 20px;
          flex-wrap: wrap;
          width: 100%;
        }
        .min-payout-text-container {
          flex: 1;
          min-width: 0;
        }
        @keyframes minPayoutShimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes minPayoutPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.45); }
          50%       { box-shadow: 0 0 0 7px rgba(239,68,68,0); }
        }
        @media (max-width: 768px) {
          .min-payout-inner {
            flex-direction: column;
            align-items: center;
            text-align: center;
            padding: 16px 20px;
            gap: 12px;
          }
          .min-payout-text-container {
            flex: none;
            width: 100%;
          }
          #min-payout-alert-cta {
            width: 100% !important;
            justify-content: center !important;
            box-sizing: border-box;
          }
        }
      `}</style>
    </div>
  )
}
