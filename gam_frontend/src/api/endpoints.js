import api from './axios'

export const authApi = {
  login:         (email, password) => api.post('/auth/login', { email, password }),
  register:      (data)            => api.post('/auth/register', data),
  me:            ()                => api.get('/auth/me'),
  logout:        ()                => api.post('/auth/logout'),
  forgotPassword:(email)           => api.post('/auth/forgot-password', { email }),
  resetPassword: (data)            => api.post('/auth/reset-password', data),
}

export const adminApi = {
  // Stats
  getSidebarStats:     ()       => api.get('/admin/sidebar-stats'),

  // Publishers
  getPublishers:       (params) => api.get('/admin/publishers', { params }),
  getPublisher:        (id, params) => api.get(`/admin/publishers/${id}`, { params }),
  createPublisher:     (data)   => api.post('/admin/publishers', data),
  updatePublisher:     (id, data) => api.put(`/admin/publishers/${id}`, data),
  deletePublisher:     (id)     => api.delete(`/admin/publishers/${id}`),
  setRatio:            (id, ratio) => api.post(`/admin/publishers/${id}/set-ratio`, { ratio }),
  getRatioHistory:     (id)     => api.get(`/admin/publishers/${id}/ratio-history`),
  suspendPublisher:    (id)     => api.post(`/admin/publishers/${id}/suspend`),
  activatePublisher:   (id)     => api.post(`/admin/publishers/${id}/activate`),
  adjustPublisherBalance: (id, amount, notes) => api.post(`/admin/publishers/${id}/adjust-balance`, { amount, notes }),
  impersonatePublisher: (id) => api.post(`/admin/publishers/${id}/impersonate`),
  createManualPayout:  (id, data) => api.post(`/admin/publishers/${id}/create-payout`, data),

  // Websites
  getWebsites:         (params) => api.get('/admin/websites', { params }),
  createWebsite:       (data)   => api.post('/admin/websites', data),
  updateWebsite:       (id, data) => api.put(`/admin/websites/${id}`, data),
  deleteWebsite:       (id)     => api.delete(`/admin/websites/${id}`),

  // Ad Units
  getAdUnits:          (params) => api.get('/admin/ad-units', { params }),
  createAdUnit:        (data)   => api.post('/admin/ad-units', data),
  createGamAdUnit:     (data)   => api.post('/admin/websites/ad-units/create-in-gam', data),
  bulkCreateAdUnits:   (data)   => api.post('/admin/websites/ad-units/bulk-create', data),
  updateAdUnit:        (id, data) => api.put(`/admin/ad-units/${id}`, data),
  deleteAdUnit:        (id)     => api.delete(`/admin/ad-units/${id}`),
  bulkDeleteAdUnits:   (data)   => api.post('/admin/ad-units/bulk-delete', data),

  // Revenue
  getRevenue:          (params) => api.get('/admin/revenue', { params }),
  wipeRevenue:         ()       => api.delete('/admin/revenue/wipe?confirm=WIPE'),

  // Period Closings
  getPeriodClosings:   ()        => api.get('/admin/period-closings'),
  getPeriodClosing:    (id)      => api.get(`/admin/period-closings/${id}`),
  closePeriod:         (year, month) => api.post('/admin/period-closings/close', { year, month }),
  deletePeriodClosing: (id)      => api.delete(`/admin/period-closings/${id}`),

  // Payouts
  getPayouts:          (params) => api.get('/admin/payouts', { params }),
  approvePayout:       (id, data) => api.post(`/admin/payouts/${id}/approve`, data),
  rejectPayout:        (id, note) => api.post(`/admin/payouts/${id}/reject`, { admin_note: note }),
  markPaid:            (id, ref)  => api.post(`/admin/payouts/${id}/mark-paid`, { payment_reference: ref }),

  // Settings
  getSettings:         ()        => api.get('/admin/settings'),
  updateSetting:       (key, value) => api.put(`/admin/settings/${key}`, { value }),
  testEmailSettings:   (email)   => api.post('/admin/settings/test-email', { email }),

  // Adjustments
  getAdjustments:      (params)  => api.get('/admin/adjustments', { params }),
  createAdjustment:    (data)    => api.post('/admin/adjustments', data),
  deleteAdjustment:    (id)      => api.delete(`/admin/adjustments/${id}`),
  applyIvtDeduction:   (data)    => api.post('/admin/adjustments/apply-ivt', data),
  applyBonusAdjustment: (data)    => api.post('/admin/adjustments/apply-bonus', data),

  // Translations
  getTranslations:     (locale)  => api.get('/admin/translations', { params: { locale } }),
  updateTranslation:   (locale, key, value) => api.put(`/admin/translations/${locale}/${encodeURIComponent(key)}`, { value }),

  // Audit Logs
  getAuditLogs: (params) => api.get('/admin/audit-logs', { params }),

  // GAM Sync — points to the single correct sync endpoint
  runSync:             (data)    => api.post('/admin/gam-accounts/sync', {}, { params: data, timeout: 300000 }),
  getSyncLogs:         ()        => api.get('/admin/gam-accounts/sync-logs'),

  // Announcements
  getAnnouncements:    ()        => api.get('/admin/announcements'),
  createAnnouncement:  (data)    => api.post('/admin/announcements', data),
  updateAnnouncement:  (id, data)=> api.put(`/admin/announcements/${id}`, data),
  deleteAnnouncement:  (id)      => api.delete(`/admin/announcements/${id}`),

  // Email Templates
  getEmailTemplates:     ()           => api.get('/admin/email-templates'),
  updateEmailTemplate:   (key, data)  => api.put(`/admin/email-templates/${key}`, data),
  previewEmailTemplate:  (key)        => api.post(`/admin/email-templates/${key}/preview`),
  resetEmailTemplate:    (key)        => api.post(`/admin/email-templates/${key}/reset`),
}

export const gamAccountsApi = {
  getAll:       ()        => api.get('/admin/gam-accounts'),
  create:       (data)    => api.post('/admin/gam-accounts', data),
  update:       (id, data)=> api.put(`/admin/gam-accounts/${id}`, data),
  remove:       (id)      => api.delete(`/admin/gam-accounts/${id}`),
  refreshToken: (id)      => api.post(`/admin/gam-accounts/${id}/refresh-token`),
  getOAuthUrl:  ()        => api.get('/admin/gam-accounts/oauth/url'),
  triggerSync:  (data)    => api.post('/admin/gam-accounts/sync', {}, { params: data, timeout: 300000 }),
  getSyncLogs:  ()        => api.get('/admin/gam-accounts/sync-logs'),
}

export const publisherApi = {
  getDashboard:   ()        => api.get('/publisher/dashboard'),
  getWebsites:    ()        => api.get('/publisher/websites'),
  getAdUnits:     (webId)   => api.get(`/publisher/websites/${webId}/ad-units`),
  getRevenue:     (params)  => api.get('/publisher/revenue', { params }),
  getPayouts:     ()        => api.get('/publisher/payouts'),
  updatePaymentInfo: (data) => api.put('/publisher/payment-info', data),
  getTranslations:(locale)  => api.get(`/translations/${locale}`),

  // Announcements
  getAnnouncements:        ()           => api.get('/publisher/announcements'),
  interactAnnouncement:    (id, data)   => api.post(`/publisher/announcements/${id}/interact`, data),
}
