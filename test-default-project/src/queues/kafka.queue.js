import { Kafka, Producer, Consumer } from 'kafkajs';
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
    console.log(`📤 Message sent to topic ${topic}`);
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
    
    console.log(`📥 Consuming messages from topic ${topic}`);
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

export default KafkaQueue;