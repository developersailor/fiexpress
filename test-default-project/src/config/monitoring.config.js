export const monitoringConfig = {
  tools: ["prometheus","grafana"],
  
  // Prometheus configuration
  prometheus: {
    enabled: true,
    port: parseInt(process.env.PROMETHEUS_PORT || '9090'),
    path: process.env.PROMETHEUS_PATH || '/metrics',
    collectDefaultMetrics: true,
    timeout: 5000
  },
  
  // Grafana configuration
  grafana: {
    enabled: true,
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

export default monitoringConfig;