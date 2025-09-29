import { writeFileSafe } from "../utils.js";
import path from "path";

export function generateMessageQueueSupport(targetRoot, options = {}) {
  const { ts = false, queues = ['rabbitmq', 'kafka'] } = options;
  
  // Message queue configuration
  const queueConfig = generateQueueConfig(ts, queues);
  writeFileSafe(path.join(targetRoot, "src", "config", "queue.config.js"), queueConfig);
  
  // Queue connection manager
  const connectionManager = generateConnectionManager(ts, queues);
  writeFileSafe(path.join(targetRoot, "src", "queues", "connection.manager.js"), connectionManager);
  
  // Generate queue implementations
  queues.forEach(queue => {
    generateQueueImplementation(targetRoot, queue, ts);
  });
  
  // Message producers
  const producer = generateMessageProducer(ts, queues);
  writeFileSafe(path.join(targetRoot, "src", "queues", "message.producer.js"), producer);
  
  // Message consumers
  const consumer = generateMessageConsumer(ts, queues);
  writeFileSafe(path.join(targetRoot, "src", "queues", "message.consumer.js"), consumer);
  
  // Queue middleware
  const queueMiddleware = generateQueueMiddleware(ts);
  writeFileSafe(path.join(targetRoot, "src", "middleware", "queue.middleware.js"), queueMiddleware);
  
  // Update package.json with queue dependencies
  updatePackageJsonWithQueues(targetRoot, queues);
  
  console.log(`📨 Message queue support (${queues.join(', ')}) added successfully!`);
}

function generateQueueConfig(ts, queues) {
  const config = {
    rabbitmq: {
      host: process.env.RABBITMQ_HOST || 'localhost',
      port: process.env.RABBITMQ_PORT || 5672,
      username: process.env.RABBITMQ_USERNAME || 'guest',
      password: process.env.RABBITMQ_PASSWORD || 'guest',
      vhost: process.env.RABBITMQ_VHOST || '/',
      connectionTimeout: 30000,
      heartbeat: 60
    },
    kafka: {
      clientId: process.env.KAFKA_CLIENT_ID || 'fiexpress-app',
      brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
      retry: {
        initialRetryTime: 100,
        retries: 8
      },
      requestTimeout: 30000,
      enforceRequestTimeout: true
    }
  };
  
  if (ts) {
    return `export const queueConfig = {
  // RabbitMQ configuration
  rabbitmq: ${JSON.stringify(config.rabbitmq, null, 2)},
  
  // Kafka configuration
  kafka: ${JSON.stringify(config.kafka, null, 2)},
  
  // Queue settings
  queues: {
    enabled: ${JSON.stringify(queues)},
    default: '${queues[0]}',
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

export default queueConfig;`;
  } else {
    return `const queueConfig = {
  // RabbitMQ configuration
  rabbitmq: ${JSON.stringify(config.rabbitmq, null, 2)},
  
  // Kafka configuration
  kafka: ${JSON.stringify(config.kafka, null, 2)},
  
  // Queue settings
  queues: {
    enabled: ${JSON.stringify(queues)},
    default: '${queues[0]}',
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

module.exports = { queueConfig };
module.exports.default = queueConfig;
`;
  }
}

function generateConnectionManager(ts) {
  if (ts) {
    return `import amqp from 'amqplib';
import { Kafka } from 'kafkajs';
import { queueConfig } from '../config/queue.config';

export class ConnectionManager {
  private rabbitmqConnection: amqp.Connection | null = null;
  private kafkaClient: Kafka | null = null;
  private connections: Map<string, any> = new Map();
  
  async connect(): Promise<void> {
    try {
      // Connect to RabbitMQ
      if (queueConfig.queues.enabled.includes('rabbitmq')) {
        await this.connectRabbitMQ();
      }
      
      // Connect to Kafka
      if (queueConfig.queues.enabled.includes('kafka')) {
        await this.connectKafka();
      }
      
      console.log('✅ All queue connections established');
    } catch (error) {
      console.error('❌ Failed to connect to queues:', error);
      throw error;
    }
  }
  
  private async connectRabbitMQ(): Promise<void> {
    const { host, port, username, password, vhost } = queueConfig.rabbitmq;
    const connectionString = \`amqp://\${username}:\${password}@\${host}:\${port}\${vhost}\`;
    
    this.rabbitmqConnection = await amqp.connect(connectionString);
    this.connections.set('rabbitmq', this.rabbitmqConnection);
    
    console.log('🐰 RabbitMQ connected successfully');
  }
  
  private async connectKafka(): Promise<void> {
    this.kafkaClient = new Kafka({
      clientId: queueConfig.kafka.clientId,
      brokers: queueConfig.kafka.brokers
    });
    
    this.connections.set('kafka', this.kafkaClient);
    console.log('🚀 Kafka connected successfully');
  }
  
  getConnection(type: string): any {
    return this.connections.get(type);
  }
  
  async disconnect(): Promise<void> {
    // Close RabbitMQ connection
    if (this.rabbitmqConnection) {
      await this.rabbitmqConnection.close();
    }
    
    // Close Kafka connection
    if (this.kafkaClient) {
      await this.kafkaClient.disconnect();
    }
    
    this.connections.clear();
    console.log('🔌 All queue connections closed');
  }
}

export default ConnectionManager;`;
  } else {
    return `const amqp = require('amqplib');
const { Kafka } = require('kafkajs');
const { queueConfig } = require('../config/queue.config');

class ConnectionManager {
  constructor() {
    this.rabbitmqConnection = null;
    this.kafkaClient = null;
    this.connections = new Map();
  }
  
  async connect() {
    try {
      // Connect to RabbitMQ
      if (queueConfig.queues.enabled.includes('rabbitmq')) {
        await this.connectRabbitMQ();
      }
      
      // Connect to Kafka
      if (queueConfig.queues.enabled.includes('kafka')) {
        await this.connectKafka();
      }
      
      console.log('✅ All queue connections established');
    } catch (error) {
      console.error('❌ Failed to connect to queues:', error);
      throw error;
    }
  }
  
  async connectRabbitMQ() {
    const { host, port, username, password, vhost } = queueConfig.rabbitmq;
    const connectionString = \`amqp://\${username}:\${password}@\${host}:\${port}\${vhost}\`;
    
    this.rabbitmqConnection = await amqp.connect(connectionString);
    this.connections.set('rabbitmq', this.rabbitmqConnection);
    
    console.log('🐰 RabbitMQ connected successfully');
  }
  
  async connectKafka() {
    this.kafkaClient = new Kafka({
      clientId: queueConfig.kafka.clientId,
      brokers: queueConfig.kafka.brokers
    });
    
    this.connections.set('kafka', this.kafkaClient);
    console.log('🚀 Kafka connected successfully');
  }
  
  getConnection(type) {
    return this.connections.get(type);
  }
  
  async disconnect() {
    // Close RabbitMQ connection
    if (this.rabbitmqConnection) {
      await this.rabbitmqConnection.close();
    }
    
    // Close Kafka connection
    if (this.kafkaClient) {
      await this.kafkaClient.disconnect();
    }
    
    this.connections.clear();
    console.log('🔌 All queue connections closed');
  }
}

module.exports = { ConnectionManager };
module.exports.default = ConnectionManager;
`;
  }
}

function generateQueueImplementation(targetRoot, queueType, ts) {
  const implementation = generateQueueImplementationCode(queueType, ts);
  writeFileSafe(path.join(targetRoot, "src", "queues", `${queueType}.queue.js`), implementation);
}

function generateQueueImplementationCode(queueType, ts) {
  if (queueType === 'rabbitmq') {
    return generateRabbitMQImplementation(ts);
  } else if (queueType === 'kafka') {
    return generateKafkaImplementation(ts);
  }
}

function generateRabbitMQImplementation(ts) {
  if (ts) {
    return `import amqp from 'amqplib';
import { queueConfig } from '../config/queue.config';

export class RabbitMQQueue {
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;
  
  async connect(): Promise<void> {
    const { host, port, username, password, vhost } = queueConfig.rabbitmq;
    const connectionString = \`amqp://\${username}:\${password}@\${host}:\${port}\${vhost}\`;
    
    this.connection = await amqp.connect(connectionString);
    this.channel = await this.connection.createChannel();
    
    console.log('🐰 RabbitMQ queue connected');
  }
  
  async publish(queueName: string, message: any, options: any = {}): Promise<void> {
    if (!this.channel) {
      throw new Error('Channel not initialized');
    }
    
    await this.channel.assertQueue(queueName, { durable: true });
    
    const messageBuffer = Buffer.from(JSON.stringify(message));
    const publishOptions = {
      persistent: true,
      ...options
    };
    
    this.channel.sendToQueue(queueName, messageBuffer, publishOptions);
    console.log(\`📤 Message sent to queue \${queueName}\`);
  }
  
  async consume(queueName: string, callback: (message: any) => Promise<void>): Promise<void> {
    if (!this.channel) {
      throw new Error('Channel not initialized');
    }
    
    await this.channel.assertQueue(queueName, { durable: true });
    
    this.channel.consume(queueName, async (msg) => {
      if (msg) {
        try {
          const message = JSON.parse(msg.content.toString());
          await callback(message);
          this.channel!.ack(msg);
        } catch (error) {
          console.error('Error processing message:', error);
          this.channel!.nack(msg, false, false);
        }
      }
    });
    
    console.log(\`📥 Consuming messages from queue \${queueName}\`);
  }
  
  async close(): Promise<void> {
    if (this.channel) {
      await this.channel.close();
    }
    if (this.connection) {
      await this.connection.close();
    }
  }
}

export default RabbitMQQueue;`;
  } else {
    return `const amqp = require('amqplib');
const { queueConfig } = require('../config/queue.config');

class RabbitMQQueue {
  constructor() {
    this.connection = null;
    this.channel = null;
  }
  
  async connect() {
    const { host, port, username, password, vhost } = queueConfig.rabbitmq;
    const connectionString = \`amqp://\${username}:\${password}@\${host}:\${port}\${vhost}\`;
    
    this.connection = await amqp.connect(connectionString);
    this.channel = await this.connection.createChannel();
    
    console.log('🐰 RabbitMQ queue connected');
  }
  
  async publish(queueName, message, options = {}) {
    if (!this.channel) {
      throw new Error('Channel not initialized');
    }
    
    await this.channel.assertQueue(queueName, { durable: true });
    
    const messageBuffer = Buffer.from(JSON.stringify(message));
    const publishOptions = {
      persistent: true,
      ...options
    };
    
    this.channel.sendToQueue(queueName, messageBuffer, publishOptions);
    console.log(\`📤 Message sent to queue \${queueName}\`);
  }
  
  async consume(queueName, callback) {
    if (!this.channel) {
      throw new Error('Channel not initialized');
    }
    
    await this.channel.assertQueue(queueName, { durable: true });
    
    this.channel.consume(queueName, async (msg) => {
      if (msg) {
        try {
          const message = JSON.parse(msg.content.toString());
          await callback(message);
          this.channel.ack(msg);
        } catch (error) {
          console.error('Error processing message:', error);
          this.channel.nack(msg, false, false);
        }
      }
    });
    
    console.log(\`📥 Consuming messages from queue \${queueName}\`);
  }
  
  async close() {
    if (this.channel) {
      await this.channel.close();
    }
    if (this.connection) {
      await this.connection.close();
    }
  }
}

module.exports = { RabbitMQQueue };
module.exports.default = RabbitMQQueue;
`;
  }
}

function generateKafkaImplementation(ts) {
  if (ts) {
    return `import { Kafka, Producer, Consumer } from 'kafkajs';
import { queueConfig } from '../config/queue.config';

export class KafkaQueue {
  private kafka: Kafka;
  private producer: Producer | null = null;
  private consumer: Consumer | null = null;
  
  constructor() {
    this.kafka = new Kafka({
      clientId: queueConfig.kafka.clientId,
      brokers: queueConfig.kafka.brokers
    });
  }
  
  async connect(): Promise<void> {
    this.producer = this.kafka.producer();
    await this.producer.connect();
    
    console.log('🚀 Kafka queue connected');
  }
  
  async publish(topic: string, message: any, options: any = {}): Promise<void> {
    if (!this.producer) {
      throw new Error('Producer not initialized');
    }
    
    const publishOptions = {
      topic,
      messages: [{
        key: options.key || null,
        value: JSON.stringify(message),
        partition: options.partition || 0
      }]
    };
    
    await this.producer.send(publishOptions);
    console.log(\`📤 Message sent to topic \${topic}\`);
  }
  
  async consume(topic: string, groupId: string, callback: (message: any) => Promise<void>): Promise<void> {
    this.consumer = this.kafka.consumer({ groupId });
    await this.consumer.connect();
    await this.consumer.subscribe({ topic, fromBeginning: false });
    
    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const messageData = JSON.parse(message.value?.toString() || '{}');
          await callback(messageData);
        } catch (error) {
          console.error('Error processing Kafka message:', error);
        }
      }
    });
    
    console.log(\`📥 Consuming messages from topic \${topic}\`);
  }
  
  async close(): Promise<void> {
    if (this.producer) {
      await this.producer.disconnect();
    }
    if (this.consumer) {
      await this.consumer.disconnect();
    }
  }
}

export default KafkaQueue;`;
  } else {
    return `const { Kafka } = require('kafkajs');
const { queueConfig } = require('../config/queue.config');

class KafkaQueue {
  constructor() {
    this.kafka = new Kafka({
      clientId: queueConfig.kafka.clientId,
      brokers: queueConfig.kafka.brokers
    });
    this.producer = null;
    this.consumer = null;
  }
  
  async connect() {
    this.producer = this.kafka.producer();
    await this.producer.connect();
    
    console.log('🚀 Kafka queue connected');
  }
  
  async publish(topic, message, options = {}) {
    if (!this.producer) {
      throw new Error('Producer not initialized');
    }
    
    const publishOptions = {
      topic,
      messages: [{
        key: options.key || null,
        value: JSON.stringify(message),
        partition: options.partition || 0
      }]
    };
    
    await this.producer.send(publishOptions);
    console.log(\`📤 Message sent to topic \${topic}\`);
  }
  
  async consume(topic, groupId, callback) {
    this.consumer = this.kafka.consumer({ groupId });
    await this.consumer.connect();
    await this.consumer.subscribe({ topic, fromBeginning: false });
    
    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const messageData = JSON.parse(message.value?.toString() || '{}');
          await callback(messageData);
        } catch (error) {
          console.error('Error processing Kafka message:', error);
        }
      }
    });
    
    console.log(\`📥 Consuming messages from topic \${topic}\`);
  }
  
  async close() {
    if (this.producer) {
      await this.producer.disconnect();
    }
    if (this.consumer) {
      await this.consumer.disconnect();
    }
  }
}

module.exports = { KafkaQueue };
module.exports.default = KafkaQueue;
`;
  }
}

function generateMessageProducer(ts) {
  if (ts) {
    return `import { ConnectionManager } from './connection.manager';
import { RabbitMQQueue } from './rabbitmq.queue';
import { KafkaQueue } from './kafka.queue';
import { queueConfig } from '../config/queue.config';

export class MessageProducer {
  private connectionManager: ConnectionManager;
  private queues: Map<string, any> = new Map();
  
  constructor() {
    this.connectionManager = new ConnectionManager();
  }
  
  async initialize(): Promise<void> {
    await this.connectionManager.connect();
    
    // Initialize queues
    if (queueConfig.queues.enabled.includes('rabbitmq')) {
      const rabbitmq = new RabbitMQQueue();
      await rabbitmq.connect();
      this.queues.set('rabbitmq', rabbitmq);
    }
    
    if (queueConfig.queues.enabled.includes('kafka')) {
      const kafka = new KafkaQueue();
      await kafka.connect();
      this.queues.set('kafka', kafka);
    }
  }
  
  async publish(queueType: string, target: string, message: any, options: any = {}): Promise<void> {
    const queue = this.queues.get(queueType);
    if (!queue) {
      throw new Error(\`Queue type \${queueType} not available\`);
    }
    
    if (queueType === 'rabbitmq') {
      await queue.publish(target, message, options);
    } else if (queueType === 'kafka') {
      await queue.publish(target, message, options);
    }
  }
  
  async publishToDefault(target: string, message: any, options: any = {}): Promise<void> {
    const defaultQueue = queueConfig.queues.default;
    await this.publish(defaultQueue, target, message, options);
  }
  
  async close(): Promise<void> {
    for (const queue of this.queues.values()) {
      await queue.close();
    }
    await this.connectionManager.disconnect();
  }
}

export default MessageProducer;`;
  } else {
    return `const { ConnectionManager } = require('./connection.manager');
const { RabbitMQQueue } = require('./rabbitmq.queue');
const { KafkaQueue } = require('./kafka.queue');
const { queueConfig } = require('../config/queue.config');

class MessageProducer {
  constructor() {
    this.connectionManager = new ConnectionManager();
    this.queues = new Map();
  }
  
  async initialize() {
    await this.connectionManager.connect();
    
    // Initialize queues
    if (queueConfig.queues.enabled.includes('rabbitmq')) {
      const rabbitmq = new RabbitMQQueue();
      await rabbitmq.connect();
      this.queues.set('rabbitmq', rabbitmq);
    }
    
    if (queueConfig.queues.enabled.includes('kafka')) {
      const kafka = new KafkaQueue();
      await kafka.connect();
      this.queues.set('kafka', kafka);
    }
  }
  
  async publish(queueType, target, message, options = {}) {
    const queue = this.queues.get(queueType);
    if (!queue) {
      throw new Error(\`Queue type \${queueType} not available\`);
    }
    
    if (queueType === 'rabbitmq') {
      await queue.publish(target, message, options);
    } else if (queueType === 'kafka') {
      await queue.publish(target, message, options);
    }
  }
  
  async publishToDefault(target, message, options = {}) {
    const defaultQueue = queueConfig.queues.default;
    await this.publish(defaultQueue, target, message, options);
  }
  
  async close() {
    for (const queue of this.queues.values()) {
      await queue.close();
    }
    await this.connectionManager.disconnect();
  }
}

module.exports = { MessageProducer };
module.exports.default = MessageProducer;
`;
  }
}

function generateMessageConsumer(ts) {
  if (ts) {
    return `import { ConnectionManager } from './connection.manager';
import { RabbitMQQueue } from './rabbitmq.queue';
import { KafkaQueue } from './kafka.queue';
import { queueConfig } from '../config/queue.config';

export class MessageConsumer {
  private connectionManager: ConnectionManager;
  private queues: Map<string, any> = new Map();
  
  constructor() {
    this.connectionManager = new ConnectionManager();
  }
  
  async initialize(): Promise<void> {
    await this.connectionManager.connect();
    
    // Initialize queues
    if (queueConfig.queues.enabled.includes('rabbitmq')) {
      const rabbitmq = new RabbitMQQueue();
      await rabbitmq.connect();
      this.queues.set('rabbitmq', rabbitmq);
    }
    
    if (queueConfig.queues.enabled.includes('kafka')) {
      const kafka = new KafkaQueue();
      await kafka.connect();
      this.queues.set('kafka', kafka);
    }
  }
  
  async consume(queueType: string, target: string, callback: (message: any) => Promise<void>, options: any = {}): Promise<void> {
    const queue = this.queues.get(queueType);
    if (!queue) {
      throw new Error(\`Queue type \${queueType} not available\`);
    }
    
    if (queueType === 'rabbitmq') {
      await queue.consume(target, callback);
    } else if (queueType === 'kafka') {
      const groupId = options.groupId || 'default-group';
      await queue.consume(target, groupId, callback);
    }
  }
  
  async consumeFromDefault(target: string, callback: (message: any) => Promise<void>, options: any = {}): Promise<void> {
    const defaultQueue = queueConfig.queues.default;
    await this.consume(defaultQueue, target, callback, options);
  }
  
  async close(): Promise<void> {
    for (const queue of this.queues.values()) {
      await queue.close();
    }
    await this.connectionManager.disconnect();
  }
}

export default MessageConsumer;`;
  } else {
    return `const { ConnectionManager } = require('./connection.manager');
const { RabbitMQQueue } = require('./rabbitmq.queue');
const { KafkaQueue } = require('./kafka.queue');
const { queueConfig } = require('../config/queue.config');

class MessageConsumer {
  constructor() {
    this.connectionManager = new ConnectionManager();
    this.queues = new Map();
  }
  
  async initialize() {
    await this.connectionManager.connect();
    
    // Initialize queues
    if (queueConfig.queues.enabled.includes('rabbitmq')) {
      const rabbitmq = new RabbitMQQueue();
      await rabbitmq.connect();
      this.queues.set('rabbitmq', rabbitmq);
    }
    
    if (queueConfig.queues.enabled.includes('kafka')) {
      const kafka = new KafkaQueue();
      await kafka.connect();
      this.queues.set('kafka', kafka);
    }
  }
  
  async consume(queueType, target, callback, options = {}) {
    const queue = this.queues.get(queueType);
    if (!queue) {
      throw new Error(\`Queue type \${queueType} not available\`);
    }
    
    if (queueType === 'rabbitmq') {
      await queue.consume(target, callback);
    } else if (queueType === 'kafka') {
      const groupId = options.groupId || 'default-group';
      await queue.consume(target, groupId, callback);
    }
  }
  
  async consumeFromDefault(target, callback, options = {}) {
    const defaultQueue = queueConfig.queues.default;
    await this.consume(defaultQueue, target, callback, options);
  }
  
  async close() {
    for (const queue of this.queues.values()) {
      await queue.close();
    }
    await this.connectionManager.disconnect();
  }
}

module.exports = { MessageConsumer };
module.exports.default = MessageConsumer;
`;
  }
}

function generateQueueMiddleware(ts) {
  if (ts) {
    return `import { Request, Response, NextFunction } from 'express';
import { MessageProducer } from '../queues/message.producer';
import { queueConfig } from '../config/queue.config';

export class QueueMiddleware {
  private producer: MessageProducer;
  
  constructor() {
    this.producer = new MessageProducer();
  }
  
  async initialize(): Promise<void> {
    await this.producer.initialize();
  }
  
  // Middleware to publish messages
  publishMessage(queueType: string, target: string, messageExtractor: (req: Request) => any) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const message = messageExtractor(req);
        await this.producer.publish(queueType, target, message);
        next();
      } catch (error) {
        console.error('Error publishing message:', error);
        next(error);
      }
    };
  }
  
  // Middleware to publish to default queue
  publishToDefault(target: string, messageExtractor: (req: Request) => any) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const message = messageExtractor(req);
        await this.producer.publishToDefault(target, message);
        next();
      } catch (error) {
        console.error('Error publishing message:', error);
        next(error);
      }
    };
  }
  
  async close(): Promise<void> {
    await this.producer.close();
  }
}

export default QueueMiddleware;`;
  } else {
    return `const { MessageProducer } = require('../queues/message.producer');
const { queueConfig } = require('../config/queue.config');

class QueueMiddleware {
  constructor() {
    this.producer = new MessageProducer();
  }
  
  async initialize() {
    await this.producer.initialize();
  }
  
  // Middleware to publish messages
  publishMessage(queueType, target, messageExtractor) {
    return async (req, res, next) => {
      try {
        const message = messageExtractor(req);
        await this.producer.publish(queueType, target, message);
        next();
      } catch (error) {
        console.error('Error publishing message:', error);
        next(error);
      }
    };
  }
  
  // Middleware to publish to default queue
  publishToDefault(target, messageExtractor) {
    return async (req, res, next) => {
      try {
        const message = messageExtractor(req);
        await this.producer.publishToDefault(target, message);
        next();
      } catch (error) {
        console.error('Error publishing message:', error);
        next(error);
      }
    };
  }
  
  async close() {
    await this.producer.close();
  }
}

module.exports = { QueueMiddleware };
module.exports.default = QueueMiddleware;
`;
  }
}

function updatePackageJsonWithQueues(targetRoot, queues) {
  const fs = require('fs');
  const pkgPath = path.join(targetRoot, "package.json");
  
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    
    pkg.dependencies = pkg.dependencies || {};
    
    // Add queue-specific dependencies
    if (queues.includes('rabbitmq')) {
      pkg.dependencies['amqplib'] = '^0.10.3';
    }
    
    if (queues.includes('kafka')) {
      pkg.dependencies['kafkajs'] = '^2.2.4';
    }
    
    // Add queue scripts
    pkg.scripts = pkg.scripts || {};
    pkg.scripts['start:producer'] = 'node src/queues/message.producer.js';
    pkg.scripts['start:consumer'] = 'node src/queues/message.consumer.js';
    
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
  } catch (error) {
    console.error("Failed to update package.json with queue dependencies:", error);
  }
}
