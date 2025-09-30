import { register, collectDefaultMetrics, Counter, Histogram, Gauge } from 'prom-client';
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
      name: `http_${name}`,
      help,
      labelNames: ['method', 'route', 'status', ...labelNames]
    });
    this.counters.set(name, counter);
    return counter;
  }

  createHttpHistogram(name: string, help: string, buckets: number[] = [0.1, 0.5, 1, 2, 5]) {
    const histogram = new Histogram({
      name: `http_${name}`,
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
      name: `business_${name}`,
      help,
      labelNames
    });
    this.counters.set(name, counter);
    return counter;
  }

  createBusinessGauge(name: string, help: string, labelNames: string[] = []) {
    const gauge = new Gauge({
      name: `business_${name}`,
      help,
      labelNames
    });
    this.gauges.set(name, gauge);
    return gauge;
  }

  // System metrics
  createSystemGauge(name: string, help: string) {
    const gauge = new Gauge({
      name: `system_${name}`,
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
export default metricsCollector;