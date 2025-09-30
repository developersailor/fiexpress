import { writeFileSafe } from "../utils.js";
import path from "path";
import fs from "fs";

export function generateMonitoringSupport(targetRoot, options = {}) {
  const { ts = false, tools = ['prometheus', 'grafana'] } = options;
  
  // Monitoring configuration
  const monitoringConfig = generateMonitoringConfig(ts, tools);
  writeFileSafe(path.join(targetRoot, "src", "config", "monitoring.config.js"), monitoringConfig);
  
  // Metrics collection
  const metricsCollector = generateMetricsCollector(ts);
  writeFileSafe(path.join(targetRoot, "src", "monitoring", "metrics.collector.js"), metricsCollector);
  
  // Health monitoring
  const healthMonitor = generateHealthMonitor(ts);
  writeFileSafe(path.join(targetRoot, "src", "monitoring", "health.monitor.js"), healthMonitor);
  
  // Performance monitoring
  const performanceMonitor = generatePerformanceMonitor(ts);
  writeFileSafe(path.join(targetRoot, "src", "monitoring", "performance.monitor.js"), performanceMonitor);
  
  // Alerting system
  const alertingSystem = generateAlertingSystem(ts);
  writeFileSafe(path.join(targetRoot, "src", "monitoring", "alerting.js"), alertingSystem);
  
  // Update package.json with monitoring dependencies
  updatePackageJsonWithMonitoring(targetRoot, tools);
  
  console.log(`📊 Advanced monitoring support added successfully!`);
}

function generateMonitoringConfig(ts, tools) {
  if (ts) {
    return `export const monitoringConfig = {
  tools: ${JSON.stringify(tools)},
  
  // Prometheus configuration
  prometheus: {
    enabled: ${tools.includes('prometheus')},
    port: parseInt(process.env.PROMETHEUS_PORT || '9090'),
    path: process.env.PROMETHEUS_PATH || '/metrics',
    collectDefaultMetrics: true,
    timeout: 5000
  },
  
  // Grafana configuration
  grafana: {
    enabled: ${tools.includes('grafana')},
    url: process.env.GRAFANA_URL || 'http://localhost:3000',
    apiKey: process.env.GRAFANA_API_KEY || '',
    dashboard: {
      title: process.env.APP_NAME || 'Express App',
      refresh: '5s',
      timeRange: '1h'
    }
  },
  
  // Metrics configuration
  metrics: {
    enabled: true,
    interval: parseInt(process.env.METRICS_INTERVAL || '5000'),
    retention: parseInt(process.env.METRICS_RETENTION || '86400'), // 24 hours
    labels: {
      app: process.env.APP_NAME || 'express-app',
      version: process.env.APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    }
  },
  
  // Health checks
  health: {
    enabled: true,
    interval: parseInt(process.env.HEALTH_INTERVAL || '30000'),
    timeout: parseInt(process.env.HEALTH_TIMEOUT || '5000'),
    checks: {
      database: true,
      redis: true,
      external: true
    }
  },
  
  // Performance monitoring
  performance: {
    enabled: true,
    slowQueryThreshold: parseInt(process.env.SLOW_QUERY_THRESHOLD || '1000'),
    memoryThreshold: parseInt(process.env.MEMORY_THRESHOLD || '100000000'), // 100MB
    cpuThreshold: parseInt(process.env.CPU_THRESHOLD || '80')
  },
  
  // Alerting
  alerting: {
    enabled: process.env.ALERTING_ENABLED === 'true',
    channels: {
      email: {
        enabled: process.env.EMAIL_ALERTS === 'true',
        smtp: {
          host: process.env.SMTP_HOST || 'localhost',
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER || '',
            pass: process.env.SMTP_PASS || ''
          }
        },
        from: process.env.ALERT_FROM || 'alerts@example.com',
        to: process.env.ALERT_TO || 'admin@example.com'
      },
      slack: {
        enabled: process.env.SLACK_ALERTS === 'true',
        webhook: process.env.SLACK_WEBHOOK || '',
        channel: process.env.SLACK_CHANNEL || '#alerts'
      },
      webhook: {
        enabled: process.env.WEBHOOK_ALERTS === 'true',
        url: process.env.WEBHOOK_URL || ''
      }
    }
  }
};

export default monitoringConfig;`;
  } else {
    return `const monitoringConfig = {
  tools: ${JSON.stringify(tools)},
  
  // Prometheus configuration
  prometheus: {
    enabled: ${tools.includes('prometheus')},
    port: parseInt(process.env.PROMETHEUS_PORT || '9090'),
    path: process.env.PROMETHEUS_PATH || '/metrics',
    collectDefaultMetrics: true,
    timeout: 5000
  },
  
  // Grafana configuration
  grafana: {
    enabled: ${tools.includes('grafana')},
    url: process.env.GRAFANA_URL || 'http://localhost:3000',
    apiKey: process.env.GRAFANA_API_KEY || '',
    dashboard: {
      title: process.env.APP_NAME || 'Express App',
      refresh: '5s',
      timeRange: '1h'
    }
  },
  
  // Metrics configuration
  metrics: {
    enabled: true,
    interval: parseInt(process.env.METRICS_INTERVAL || '5000'),
    retention: parseInt(process.env.METRICS_RETENTION || '86400'), // 24 hours
    labels: {
      app: process.env.APP_NAME || 'express-app',
      version: process.env.APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    }
  },
  
  // Health checks
  health: {
    enabled: true,
    interval: parseInt(process.env.HEALTH_INTERVAL || '30000'),
    timeout: parseInt(process.env.HEALTH_TIMEOUT || '5000'),
    checks: {
      database: true,
      redis: true,
      external: true
    }
  },
  
  // Performance monitoring
  performance: {
    enabled: true,
    slowQueryThreshold: parseInt(process.env.SLOW_QUERY_THRESHOLD || '1000'),
    memoryThreshold: parseInt(process.env.MEMORY_THRESHOLD || '100000000'), // 100MB
    cpuThreshold: parseInt(process.env.CPU_THRESHOLD || '80')
  },
  
  // Alerting
  alerting: {
    enabled: process.env.ALERTING_ENABLED === 'true',
    channels: {
      email: {
        enabled: process.env.EMAIL_ALERTS === 'true',
        smtp: {
          host: process.env.SMTP_HOST || 'localhost',
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER || '',
            pass: process.env.SMTP_PASS || ''
          }
        },
        from: process.env.ALERT_FROM || 'alerts@example.com',
        to: process.env.ALERT_TO || 'admin@example.com'
      },
      slack: {
        enabled: process.env.SLACK_ALERTS === 'true',
        webhook: process.env.SLACK_WEBHOOK || '',
        channel: process.env.SLACK_CHANNEL || '#alerts'
      },
      webhook: {
        enabled: process.env.WEBHOOK_ALERTS === 'true',
        url: process.env.WEBHOOK_URL || ''
      }
    }
  }
};

module.exports = { monitoringConfig };
module.exports.default = monitoringConfig;
`;
  }
}

function generateMetricsCollector(ts) {
  if (ts) {
    return `import { register, collectDefaultMetrics, Counter, Histogram, Gauge } from 'prom-client';
import { monitoringConfig } from '../config/monitoring.config';

export class MetricsCollector {
  private counters: Map<string, Counter> = new Map();
  private histograms: Map<string, Histogram> = new Map();
  private gauges: Map<string, Gauge> = new Map();

  constructor() {
    if (monitoringConfig.prometheus.enabled) {
      // Collect default metrics
      collectDefaultMetrics({
        timeout: monitoringConfig.prometheus.timeout,
        prefix: 'express_'
      });
    }
  }

  // HTTP metrics
  createHttpCounter(name: string, help: string, labelNames: string[] = []) {
    const counter = new Counter({
      name: \`http_\${name}\`,
      help,
      labelNames: ['method', 'route', 'status', ...labelNames]
    });
    this.counters.set(name, counter);
    return counter;
  }

  createHttpHistogram(name: string, help: string, buckets: number[] = [0.1, 0.5, 1, 2, 5]) {
    const histogram = new Histogram({
      name: \`http_\${name}\`,
      help,
      buckets,
      labelNames: ['method', 'route', 'status']
    });
    this.histograms.set(name, histogram);
    return histogram;
  }

  // Business metrics
  createBusinessCounter(name: string, help: string, labelNames: string[] = []) {
    const counter = new Counter({
      name: \`business_\${name}\`,
      help,
      labelNames
    });
    this.counters.set(name, counter);
    return counter;
  }

  createBusinessGauge(name: string, help: string, labelNames: string[] = []) {
    const gauge = new Gauge({
      name: \`business_\${name}\`,
      help,
      labelNames
    });
    this.gauges.set(name, gauge);
    return gauge;
  }

  // System metrics
  createSystemGauge(name: string, help: string) {
    const gauge = new Gauge({
      name: \`system_\${name}\`,
      help
    });
    this.gauges.set(name, gauge);
    return gauge;
  }

  // Record HTTP request
  recordHttpRequest(method: string, route: string, statusCode: number, duration: number) {
    const requestCounter = this.counters.get('requests');
    const requestHistogram = this.histograms.get('request_duration');
    
    if (requestCounter) {
      requestCounter.inc({ method, route, status: statusCode.toString() });
    }
    
    if (requestHistogram) {
      requestHistogram.observe({ method, route, status: statusCode.toString() }, duration);
    }
  }

  // Record business metric
  recordBusinessMetric(name: string, value: number = 1, labels: Record<string, string> = {}) {
    const metric = this.counters.get(name);
    if (metric) {
      metric.inc(labels, value);
    }
  }

  // Set gauge value
  setGaugeValue(name: string, value: number, labels: Record<string, string> = {}) {
    const gauge = this.gauges.get(name);
    if (gauge) {
      gauge.set(labels, value);
    }
  }

  // Get metrics
  async getMetrics(): Promise<string> {
    return register.metrics();
  }

  // Clear metrics
  clearMetrics(): void {
    register.clear();
  }
}

export const metricsCollector = new MetricsCollector();
export default metricsCollector;`;
  } else {
    return `const { register, collectDefaultMetrics, Counter, Histogram, Gauge } = require('prom-client');
const { monitoringConfig } = require('../config/monitoring.config');

class MetricsCollector {
  constructor() {
    this.counters = new Map();
    this.histograms = new Map();
    this.gauges = new Map();

    if (monitoringConfig.prometheus.enabled) {
      // Collect default metrics
      collectDefaultMetrics({
        timeout: monitoringConfig.prometheus.timeout,
        prefix: 'express_'
      });
    }
  }

  // HTTP metrics
  createHttpCounter(name, help, labelNames = []) {
    const counter = new Counter({
      name: \`http_\${name}\`,
      help,
      labelNames: ['method', 'route', 'status', ...labelNames]
    });
    this.counters.set(name, counter);
    return counter;
  }

  createHttpHistogram(name, help, buckets = [0.1, 0.5, 1, 2, 5]) {
    const histogram = new Histogram({
      name: \`http_\${name}\`,
      help,
      buckets,
      labelNames: ['method', 'route', 'status']
    });
    this.histograms.set(name, histogram);
    return histogram;
  }

  // Business metrics
  createBusinessCounter(name, help, labelNames = []) {
    const counter = new Counter({
      name: \`business_\${name}\`,
      help,
      labelNames
    });
    this.counters.set(name, counter);
    return counter;
  }

  createBusinessGauge(name, help, labelNames = []) {
    const gauge = new Gauge({
      name: \`business_\${name}\`,
      help,
      labelNames
    });
    this.gauges.set(name, gauge);
    return gauge;
  }

  // System metrics
  createSystemGauge(name, help) {
    const gauge = new Gauge({
      name: \`system_\${name}\`,
      help
    });
    this.gauges.set(name, gauge);
    return gauge;
  }

  // Record HTTP request
  recordHttpRequest(method, route, statusCode, duration) {
    const requestCounter = this.counters.get('requests');
    const requestHistogram = this.histograms.get('request_duration');
    
    if (requestCounter) {
      requestCounter.inc({ method, route, status: statusCode.toString() });
    }
    
    if (requestHistogram) {
      requestHistogram.observe({ method, route, status: statusCode.toString() }, duration);
    }
  }

  // Record business metric
  recordBusinessMetric(name, value = 1, labels = {}) {
    const metric = this.counters.get(name);
    if (metric) {
      metric.inc(labels, value);
    }
  }

  // Set gauge value
  setGaugeValue(name, value, labels = {}) {
    const gauge = this.gauges.get(name);
    if (gauge) {
      gauge.set(labels, value);
    }
  }

  // Get metrics
  async getMetrics() {
    return register.metrics();
  }

  // Clear metrics
  clearMetrics() {
    register.clear();
  }
}

const metricsCollector = new MetricsCollector();
module.exports = { MetricsCollector, metricsCollector };
module.exports.default = metricsCollector;
`;
  }
}

function generateHealthMonitor(ts) {
  if (ts) {
    return `import { monitoringConfig } from '../config/monitoring.config';

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
      console.error(\`Health check \${name} failed:\`, error);
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
export default healthMonitor;`;
  } else {
    return `const { monitoringConfig } = require('../config/monitoring.config');

class HealthMonitor {
  constructor() {
    this.checks = new Map();
    this.status = new Map();
    this.lastCheck = new Map();
    this.setupDefaultChecks();
    this.startMonitoring();
  }

  setupDefaultChecks() {
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

  startMonitoring() {
    if (monitoringConfig.health.enabled) {
      setInterval(() => {
        this.runAllChecks();
      }, monitoringConfig.health.interval);
    }
  }

  addCheck(name, checkFunction) {
    this.checks.set(name, checkFunction);
  }

  async runCheck(name) {
    const check = this.checks.get(name);
    if (!check) {
      return false;
    }

    try {
      const result = await Promise.race([
        check(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Health check timeout')), monitoringConfig.health.timeout)
        )
      ]);
      
      this.status.set(name, result);
      this.lastCheck.set(name, Date.now());
      return result;
    } catch (error) {
      console.error(\`Health check \${name} failed:\`, error);
      this.status.set(name, false);
      this.lastCheck.set(name, Date.now());
      return false;
    }
  }

  async runAllChecks() {
    const results = {};
    
    for (const [name, check] of this.checks.entries()) {
      results[name] = await this.runCheck(name);
    }
    
    return results;
  }

  getStatus(name) {
    if (name) {
      return this.status.get(name) || false;
    }
    
    const status = {};
    for (const [name, isHealthy] of this.status.entries()) {
      status[name] = isHealthy;
    }
    return status;
  }

  getLastCheck(name) {
    return this.lastCheck.get(name) || null;
  }

  isHealthy() {
    for (const isHealthy of this.status.values()) {
      if (!isHealthy) {
        return false;
      }
    }
    return true;
  }
}

const healthMonitor = new HealthMonitor();
module.exports = { HealthMonitor, healthMonitor };
module.exports.default = healthMonitor;
`;
  }
}

function generatePerformanceMonitor(ts) {
  if (ts) {
    return `import { performance } from 'perf_hooks';
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
        console.warn(\`Slow function \${name}: \${duration.toFixed(2)}ms\`);
      }
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      console.error(\`Function \${name} failed after \${duration.toFixed(2)}ms:\`, error);
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
export default performanceMonitor;`;
  } else {
    return `const { performance } = require('perf_hooks');
const { monitoringConfig } = require('../config/monitoring.config');

class PerformanceMonitor {
  constructor() {
    this.slowQueries = [];
    this.memoryUsage = [];
    this.cpuUsage = [];
    this.startMonitoring();
  }

  startMonitoring() {
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
  trackSlowQuery(query, duration) {
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
  async trackFunction(name, fn) {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      
      if (duration > monitoringConfig.performance.slowQueryThreshold) {
        console.warn(\`Slow function \${name}: \${duration.toFixed(2)}ms\`);
      }
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      console.error(\`Function \${name} failed after \${duration.toFixed(2)}ms:\`, error);
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
  getAverageMemoryUsage() {
    if (this.memoryUsage.length === 0) return 0;
    
    const total = this.memoryUsage.reduce((sum, entry) => sum + entry.usage, 0);
    return total / this.memoryUsage.length;
  }

  // Get average CPU usage
  getAverageCpuUsage() {
    if (this.cpuUsage.length === 0) return 0;
    
    const total = this.cpuUsage.reduce((sum, entry) => sum + entry.usage, 0);
    return total / this.cpuUsage.length;
  }

  // Check if performance is degraded
  isPerformanceDegraded() {
    const avgMemory = this.getAverageMemoryUsage();
    const avgCpu = this.getAverageCpuUsage();
    
    return avgMemory > monitoringConfig.performance.memoryThreshold || 
           avgCpu > monitoringConfig.performance.cpuThreshold;
  }
}

const performanceMonitor = new PerformanceMonitor();
module.exports = { PerformanceMonitor, performanceMonitor };
module.exports.default = performanceMonitor;
`;
  }
}

function generateAlertingSystem(ts) {
  if (ts) {
    return `import nodemailer from 'nodemailer';
import { monitoringConfig } from '../config/monitoring.config';

export class AlertingSystem {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.setupEmailTransporter();
  }

  private setupEmailTransporter() {
    if (monitoringConfig.alerting.channels.email.enabled) {
      this.transporter = nodemailer.createTransporter(monitoringConfig.alerting.channels.email.smtp);
    }
  }

  // Send email alert
  async sendEmailAlert(subject: string, message: string, severity: 'low' | 'medium' | 'high' | 'critical' = 'medium') {
    if (!this.transporter) {
      console.warn('Email transporter not configured');
      return false;
    }

    try {
      await this.transporter.sendMail({
        from: monitoringConfig.alerting.channels.email.from,
        to: monitoringConfig.alerting.channels.email.to,
        subject: \`[\${severity.toUpperCase()}] \${subject}\`,
        text: message,
        html: \`<h2>\${subject}</h2><p>\${message}</p><p><strong>Severity:</strong> \${severity}</p>\`
      });
      
      console.log('Email alert sent successfully');
      return true;
    } catch (error) {
      console.error('Failed to send email alert:', error);
      return false;
    }
  }

  // Send Slack alert
  async sendSlackAlert(message: string, severity: 'low' | 'medium' | 'high' | 'critical' = 'medium') {
    if (!monitoringConfig.alerting.channels.slack.enabled) {
      console.warn('Slack alerts not enabled');
      return false;
    }

    try {
      const response = await fetch(monitoringConfig.alerting.channels.slack.webhook, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: \`[\${severity.toUpperCase()}] \${message}\`,
          channel: monitoringConfig.alerting.channels.slack.channel
        })
      });

      if (response.ok) {
        console.log('Slack alert sent successfully');
        return true;
      } else {
        console.error('Failed to send Slack alert:', response.statusText);
        return false;
      }
    } catch (error) {
      console.error('Failed to send Slack alert:', error);
      return false;
    }
  }

  // Send webhook alert
  async sendWebhookAlert(data: any) {
    if (!monitoringConfig.alerting.channels.webhook.enabled) {
      console.warn('Webhook alerts not enabled');
      return false;
    }

    try {
      const response = await fetch(monitoringConfig.alerting.channels.webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        console.log('Webhook alert sent successfully');
        return true;
      } else {
        console.error('Failed to send webhook alert:', response.statusText);
        return false;
      }
    } catch (error) {
      console.error('Failed to send webhook alert:', error);
      return false;
    }
  }

  // Send alert to all configured channels
  async sendAlert(subject: string, message: string, severity: 'low' | 'medium' | 'high' | 'critical' = 'medium') {
    const results = [];

    // Send email alert
    if (monitoringConfig.alerting.channels.email.enabled) {
      results.push(await this.sendEmailAlert(subject, message, severity));
    }

    // Send Slack alert
    if (monitoringConfig.alerting.channels.slack.enabled) {
      results.push(await this.sendSlackAlert(message, severity));
    }

    // Send webhook alert
    if (monitoringConfig.alerting.channels.webhook.enabled) {
      results.push(await this.sendWebhookAlert({
        subject,
        message,
        severity,
        timestamp: new Date().toISOString()
      }));
    }

    return results.some(result => result);
  }
}

export const alertingSystem = new AlertingSystem();
export default alertingSystem;`;
  } else {
    return `const nodemailer = require('nodemailer');
const { monitoringConfig } = require('../config/monitoring.config');

class AlertingSystem {
  constructor() {
    this.transporter = null;
    this.setupEmailTransporter();
  }

  setupEmailTransporter() {
    if (monitoringConfig.alerting.channels.email.enabled) {
      this.transporter = nodemailer.createTransporter(monitoringConfig.alerting.channels.email.smtp);
    }
  }

  // Send email alert
  async sendEmailAlert(subject, message, severity = 'medium') {
    if (!this.transporter) {
      console.warn('Email transporter not configured');
      return false;
    }

    try {
      await this.transporter.sendMail({
        from: monitoringConfig.alerting.channels.email.from,
        to: monitoringConfig.alerting.channels.email.to,
        subject: \`[\${severity.toUpperCase()}] \${subject}\`,
        text: message,
        html: \`<h2>\${subject}</h2><p>\${message}</p><p><strong>Severity:</strong> \${severity}</p>\`
      });
      
      console.log('Email alert sent successfully');
      return true;
    } catch (error) {
      console.error('Failed to send email alert:', error);
      return false;
    }
  }

  // Send Slack alert
  async sendSlackAlert(message, severity = 'medium') {
    if (!monitoringConfig.alerting.channels.slack.enabled) {
      console.warn('Slack alerts not enabled');
      return false;
    }

    try {
      const response = await fetch(monitoringConfig.alerting.channels.slack.webhook, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: \`[\${severity.toUpperCase()}] \${message}\`,
          channel: monitoringConfig.alerting.channels.slack.channel
        })
      });

      if (response.ok) {
        console.log('Slack alert sent successfully');
        return true;
      } else {
        console.error('Failed to send Slack alert:', response.statusText);
        return false;
      }
    } catch (error) {
      console.error('Failed to send Slack alert:', error);
      return false;
    }
  }

  // Send webhook alert
  async sendWebhookAlert(data) {
    if (!monitoringConfig.alerting.channels.webhook.enabled) {
      console.warn('Webhook alerts not enabled');
      return false;
    }

    try {
      const response = await fetch(monitoringConfig.alerting.channels.webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        console.log('Webhook alert sent successfully');
        return true;
      } else {
        console.error('Failed to send webhook alert:', response.statusText);
        return false;
      }
    } catch (error) {
      console.error('Failed to send webhook alert:', error);
      return false;
    }
  }

  // Send alert to all configured channels
  async sendAlert(subject, message, severity = 'medium') {
    const results = [];

    // Send email alert
    if (monitoringConfig.alerting.channels.email.enabled) {
      results.push(await this.sendEmailAlert(subject, message, severity));
    }

    // Send Slack alert
    if (monitoringConfig.alerting.channels.slack.enabled) {
      results.push(await this.sendSlackAlert(message, severity));
    }

    // Send webhook alert
    if (monitoringConfig.alerting.channels.webhook.enabled) {
      results.push(await this.sendWebhookAlert({
        subject,
        message,
        severity,
        timestamp: new Date().toISOString()
      }));
    }

    return results.some(result => result);
  }
}

const alertingSystem = new AlertingSystem();
module.exports = { AlertingSystem, alertingSystem };
module.exports.default = alertingSystem;
`;
  }
}

function updatePackageJsonWithMonitoring(targetRoot, tools) {
  const pkgPath = path.join(targetRoot, "package.json");
  
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    
    pkg.dependencies = pkg.dependencies || {};
    pkg.dependencies["prom-client"] = "^15.0.0";
    pkg.dependencies["nodemailer"] = "^6.9.0";
    
    if (tools.includes('prometheus')) {
      pkg.dependencies["prometheus-api-metrics"] = "^3.0.0";
    }
    
    if (tools.includes('grafana')) {
      pkg.dependencies["grafana-dashboard"] = "^1.0.0";
    }
    
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
  } catch (error) {
    console.error("Failed to update package.json with monitoring dependencies:", error);
  }
}
