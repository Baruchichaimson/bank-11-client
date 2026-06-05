import { io } from 'socket.io-client';

const DEFAULT_API_BASE_URL = 'http://localhost:3000';
const DEFAULT_SOCKET_URL = 'http://localhost:3000';

export const SOCKET_TRANSPORTS = Object.freeze(['polling', 'websocket']);

const getViteEnv = () => import.meta.env || {};

export const normalizeSocketUrl = (value, fallback = DEFAULT_SOCKET_URL) => {
  const text = String(value || '').trim();
  if (!text) return fallback;

  try {
    const url = new URL(text);
    return `${url.protocol}//${url.host}`;
  } catch {
    return fallback;
  }
};

const getApiBaseUrl = () => {
  const env = getViteEnv();
  if (env.VITE_API_BASE_URL) return env.VITE_API_BASE_URL;
  if (env.DEV) return DEFAULT_API_BASE_URL;
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return DEFAULT_API_BASE_URL;
};

const deriveSocketUrlFromApiBase = (apiBaseUrl) => {
  return normalizeSocketUrl(apiBaseUrl, DEFAULT_SOCKET_URL);
};

export const getSocketUrl = () => {
  const env = getViteEnv();
  return normalizeSocketUrl(
    env.VITE_SOCKET_URL,
    deriveSocketUrlFromApiBase(getApiBaseUrl())
  );
};

const createAuthedSocket = ({ token }) =>
  io(getSocketUrl(), {
    autoConnect: true,
    transports: SOCKET_TRANSPORTS,
    withCredentials: true,
    auth: token ? { token } : {}
  });

let sharedCallSocket = null;
let sharedCallSocketToken = null;

export const getOrCreateCallSocket = ({ token }) => {
  const socketKey = token || '__cookie_auth__';

  if (sharedCallSocket && sharedCallSocketToken === socketKey) {
    return sharedCallSocket;
  }

  if (sharedCallSocket) {
    sharedCallSocket.disconnect();
  }

  sharedCallSocket = createAuthedSocket({ token });
  sharedCallSocketToken = socketKey;
  return sharedCallSocket;
};

export const disconnectCallSocket = () => {
  if (!sharedCallSocket) return;
  sharedCallSocket.disconnect();
  sharedCallSocket = null;
  sharedCallSocketToken = null;
};

export const createAssistantSocket = ({ token }) => createAuthedSocket({ token });
