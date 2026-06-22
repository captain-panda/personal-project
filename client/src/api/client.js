import axios from 'axios';

// In production the API is served same-origin via a Vercel rewrite (/api/* →
// Render), so the refresh cookie is first-party. Always use a relative base URL
// in production builds; only dev talks to localhost (or an explicit VITE_API_URL).
const baseURL = import.meta.env.PROD ? '' : import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Access token lives in memory only (never localStorage). The refresh token is
// an httpOnly cookie the browser sends automatically with withCredentials.
let accessToken = null;
export const setAccessToken = (t) => {
  accessToken = t;
};
export const getAccessToken = () => accessToken;

export const api = axios.create({ baseURL, withCredentials: true });

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

// On a 401, transparently refresh once and retry. Concurrent 401s share a
// single in-flight refresh call.
let refreshing = null;
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const isAuthCall = original?.url?.includes('/api/auth/');
    if (error.response?.status === 401 && original && !original._retry && !isAuthCall) {
      original._retry = true;
      try {
        refreshing =
          refreshing || axios.post(`${baseURL}/api/auth/refresh`, {}, { withCredentials: true });
        const { data } = await refreshing;
        refreshing = null;
        setAccessToken(data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch (e) {
        refreshing = null;
        setAccessToken(null);
        window.dispatchEvent(new Event('auth:logout'));
        return Promise.reject(e);
      }
    }
    return Promise.reject(error);
  },
);
