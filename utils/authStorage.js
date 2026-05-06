const JWT_KEY = 'bank_access_token';

export const getJwt = () => {
  try {
    return sessionStorage.getItem(JWT_KEY);
  } catch {
    return null;
  }
};

export const setJwt = (token) => {
  try {
    if (!token) return;
    sessionStorage.setItem(JWT_KEY, token);
  } catch {
    // Ignore storage errors in restricted browsers/modes.
  }
};

export const clearJwt = () => {
  try {
    sessionStorage.removeItem(JWT_KEY);
  } catch {
    // Ignore storage errors in restricted browsers/modes.
  }
};
