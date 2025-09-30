import express from 'express';
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

export default router;