import { io } from 'socket.io-client';

const DEFAULT_SOCKET_URL = 'http://localhost:3000';

export const getSocketUrl = () =>
  import.meta.env.VITE_SOCKET_URL || DEFAULT_SOCKET_URL;

export const createAssistantSocket = ({ token }) =>
  io(getSocketUrl(), {
    autoConnect: true,
    transports: ['websocket', 'polling'],
    auth: { token }
  });
