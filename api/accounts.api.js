import api from './axios.js';

export const getAccount = () => api.get('/accounts/me');
