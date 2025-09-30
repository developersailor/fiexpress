import { ConnectionManager } from './connection.manager';
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
      throw new Error(`Queue type ${queueType} not available`);
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

export default MessageProducer;