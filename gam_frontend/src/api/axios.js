import axios from 'axios'

const api = axios.create({
  baseURL: '/api/v1',
  headers: { Accept: 'application/json' },
})

// Attach token from sessionStorage or localStorage to every request
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token') || localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`

  const locale = localStorage.getItem('locale') || 'en'
  config.headers['X-Locale'] = locale
  config.headers['Accept-Language'] = locale
  return config
})

// On 401 or 403, clear tokens and redirect to login (except for the login request itself)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isLoginRequest = err.config?.url?.includes('/auth/login')
    if ((err.response?.status === 401 || err.response?.status === 403) && !isLoginRequest) {
      sessionStorage.removeItem('token')
      sessionStorage.removeItem('user')
      sessionStorage.removeItem('admin_token')
      sessionStorage.removeItem('admin_user')
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_user')

      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
      return new Promise(() => {}) // Suppress further promise execution to avoid error toast messages during redirect
    }
    return Promise.reject(err)
  }
)

export default api
