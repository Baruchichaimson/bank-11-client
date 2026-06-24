import api from './axios.js';

export const getMyAvatar = () => api.get('/users/me/avatar');
