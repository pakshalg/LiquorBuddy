import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io('/', {
      auth: { token: localStorage.getItem('token') },
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
}

export function reconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  // Reconnect immediately with whatever token is now in localStorage
  socket = io('/', {
    auth: { token: localStorage.getItem('token') },
    transports: ['websocket', 'polling'],
  });
  return socket;
}

export function watchStore(storeId: string) {
  getSocket().emit('store:watch', storeId);
}

export function unwatchStore(storeId: string) {
  getSocket().emit('store:unwatch', storeId);
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
