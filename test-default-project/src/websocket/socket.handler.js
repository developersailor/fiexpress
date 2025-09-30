import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { WebSocketService } from '../services/websocket.service';
import { authenticateSocket } from './middleware/auth.middleware';

export class SocketHandler {
  private io: SocketIOServer;
  private websocketService: WebSocketService;

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.websocketService = new WebSocketService(this.io);
    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    // Authentication middleware
    this.io.use(authenticateSocket);

    // Connection middleware
    this.io.use((socket, next) => {
      console.log(`🔌 Client connected: ${socket.id}`);
      next();
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`🔌 User ${socket.data.user?.id || 'anonymous'} connected with socket ${socket.id}`);

      // Join user to their personal room
      if (socket.data.user) {
        socket.join(`user:${socket.data.user.id}`);
      }

      // Handle room joining
      socket.on('join_room', (roomId: string) => {
        socket.join(roomId);
        console.log(`🔌 User ${socket.data.user?.id || 'anonymous'} joined room ${roomId}`);
        
        // Notify others in the room
        socket.to(roomId).emit('user_joined', {
          userId: socket.data.user?.id,
          socketId: socket.id,
          timestamp: new Date().toISOString()
        });
      });

      // Handle room leaving
      socket.on('leave_room', (roomId: string) => {
        socket.leave(roomId);
        console.log(`🔌 User ${socket.data.user?.id || 'anonymous'} left room ${roomId}`);
        
        // Notify others in the room
        socket.to(roomId).emit('user_left', {
          userId: socket.data.user?.id,
          socketId: socket.id,
          timestamp: new Date().toISOString()
        });
      });

      // Handle private messages
      socket.on('private_message', (data: { to: string, message: string, type?: string }) => {
        this.websocketService.sendPrivateMessage(socket, data);
      });

      // Handle room messages
      socket.on('room_message', (data: { room: string, message: string, type?: string }) => {
        this.websocketService.sendRoomMessage(socket, data);
      });

      // Handle typing indicators
      socket.on('typing_start', (data: { room?: string, to?: string }) => {
        this.websocketService.handleTypingStart(socket, data);
      });

      socket.on('typing_stop', (data: { room?: string, to?: string }) => {
        this.websocketService.handleTypingStop(socket, data);
      });

      // Handle presence updates
      socket.on('presence_update', (data: { status: string, message?: string }) => {
        this.websocketService.updatePresence(socket, data);
      });

      // Handle custom events
      socket.on('custom_event', (data: any) => {
        this.websocketService.handleCustomEvent(socket, data);
      });

      // Handle disconnection
      socket.on('disconnect', (reason: string) => {
        console.log(`🔌 User ${socket.data.user?.id || 'anonymous'} disconnected: ${reason}`);
        
        // Notify all rooms the user was in
        this.websocketService.handleDisconnection(socket);
      });

      // Handle errors
      socket.on('error', (error: Error) => {
        console.error(`🔌 Socket error for user ${socket.data.user?.id || 'anonymous'}: `, error);
      });
    });
  }

  getIO(): SocketIOServer {
    return this.io;
  }

  getWebSocketService(): WebSocketService {
    return this.websocketService;
  }
}

export default SocketHandler;