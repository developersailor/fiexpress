import amqp from 'amqplib';
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
    const connectionString = `amqp://${username}:${password}@${host}:${port}${vhost}`;
    
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

export default ConnectionManager;