import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

export function setupInventorySocket(io: Server) {
  io.on('connection', (socket: Socket) => {
    // Authenticate and join user-specific room for order + alert notifications
    const token = socket.handshake.auth?.token as string | undefined;
    if (token) {
      try {
        const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
        socket.join(`user:${payload.userId}`);
      } catch {
        // unauthenticated client — still allowed to watch store rooms
      }
    }

    // Join a store room to receive live inventory updates
    socket.on('store:watch', (storeId: string) => {
      socket.join(`store:${storeId}`);
    });

    socket.on('store:unwatch', (storeId: string) => {
      socket.leave(`store:${storeId}`);
    });

    socket.on('disconnect', () => {
      // rooms are cleaned up automatically
    });
  });
}
