const JWT_STORAGE_KEY = 'jwt';
const LEGACY_TOKEN_KEY = 'token';

export const getJwt = () =>
  sessionStorage.getItem(JWT_STORAGE_KEY) ||
  localStorage.getItem(JWT_STORAGE_KEY) ||
  localStorage.getItem(LEGACY_TOKEN_KEY);

export const setJwt = (token) => {
  if (!token) return;
  sessionStorage.setItem(JWT_STORAGE_KEY, token);
  localStorage.removeItem(JWT_STORAGE_KEY);
  localStorage.removeItem(LEGACY_TOKEN_KEY);
};

export const clearJwt = () => {
  sessionStorage.removeItem(JWT_STORAGE_KEY);
  localStorage.removeItem(JWT_STORAGE_KEY);
  localStorage.removeItem(LEGACY_TOKEN_KEY);
};
