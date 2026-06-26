import { useState, useEffect } from 'react'
import { Wrench, DollarSign, Percent, Coins, Copy, Check, Info, Shield, ShieldAlert, AlertTriangle, Zap, Globe } from 'lucide-react'
import { useI18n } from '../../contexts/I18nContext'
import { adminApi, gamAccountsApi } from '../../api/endpoints'
import toast from 'react-hot-toast'

export default function Tools() {
  const { t } = useI18n()
  const [activeTool, setActiveTool] = useState('usd_to_egp')

  // Tool 1: USD to EGP Calculator State
  const [usdAmount, setUsdAmount] = useState('')
  const [companyRatio, setCompanyRatio] = useState('10')
  const [egpAmount, setEgpAmount] = useState('')
  const [copied, setCopied] = useState(false)

  // Tool 2: IVT Calculator State
  const [adexEarnings, setAdexEarnings] = useState('')
  const [adexIvt, setAdexIvt] = useState('')
  const [adsenseEarnings, setAdsenseEarnings] = useState('')
  const [adsenseIvt, setAdsenseIvt] = useState('')
  const [showApplyModal, setShowApplyModal] = useState(false)

  // Tool 1 Calculations
  const usd = parseFloat(usdAmount) || 0
  const ratio = parseFloat(companyRatio) || 0
  const egp = parseFloat(egpAmount) || 0

  const companyShare = usd * (ratio / 100)
  const netUsd = Math.max(0, usd - companyShare)
  const rate = netUsd > 0 ? (egp / netUsd) : 0

  const handleCopy = () => {
    if (rate <= 0) return
    navigator.clipboard.writeText(rate.toFixed(4))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Tool 2 Calculations
  const adexEarnVal = parseFloat(adexEarnings) || 0
  const adexIvtVal = parseFloat(adexIvt) || 0
  const adsenseEarnVal = parseFloat(adsenseEarnings) || 0
  const adsenseIvtVal = parseFloat(adsenseIvt) || 0

  const adexIvtPct = adexEarnVal > 0 ? (adexIvtVal / adexEarnVal) * 100 : 0
  const adsenseIvtPct = adsenseEarnVal > 0 ? (adsenseIvtVal / adsenseEarnVal) * 100 : 0

  const totalEarn = adexEarnVal + adsenseEarnVal
  const totalIvt = adexIvtVal + adsenseIvtVal
  const totalIvtPct = totalEarn > 0 ? (totalIvt / totalEarn) * 100 : 0

  // Threshold helpers for IVT
  const getThresholdColor = (pct, hasData) => {
    if (!hasData) return 'rgba(255, 255, 255, 0.15)'
    if (pct < 1) return '#10b981' // Green (Safe)
    if (pct <= 5) return '#f59e0b' // Orange (Warning)
    return '#ef4444' // Red (Danger)
  }

  const getThresholdGlow = (pct, hasData) => {
    if (!hasData) return 'none'
    if (pct < 1) return '0 0 16px rgba(16, 185, 129, 0.2)'
    if (pct <= 5) return '0 0 16px rgba(245, 158, 11, 0.2)'
    return '0 0 16px rgba(239, 68, 68, 0.2)'
  }

  const getThresholdLabel = (pct, hasData) => {
    if (!hasData) return t('admin.tools.ivt.status.no_data', 'Enter data to calculate')
    if (pct < 1) return t('admin.tools.ivt.status.safe', 'Safe (< 1%)')
    if (pct <= 5) return t('admin.tools.ivt.status.warning', 'Warning (1% - 5%)')
    return t('admin.tools.ivt.status.danger', 'High Risk (> 5%)')
  }

  const tools = [
    {
      id: 'usd_to_egp',
      name: t('admin.tools.usd_egp.name', 'USD to EGP Rate Calculator'),
      desc: t('admin.tools.usd_egp.desc', 'Calculate the effective AdSense exchange rate after company share deduction.'),
      icon: Coins
    },
    {
      id: 'ivt_calculator',
      name: t('admin.tools.ivt.name', 'Publisher IVT Calculator'),
      desc: t('admin.tools.ivt.desc', 'Calculate invalid traffic percentages and risk categories for publishers.'),
      icon: ShieldAlert
    }
  ]

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Wrench size={24} style={{ color: 'var(--color-primary)' }} />
            <span>{t('admin.tools.title', 'Tools')}</span>
          </h1>
          <p className="page-subtitle">{t('admin.tools.subtitle', 'Administrative utilities and optimization tools')}</p>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(240px, 1fr) 3fr',
        gap: '24px',
        alignItems: 'start',
        marginTop: '20px'
      }}>
        {/* Sidebar list of tools */}
        <div style={{
          background: 'rgba(30, 41, 59, 0.4)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(8px)',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{
            fontSize: '12px',
            fontWeight: 700,
            textTransform: 'uppercase',
            color: 'var(--color-text-subtle)',
            padding: '0 8px 8px 8px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
          }}>
            {t('admin.tools.list_title', 'Available Tools')}
          </div>
          
          {tools.map(tool => {
            const Icon = tool.icon
            const isActive = activeTool === tool.id
            return (
              <button
                key={tool.id}
                onClick={() => setActiveTool(tool.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid',
                  borderColor: isActive ? 'rgba(99, 102, 241, 0.3)' : 'transparent',
                  background: isActive ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(99, 102, 241, 0.05) 100%)' : 'transparent',
                  color: isActive ? '#ffffff' : 'var(--color-text-subtle)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'
                    e.currentTarget.style.color = '#ffffff'
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = 'var(--color-text-subtle)'
                  }
                }}
              >
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: isActive ? 'var(--color-primary)' : 'rgba(255, 255, 255, 0.04)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  boxShadow: isActive ? '0 4px 12px rgba(99, 102, 241, 0.3)' : 'none'
                }}>
                  <Icon size={16} />
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{tool.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{tool.desc}</div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Workspace area */}
        <div style={{
          background: 'rgba(30, 41, 59, 0.4)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(8px)',
          padding: '28px',
          minHeight: '400px'
        }}>
          {activeTool === 'usd_to_egp' && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Coins size={20} style={{ color: 'var(--color-primary)' }} />
                  <span>{t('admin.tools.usd_egp.name', 'USD to EGP Rate Calculator')}</span>
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--color-text-subtle)', marginTop: '4px' }}>
                  {t('admin.tools.usd_egp.long_desc', 'Google Ad Manager stats run in USD, but final payments arrive in EGP. Use this calculator to isolate the company revenue share and deduce the exact USD to EGP rate used by Google AdSense.')}
                </p>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '24px'
              }}>
                {/* Inputs Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.01)',
                    border: '1px solid rgba(255, 255, 255, 0.04)',
                    borderRadius: '12px',
                    padding: '20px'
                  }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Info size={16} style={{ color: 'var(--color-primary-light)' }} />
                      <span>{t('admin.tools.usd_egp.inputs_header', 'Calculation Inputs')}</span>
                    </h3>

                    {/* Total USD Input */}
                    <div className="form-group" style={{ marginBottom: '16px' }}>
                      <label className="form-label">{t('admin.tools.usd_egp.label.usd', 'Total USD Amount ($)')}</label>
                      <div style={{ position: 'relative' }}>
                        <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', fontSize: '14px', pointerEvents: 'none' }}>$</div>
                        <input
                          type="number"
                          className="form-input"
                          placeholder="0.00"
                          value={usdAmount}
                          onChange={e => setUsdAmount(e.target.value)}
                          style={{ paddingLeft: '28px' }}
                          min="0"
                          step="any"
                        />
                      </div>
                    </div>

                    {/* Company Ratio Input */}
                    <div className="form-group" style={{ marginBottom: '16px' }}>
                      <label className="form-label">{t('admin.tools.usd_egp.label.ratio', 'Company Ratio (%)')}</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="number"
                          className="form-input"
                          placeholder="10"
                          value={companyRatio}
                          onChange={e => setCompanyRatio(e.target.value)}
                          style={{ paddingRight: '28px' }}
                          min="0"
                          max="100"
                          step="any"
                        />
                        <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', fontSize: '14px', pointerEvents: 'none' }}>%</div>
                      </div>
                    </div>

                    {/* Final EGP Input */}
                    <div className="form-group" style={{ marginBottom: '0' }}>
                      <label className="form-label">{t('admin.tools.usd_egp.label.egp', 'Final EGP Amount')}</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="number"
                          className="form-input"
                          placeholder="0.00"
                          value={egpAmount}
                          onChange={e => setEgpAmount(e.target.value)}
                          style={{ paddingRight: '48px' }}
                          min="0"
                          step="any"
                        />
                        <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', fontSize: '12px', fontWeight: 600, pointerEvents: 'none' }}>EGP</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Outputs Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Exchange Rate Card */}
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.05) 100%)',
                    border: '1px solid rgba(99, 102, 241, 0.2)',
                    borderRadius: '12px',
                    padding: '24px',
                    textAlign: 'center',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '160px',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    {/* Glowing background blur */}
                    <div style={{
                      position: 'absolute',
                      width: '100px',
                      height: '100px',
                      borderRadius: '50%',
                      background: 'var(--color-primary)',
                      filter: 'blur(60px)',
                      opacity: 0.15,
                      top: '10%',
                      left: '40%'
                    }} />

                    <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-primary-light)', marginBottom: '8px' }}>
                      {t('admin.tools.usd_egp.rate_title', 'AdSense Exchange Rate')}
                    </div>
                    
                    <div style={{
                      fontSize: '32px',
                      fontWeight: 800,
                      color: '#ffffff',
                      marginBottom: '16px',
                      fontFamily: 'monospace',
                      textShadow: '0 2px 10px rgba(0,0,0,0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span>1$ = </span>
                      <span style={{ color: rate > 0 ? '#10b981' : '#e2e8f0' }}>{rate > 0 ? rate.toFixed(4) : '0.0000'}</span>
                      <span style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-text-subtle)' }}> EGP</span>
                    </div>

                    <button
                      onClick={handleCopy}
                      disabled={rate <= 0}
                      className="btn btn-secondary"
                      style={{
                        padding: '6px 14px',
                        fontSize: '12px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        background: copied ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                        borderColor: copied ? '#10b981' : 'rgba(255, 255, 255, 0.08)',
                        color: copied ? '#10b981' : '#ffffff',
                        cursor: rate > 0 ? 'pointer' : 'not-allowed',
                        opacity: rate > 0 ? 1 : 0.5,
                        transition: 'all 0.2s'
                      }}
                    >
                      {copied ? (
                        <>
                          <Check size={13} />
                          <span>{t('admin.tools.usd_egp.btn_copied', 'Copied')}</span>
                        </>
                      ) : (
                        <>
                          <Copy size={13} />
                          <span>{t('admin.tools.usd_egp.btn_copy', 'Copy Rate')}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Summary Details */}
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.01)',
                    border: '1px solid rgba(255, 255, 255, 0.04)',
                    borderRadius: '12px',
                    padding: '20px'
                  }}>
                    <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Shield size={14} style={{ color: 'var(--color-primary-light)' }} />
                      <span>{t('admin.tools.usd_egp.summary_header', 'Calculation Summary')}</span>
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {/* Company share */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', paddingBottom: '8px', borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                        <span style={{ color: 'var(--color-text-subtle)' }}>
                          {t('admin.tools.usd_egp.summary.share', 'Company Fee ({ratio}%)', { ratio })}:
                        </span>
                        <span style={{ fontWeight: 600, color: '#f59e0b' }}>
                          ${companyShare.toFixed(2)}
                        </span>
                      </div>

                      {/* Net USD Exchanged */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', paddingBottom: '8px', borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                        <span style={{ color: 'var(--color-text-subtle)' }}>
                          {t('admin.tools.usd_egp.summary.net', 'Net Exchanged USD')}:
                        </span>
                        <span style={{ fontWeight: 600, color: 'var(--color-primary-light)' }}>
                          ${netUsd.toFixed(2)}
                        </span>
                      </div>

                      {/* Final EGP amount */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                        <span style={{ color: 'var(--color-text-subtle)' }}>
                          {t('admin.tools.usd_egp.summary.egp', 'Final EGP Balance')}:
                        </span>
                        <span style={{ fontWeight: 600, color: '#ffffff' }}>
                          {egp.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTool === 'ivt_calculator' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldAlert size={20} style={{ color: 'var(--color-primary)' }} />
                    <span>{t('admin.tools.ivt.name', 'Publisher IVT Calculator')}</span>
                  </h2>
                  <p style={{ fontSize: '13px', color: 'var(--color-text-subtle)', marginTop: '4px' }}>
                    {t('admin.tools.ivt.long_desc', 'Calculate and analyze invalid traffic (IVT) proportions for Ad Exchange and AdSense platforms to evaluate safety status and optimize yields.')}
                  </p>
                </div>
                
                <button
                  className="btn btn-primary"
                  onClick={() => setShowApplyModal(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.35)',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <Zap size={14} />
                  <span>{t('adjustments.apply_ivt', 'Apply IVT Deduction')}</span>
                </button>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '24px'
              }}>
                {/* Inputs Pane */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Ad Exchange inputs */}
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.01)',
                    border: '1px solid rgba(255, 255, 255, 0.04)',
                    borderRadius: '12px',
                    padding: '20px'
                  }}>
                    <h3 style={{
                      fontSize: '13px',
                      fontWeight: 700,
                      color: 'var(--color-primary-light)',
                      marginBottom: '16px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      {t('admin.tools.ivt.adex_header', 'Ad Exchange Stats')}
                    </h3>

                    {/* AdEx Earnings */}
                    <div className="form-group" style={{ marginBottom: '14px' }}>
                      <label className="form-label">{t('admin.tools.ivt.label.adex_earnings', 'Earnings ($)')}</label>
                      <div style={{ position: 'relative' }}>
                        <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', fontSize: '14px', pointerEvents: 'none' }}>$</div>
                        <input
                          type="number"
                          className="form-input"
                          placeholder="0.00"
                          value={adexEarnings}
                          onChange={e => setAdexEarnings(e.target.value)}
                          style={{ paddingLeft: '28px' }}
                          min="0"
                          step="any"
                        />
                      </div>
                    </div>

                    {/* AdEx IVT */}
                    <div className="form-group" style={{ marginBottom: '0' }}>
                      <label className="form-label">{t('admin.tools.ivt.label.adex_ivt', 'Invalid Traffic ($)')}</label>
                      <div style={{ position: 'relative' }}>
                        <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', fontSize: '14px', pointerEvents: 'none' }}>$</div>
                        <input
                          type="number"
                          className="form-input"
                          placeholder="0.00"
                          value={adexIvt}
                          onChange={e => setAdexIvt(e.target.value)}
                          style={{ paddingLeft: '28px' }}
                          min="0"
                          step="any"
                        />
                      </div>
                    </div>
                  </div>

                  {/* AdSense inputs */}
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.01)',
                    border: '1px solid rgba(255, 255, 255, 0.04)',
                    borderRadius: '12px',
                    padding: '20px'
                  }}>
                    <h3 style={{
                      fontSize: '13px',
                      fontWeight: 700,
                      color: 'var(--color-primary-light)',
                      marginBottom: '16px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      {t('admin.tools.ivt.adsense_header', 'AdSense Stats')}
                    </h3>

                    {/* AdSense Earnings */}
                    <div className="form-group" style={{ marginBottom: '14px' }}>
                      <label className="form-label">{t('admin.tools.ivt.label.adsense_earnings', 'Earnings ($)')}</label>
                      <div style={{ position: 'relative' }}>
                        <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', fontSize: '14px', pointerEvents: 'none' }}>$</div>
                        <input
                          type="number"
                          className="form-input"
                          placeholder="0.00"
                          value={adsenseEarnings}
                          onChange={e => setAdsenseEarnings(e.target.value)}
                          style={{ paddingLeft: '28px' }}
                          min="0"
                          step="any"
                        />
                      </div>
                    </div>

                    {/* AdSense IVT */}
                    <div className="form-group" style={{ marginBottom: '0' }}>
                      <label className="form-label">{t('admin.tools.ivt.label.adsense_ivt', 'Invalid Traffic ($)')}</label>
                      <div style={{ position: 'relative' }}>
                        <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', fontSize: '14px', pointerEvents: 'none' }}>$</div>
                        <input
                          type="number"
                          className="form-input"
                          placeholder="0.00"
                          value={adsenseIvt}
                          onChange={e => setAdsenseIvt(e.target.value)}
                          style={{ paddingLeft: '28px' }}
                          min="0"
                          step="any"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Outputs Pane */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Total IVT Card */}
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    padding: '24px',
                    textAlign: 'center',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    minHeight: '160px'
                  }}>
                    {/* Glowing status indicator ring */}
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      boxShadow: getThresholdGlow(totalIvtPct, totalEarn > 0),
                      pointerEvents: 'none',
                      borderRadius: '12px',
                      transition: 'box-shadow 0.3s'
                    }} />

                    <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-subtle)', marginBottom: '8px' }}>
                      {t('admin.tools.ivt.total_title', 'Total Invalid Traffic')}
                    </div>

                    <div style={{
                      fontSize: '36px',
                      fontWeight: 800,
                      color: getThresholdColor(totalIvtPct, totalEarn > 0),
                      marginBottom: '10px',
                      fontFamily: 'monospace',
                      transition: 'color 0.3s'
                    }}>
                      {totalEarn > 0 ? totalIvtPct.toFixed(2) : '0.00'}%
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: getThresholdColor(totalIvtPct, totalEarn > 0),
                      background: 'rgba(255, 255, 255, 0.02)',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      border: '1px solid rgba(255, 255, 255, 0.04)',
                      transition: 'all 0.3s'
                    }}>
                      <Shield size={12} />
                      <span>{getThresholdLabel(totalIvtPct, totalEarn > 0)}</span>
                    </div>
                  </div>

                  {/* Breakdown Details */}
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.01)',
                    border: '1px solid rgba(255, 255, 255, 0.04)',
                    borderRadius: '12px',
                    padding: '20px'
                  }}>
                    <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', marginBottom: '16px' }}>
                      {t('admin.tools.ivt.breakdown_header', 'Platform Breakdown')}
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {/* Ad Exchange IVT Row */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                          <span style={{ fontWeight: 600, color: '#ffffff' }}>{t('admin.tools.ivt.breakdown.adex', 'Ad Exchange')}</span>
                          <span style={{
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            color: getThresholdColor(adexIvtPct, adexEarnVal > 0)
                          }}>
                            {adexEarnVal > 0 ? adexIvtPct.toFixed(2) : '0.00'}%
                          </span>
                        </div>
                        {/* Progress Bar Container */}
                        <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%',
                            width: `${Math.min(100, adexIvtPct)}%`,
                            background: getThresholdColor(adexIvtPct, adexEarnVal > 0),
                            borderRadius: '3px',
                            transition: 'width 0.3s, background 0.3s'
                          }} />
                        </div>
                      </div>

                      {/* AdSense IVT Row */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                          <span style={{ fontWeight: 600, color: '#ffffff' }}>{t('admin.tools.ivt.breakdown.adsense', 'AdSense')}</span>
                          <span style={{
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            color: getThresholdColor(adsenseIvtPct, adsenseEarnVal > 0)
                          }}>
                            {adsenseEarnVal > 0 ? adsenseIvtPct.toFixed(2) : '0.00'}%
                          </span>
                        </div>
                        {/* Progress Bar Container */}
                        <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%',
                            width: `${Math.min(100, adsenseIvtPct)}%`,
                            background: getThresholdColor(adsenseIvtPct, adsenseEarnVal > 0),
                            borderRadius: '3px',
                            transition: 'width 0.3s, background 0.3s'
                          }} />
                        </div>
                      </div>

                      {/* Cumulative Info Card */}
                      <div style={{
                        marginTop: '8px',
                        padding: '12px',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.04)',
                        fontSize: '11px',
                        color: 'var(--color-text-subtle)',
                        lineHeight: '1.4',
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'flex-start'
                      }}>
                        <Info size={14} style={{ color: 'var(--color-primary-light)', flexShrink: 0, marginTop: '1px' }} />
                        <div>
                          {t('admin.tools.ivt.info_note', 'Total earnings reflect sum of Ad Exchange and AdSense ($ {totalEarn}). Total IVT amount is $ {totalIvt}. Keep total IVT under 1.00% to protect account standings.', {
                            totalEarn: totalEarn.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                            totalIvt: totalIvt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showApplyModal && (
        <ApplyIvtModal
          defaultPercent={totalIvtPct > 0 ? totalIvtPct.toFixed(2) : ''}
          onClose={() => setShowApplyModal(false)}
          onSaved={() => {
            setShowApplyModal(false)
          }}
        />
      )}
    </div>
  )
}

function ApplyIvtModal({ onClose, onSaved, defaultPercent }) {
  const { t } = useI18n()
  
  const getLastMonthDates = () => {
    const now = new Date()
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    const formatDate = (date) => {
      const yyyy = date.getFullYear()
      const mm = String(date.getMonth() + 1).padStart(2, '0')
      const dd = String(date.getDate()).padStart(2, '0')
      return `${yyyy}-${mm}-${dd}`
    }

    return {
      from: formatDate(startOfLastMonth),
      to: formatDate(endOfLastMonth)
    }
  }

  const defaultDates = getLastMonthDates()

  const [gamAccounts, setGamAccounts] = useState([])
  const [selectedGamAccountId, setSelectedGamAccountId] = useState('')
  const [websites, setWebsites] = useState([])
  const [selectedWebsiteIds, setSelectedWebsiteIds] = useState([])
  const [showWebsiteSelector, setShowWebsiteSelector] = useState(false)
  const [dateFrom, setDateFrom] = useState(defaultDates.from)
  const [dateTo, setDateTo] = useState(defaultDates.to)
  const [ivtPercent, setIvtPercent] = useState(defaultPercent || '')
  const [loadingGamAccounts, setLoadingGamAccounts] = useState(false)
  const [loadingWebsites, setLoadingWebsites] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setLoadingGamAccounts(true)
    gamAccountsApi.getAll()
      .then(res => {
        setGamAccounts(res.data || [])
      })
      .catch(() => {
        toast.error(t('adjustments.toast_load_gam_fail', 'Failed to load GAM accounts'))
      })
      .finally(() => {
        setLoadingGamAccounts(false)
      })
  }, [])

  useEffect(() => {
    if (!selectedGamAccountId) {
      setWebsites([])
      setSelectedWebsiteIds([])
      return
    }
    setLoadingWebsites(true)
    adminApi.getWebsites({ gam_account_id: selectedGamAccountId })
      .then(res => {
        const list = res.data?.data || []
        setWebsites(list)
        setSelectedWebsiteIds(list.map(w => w.id))
      })
      .catch(() => {
        toast.error(t('adjustments.toast_load_websites_fail', 'Failed to load websites'))
      })
      .finally(() => {
        setLoadingWebsites(false)
      })
  }, [selectedGamAccountId])

  async function handleSubmit(e, isForced = false) {
    if (e) e.preventDefault()
    if (!selectedGamAccountId) {
      toast.error(t('adjustments.toast_select_gam', 'Please select a GAM Account'))
      return
    }
    if (selectedWebsiteIds.length === 0) {
      toast.error(t('adjustments.toast_select_website', 'Please select at least one website'))
      return
    }
    if (!dateFrom || !dateTo) {
      toast.error(t('adjustments.toast_select_dates', 'Please select a date range'))
      return
    }
    const percent = parseFloat(ivtPercent)
    if (isNaN(percent) || percent < 0 || percent > 100) {
      toast.error(t('adjustments.toast_invalid_percent', 'Please enter a valid percentage between 0 and 100'))
      return
    }

    setSubmitting(true)
    try {
      const res = await adminApi.applyIvtDeduction({
        gam_account_id: selectedGamAccountId,
        website_ids: selectedWebsiteIds,
        date_from: dateFrom,
        date_to: dateTo,
        ivt_percent: percent,
        force: isForced
      })
      const count = res.data?.applied_adjustments?.length || 0
      toast.success(t('adjustments.toast_ivt_success', 'Successfully applied IVT. Created {count} adjustment(s).', { count }))
      onSaved()
    } catch (err) {
      if (err.response?.status === 409 && err.response?.data?.conflict) {
        const confirmMessage = err.response.data.message
        if (window.confirm(confirmMessage)) {
          await handleSubmit(null, true)
          return
        }
      } else {
        toast.error(err.response?.data?.message || t('adjustments.toast_ivt_fail', 'Failed to apply IVT deductions'))
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 600 }}>
        <div className="modal-header">
          <span className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={18} style={{ color: 'var(--br-primary)' }} /> {t('adjustments.apply_ivt', 'Apply IVT Deduction')}
          </span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="alert alert-info" style={{ color: 'var(--color-text)', border: '1px solid var(--color-border)', margin: '12px 0 20px 0', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
          <Info size={16} style={{ flexShrink: 0, marginTop: 2, color: 'var(--color-info)' }} />
          <span>{t('adjustments.ivt_desc', 'This tool automatically creates negative pending adjustments for the selected websites based on their total publisher earnings in the selected period.')}</span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label">{t('adjustments.gam_account_label', 'GAM Account *')}</label>
            {loadingGamAccounts ? (
              <div className="text-muted">{t('adjustments.loading_accounts', 'Loading accounts...')}</div>
            ) : (
              <select
                className="form-select"
                value={selectedGamAccountId}
                onChange={e => setSelectedGamAccountId(e.target.value)}
                required
              >
                <option value="">{t('adjustments.select_gam_account', '-- Select GAM Account --')}</option>
                {gamAccounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.network_code})
                  </option>
                ))}
              </select>
            )}
          </div>

          {selectedGamAccountId && (
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label" style={{ marginBottom: 8 }}>{t('adjustments.websites_label', 'Websites *')}</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowWebsiteSelector(true)}
                  disabled={loadingWebsites || websites.length === 0}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Globe size={14} /> {t('adjustments.select_websites_btn', 'Select Websites...')}
                </button>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>
                  {loadingWebsites ? (
                    <span className="text-muted">{t('adjustments.loading_websites', 'Loading websites...')}</span>
                  ) : websites.length === 0 ? (
                    <span className="text-danger">{t('adjustments.no_websites_linked', 'No websites linked to this account')}</span>
                  ) : (
                    <span>{t('adjustments.selected_count', '{selected} of {total} selected', { selected: selectedWebsiteIds.length, total: websites.length })}</span>
                  )}
                </span>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">{t('dashboard.filters.start_date', 'Start Date *')}</label>
              <input
                type="date"
                className="form-input"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                required
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">{t('dashboard.filters.end_date', 'End Date *')}</label>
              <input
                type="date"
                className="form-input"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 20 }}>
            <label className="form-label">{t('adjustments.ivt_percent_label', 'IVT Percentage (%) *')}</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              className="form-input"
              placeholder="e.g. 5.0"
              value={ivtPercent}
              onChange={e => setIvtPercent(e.target.value)}
              required
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>{t('common.cancel', 'Cancel')}</button>
            <button type="submit" className="btn btn-primary" disabled={submitting || loadingWebsites || (selectedGamAccountId && websites.length === 0)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              {submitting ? t('adjustments.applying', 'Applying…') : <><Zap size={14} /> {t('adjustments.apply_ivt', 'Apply IVT Deduction')}</>}
            </button>
          </div>
        </form>
      </div>

      {showWebsiteSelector && (
        <WebsiteSelectionModal
          websites={websites}
          selectedWebsiteIds={selectedWebsiteIds}
          onClose={() => setShowWebsiteSelector(false)}
          onConfirm={(ids) => {
            setSelectedWebsiteIds(ids)
            setShowWebsiteSelector(false)
          }}
        />
      )}
    </div>
  )
}

function WebsiteSelectionModal({ websites, selectedWebsiteIds, onClose, onConfirm, type = 'ivt' }) {
  const { t } = useI18n()
  const [tempSelectedIds, setTempSelectedIds] = useState(selectedWebsiteIds)
  const [search, setSearch] = useState('')

  const displayedWebsites = websites.filter(web =>
    web.domain.toLowerCase().includes(search.toLowerCase()) ||
    (web.publisher?.name || '').toLowerCase().includes(search.toLowerCase())
  )

  const handleToggleSelectAll = () => {
    const visibleIds = displayedWebsites.map(w => w.id)
    const allVisibleSelected = visibleIds.length > 0 && visibleIds.every(id => tempSelectedIds.includes(id))
    if (allVisibleSelected) {
      setTempSelectedIds(prev => prev.filter(id => !visibleIds.includes(id)))
    } else {
      setTempSelectedIds(prev => [...new Set([...prev, ...visibleIds])])
    }
  }

  const getSelectAllLabel = () => {
    const visibleIds = displayedWebsites.map(w => w.id)
    const allVisibleSelected = visibleIds.length > 0 && visibleIds.every(id => tempSelectedIds.includes(id))
    if (allVisibleSelected) {
      return search ? t('adjustments.deselect_filtered', 'Deselect Filtered') : t('adjustments.deselect_all', 'Deselect All')
    } else {
      return search ? t('adjustments.select_filtered', 'Select Filtered') : t('adjustments.select_all', 'Select All')
    }
  }

  const handleToggleWebsite = (id) => {
    setTempSelectedIds(prev =>
      prev.includes(id) ? prev.filter(wId => wId !== id) : [...prev, id]
    )
  }

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div className="modal" style={{ maxWidth: 700, zIndex: 1101 }}>
        <div className="modal-header">
          <span className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Globe size={18} style={{ color: 'var(--br-primary)' }} /> {t('adjustments.select_websites', 'Select Websites')}
          </span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="alert alert-info" style={{ color: 'var(--color-text)', border: '1px solid var(--color-border)', margin: '12px 0 16px 0', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
          <Info size={16} style={{ flexShrink: 0, marginTop: 2, color: 'var(--color-info)' }} />
          <span>
            {type === 'bonus'
              ? t('adjustments.select_bonus_desc', 'Select websites to apply the bonus. Use search to filter if needed.')
              : t('adjustments.select_ivt_desc', 'Select websites to apply the IVT deduction. Use search to filter if needed.')}
          </span>
        </div>

        <div className="form-group" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>
              {t('adjustments.selected_count', '{selected} of {total} selected', { selected: tempSelectedIds.length, total: websites.length })}
            </span>
            <button
              type="button"
              className="btn btn-secondary btn-xs"
              onClick={handleToggleSelectAll}
              style={{ fontSize: '11px', padding: '2px 8px' }}
            >
              {getSelectAllLabel()}
            </button>
          </div>

          <input
            type="text"
            className="form-input"
            placeholder={t('adjustments.search_websites_placeholder', 'Search websites by domain or publisher name...')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ marginBottom: 12, height: 36, fontSize: '13px' }}
          />

          {displayedWebsites.length === 0 ? (
            <div className="text-muted" style={{ padding: 24, textAlign: 'center', background: 'var(--color-surface-2)', borderRadius: 4 }}>
              {t('adjustments.no_websites_match', 'No websites match your search query.')}
            </div>
          ) : (
            <div className="card" style={{ padding: 12, maxHeight: 300, overflowY: 'auto', background: 'var(--color-surface-2)' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: 8
              }}>
                {displayedWebsites.map(web => (
                  <label key={web.id} style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                    cursor: 'pointer',
                    background: 'var(--color-surface-3)',
                    padding: '6px 10px',
                    borderRadius: '4px',
                    border: '1px solid var(--color-border)',
                    fontSize: '13px',
                    transition: 'background 0.2s',
                    userSelect: 'none'
                  }} className="hover-surface-2">
                    <input
                      type="checkbox"
                      checked={tempSelectedIds.includes(web.id)}
                      onChange={() => handleToggleWebsite(web.id)}
                      style={{ marginTop: '3px' }}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                      <span style={{ fontWeight: 600, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={web.domain}>
                        {web.domain}
                      </span>
                      <span className="text-muted" style={{ fontSize: '11px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={web.publisher?.name}>
                        {t('adjustments.pub_prefix', 'Pub: ')}{web.publisher?.name || 'N/A'}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>{t('common.cancel', 'Cancel')}</button>
          <button type="button" className="btn btn-primary" onClick={() => onConfirm(tempSelectedIds)}>
            {t('adjustments.confirm_selection', 'Confirm Selection')}
          </button>
        </div>
      </div>
    </div>
  )
}
