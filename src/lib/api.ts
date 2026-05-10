import axios from 'axios'

const API_BASE = ''


const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

function getAccessToken(): string | null {
  return localStorage.getItem('access_token')
}

// Fetch CSRF token from backend GET /
// Backend sets csrf_token cookie on this endpoint
function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

// Request interceptor — attach auth token & CSRF header
api.interceptors.request.use(async (config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  // Always fetch fresh CSRF token for POST/PUT/PATCH/DELETE
  if (['post', 'put', 'patch', 'delete'].includes(config.method ?? '')) {
    const token = getCookie('csrf_token')
    if (token) {
      config.headers['X-CSRF-Token'] = token
    }
  }
  return config
})

// Response interceptor — handle 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
export { getAccessToken }
