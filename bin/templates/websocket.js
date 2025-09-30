import { writeFileSafe } from "../utils.js";
import path from "path";
import fs from "fs";

export function generateWebSocketSupport(targetRoot, options = {}) {
  const { ts = false } = options;
  
  // Socket handler
  const socketHandler = generateSocketHandler(ts);
  writeFileSafe(path.join(targetRoot, "src", "websocket", "socket.handler.js"), socketHandler);
  
  // WebSocket service
  const websocketService = generateWebSocketService(ts);
  writeFileSafe(path.join(targetRoot, "src", "services", "websocket.service.js"), websocketService);
  
  // Socket events
  generateSocketEvents(targetRoot, ts);
  
  // Socket middleware
  const socketMiddleware = generateSocketMiddleware(ts);
  writeFileSafe(path.join(targetRoot, "src", "websocket", "middleware", "auth.middleware.js"), socketMiddleware);
  
  // Client example
  const clientExample = generateClientExample(ts);
  writeFileSafe(path.join(targetRoot, "client", "websocket.client.js"), clientExample);
  
  // WebSocket routes
  const websocketRoutes = generateWebSocketRoutes(ts);
  writeFileSafe(path.join(targetRoot, "src", "routes", "websocket.js"), websocketRoutes);
  
  // Update package.json with WebSocket dependencies
  updatePackageJsonWithWebSocket(targetRoot);
  
  console.log("🔌 WebSocket support added successfully!");
}

function generateSocketHandler(ts) {
  if (ts) {
    return `import { Server as SocketIOServer } from 'socket.io';
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
      console.log(\`🔌 Client connected: \${socket.id}\`);
      next();
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(\`🔌 User \${socket.data.user?.id || 'anonymous'} connected with socket \${socket.id}\`);

      // Join user to their personal room
      if (socket.data.user) {
        socket.join(\`user:\${socket.data.user.id}\`);
      }

      // Handle room joining
      socket.on('join_room', (roomId: string) => {
        socket.join(roomId);
        console.log(\`🔌 User \${socket.data.user?.id || 'anonymous'} joined room \${roomId}\`);
        
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
        console.log(\`🔌 User \${socket.data.user?.id || 'anonymous'} left room \${roomId}\`);
        
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
        console.log(\`🔌 User \${socket.data.user?.id || 'anonymous'} disconnected: \${reason}\`);
        
        // Notify all rooms the user was in
        this.websocketService.handleDisconnection(socket);
      });

      // Handle errors
      socket.on('error', (error: Error) => {
        console.error(\`🔌 Socket error for user \${socket.data.user?.id || 'anonymous'}: \`, error);
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

export default SocketHandler;`;
  } else {
    return `const { Server: SocketIOServer } = require('socket.io');
const { Server: HTTPServer } = require('http');
const { WebSocketService } = require('../services/websocket.service');
const { authenticateSocket } = require('./middleware/auth.middleware');

class SocketHandler {
  constructor(httpServer) {
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

  setupMiddleware() {
    // Authentication middleware
    this.io.use(authenticateSocket);

    // Connection middleware
    this.io.use((socket, next) => {
      console.log(\`🔌 Client connected: \${socket.id}\`);
      next();
    });
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(\`🔌 User \${socket.data.user?.id || 'anonymous'} connected with socket \${socket.id}\`);

      // Join user to their personal room
      if (socket.data.user) {
        socket.join(\`user:\${socket.data.user.id}\`);
      }

      // Handle room joining
      socket.on('join_room', (roomId) => {
        socket.join(roomId);
        console.log(\`🔌 User \${socket.data.user?.id || 'anonymous'} joined room \${roomId}\`);
        
        // Notify others in the room
        socket.to(roomId).emit('user_joined', {
          userId: socket.data.user?.id,
          socketId: socket.id,
          timestamp: new Date().toISOString()
        });
      });

      // Handle room leaving
      socket.on('leave_room', (roomId) => {
        socket.leave(roomId);
        console.log(\`🔌 User \${socket.data.user?.id || 'anonymous'} left room \${roomId}\`);
        
        // Notify others in the room
        socket.to(roomId).emit('user_left', {
          userId: socket.data.user?.id,
          socketId: socket.id,
          timestamp: new Date().toISOString()
        });
      });

      // Handle private messages
      socket.on('private_message', (data) => {
        this.websocketService.sendPrivateMessage(socket, data);
      });

      // Handle room messages
      socket.on('room_message', (data) => {
        this.websocketService.sendRoomMessage(socket, data);
      });

      // Handle typing indicators
      socket.on('typing_start', (data) => {
        this.websocketService.handleTypingStart(socket, data);
      });

      socket.on('typing_stop', (data) => {
        this.websocketService.handleTypingStop(socket, data);
      });

      // Handle presence updates
      socket.on('presence_update', (data) => {
        this.websocketService.updatePresence(socket, data);
      });

      // Handle custom events
      socket.on('custom_event', (data) => {
        this.websocketService.handleCustomEvent(socket, data);
      });

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        console.log(\`🔌 User \${socket.data.user?.id || 'anonymous'} disconnected: \${reason}\`);
        
        // Notify all rooms the user was in
        this.websocketService.handleDisconnection(socket);
      });

      // Handle errors
      socket.on('error', (error) => {
        console.error(\`🔌 Socket error for user \${socket.data.user?.id || 'anonymous'}: \`, error);
      });
    });
  }

  getIO() {
    return this.io;
  }

  getWebSocketService() {
    return this.websocketService;
  }
}

module.exports = { SocketHandler };
module.exports.default = SocketHandler;
`;
  }
}

function generateWebSocketService(ts) {
  if (ts) {
    return `import { Server as SocketIOServer, Socket } from 'socket.io';

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
    this.io.to(\`user:\${data.to}\`).emit('private_message', message);
    
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
      socket.to(\`user:\${data.to}\`).emit('typing_start', {
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
      socket.to(\`user:\${data.to}\`).emit('typing_stop', {
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
    this.io.to(\`user:\${userId}\`).emit('notification', {
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

export default WebSocketService;`;
  } else {
    return `const { Server: SocketIOServer } = require('socket.io');

class WebSocketService {
  constructor(io) {
    this.io = io;
    this.typingUsers = new Map();
    this.userPresence = new Map();
  }

  // Send private message
  sendPrivateMessage(socket, data) {
    const message = {
      from: socket.data.user?.id || 'anonymous',
      to: data.to,
      message: data.message,
      type: data.type || 'text',
      timestamp: new Date().toISOString()
    };

    // Send to specific user
    this.io.to(\`user:\${data.to}\`).emit('private_message', message);
    
    // Send confirmation back to sender
    socket.emit('message_sent', {
      ...message,
      status: 'sent'
    });
  }

  // Send room message
  sendRoomMessage(socket, data) {
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
  handleTypingStart(socket, data) {
    const userId = socket.data.user?.id || 'anonymous';
    
    if (data.room) {
      // Room typing
      if (!this.typingUsers.has(data.room)) {
        this.typingUsers.set(data.room, new Set());
      }
      this.typingUsers.get(data.room).add(userId);
      
      socket.to(data.room).emit('typing_start', {
        userId,
        room: data.room,
        timestamp: new Date().toISOString()
      });
    } else if (data.to) {
      // Private typing
      socket.to(\`user:\${data.to}\`).emit('typing_start', {
        userId,
        to: data.to,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Handle typing stop
  handleTypingStop(socket, data) {
    const userId = socket.data.user?.id || 'anonymous';
    
    if (data.room) {
      // Room typing
      if (this.typingUsers.has(data.room)) {
        this.typingUsers.get(data.room).delete(userId);
        
        socket.to(data.room).emit('typing_stop', {
          userId,
          room: data.room,
          timestamp: new Date().toISOString()
        });
      }
    } else if (data.to) {
      // Private typing
      socket.to(\`user:\${data.to}\`).emit('typing_stop', {
        userId,
        to: data.to,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Update user presence
  updatePresence(socket, data) {
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
  handleCustomEvent(socket, data) {
    // Broadcast custom event to all connected users
    this.io.emit('custom_event', {
      from: socket.data.user?.id || 'anonymous',
      data,
      timestamp: new Date().toISOString()
    });
  }

  // Handle disconnection
  handleDisconnection(socket) {
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
  getOnlineUsers() {
    return Array.from(this.userPresence.keys());
  }

  // Get user presence
  getUserPresence(userId) {
    return this.userPresence.get(userId);
  }

  // Get all presence
  getAllPresence() {
    return this.userPresence;
  }

  // Send notification to user
  sendNotification(userId, notification) {
    this.io.to(\`user:\${userId}\`).emit('notification', {
      ...notification,
      timestamp: new Date().toISOString()
    });
  }

  // Broadcast to all users
  broadcast(event, data) {
    this.io.emit(event, {
      ...data,
      timestamp: new Date().toISOString()
    });
  }

  // Send to specific room
  sendToRoom(room, event, data) {
    this.io.to(room).emit(event, {
      ...data,
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = { WebSocketService };
module.exports.default = WebSocketService;
`;
  }
}

function generateSocketEvents(targetRoot, ts) {
  // Create events directory structure
  const events = [
    'message.events.js',
    'presence.events.js',
    'notification.events.js'
  ];

  events.forEach(eventFile => {
    const eventContent = generateEventFile(ts, eventFile);
    writeFileSafe(path.join(targetRoot, "src", "websocket", "events", eventFile), eventContent);
  });
}

function generateEventFile(ts, eventFile) {
  const eventTypes = {
    'message.events.js': {
      name: 'Message Events',
      events: ['message_sent', 'message_received', 'message_delivered', 'message_read']
    },
    'presence.events.js': {
      name: 'Presence Events',
      events: ['user_online', 'user_offline', 'user_away', 'user_busy']
    },
    'notification.events.js': {
      name: 'Notification Events',
      events: ['notification_sent', 'notification_read', 'notification_cleared']
    }
  };

  const eventType = eventTypes[eventFile];
  
  if (ts) {
    return `// ${eventType.name}
// This file contains event handlers for ${eventType.name.toLowerCase()}

export const ${eventFile.replace('.events.js', 'Events')} = {
${eventType.events.map(event => `  ${event}: (socket, data) => {
    // Handle ${event} event
    console.log(\`📡 ${event}: \`, data);
  }`).join(',\n')}
};

export default ${eventFile.replace('.events.js', 'Events')};`;
  } else {
    return `// ${eventType.name}
// This file contains event handlers for ${eventType.name.toLowerCase()}

const ${eventFile.replace('.events.js', 'Events')} = {
${eventType.events.map(event => `  ${event}: (socket, data) => {
    // Handle ${event} event
    console.log(\`📡 ${event}: \`, data);
  }`).join(',\n')}
};

module.exports = { ${eventFile.replace('.events.js', 'Events')} };
module.exports.default = ${eventFile.replace('.events.js', 'Events')};
`;
  }
}

function generateSocketMiddleware(ts) {
  if (ts) {
    return `import { Socket } from 'socket.io';
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
}`;
  } else {
    return `const { Socket } = require('socket.io');
const { verify } = require('jsonwebtoken');

function authenticateSocket(socket, next) {
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

function rateLimitSocket(maxConnections = 10) {
  const connectionCounts = new Map();

  return (socket, next) => {
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

function validateSocketData(schema) {
  return (socket, next) => {
    // Add data validation logic here
    // This is a placeholder for schema validation
    next();
  };
}

module.exports = {
  authenticateSocket,
  rateLimitSocket,
  validateSocketData
};
`;
  }
}

function generateClientExample(ts) {
  if (ts) {
    return `import { io, Socket } from 'socket.io-client';

export class WebSocketClient {
  private socket: Socket;
  private connected: boolean = false;

  constructor(url: string = 'http://localhost:3000') {
    this.socket = io(url, {
      transports: ['websocket', 'polling'],
      autoConnect: false
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.socket.on('connect', () => {
      console.log('🔌 Connected to server');
      this.connected = true;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Disconnected from server:', reason);
      this.connected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔌 Connection error:', error);
    });

    // Message events
    this.socket.on('private_message', (data) => {
      console.log('📨 Private message received:', data);
    });

    this.socket.on('room_message', (data) => {
      console.log('📨 Room message received:', data);
    });

    this.socket.on('message_sent', (data) => {
      console.log('📤 Message sent:', data);
    });

    // Typing events
    this.socket.on('typing_start', (data) => {
      console.log('⌨️ User started typing:', data);
    });

    this.socket.on('typing_stop', (data) => {
      console.log('⌨️ User stopped typing:', data);
    });

    // Presence events
    this.socket.on('presence_update', (data) => {
      console.log('👤 Presence update:', data);
    });

    this.socket.on('user_joined', (data) => {
      console.log('👤 User joined:', data);
    });

    this.socket.on('user_left', (data) => {
      console.log('👤 User left:', data);
    });

    // Notification events
    this.socket.on('notification', (data) => {
      console.log('🔔 Notification:', data);
    });

    // Custom events
    this.socket.on('custom_event', (data) => {
      console.log('📡 Custom event:', data);
    });
  }

  // Connection methods
  connect(token?: string) {
    if (token) {
      this.socket.auth = { token };
    }
    this.socket.connect();
  }

  disconnect() {
    this.socket.disconnect();
  }

  isConnected(): boolean {
    return this.connected;
  }

  // Room methods
  joinRoom(roomId: string) {
    this.socket.emit('join_room', roomId);
  }

  leaveRoom(roomId: string) {
    this.socket.emit('leave_room', roomId);
  }

  // Message methods
  sendPrivateMessage(to: string, message: string, type: string = 'text') {
    this.socket.emit('private_message', { to, message, type });
  }

  sendRoomMessage(room: string, message: string, type: string = 'text') {
    this.socket.emit('room_message', { room, message, type });
  }

  // Typing methods
  startTyping(room?: string, to?: string) {
    this.socket.emit('typing_start', { room, to });
  }

  stopTyping(room?: string, to?: string) {
    this.socket.emit('typing_stop', { room, to });
  }

  // Presence methods
  updatePresence(status: string, message?: string) {
    this.socket.emit('presence_update', { status, message });
  }

  // Custom event methods
  sendCustomEvent(data: any) {
    this.socket.emit('custom_event', data);
  }

  // Event listener methods
  on(event: string, callback: Function) {
    this.socket.on(event, callback);
  }

  off(event: string, callback?: Function) {
    this.socket.off(event, callback);
  }

  // Get socket instance
  getSocket(): Socket {
    return this.socket;
  }
}

// Usage example
export const createWebSocketClient = (url?: string, token?: string): WebSocketClient => {
  const client = new WebSocketClient(url);
  client.connect(token);
  return client;
};

export default WebSocketClient;`;
  } else {
    return `const { io } = require('socket.io-client');

class WebSocketClient {
  constructor(url = 'http://localhost:3000') {
    this.socket = io(url, {
      transports: ['websocket', 'polling'],
      autoConnect: false
    });

    this.connected = false;
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.socket.on('connect', () => {
      console.log('🔌 Connected to server');
      this.connected = true;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Disconnected from server:', reason);
      this.connected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔌 Connection error:', error);
    });

    // Message events
    this.socket.on('private_message', (data) => {
      console.log('📨 Private message received:', data);
    });

    this.socket.on('room_message', (data) => {
      console.log('📨 Room message received:', data);
    });

    this.socket.on('message_sent', (data) => {
      console.log('📤 Message sent:', data);
    });

    // Typing events
    this.socket.on('typing_start', (data) => {
      console.log('⌨️ User started typing:', data);
    });

    this.socket.on('typing_stop', (data) => {
      console.log('⌨️ User stopped typing:', data);
    });

    // Presence events
    this.socket.on('presence_update', (data) => {
      console.log('👤 Presence update:', data);
    });

    this.socket.on('user_joined', (data) => {
      console.log('👤 User joined:', data);
    });

    this.socket.on('user_left', (data) => {
      console.log('👤 User left:', data);
    });

    // Notification events
    this.socket.on('notification', (data) => {
      console.log('🔔 Notification:', data);
    });

    // Custom events
    this.socket.on('custom_event', (data) => {
      console.log('📡 Custom event:', data);
    });
  }

  // Connection methods
  connect(token) {
    if (token) {
      this.socket.auth = { token };
    }
    this.socket.connect();
  }

  disconnect() {
    this.socket.disconnect();
  }

  isConnected() {
    return this.connected;
  }

  // Room methods
  joinRoom(roomId) {
    this.socket.emit('join_room', roomId);
  }

  leaveRoom(roomId) {
    this.socket.emit('leave_room', roomId);
  }

  // Message methods
  sendPrivateMessage(to, message, type = 'text') {
    this.socket.emit('private_message', { to, message, type });
  }

  sendRoomMessage(room, message, type = 'text') {
    this.socket.emit('room_message', { room, message, type });
  }

  // Typing methods
  startTyping(room, to) {
    this.socket.emit('typing_start', { room, to });
  }

  stopTyping(room, to) {
    this.socket.emit('typing_stop', { room, to });
  }

  // Presence methods
  updatePresence(status, message) {
    this.socket.emit('presence_update', { status, message });
  }

  // Custom event methods
  sendCustomEvent(data) {
    this.socket.emit('custom_event', data);
  }

  // Event listener methods
  on(event, callback) {
    this.socket.on(event, callback);
  }

  off(event, callback) {
    this.socket.off(event, callback);
  }

  // Get socket instance
  getSocket() {
    return this.socket;
  }
}

// Usage example
const createWebSocketClient = (url, token) => {
  const client = new WebSocketClient(url);
  client.connect(token);
  return client;
};

module.exports = { WebSocketClient, createWebSocketClient };
module.exports.default = WebSocketClient;
`;
  }
}

function generateWebSocketRoutes(ts) {
  if (ts) {
    return `import express from 'express';
import { SocketHandler } from '../websocket/socket.handler';

const router = express.Router();

// WebSocket health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'WebSocket',
    endpoint: '/socket.io',
    features: [
      'Real-time messaging',
      'Room management',
      'Presence tracking',
      'Typing indicators',
      'Custom events'
    ]
  });
});

// WebSocket statistics
router.get('/stats', (req, res) => {
  // This would require access to the SocketHandler instance
  // In a real implementation, you'd pass the handler instance
  res.json({
    message: 'WebSocket statistics endpoint',
    note: 'This endpoint requires SocketHandler instance to provide real stats'
  });
});

export default router;`;
  } else {
    return `const express = require('express');
const { SocketHandler } = require('../websocket/socket.handler');

const router = express.Router();

// WebSocket health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'WebSocket',
    endpoint: '/socket.io',
    features: [
      'Real-time messaging',
      'Room management',
      'Presence tracking',
      'Typing indicators',
      'Custom events'
    ]
  });
});

// WebSocket statistics
router.get('/stats', (req, res) => {
  // This would require access to the SocketHandler instance
  // In a real implementation, you'd pass the handler instance
  res.json({
    message: 'WebSocket statistics endpoint',
    note: 'This endpoint requires SocketHandler instance to provide real stats'
  });
});

module.exports = router;
`;
  }
}

function updatePackageJsonWithWebSocket(targetRoot) {
  const pkgPath = path.join(targetRoot, "package.json");
  
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    
    pkg.dependencies = pkg.dependencies || {};
    pkg.dependencies["socket.io"] = "^4.7.0";
    pkg.dependencies["socket.io-client"] = "^4.7.0";
    
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
  } catch (error) {
    console.error("Failed to update package.json with WebSocket dependencies:", error);
  }
}
