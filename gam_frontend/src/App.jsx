import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { I18nProvider, useI18n } from './contexts/I18nContext'
import { SettingsProvider, useSettings } from './contexts/SettingsContext'

import PrivateRoute from './components/PrivateRoute'

// Layouts
import AdminLayout     from './layouts/AdminLayout'
import PublisherLayout from './layouts/PublisherLayout'

// Auth
import LandingPage         from './pages/LandingPage'
import SupportPage         from './pages/SupportPage'
import LoginPage           from './pages/LoginPage'
import PageDetail          from './pages/PageDetail'
import RegisterPage        from './pages/RegisterPage'
import ForgotPasswordPage  from './pages/ForgotPasswordPage'
import ResetPasswordPage   from './pages/ResetPasswordPage'
import DesignSystemPreview from './pages/DesignSystemPreview'

// Admin pages
import AdminDashboard   from './pages/admin/Dashboard'
import Publishers       from './pages/admin/Publishers'
import PublisherProfile from './pages/admin/PublisherProfile'
import Websites         from './pages/admin/Websites'
import AdminRevenue     from './pages/admin/Revenue'
import PeriodClosings   from './pages/admin/PeriodClosings'
import Payouts          from './pages/admin/Payouts'
import Adjustments      from './pages/admin/Adjustments'
import Settings         from './pages/admin/Settings'
import Translations     from './pages/admin/Translations'
import AuditLogs        from './pages/admin/AuditLogs'
import GamAccounts      from './pages/admin/GamAccounts'
import GamSync          from './pages/admin/GamSync'
import Announcements    from './pages/admin/Announcements'
import EmailTemplates   from './pages/admin/EmailTemplates'
import AdminTickets     from './pages/admin/Tickets'
import AdminTicketDetail from './pages/admin/TicketDetail'
import AdminPages         from './pages/admin/Pages'
import AdminFaqs          from './pages/admin/Faqs'
import AdminProfile       from './pages/admin/Profile'
import AdminAdmins        from './pages/admin/Admins'
import Tools              from './pages/admin/Tools'
import DangerZone         from './pages/admin/DangerZone'
import FinanceDashboard   from './pages/admin/FinanceDashboard'
import AdOpsDashboard     from './pages/admin/AdOpsDashboard'
import SupportDashboard   from './pages/admin/SupportDashboard'
import ContentDashboard   from './pages/admin/ContentDashboard'
import TrafficOverview    from './pages/admin/Traffic'
import TrafficRealtime    from './pages/admin/TrafficRealtime'
import TrafficPublisher   from './pages/admin/TrafficPublisher'
import TrafficAnomalies   from './pages/admin/TrafficAnomalies'
import TrafficQuality     from './pages/admin/TrafficQuality'

// Publisher pages
import PubDashboard from './pages/publisher/Dashboard'
import PubWebsites  from './pages/publisher/Websites'
import PubRevenue   from './pages/publisher/Revenue'
import PubPayouts   from './pages/publisher/Payouts'
import PubSettings  from './pages/publisher/Settings'
import PubTickets   from './pages/publisher/Tickets'
import PubTicketDetail from './pages/publisher/TicketDetail'

function RootRedirect() {
  const { authLoading } = useAuth()
  // Wait for auth verification before rendering the landing page so the
  // correct buttons (Dashboard vs Sign In/Sign Up) appear immediately.
  if (authLoading) return null
  return <LandingPage />
}

function AdminDashboardGateway() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />

  const primaryRole = user.roles_list?.[0] || 'Super Admin'
  if (primaryRole === 'Finance Manager') return <Navigate to="/admin/finance" replace />
  if (primaryRole === 'Ad Ops Manager') return <Navigate to="/admin/adops" replace />
  if (primaryRole === 'Support Agent') return <Navigate to="/admin/support" replace />
  if (primaryRole === 'Content Manager') return <Navigate to="/admin/content" replace />

  return <AdminDashboard />
}

function PageTitleUpdater() {
  const location = useLocation()
  const { settings } = useSettings()
  const { t } = useI18n()

  useEffect(() => {
    const siteName = settings.site_name || 'Mindora X'
    const path = location.pathname

    let title = ''

    if (path === '/') {
      title = t('title.home', 'Maximize your revenue with {siteName}', { siteName })
    } else if (path === '/login') {
      title = `${t('title.login', 'Login')} - ${siteName}`
    } else if (path === '/register') {
      title = `${t('title.register', 'Register')} - ${siteName}`
    } else if (path === '/forgot-password') {
      title = `${t('title.forgot_password', 'Forgot Password')} - ${siteName}`
    } else if (path === '/reset-password') {
      title = `${t('title.reset_password', 'Reset Password')} - ${siteName}`
    } else if (path === '/support') {
      title = `${t('title.support', 'Support')} - ${siteName}`
    } else if (path === '/design-system') {
      title = `${t('title.design_system', 'Design System')} - ${siteName}`
    } else if (path.startsWith('/page/')) {
      const slug = path.split('/page/')[1] || ''
      const pageTitle = slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
      title = `${pageTitle} - ${siteName}`
    }
    // Admin routes
    else if (path === '/admin') {
      title = `${t('title.admin_dashboard', 'Dashboard')} - ${siteName}`
    } else if (path === '/admin/finance') {
      title = `${t('title.admin_finance', 'Finance Dashboard')} - ${siteName}`
    } else if (path === '/admin/adops') {
      title = `${t('title.admin_adops', 'Ad Ops Dashboard')} - ${siteName}`
    } else if (path === '/admin/support') {
      title = `${t('title.admin_support', 'Support Dashboard')} - ${siteName}`
    } else if (path === '/admin/content') {
      title = `${t('title.admin_content', 'Content Dashboard')} - ${siteName}`
    } else if (path === '/admin/publishers') {
      title = `${t('title.admin_publishers', 'Publishers')} - ${siteName}`
    } else if (path.startsWith('/admin/publishers/')) {
      title = `${t('title.admin_publisher_profile', 'Publisher Profile')} - ${siteName}`
    } else if (path === '/admin/websites') {
      title = `${t('title.admin_websites', 'Websites')} - ${siteName}`
    } else if (path === '/admin/revenue') {
      title = `${t('title.admin_revenue', 'Revenue')} - ${siteName}`
    } else if (path === '/admin/closings') {
      title = `${t('title.admin_closings', 'Period Closings')} - ${siteName}`
    } else if (path === '/admin/payouts') {
      title = `${t('title.admin_payouts', 'Payouts')} - ${siteName}`
    } else if (path === '/admin/adjustments') {
      title = `${t('title.admin_adjustments', 'Adjustments')} - ${siteName}`
    } else if (path === '/admin/settings') {
      title = `${t('title.admin_settings', 'Settings')} - ${siteName}`
    } else if (path === '/admin/profile') {
      title = `${t('title.admin_profile', 'Profile')} - ${siteName}`
    } else if (path === '/admin/translations') {
      title = `${t('title.admin_translations', 'Translations')} - ${siteName}`
    } else if (path === '/admin/audit-logs') {
      title = `${t('title.admin_audit_logs', 'Audit Logs')} - ${siteName}`
    } else if (path === '/admin/gam-accounts') {
      title = `${t('title.admin_gam_accounts', 'GAM Accounts')} - ${siteName}`
    } else if (path === '/admin/gam-sync') {
      title = `${t('title.admin_gam_sync', 'GAM Sync')} - ${siteName}`
    } else if (path === '/admin/announcements') {
      title = `${t('title.admin_announcements', 'Announcements')} - ${siteName}`
    } else if (path === '/admin/pages') {
      title = `${t('title.admin_pages', 'Pages')} - ${siteName}`
    } else if (path === '/admin/faqs') {
      title = `${t('title.admin_faqs', 'FAQ Management')} - ${siteName}`
    } else if (path === '/admin/email-templates') {
      title = `${t('title.admin_email_templates', 'Email Templates')} - ${siteName}`
    } else if (path === '/admin/tickets') {
      title = `${t('title.admin_tickets', 'Support Tickets')} - ${siteName}`
    } else if (path === '/admin/admins') {
      title = `${t('title.admin_admins', 'Admins')} - ${siteName}`
    } else if (path === '/admin/tools') {
      title = `${t('title.admin_tools', 'Tools')} - ${siteName}`
    } else if (path.startsWith('/admin/tickets/')) {
      title = `${t('title.admin_ticket_detail', 'Ticket Detail')} - ${siteName}`
    } else if (path === '/admin/traffic') {
      title = `${t('title.admin_traffic_intelligence', 'Traffic Intelligence')} - ${siteName}`
    } else if (path === '/admin/traffic/realtime') {
      title = `${t('title.admin_realtime_monitor', 'Realtime Monitor')} - ${siteName}`
    } else if (path === '/admin/traffic/anomalies') {
      title = `${t('title.admin_anomaly_feed', 'Anomaly Feed')} - ${siteName}`
    } else if (path === '/admin/traffic/quality-scores') {
      title = `${t('title.admin_quality_scores', 'Quality Scores')} - ${siteName}`
    } else if (path.startsWith('/admin/traffic/publishers/')) {
      title = `${t('title.admin_publisher_traffic', 'Publisher Traffic')} - ${siteName}`
    }
    // Publisher routes
    else if (path === '/publisher') {
      title = `${t('title.publisher_dashboard', 'Dashboard')} - ${siteName}`
    } else if (path === '/publisher/websites') {
      title = `${t('title.publisher_websites', 'Websites')} - ${siteName}`
    } else if (path === '/publisher/revenue') {
      title = `${t('title.publisher_revenue', 'Revenue')} - ${siteName}`
    } else if (path === '/publisher/payouts') {
      title = `${t('title.publisher_payouts', 'Payouts')} - ${siteName}`
    } else if (path === '/publisher/settings') {
      title = `${t('title.publisher_settings', 'Settings')} - ${siteName}`
    } else if (path === '/publisher/tickets') {
      title = `${t('title.publisher_tickets', 'Support Tickets')} - ${siteName}`
    } else if (path.startsWith('/publisher/tickets/')) {
      title = `${t('title.publisher_ticket_detail', 'Ticket Detail')} - ${siteName}`
    } else {
      title = settings.meta_title || siteName
    }

    document.title = title
  }, [location.pathname, settings, t])

  return null
}

function AppContent() {
  const { loading: i18nLoading } = useI18n()
  const { loading: settingsLoading } = useSettings()

  useEffect(() => {
    // Hide the initial global preloader when translations & settings have loaded
    if (!i18nLoading && !settingsLoading) {
      const preloader = document.getElementById('global-preloader')
      if (preloader) {
        preloader.classList.add('fade-out')
        // Remove the preloader from DOM after the 500ms opacity transition finishes
        const timer = setTimeout(() => {
          preloader.remove()
        }, 500)
        return () => clearTimeout(timer)
      }
    }
  }, [i18nLoading, settingsLoading])

  return (
    <BrowserRouter>
      <PageTitleUpdater />
      <Toaster
        position="top-right"
        containerStyle={{ zIndex: 100000 }}
        toastOptions={{
          style: {
            background: '#080f1d',
            color: '#f8fafc',
            border: '0.5px solid rgba(0, 242, 254, 0.14)',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 0.5px rgba(0,242,254,0.06)',
            fontSize: '13px',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error:   { iconTheme: { primary: '#f43f5e', secondary: '#fff' } },
        }}
      />

      <Routes>
        {/* Root landing page */}
        <Route path="/" element={<RootRedirect />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/design-system" element={<DesignSystemPreview />} />
        <Route path="/page/:slug" element={<PageDetail />} />

        {/* Auth */}
        <Route path="/login"          element={<LoginPage />} />
        <Route path="/register"        element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password"  element={<ResetPasswordPage />} />

        {/* Admin routes */}
        <Route path="/admin" element={
          <PrivateRoute role="admin">
            <AdminLayout><AdminDashboardGateway /></AdminLayout>
          </PrivateRoute>
        } />
        <Route path="/admin/finance" element={
          <PrivateRoute role="admin">
            <AdminLayout><FinanceDashboard /></AdminLayout>
          </PrivateRoute>
        } />
        <Route path="/admin/adops" element={
          <PrivateRoute role="admin">
            <AdminLayout><AdOpsDashboard /></AdminLayout>
          </PrivateRoute>
        } />
        <Route path="/admin/support" element={
          <PrivateRoute role="admin">
            <AdminLayout><SupportDashboard /></AdminLayout>
          </PrivateRoute>
        } />
        <Route path="/admin/content" element={
          <PrivateRoute role="admin">
            <AdminLayout><ContentDashboard /></AdminLayout>
          </PrivateRoute>
        } />
        <Route path="/admin/publishers" element={
          <PrivateRoute role="admin">
            <AdminLayout><Publishers /></AdminLayout>
          </PrivateRoute>
        } />
        <Route path="/admin/publishers/:id" element={
          <PrivateRoute role="admin">
            <AdminLayout><PublisherProfile /></AdminLayout>
          </PrivateRoute>
        } />
        <Route path="/admin/websites" element={
          <PrivateRoute role="admin">
            <AdminLayout><Websites /></AdminLayout>
          </PrivateRoute>
        } />
        <Route path="/admin/revenue" element={
          <PrivateRoute role="admin">
            <AdminLayout><AdminRevenue /></AdminLayout>
          </PrivateRoute>
        } />
        <Route path="/admin/closings" element={
          <PrivateRoute role="admin">
            <AdminLayout><PeriodClosings /></AdminLayout>
          </PrivateRoute>
        } />
        <Route path="/admin/payouts" element={
          <PrivateRoute role="admin">
            <AdminLayout><Payouts /></AdminLayout>
          </PrivateRoute>
        } />
        <Route path="/admin/adjustments" element={
          <PrivateRoute role="admin">
            <AdminLayout><Adjustments /></AdminLayout>
          </PrivateRoute>
        } />
        <Route path="/admin/settings" element={
          <PrivateRoute role="admin">
            <AdminLayout><Settings /></AdminLayout>
          </PrivateRoute>
        } />
        <Route path="/admin/danger-zone" element={
          <PrivateRoute role="admin">
            <AdminLayout><DangerZone /></AdminLayout>
          </PrivateRoute>
        } />
        <Route path="/admin/profile" element={
          <PrivateRoute role="admin">
            <AdminLayout><AdminProfile /></AdminLayout>
          </PrivateRoute>
        } />
        <Route path="/admin/translations" element={
          <PrivateRoute role="admin">
            <AdminLayout><Translations /></AdminLayout>
          </PrivateRoute>
        } />
        <Route path="/admin/audit-logs" element={
          <PrivateRoute role="admin">
            <AdminLayout><AuditLogs /></AdminLayout>
          </PrivateRoute>
        } />
        <Route path="/admin/gam-accounts" element={
          <PrivateRoute role="admin">
            <AdminLayout><GamAccounts /></AdminLayout>
          </PrivateRoute>
        } />
        <Route path="/admin/gam-sync" element={
          <PrivateRoute role="admin">
            <AdminLayout><GamSync /></AdminLayout>
          </PrivateRoute>
        } />
        <Route path="/admin/announcements" element={
          <PrivateRoute role="admin">
            <AdminLayout><Announcements /></AdminLayout>
          </PrivateRoute>
        } />
        <Route path="/admin/pages" element={
          <PrivateRoute role="admin">
            <AdminLayout><AdminPages /></AdminLayout>
          </PrivateRoute>
        } />
        <Route path="/admin/faqs" element={
          <PrivateRoute role="admin">
            <AdminLayout><AdminFaqs /></AdminLayout>
          </PrivateRoute>
        } />
        <Route path="/admin/email-templates" element={
          <PrivateRoute role="admin">
            <AdminLayout><EmailTemplates /></AdminLayout>
          </PrivateRoute>
        } />
        <Route path="/admin/tickets" element={
          <PrivateRoute role="admin">
            <AdminLayout><AdminTickets /></AdminLayout>
          </PrivateRoute>
        } />
        <Route path="/admin/tickets/:id" element={
          <PrivateRoute role="admin">
            <AdminLayout><AdminTicketDetail /></AdminLayout>
          </PrivateRoute>
        } />
        <Route path="/admin/admins" element={
          <PrivateRoute role="admin">
            <AdminLayout><AdminAdmins /></AdminLayout>
          </PrivateRoute>
        } />
        <Route path="/admin/tools" element={
          <PrivateRoute role="admin">
            <AdminLayout><Tools /></AdminLayout>
          </PrivateRoute>
        } />

        {/* Traffic Intelligence — admin-only */}
        <Route path="/admin/traffic" element={
          <PrivateRoute role="admin">
            <AdminLayout><TrafficOverview /></AdminLayout>
          </PrivateRoute>
        } />
        <Route path="/admin/traffic/realtime" element={
          <PrivateRoute role="admin">
            <AdminLayout><TrafficRealtime /></AdminLayout>
          </PrivateRoute>
        } />
        <Route path="/admin/traffic/publishers/:publisherId" element={
          <PrivateRoute role="admin">
            <AdminLayout><TrafficPublisher /></AdminLayout>
          </PrivateRoute>
        } />
        <Route path="/admin/traffic/anomalies" element={
          <PrivateRoute role="admin">
            <AdminLayout><TrafficAnomalies /></AdminLayout>
          </PrivateRoute>
        } />
        <Route path="/admin/traffic/quality-scores" element={
          <PrivateRoute role="admin">
            <AdminLayout><TrafficQuality /></AdminLayout>
          </PrivateRoute>
        } />

        {/* Publisher routes */}
        <Route path="/publisher" element={
          <PrivateRoute role="publisher">
            <PublisherLayout><PubDashboard /></PublisherLayout>
          </PrivateRoute>
        } />
        <Route path="/publisher/websites" element={
          <PrivateRoute role="publisher">
            <PublisherLayout><PubWebsites /></PublisherLayout>
          </PrivateRoute>
        } />
        <Route path="/publisher/revenue" element={
          <PrivateRoute role="publisher">
            <PublisherLayout><PubRevenue /></PublisherLayout>
          </PrivateRoute>
        } />
        <Route path="/publisher/payouts" element={
          <PrivateRoute role="publisher">
            <PublisherLayout><PubPayouts /></PublisherLayout>
          </PrivateRoute>
        } />
        <Route path="/publisher/settings" element={
          <PrivateRoute role="publisher">
            <PublisherLayout><PubSettings /></PublisherLayout>
          </PrivateRoute>
        } />
        <Route path="/publisher/tickets" element={
          <PrivateRoute role="publisher">
            <PublisherLayout><PubTickets /></PublisherLayout>
          </PrivateRoute>
        } />
        <Route path="/publisher/tickets/:id" element={
          <PrivateRoute role="publisher">
            <PublisherLayout><PubTicketDetail /></PublisherLayout>
          </PrivateRoute>
        } />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

function App() {
  return (
    <AuthProvider>
      <I18nProvider>
        <SettingsProvider>
          <AppContent />
        </SettingsProvider>
      </I18nProvider>
    </AuthProvider>
  )
}

export default App
