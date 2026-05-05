import axios from 'axios'

const API_BASE = ''

let csrfToken: string | null = null

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

// Fetch CSRF token from GET /
export async function fetchCsrfToken(): Promise<string | null> {
  try {
    const res = await axios.get('/', { withCredentials: true })
    let token: string | null = null
    if (res.data?.csrf_token) {
      token = res.data.csrf_token
    }
    if (!token) {
      const setCookie = res.headers['set-cookie']
      if (setCookie) {
        const match = setCookie.find((c: string) => c.startsWith('csrf_token='))
        if (match) {
          token = match.split('=')[1]?.split(';')[0] ?? null
        }
      }
    }
    if (!token) {
      const match = document.cookie.match(/csrf_token=([^;]+)/)
      token = match ? match[1] : null
    }
    csrfToken = token
    return token
  } catch {
    return null
  }
}

// Initialize CSRF token on load
fetchCsrfToken()

// Request interceptor — attach auth token & CSRF header
api.interceptors.request.use(async (config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  // Always fetch fresh CSRF token for POST/PUT/PATCH/DELETE
  if (['post', 'put', 'patch', 'delete'].includes(config.method ?? '')) {
    const token = await fetchCsrfToken()
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
