import { Sequelize } from 'sequelize';
import { PrismaClient } from '@prisma/client';
import mongoose from 'mongoose';

export async function checkDatabaseHealth(): Promise<{ status: string; message?: string; responseTime?: number }> {
  const startTime = Date.now();
  
  try {
    switch ('postgres') {
      case 'postgres':
      case 'mysql':
        // Sequelize check
        const sequelize = new Sequelize(process.env.DB_URL || 'postgres://localhost/test');
        await sequelize.authenticate();
        await sequelize.close();
        break;
        
      case 'mongo':
        // Mongoose check
        if (mongoose.connection.readyState !== 1) {
          await mongoose.connect(process.env.DB_URL || 'mongodb://localhost/test');
        }
        break;
        
      default:
        // Prisma check
        const prisma = new PrismaClient();
        await prisma.$queryRaw`SELECT 1`;
        await prisma.$disconnect();
        break;
    }
    
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'healthy',
      message: 'Database connection successful',
      responseTime: `${responseTime}ms`
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: `Database connection failed: ${error.message}`
    };
  }
}