import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
})

// Attach JWT on every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('tolseva_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401 globally
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('tolseva_token')
      localStorage.removeItem('tolseva_user')
      localStorage.removeItem('tolseva_role')
      window.location.href = '/'
    }
    return Promise.reject(err)
  }
)

// Auth
export const requestVendorOtp = (data) => api.post('/auth/vendor/request-otp', data)
export const verifyVendorOtp = (data) => api.post('/auth/vendor/verify-otp', data)
export const inspectorLogin = (data) => api.post('/auth/inspector/login', data)
export const adminLogin = (data) => api.post('/auth/admin/login', data)

// Vendor
export const getMachines = () => api.get('/vendor/machines')
export const addMachine = (data) => api.post('/vendor/machines', data)
export const getAppointments = () => api.get('/vendor/appointments')
export const bookAppointment = (data) => api.post('/vendor/appointments', data)

// Inspector
export const getAssignedVisits = (filter) => api.get('/inspector/assigned-visits', { params: { filter } })
export const submitVerification = (data) => api.post('/inspector/verify', data)
export const getCertificate = (id) => api.get(`/inspector/certificate/${id}`)

// Admin
export const getAdminDashboard = () => api.get('/admin/dashboard')
export const getAdminVendors = (page = 1) => api.get('/admin/vendors', { params: { page } })
export const getAdminInspectors = () => api.get('/admin/inspectors')
export const assignInspector = (appointmentId, inspectorId) => api.patch(`/admin/appointments/${appointmentId}/assign`, { inspector_id: inspectorId })
export const getAdminAppointments = () => api.get('/admin/appointments')
export const createInspector = (data) => api.post('/admin/inspectors', data)

// Bot
export const askBot = (query, lang = 'en') => api.post('/bot/assist', { query, lang })

export default api
