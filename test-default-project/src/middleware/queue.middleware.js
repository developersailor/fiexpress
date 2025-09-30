import { Request, Response, NextFunction } from 'express';
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

export default QueueMiddleware;