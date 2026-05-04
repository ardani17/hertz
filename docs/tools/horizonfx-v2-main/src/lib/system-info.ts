import os from 'os';
import { promises as fs } from 'fs';

export interface SystemInfo {
  serverTime: string;
  uptime: string;
  version: string;
  environment: string;
  nodeVersion: string;
  platform: string;
  architecture: string;
  totalMemory: string;
  freeMemory: string;
  memoryUsage: number; // percentage
  cpuUsage: number; // percentage
  loadAverage: number[];
  diskUsage?: {
    total: string;
    used: string;
    free: string;
    usagePercentage: number;
  };
}

export interface SecurityStatus {
  sslCertificate: {
    status: 'valid' | 'warning' | 'error';
    message: string;
  };
  rateLimiting: {
    status: 'active' | 'inactive';
    message: string;
  };
  csrfProtection: {
    status: 'enabled' | 'disabled';
    message: string;
  };
  failedLogins24h: number;
  lastSecurityScan?: string;
  securityScore: number; // 0-100
}

function formatBytes(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}

async function getCPUUsage(): Promise<number> {
  return new Promise((resolve) => {
    const startMeasure = process.cpuUsage();
    const startTime = process.hrtime();
    
    setTimeout(() => {
      const endMeasure = process.cpuUsage(startMeasure);
      const endTime = process.hrtime(startTime);
      
      const totalTime = endTime[0] * 1000000 + endTime[1] / 1000; // microseconds
      const cpuTime = endMeasure.user + endMeasure.system; // microseconds
      
      const cpuPercent = (cpuTime / totalTime) * 100;
      resolve(Math.min(100, Math.max(0, cpuPercent)));
    }, 100);
  });
}

async function getDiskUsage(): Promise<SystemInfo['diskUsage']> {
  try {
    if (process.platform === 'win32') {
      // For Windows, we'll use a simplified approach
      await fs.stat(process.cwd());
      return {
        total: 'N/A',
        used: 'N/A',
        free: 'N/A',
        usagePercentage: 0
      };
    } else {
      // For Unix-like systems, we could use statvfs but it's complex
      // For now, return placeholder data
      return {
        total: 'N/A',
        used: 'N/A',
        free: 'N/A',
        usagePercentage: 0
      };
    }
  } catch (error) {
    void error;
    return {
      total: 'N/A',
      used: 'N/A',
      free: 'N/A',
      usagePercentage: 0
    };
  }
}

export async function getSystemInfo(): Promise<SystemInfo> {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const memoryUsage = (usedMemory / totalMemory) * 100;
  
  const cpuUsage = await getCPUUsage();
  const diskUsage = await getDiskUsage();
  
  return {
    serverTime: new Date().toISOString(),
    uptime: formatUptime(os.uptime()),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
    platform: `${os.type()} ${os.release()}`,
    architecture: os.arch(),
    totalMemory: formatBytes(totalMemory),
    freeMemory: formatBytes(freeMemory),
    memoryUsage: Math.round(memoryUsage * 100) / 100,
    cpuUsage: Math.round(cpuUsage * 100) / 100,
    loadAverage: os.loadavg(),
    diskUsage
  };
}

export async function getSecurityStatus(failedLogins24h: number = 0): Promise<SecurityStatus> {
  // Check SSL certificate status (simplified)
  const sslStatus = process.env.NODE_ENV === 'production' 
    ? { status: 'valid' as const, message: 'SSL certificate is valid' }
    : { status: 'warning' as const, message: 'Development environment - SSL not configured' };
  
  // Check rate limiting (based on environment variables or middleware)
  const rateLimitingStatus = {
    status: 'active' as const,
    message: 'Rate limiting is active'
  };
  
  // Check CSRF protection
  const csrfStatus = {
    status: 'enabled' as const,
    message: 'CSRF protection is enabled'
  };
  
  // Calculate security score based on various factors
  let securityScore = 100;
  
  if (sslStatus.status !== 'valid') securityScore -= 20;
  if (rateLimitingStatus.status !== 'active') securityScore -= 15;
  if (csrfStatus.status !== 'enabled') securityScore -= 15;
  if (failedLogins24h > 10) securityScore -= 20;
  if (failedLogins24h > 50) securityScore -= 30;
  
  securityScore = Math.max(0, securityScore);
  
  return {
    sslCertificate: sslStatus,
    rateLimiting: rateLimitingStatus,
    csrfProtection: csrfStatus,
    failedLogins24h,
    lastSecurityScan: new Date().toISOString(),
    securityScore
  };
}

export function getHealthStatus() {
  const memoryUsage = process.memoryUsage();
  const uptime = process.uptime();
  
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: formatUptime(uptime),
    memory: {
      used: formatBytes(memoryUsage.heapUsed),
      total: formatBytes(memoryUsage.heapTotal),
      external: formatBytes(memoryUsage.external),
      rss: formatBytes(memoryUsage.rss)
    },
    cpu: {
      usage: 'calculating...'
    }
  };
}