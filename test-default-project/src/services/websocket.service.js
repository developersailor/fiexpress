import { Server as SocketIOServer, Socket } from 'socket.io';

export class WebSocketService {
  private io: SocketIOServer;
  private typingUsers: Map<string, Set<string>> = new Map();
  private userPresence: Map<string, any> = new Map();

  constructor(io: SocketIOServer) {
    this.io = io;
  }

  // Send private message
  sendPrivateMessage(socket: Socket, data: { to: string, message: string, type?: string }) {
    const message = {
      from: socket.data.user?.id || 'anonymous',
      to: data.to,
      message: data.message,
      type: data.type || 'text',
      timestamp: new Date().toISOString()
    };

    // Send to specific user
    this.io.to(`user:${data.to}`).emit('private_message', message);
    
    // Send confirmation back to sender
    socket.emit('message_sent', {
      ...message,
      status: 'sent'
    });
  }

  // Send room message
  sendRoomMessage(socket: Socket, data: { room: string, message: string, type?: string }) {
    const message = {
      from: socket.data.user?.id || 'anonymous',
      room: data.room,
      message: data.message,
      type: data.type || 'text',
      timestamp: new Date().toISOString()
    };

    // Send to all users in the room
    this.io.to(data.room).emit('room_message', message);
  }

  // Handle typing start
  handleTypingStart(socket: Socket, data: { room?: string, to?: string }) {
    const userId = socket.data.user?.id || 'anonymous';
    
    if (data.room) {
      // Room typing
      if (!this.typingUsers.has(data.room)) {
        this.typingUsers.set(data.room, new Set());
      }
      this.typingUsers.get(data.room)!.add(userId);
      
      socket.to(data.room).emit('typing_start', {
        userId,
        room: data.room,
        timestamp: new Date().toISOString()
      });
    } else if (data.to) {
      // Private typing
      socket.to(`user:${data.to}`).emit('typing_start', {
        userId,
        to: data.to,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Handle typing stop
  handleTypingStop(socket: Socket, data: { room?: string, to?: string }) {
    const userId = socket.data.user?.id || 'anonymous';
    
    if (data.room) {
      // Room typing
      if (this.typingUsers.has(data.room)) {
        this.typingUsers.get(data.room)!.delete(userId);
        
        socket.to(data.room).emit('typing_stop', {
          userId,
          room: data.room,
          timestamp: new Date().toISOString()
        });
      }
    } else if (data.to) {
      // Private typing
      socket.to(`user:${data.to}`).emit('typing_stop', {
        userId,
        to: data.to,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Update user presence
  updatePresence(socket: Socket, data: { status: string, message?: string }) {
    const userId = socket.data.user?.id || 'anonymous';
    
    this.userPresence.set(userId, {
      status: data.status,
      message: data.message,
      lastSeen: new Date().toISOString(),
      socketId: socket.id
    });

    // Broadcast presence update to all connected users
    this.io.emit('presence_update', {
      userId,
      status: data.status,
      message: data.message,
      timestamp: new Date().toISOString()
    });
  }

  // Handle custom events
  handleCustomEvent(socket: Socket, data: any) {
    // Broadcast custom event to all connected users
    this.io.emit('custom_event', {
      from: socket.data.user?.id || 'anonymous',
      data,
      timestamp: new Date().toISOString()
    });
  }

  // Handle disconnection
  handleDisconnection(socket: Socket) {
    const userId = socket.data.user?.id || 'anonymous';
    
    // Update presence to offline
    this.userPresence.set(userId, {
      status: 'offline',
      lastSeen: new Date().toISOString()
    });

    // Broadcast offline status
    this.io.emit('presence_update', {
      userId,
      status: 'offline',
      timestamp: new Date().toISOString()
    });

    // Clean up typing indicators
    for (const [room, users] of this.typingUsers.entries()) {
      if (users.has(userId)) {
        users.delete(userId);
        socket.to(room).emit('typing_stop', {
          userId,
          room,
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  // Get online users
  getOnlineUsers(): string[] {
    return Array.from(this.userPresence.keys());
  }

  // Get user presence
  getUserPresence(userId: string): any {
    return this.userPresence.get(userId);
  }

  // Get all presence
  getAllPresence(): Map<string, any> {
    return this.userPresence;
  }

  // Send notification to user
  sendNotification(userId: string, notification: any) {
    this.io.to(`user:${userId}`).emit('notification', {
      ...notification,
      timestamp: new Date().toISOString()
    });
  }

  // Broadcast to all users
  broadcast(event: string, data: any) {
    this.io.emit(event, {
      ...data,
      timestamp: new Date().toISOString()
    });
  }

  // Send to specific room
  sendToRoom(room: string, event: string, data: any) {
    this.io.to(room).emit(event, {
      ...data,
      timestamp: new Date().toISOString()
    });
  }
}

export default WebSocketService;