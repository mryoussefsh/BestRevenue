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

// On 401, clear token and redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
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
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
