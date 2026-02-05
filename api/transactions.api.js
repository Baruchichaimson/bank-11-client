import api from './axios.js';

export const getTransactions = () => api.get('/transactions');

export const getTransactionById = (transactionId) =>
  api.get(`/transactions/${transactionId}`);

export const createTransaction = (payload) =>
  api.post('/transactions', payload);
