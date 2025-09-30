import { io, Socket } from 'socket.io-client';

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

export default WebSocketClient;