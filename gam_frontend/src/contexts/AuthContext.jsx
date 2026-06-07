import { createContext, useContext, useState, useCallback } from 'react'
import { authApi } from '../api/endpoints'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) } catch { return null }
  })

  const login = useCallback(async (email, password) => {
    const res = await authApi.login(email, password)
    const { access_token, user: userData } = res.data
    localStorage.setItem('token', access_token)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
    return userData
  }, [])

  const logout = useCallback(async () => {
    try { await authApi.logout() } catch {}
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
    setUser(null)
  }, [])

  const impersonate = useCallback((publisherToken, publisherUser) => {
    localStorage.setItem('admin_token', localStorage.getItem('token'))
    localStorage.setItem('admin_user', localStorage.getItem('user'))
    localStorage.setItem('token', publisherToken)
    localStorage.setItem('user', JSON.stringify(publisherUser))
    setUser(publisherUser)
    window.location.href = '/'
  }, [])

  const stopImpersonating = useCallback(() => {
    const adminToken = localStorage.getItem('admin_token')
    const adminUser = localStorage.getItem('admin_user')
    if (adminToken && adminUser) {
      localStorage.setItem('token', adminToken)
      localStorage.setItem('user', adminUser)
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_user')
      setUser(JSON.parse(adminUser))
      window.location.href = '/'
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, logout, impersonate, stopImpersonating }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
