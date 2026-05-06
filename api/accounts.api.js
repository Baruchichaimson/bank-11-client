import api from './axios.js';

export const getAccount = (params = {}) => api.get('/accounts/me', { params });
