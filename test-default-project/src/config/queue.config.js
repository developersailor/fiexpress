export const queueConfig = {
  // RabbitMQ configuration
  rabbitmq: {
  "host": "localhost",
  "port": 5672,
  "username": "guest",
  "password": "guest",
  "vhost": "/",
  "connectionTimeout": 30000,
  "heartbeat": 60
},
  
  // Kafka configuration
  kafka: {
  "clientId": "fiexpress-app",
  "brokers": [
    "localhost:9092"
  ],
  "retry": {
    "initialRetryTime": 100,
    "retries": 8
  },
  "requestTimeout": 30000,
  "enforceRequestTimeout": true
},
  
  // Queue settings
  queues: {
    enabled: ["rabbitmq","kafka"],
    default: 'rabbitmq',
    retryAttempts: 3,
    retryDelay: 1000,
    deadLetterQueue: true
  },
  
  // Message settings
  messages: {
    ttl: 3600000, // 1 hour
    maxSize: 1024 * 1024, // 1MB
    compression: true,
    encryption: false
  }
};

export default queueConfig;