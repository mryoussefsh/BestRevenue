import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { I18nProvider } from './contexts/I18nContext'
import { SettingsProvider } from './contexts/SettingsContext'

import PrivateRoute from './components/PrivateRoute'

// Layouts
import AdminLayout     from './layouts/AdminLayout'
import PublisherLayout from './layouts/PublisherLayout'

// Auth
import LandingPage         from './pages/LandingPage'
import LoginPage           from './pages/LoginPage'
import RegisterPage        from './pages/RegisterPage'
import ForgotPasswordPage  from './pages/ForgotPasswordPage'
import ResetPasswordPage   from './pages/ResetPasswordPage'

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

// Publisher pages
import PubDashboard from './pages/publisher/Dashboard'
import PubWebsites  from './pages/publisher/Websites'
import PubRevenue   from './pages/publisher/Revenue'
import PubPayouts   from './pages/publisher/Payouts'
import PubSettings  from './pages/publisher/Settings'

function RootRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'admin') return <Navigate to="/admin" replace />
  return <Navigate to="/publisher" replace />
}

function App() {
  return (
    <AuthProvider>
      <I18nProvider>
        <SettingsProvider>
          <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#1a1a2e',
                color: '#e2e8f0',
                border: '1px solid #2a2a4a',
                borderRadius: '10px',
              },
              success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
              error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
            }}
          />

          <Routes>
            {/* Root landing page */}
            <Route path="/" element={<LandingPage />} />

            {/* Auth */}
            <Route path="/login"          element={<LoginPage />} />
            <Route path="/register"        element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password"  element={<ResetPasswordPage />} />

            {/* Admin routes */}
            <Route path="/admin" element={
              <PrivateRoute role="admin">
                <AdminLayout><AdminDashboard /></AdminLayout>
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
            <Route path="/admin/email-templates" element={
              <PrivateRoute role="admin">
                <AdminLayout><EmailTemplates /></AdminLayout>
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

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </BrowserRouter>
        </SettingsProvider>
      </I18nProvider>
    </AuthProvider>
  )
}

export default App
