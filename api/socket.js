import { io } from 'socket.io-client';

const DEFAULT_API_BASE_URL = 'http://localhost:3000/api/v1';
const DEFAULT_SOCKET_URL = 'http://localhost:3000';

const getApiBaseUrl = () =>
  import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL;

const deriveSocketUrlFromApiBase = (apiBaseUrl) => {
  try {
    const url = new URL(apiBaseUrl);
    return `${url.protocol}//${url.host}`;
  } catch {
    return DEFAULT_SOCKET_URL;
  }
};

export const getSocketUrl = () =>
  import.meta.env.VITE_SOCKET_URL || deriveSocketUrlFromApiBase(getApiBaseUrl());

const createAuthedSocket = ({ token }) =>
  io(getSocketUrl(), {
    autoConnect: true,
    transports: ['websocket', 'polling'],
    auth: { token }
  });

let sharedCallSocket = null;
let sharedCallSocketToken = null;

export const getOrCreateCallSocket = ({ token }) => {
  if (!token) return null;

  if (sharedCallSocket && sharedCallSocketToken === token) {
    return sharedCallSocket;
  }

  if (sharedCallSocket) {
    sharedCallSocket.disconnect();
  }

  sharedCallSocket = createAuthedSocket({ token });
  sharedCallSocketToken = token;
  return sharedCallSocket;
};

export const disconnectCallSocket = () => {
  if (!sharedCallSocket) return;
  sharedCallSocket.disconnect();
  sharedCallSocket = null;
  sharedCallSocketToken = null;
};

export const createAssistantSocket = ({ token }) => createAuthedSocket({ token });
