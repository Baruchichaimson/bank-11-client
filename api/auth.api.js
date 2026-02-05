import api from './axios.js';

export const signup = (payload) => api.post('/auth/signup', payload);

export const login = (payload) => api.post('/auth/login', payload);

export const verify = (token) =>
  api.get('/auth/verify', {
    params: { token }
  });

export const forgotPassword = (payload) =>
  api.post('/auth/forgot-password', payload);

export const resetPassword = (payload) =>
  api.post('/auth/reset-password', payload);

export const verifyStatus = (email) =>
  api.get('/auth/verify-status', {
    params: { email }
  });
