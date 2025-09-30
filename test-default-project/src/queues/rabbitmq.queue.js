import amqp from 'amqplib';
import { queueConfig } from '../config/queue.config';

export class RabbitMQQueue {
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;
  
  async connect(): Promise<void> {
    const { host, port, username, password, vhost } = queueConfig.rabbitmq;
    const connectionString = `amqp://${username}:${password}@${host}:${port}${vhost}`;
    
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
    console.log(`📤 Message sent to queue ${queueName}`);
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
    
    console.log(`📥 Consuming messages from queue ${queueName}`);
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

export default RabbitMQQueue;