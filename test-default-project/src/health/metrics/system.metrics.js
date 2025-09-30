import os from 'os';

export function getSystemMetrics() {
  const memoryUsage = process.memoryUsage();
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  
  return {
    memory: {
      used: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
      total: `${Math.round(totalMemory / 1024 / 1024)} MB`,
      free: `${Math.round(freeMemory / 1024 / 1024)} MB`,
      usage: `${Math.round(((totalMemory - freeMemory) / totalMemory) * 100)}%`
    },
    cpu: {
      loadAverage: os.loadavg(),
      uptime: os.uptime(),
      platform: os.platform(),
      arch: os.arch()
    },
    process: {
      pid: process.pid,
      uptime: process.uptime(),
      version: process.version,
      platform: process.platform
    }
  };
}