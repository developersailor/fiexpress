import { ConnectionManager } from './connection.manager';
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
      throw new Error(`Queue type ${queueType} not available`);
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

export default MessageConsumer;