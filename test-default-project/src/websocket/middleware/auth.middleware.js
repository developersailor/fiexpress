import { Socket } from 'socket.io';
import { verify } from 'jsonwebtoken';

export function authenticateSocket(socket: Socket, next: Function) {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      if (auth) {
        return next(new Error('Authentication required'));
      } else {
        // Allow anonymous connections
        socket.data.user = null;
        return next();
      }
    }

    const decoded = verify(token, process.env.JWT_SECRET || 'secret');
    socket.data.user = decoded;
    next();
  } catch (error) {
    if (auth) {
      return next(new Error('Invalid token'));
    } else {
      // Allow anonymous connections
      socket.data.user = null;
      next();
    }
  }
}

export function rateLimitSocket(maxConnections: number = 10) {
  const connectionCounts = new Map<string, number>();

  return (socket: Socket, next: Function) => {
    const clientId = socket.handshake.address;
    const currentCount = connectionCounts.get(clientId) || 0;

    if (currentCount >= maxConnections) {
      return next(new Error('Too many connections'));
    }

    connectionCounts.set(clientId, currentCount + 1);

    socket.on('disconnect', () => {
      const newCount = (connectionCounts.get(clientId) || 1) - 1;
      if (newCount <= 0) {
        connectionCounts.delete(clientId);
      } else {
        connectionCounts.set(clientId, newCount);
      }
    });

    next();
  };
}

export function validateSocketData(schema: any) {
  return (socket: Socket, next: Function) => {
    // Add data validation logic here
    // This is a placeholder for schema validation
    next();
  };
}