import api from './axios.js';

export const getTransactions = () => api.get('/transactions');

export const getSentTransactionByRecipientName = (recipientName) =>
  api.get(`/transactions/by-recipient-name/${encodeURIComponent(recipientName)}`);

export const createTransaction = (payload) =>
  api.post('/transactions', payload);
