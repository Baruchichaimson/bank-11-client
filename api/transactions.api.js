import api from './axios.js';

export const getTransactions = (params = {}) => api.get('/transactions', { params });

export const getSentTransactionByRecipientName = (recipientName) =>
  api.get(`/transactions/by-recipient-name/${encodeURIComponent(recipientName)}`);

export const createTransaction = (payload) =>
  api.post('/transactions', payload);
