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

let isRefreshing = false;
let requestsQueue: any[] = []; // 存储因为 token 过期而被挂起的请求
// Response interceptor — handle 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;
    
    // 如果返回 401 且不是刷新接口本身的 401
    if (response?.status === 401 && !config._retry && config.url !== '/api/v1/auth/refresh_token') {
      if (isRefreshing) {
        // 如果正在刷新中，把当前的请求暂存到队列里
        return new Promise((resolve) => {
          requestsQueue.push((token: string) => {
            config.headers.Authorization = `Bearer ${token}`;
            resolve(api(config));
          });
        });
      }

      config._retry = true;
      isRefreshing = true;

      try {
        // 🟢 关键点：这里不需要手动传 refresh_token
        // 浏览器会自动携带 HttpOnly Cookie
        const currentCsrfToken = getCookie('csrf_token');
        const res = await axios.post('/api/v1/auth/refresh_token', {}, { withCredentials: true ,headers:{'X-CSRF-Token':currentCsrfToken}});
        const { access_token } = res.data;

        localStorage.setItem('access_token', access_token);
        
        // 刷新成功，执行队列里的所有请求
        requestsQueue.forEach((callback) => callback(access_token));
        requestsQueue = [];

        // 执行当前触发刷新的请求
        config.headers.Authorization = `Bearer ${access_token}`;
        config.headers['X-CSRF-Token'] = getCookie('csrf_token');
        return api(config);
      } catch (refreshError) {
        // 刷新失败（Refresh Token 也过期了），清除所有状态并跳转登录
        localStorage.removeItem('access_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
)

export default api
export { getAccessToken }
