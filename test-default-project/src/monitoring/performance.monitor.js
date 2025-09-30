import { performance } from 'perf_hooks';
import { monitoringConfig } from '../config/monitoring.config';

export class PerformanceMonitor {
  private slowQueries: Array<{ query: string; duration: number; timestamp: number }> = [];
  private memoryUsage: Array<{ timestamp: number; usage: number }> = [];
  private cpuUsage: Array<{ timestamp: number; usage: number }> = [];

  constructor() {
    this.startMonitoring();
  }

  private startMonitoring() {
    if (monitoringConfig.performance.enabled) {
      // Monitor memory usage
      setInterval(() => {
        const usage = process.memoryUsage();
        this.memoryUsage.push({
          timestamp: Date.now(),
          usage: usage.heapUsed
        });
        
        // Keep only last 1000 entries
        if (this.memoryUsage.length > 1000) {
          this.memoryUsage.shift();
        }
      }, 5000);

      // Monitor CPU usage
      setInterval(() => {
        const usage = process.cpuUsage();
        this.cpuUsage.push({
          timestamp: Date.now(),
          usage: usage.user + usage.system
        });
        
        // Keep only last 1000 entries
        if (this.cpuUsage.length > 1000) {
          this.cpuUsage.shift();
        }
      }, 5000);
    }
  }

  // Track slow queries
  trackSlowQuery(query: string, duration: number) {
    if (duration > monitoringConfig.performance.slowQueryThreshold) {
      this.slowQueries.push({
        query,
        duration,
        timestamp: Date.now()
      });
      
      // Keep only last 100 entries
      if (this.slowQueries.length > 100) {
        this.slowQueries.shift();
      }
    }
  }

  // Track function execution time
  async trackFunction<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      
      if (duration > monitoringConfig.performance.slowQueryThreshold) {
        console.warn(`Slow function ${name}: ${duration.toFixed(2)}ms`);
      }
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      console.error(`Function ${name} failed after ${duration.toFixed(2)}ms:`, error);
      throw error;
    }
  }

  // Get performance metrics
  getMetrics() {
    return {
      slowQueries: this.slowQueries,
      memoryUsage: this.memoryUsage,
      cpuUsage: this.cpuUsage,
      currentMemory: process.memoryUsage(),
      currentCpu: process.cpuUsage(),
      uptime: process.uptime()
    };
  }

  // Get average memory usage
  getAverageMemoryUsage(): number {
    if (this.memoryUsage.length === 0) return 0;
    
    const total = this.memoryUsage.reduce((sum, entry) => sum + entry.usage, 0);
    return total / this.memoryUsage.length;
  }

  // Get average CPU usage
  getAverageCpuUsage(): number {
    if (this.cpuUsage.length === 0) return 0;
    
    const total = this.cpuUsage.reduce((sum, entry) => sum + entry.usage, 0);
    return total / this.cpuUsage.length;
  }

  // Check if performance is degraded
  isPerformanceDegraded(): boolean {
    const avgMemory = this.getAverageMemoryUsage();
    const avgCpu = this.getAverageCpuUsage();
    
    return avgMemory > monitoringConfig.performance.memoryThreshold || 
           avgCpu > monitoringConfig.performance.cpuThreshold;
  }
}

export const performanceMonitor = new PerformanceMonitor();
export default performanceMonitor;