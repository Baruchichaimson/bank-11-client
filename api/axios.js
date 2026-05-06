import axios from 'axios';
import { clearJwt, getJwt } from '../utils/authStorage.js';

const DEFAULT_API_BASE_URL = 'http://localhost:3000';
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL;

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  withCredentials: true
});

const AUTH_EXEMPT_PATHS = [
  '/auth/login',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify',
  '/auth/verify-status',
  '/auth/logout'
];
const PUBLIC_APP_PATHS = ['/login', '/register', '/verify', '/reset-password'];

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    const url = err.config?.url || '';
    const isAuthExempt = AUTH_EXEMPT_PATHS.some((path) => url.includes(path));
    const isPublicPath = PUBLIC_APP_PATHS.some((path) =>
      window.location.pathname.startsWith(path)
    );

    if (status === 401 && !isAuthExempt && !isPublicPath) {
      clearJwt();
      window.location.replace('/login');
    }
    return Promise.reject(err);
  }
);

api.interceptors.request.use((config) => {
  const jwt = getJwt();
  if (jwt && !config.headers?.Authorization) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${jwt}`;
  }

  console.log(
    'AXIOS REQUEST =>',
    config.method?.toUpperCase(),
    config.baseURL + config.url
  );
  return config;
});

export default api;
