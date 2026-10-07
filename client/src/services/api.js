import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

/**
 * Checks whether a JWT token is structurally valid and unexpired.
 * @param {string|null} token
 * @returns {boolean}
 */
export function isTokenValid(token) {
  if (!token) return false;
  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    return decoded.exp > currentTime;
  } catch {
    return false;
  }
}

/**
 * Centralized Axios instance configured for MCC Chronicles Backend API.
 */
const api = axios.create({
  baseURL:
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
    'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

/**
 * Request Interceptor: Attach JWT Bearer token if present & valid.
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('mcc_token');
    if (token) {
      if (isTokenValid(token)) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        // Token has expired; remove stale credentials
        localStorage.removeItem('mcc_token');
        localStorage.removeItem('mcc_user');
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response Interceptor: Flatten response data and handle 401 Unauthorized rejections.
 */
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status;
    const errorMessage =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected network error occurred';

    if (status === 401) {
      localStorage.removeItem('mcc_token');
      localStorage.removeItem('mcc_user');

      // Dispatch custom window event so AuthContext or Router can respond gracefully
      window.dispatchEvent(new CustomEvent('mcc:unauthorized'));

      const publicPaths = ['/', '/login', '/about', '/contact', '/gallery', '/circulars'];
      const currentPath = window.location.pathname;
      const isPublic = publicPaths.some(
        (p) => currentPath === p || currentPath.startsWith('/category/') || currentPath.startsWith('/article/')
      );

      if (!isPublic && currentPath !== '/login') {
        window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
      }
    }

    return Promise.reject(new Error(errorMessage));
  }
);

export default api;
