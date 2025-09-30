import { monitoringConfig } from '../config/monitoring.config';

export class HealthMonitor {
  private checks: Map<string, () => Promise<boolean>> = new Map();
  private status: Map<string, boolean> = new Map();
  private lastCheck: Map<string, number> = new Map();

  constructor() {
    this.setupDefaultChecks();
    this.startMonitoring();
  }

  private setupDefaultChecks() {
    // Database health check
    this.addCheck('database', async () => {
      try {
        // Add your database health check logic here
        return true;
      } catch (error) {
        console.error('Database health check failed:', error);
        return false;
      }
    });

    // Redis health check
    this.addCheck('redis', async () => {
      try {
        // Add your Redis health check logic here
        return true;
      } catch (error) {
        console.error('Redis health check failed:', error);
        return false;
      }
    });

    // External service health check
    this.addCheck('external', async () => {
      try {
        // Add your external service health check logic here
        return true;
      } catch (error) {
        console.error('External service health check failed:', error);
        return false;
      }
    });
  }

  private startMonitoring() {
    if (monitoringConfig.health.enabled) {
      setInterval(() => {
        this.runAllChecks();
      }, monitoringConfig.health.interval);
    }
  }

  addCheck(name: string, checkFunction: () => Promise<boolean>) {
    this.checks.set(name, checkFunction);
  }

  async runCheck(name: string): Promise<boolean> {
    const check = this.checks.get(name);
    if (!check) {
      return false;
    }

    try {
      const result = await Promise.race([
        check(),
        new Promise<boolean>((_, reject) => 
          setTimeout(() => reject(new Error('Health check timeout')), monitoringConfig.health.timeout)
        )
      ]);
      
      this.status.set(name, result);
      this.lastCheck.set(name, Date.now());
      return result;
    } catch (error) {
      console.error(`Health check ${name} failed:`, error);
      this.status.set(name, false);
      this.lastCheck.set(name, Date.now());
      return false;
    }
  }

  async runAllChecks(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    
    for (const [name, check] of this.checks.entries()) {
      results[name] = await this.runCheck(name);
    }
    
    return results;
  }

  getStatus(name?: string): boolean | Record<string, boolean> {
    if (name) {
      return this.status.get(name) || false;
    }
    
    const status: Record<string, boolean> = {};
    for (const [name, isHealthy] of this.status.entries()) {
      status[name] = isHealthy;
    }
    return status;
  }

  getLastCheck(name: string): number | null {
    return this.lastCheck.get(name) || null;
  }

  isHealthy(): boolean {
    for (const isHealthy of this.status.values()) {
      if (!isHealthy) {
        return false;
      }
    }
    return true;
  }
}

export const healthMonitor = new HealthMonitor();
export default healthMonitor;