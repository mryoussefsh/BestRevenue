import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { authApi } from '../api/endpoints'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    // Check URL parameters for impersonation data first (used to isolate tabs)
    const queryParams = new URLSearchParams(window.location.search)
    const impToken = queryParams.get('impersonate_token')
    const impUserStr = queryParams.get('impersonate_user')
    if (impToken && impUserStr) {
      try {
        const impUser = JSON.parse(impUserStr)
        sessionStorage.setItem('token', impToken)
        sessionStorage.setItem('user', JSON.stringify(impUser))
        
        // Copy admin credentials from localStorage to sessionStorage in the new tab
        const adminToken = localStorage.getItem('token')
        const adminUser = localStorage.getItem('user')
        if (adminToken && adminUser) {
          sessionStorage.setItem('admin_token', adminToken)
          sessionStorage.setItem('admin_user', adminUser)
        }
        
        // Clean URL query parameters so the URL looks clean
        const cleanUrl = window.location.pathname + window.location.hash
        window.history.replaceState({}, document.title, cleanUrl)
        return impUser
      } catch (e) {
        console.error('Failed to parse impersonation parameters:', e)
      }
    }

    try {
      return JSON.parse(sessionStorage.getItem('user') || localStorage.getItem('user'))
    } catch {
      return null
    }
  })

  useEffect(() => {
    const token = sessionStorage.getItem('token') || localStorage.getItem('token')
    if (token) {
      authApi.me()
        .then(res => {
          const userData = res.data
          if (sessionStorage.getItem('token')) {
            sessionStorage.setItem('user', JSON.stringify(userData))
          } else {
            localStorage.setItem('user', JSON.stringify(userData))
          }
          setUser(userData)
        })
        .catch(err => {
          console.error('Failed to sync user session on mount:', err)
        })
    }
  }, [])

  const login = useCallback(async (email, password) => {
    const res = await authApi.login(email, password)
    const { access_token, user: userData } = res.data
    localStorage.setItem('token', access_token)
    localStorage.setItem('user', JSON.stringify(userData))
    sessionStorage.setItem('token', access_token)
    sessionStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
    return userData
  }, [])

  const logout = useCallback(async () => {
    try { await authApi.logout() } catch {}
    const sessToken = sessionStorage.getItem('token')
    const localToken = localStorage.getItem('token')
    if (sessToken && sessToken !== localToken) {
      sessionStorage.removeItem('token')
      sessionStorage.removeItem('user')
      sessionStorage.removeItem('admin_token')
      sessionStorage.removeItem('admin_user')
    } else {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_user')
      sessionStorage.removeItem('token')
      sessionStorage.removeItem('user')
      sessionStorage.removeItem('admin_token')
      sessionStorage.removeItem('admin_user')
    }
    setUser(null)
  }, [])

  const impersonate = useCallback((publisherToken, publisherUser) => {
    const currentToken = sessionStorage.getItem('token') || localStorage.getItem('token')
    const currentUser = sessionStorage.getItem('user') || localStorage.getItem('user')

    sessionStorage.setItem('admin_token', currentToken)
    sessionStorage.setItem('admin_user', currentUser)
    sessionStorage.setItem('token', publisherToken)
    sessionStorage.setItem('user', JSON.stringify(publisherUser))
    
    // Fallback updates for localStorage
    localStorage.setItem('admin_token', localStorage.getItem('token'))
    localStorage.setItem('admin_user', localStorage.getItem('user'))
    localStorage.setItem('token', publisherToken)
    localStorage.setItem('user', JSON.stringify(publisherUser))

    setUser(publisherUser)
    window.location.href = '/'
  }, [])

  const stopImpersonating = useCallback(() => {
    const adminToken = sessionStorage.getItem('admin_token') || localStorage.getItem('admin_token')
    const adminUser = sessionStorage.getItem('admin_user') || localStorage.getItem('admin_user')
    if (adminToken && adminUser) {
      sessionStorage.setItem('token', adminToken)
      sessionStorage.setItem('user', adminUser)
      sessionStorage.removeItem('admin_token')
      sessionStorage.removeItem('admin_user')
      
      localStorage.setItem('token', adminToken)
      localStorage.setItem('user', adminUser)
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_user')
      
      setUser(JSON.parse(adminUser))
      window.location.href = '/'
    }
  }, [])

  const updatePaymentInfo = useCallback((newPaymentInfo) => {
    setUser(u => {
      const updated = { ...u, payment_info: newPaymentInfo }
      if (sessionStorage.getItem('token')) {
        sessionStorage.setItem('user', JSON.stringify(updated))
      } else {
        localStorage.setItem('user', JSON.stringify(updated))
      }
      return updated
    })
  }, [])

  const updateUser = useCallback((userData) => {
    setUser(u => {
      const updated = { ...u, ...userData }
      if (sessionStorage.getItem('token')) {
        sessionStorage.setItem('user', JSON.stringify(updated))
      } else {
        localStorage.setItem('user', JSON.stringify(updated))
      }
      return updated
    })
  }, [])

  const hasPermission = useCallback((permission) => {
    if (!user) return false;
    if (user.role === 'admin') {
      // Super Admin bypasses all checks
      if (user.roles_list?.includes('Super Admin')) return true;
      return user.permissions_list?.includes(permission) || false;
    }
    return false;
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, login, logout, impersonate, stopImpersonating, updatePaymentInfo, updateUser, hasPermission }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
