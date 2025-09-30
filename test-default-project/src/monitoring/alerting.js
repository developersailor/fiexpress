import nodemailer from 'nodemailer';
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
        subject: `[${severity.toUpperCase()}] ${subject}`,
        text: message,
        html: `<h2>${subject}</h2><p>${message}</p><p><strong>Severity:</strong> ${severity}</p>`
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
          text: `[${severity.toUpperCase()}] ${message}`,
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
export default alertingSystem;