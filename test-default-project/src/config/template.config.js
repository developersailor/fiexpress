import express from 'express';
import path from 'path';

export const templateConfig = {
  engine: 'ejs',
  extension: 'ejs',
  viewsPath: path.join(process.cwd(), 'views'),
  partialsPath: path.join(process.cwd(), 'views', 'partials'),
  layoutsPath: path.join(process.cwd(), 'views', 'layouts'),
  staticPath: path.join(process.cwd(), 'public'),
  
  // Engine-specific configuration
  engineConfig: {
  "cache": false,
  "debug": true
},
  
  // Global template variables
  globals: {
    appName: process.env.APP_NAME || 'Express App',
    version: process.env.APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    currentYear: new Date().getFullYear()
  },
  
  // Helper functions
  helpers: {
    formatDate: (date: Date, format: string = 'YYYY-MM-DD') => {
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(date);
    },
    
    formatCurrency: (amount: number, currency: string = 'USD') => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
      }).format(amount);
    },
    
    truncate: (text: string, length: number = 100) => {
      return text.length > length ? text.substring(0, length) + '...' : text;
    },
    
    capitalize: (text: string) => {
      return text.charAt(0).toUpperCase() + text.slice(1);
    },
    
    eq: (a: any, b: any) => a === b,
    ne: (a: any, b: any) => a !== b,
    lt: (a: number, b: number) => a < b,
    gt: (a: number, b: number) => a > b,
    lte: (a: number, b: number) => a <= b,
    gte: (a: number, b: number) => a >= b
  }
};

export default templateConfig;