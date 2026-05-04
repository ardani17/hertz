import axios from 'axios';
import connectDB from './mongodb';

// Interface untuk API health status
export interface ApiHealthStatus {
  service: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime: number;
  lastChecked: Date;
  error?: string;
  uptime: number;
}

// Interface untuk overall API health
export interface ApiHealth {
  overall: 'healthy' | 'unhealthy' | 'degraded';
  services: ApiHealthStatus[];
  totalServices: number;
  healthyServices: number;
  unhealthyServices: number;
  avgResponseTime: number;
}

// Konfigurasi API endpoints untuk health check
const API_ENDPOINTS = [
  {
    name: 'News API',
    url: '/api/news',
    timeout: 5000,
    critical: true
  },
  {
    name: 'Stocks API',
    url: '/api/stocks',
    timeout: 5000,
    critical: true
  },
  {
    name: 'Calendar API',
    url: '/api/economic-calendar',
    timeout: 5000,
    critical: true
  },
  {
    name: 'Database Connection',
    url: '/api/health/database',
    timeout: 3000,
    critical: true
  },
  {
    name: 'Admin Dashboard API',
    url: '/api/admin/dashboard/stats',
    timeout: 5000,
    critical: false
  },
  {
    name: 'Analytics API',
    url: '/api/admin/analytics',
    timeout: 5000,
    critical: false
  }
];

// Storage untuk health check history
class HealthCheckStore {
  private history: Map<string, ApiHealthStatus[]> = new Map();
  private maxHistorySize = 100;

  addHealthCheck(service: string, status: ApiHealthStatus) {
    if (!this.history.has(service)) {
      this.history.set(service, []);
    }
    
    const serviceHistory = this.history.get(service)!;
    serviceHistory.push(status);
    
    // Keep only recent history
    if (serviceHistory.length > this.maxHistorySize) {
      serviceHistory.shift();
    }
  }

  getServiceHistory(service: string): ApiHealthStatus[] {
    return this.history.get(service) || [];
  }

  getServiceUptime(service: string): number {
    const history = this.getServiceHistory(service);
    if (history.length === 0) return 100;
    
    const healthyChecks = history.filter(h => h.status === 'healthy').length;
    return (healthyChecks / history.length) * 100;
  }

  getAllServices(): string[] {
    return Array.from(this.history.keys());
  }
}

const healthStore = new HealthCheckStore();

// Fungsi untuk check single API endpoint
async function checkApiEndpoint(endpoint: typeof API_ENDPOINTS[0], baseUrl: string): Promise<ApiHealthStatus> {
  const startTime = Date.now();
  const fullUrl = `${baseUrl}${endpoint.url}`;
  
  try {
    const response = await axios.get(fullUrl, {
      timeout: endpoint.timeout,
      validateStatus: (status: number) => status < 500 // Accept 4xx as healthy (client errors)
    });
    
    const responseTime = Date.now() - startTime;
    const uptime = healthStore.getServiceUptime(endpoint.name);
    
    const status: ApiHealthStatus = {
      service: endpoint.name,
      status: response.status < 400 ? 'healthy' : 'degraded',
      responseTime,
      lastChecked: new Date(),
      uptime
    };
    
    healthStore.addHealthCheck(endpoint.name, status);
    return status;
    
  } catch (error: unknown) {
    const responseTime = Date.now() - startTime;
    const uptime = healthStore.getServiceUptime(endpoint.name);
    
    const status: ApiHealthStatus = {
      service: endpoint.name,
      status: 'unhealthy',
      responseTime,
      lastChecked: new Date(),
      error: error instanceof Error ? error.message : 'Unknown error',
      uptime
    };
    
    healthStore.addHealthCheck(endpoint.name, status);
    return status;
  }
}

// Fungsi untuk check database health
export async function checkDatabaseHealth(): Promise<ApiHealthStatus> {
  const startTime = Date.now();
  
  try {
    await connectDB();
    const responseTime = Date.now() - startTime;
    const uptime = healthStore.getServiceUptime('Database Connection');
    
    const status: ApiHealthStatus = {
      service: 'Database Connection',
      status: 'healthy',
      responseTime,
      lastChecked: new Date(),
      uptime
    };
    
    healthStore.addHealthCheck('Database Connection', status);
    return status;
    
  } catch (error: unknown) {
    const responseTime = Date.now() - startTime;
    const uptime = healthStore.getServiceUptime('Database Connection');
    
    const status: ApiHealthStatus = {
      service: 'Database Connection',
      status: 'unhealthy',
      responseTime,
      lastChecked: new Date(),
      error: error instanceof Error ? error.message : 'Database connection failed',
      uptime
    };
    
    healthStore.addHealthCheck('Database Connection', status);
    return status;
  }
}

// Fungsi utama untuk check semua API health
export async function checkApiHealth(baseUrl?: string): Promise<ApiHealth> {
  // Default base URL untuk internal checks
  const defaultBaseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const checkBaseUrl = baseUrl || defaultBaseUrl;
  
  try {
    // Check database health first
    const dbHealth = await checkDatabaseHealth();
    
    // Check all API endpoints
    const healthChecks = await Promise.allSettled(
      API_ENDPOINTS.filter(ep => ep.name !== 'Database Connection')
        .map(endpoint => checkApiEndpoint(endpoint, checkBaseUrl))
    );
    
    const services: ApiHealthStatus[] = [dbHealth];
    
    // Process health check results
    healthChecks.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        services.push(result.value);
      } else {
        // Create unhealthy status for failed checks
        const endpoint = API_ENDPOINTS.filter(ep => ep.name !== 'Database Connection')[index];
        const uptime = healthStore.getServiceUptime(endpoint.name);
        
        const failedStatus: ApiHealthStatus = {
          service: endpoint.name,
          status: 'unhealthy',
          responseTime: endpoint.timeout,
          lastChecked: new Date(),
          error: 'Health check failed',
          uptime
        };
        
        services.push(failedStatus);
        healthStore.addHealthCheck(endpoint.name, failedStatus);
      }
    });
    
    // Calculate overall health
    const totalServices = services.length;
    const healthyServices = services.filter(s => s.status === 'healthy').length;
    const unhealthyServices = services.filter(s => s.status === 'unhealthy').length;
    const degradedServices = services.filter(s => s.status === 'degraded').length;
    
    // Determine overall status
    let overall: 'healthy' | 'unhealthy' | 'degraded';
    if (unhealthyServices > 0) {
      // Check if any critical services are down
      const criticalDown = services.some(s => 
        s.status === 'unhealthy' && 
        API_ENDPOINTS.find(ep => ep.name === s.service)?.critical
      );
      overall = criticalDown ? 'unhealthy' : 'degraded';
    } else if (degradedServices > 0) {
      overall = 'degraded';
    } else {
      overall = 'healthy';
    }
    
    // Calculate average response time
    const avgResponseTime = services.reduce((sum, s) => sum + s.responseTime, 0) / services.length;
    
    return {
      overall,
      services,
      totalServices,
      healthyServices,
      unhealthyServices,
      avgResponseTime: Math.round(avgResponseTime)
    };
    
  } catch (error) {
    console.error('Error checking API health:', error);
    
    // Return unhealthy status on error
    return {
      overall: 'unhealthy',
      services: [],
      totalServices: 0,
      healthyServices: 0,
      unhealthyServices: 0,
      avgResponseTime: 0
    };
  }
}

// Fungsi untuk mendapatkan health check history
export function getHealthHistory(service?: string) {
  if (service) {
    return {
      service,
      history: healthStore.getServiceHistory(service),
      uptime: healthStore.getServiceUptime(service)
    };
  }
  
  const allServices = healthStore.getAllServices();
  return allServices.map(serviceName => ({
    service: serviceName,
    history: healthStore.getServiceHistory(serviceName),
    uptime: healthStore.getServiceUptime(serviceName)
  }));
}

// Fungsi untuk reset health history (untuk testing)
export function resetHealthHistory() {
  healthStore['history'].clear();
}

// Fungsi untuk mendapatkan service uptime
export function getServiceUptime(service: string): number {
  return healthStore.getServiceUptime(service);
}

// Fungsi untuk simplified health check (untuk backward compatibility)
export async function getSimplifiedApiHealth(): Promise<{ [key: string]: boolean }> {
  const health = await checkApiHealth();
  
  const simplified: { [key: string]: boolean } = {};
  health.services.forEach(service => {
    const key = service.service.toLowerCase().replace(/\s+/g, '_').replace('_api', '');
    simplified[key] = service.status === 'healthy';
  });
  
  return simplified;
}