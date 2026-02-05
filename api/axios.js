import axios from 'axios';
import { getJwt, clearJwt } from '../utils/authStorage.js';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

const AUTH_EXEMPT_PATHS = [
  '/auth/login',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify',
  '/auth/verify-status'
];

api.interceptors.request.use((config) => {
  const token = getJwt();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    const token = getJwt();
    const url = err.config?.url || '';
    const isAuthExempt = AUTH_EXEMPT_PATHS.some((path) => url.includes(path));

    if (status === 401 && token && !isAuthExempt) {
      clearJwt();
      window.location.replace('/login');
    }
    return Promise.reject(err);
  }
);

export default api;
