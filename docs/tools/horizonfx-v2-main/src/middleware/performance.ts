import { NextRequest, NextResponse } from 'next/server';
import { logRequest } from '@/lib/performance-metrics';

// Performance tracking middleware untuk Next.js
export function performanceMiddleware(request: NextRequest) {
  const startTime = Date.now();
  
  // Clone the request untuk tracking
  const url = request.url;
  const method = request.method;
  const userAgent = request.headers.get('user-agent') || '';
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown';
  
  // Create response dengan tracking
  const response = NextResponse.next();
  
  // Add performance tracking headers
  response.headers.set('X-Request-Start', startTime.toString());
  
  // Log request setelah response selesai
  // Note: Dalam Next.js middleware, kita tidak bisa menunggu response selesai
  // Jadi kita akan log request dengan estimasi response time
  const estimatedResponseTime = Date.now() - startTime;
  
  // Log request (akan di-update ketika response selesai)
  logRequest({
    timestamp: new Date(),
    method,
    url,
    responseTime: estimatedResponseTime,
    statusCode: 200, // Default, akan di-update di API routes
    userAgent,
    ip
  });
  
  return response;
}

// Helper function untuk API routes
export function withPerformanceTracking(handler: (req: NextRequest, ...args: unknown[]) => Promise<NextResponse>) {
  return async (req: NextRequest, ...args: unknown[]) => {
    const startTime = Date.now();
    
    try {
      const response = await handler(req, ...args);
      const responseTime = Date.now() - startTime;
      
      // Log successful request
      logRequest({
        timestamp: new Date(),
        method: req.method,
        url: req.url,
        responseTime,
        statusCode: response.status || 200,
        userAgent: req.headers.get('user-agent') || '',
        ip: req.headers.get('x-forwarded-for') || 
             req.headers.get('x-real-ip') || 
             'unknown'
      });
      
      return response;
    } catch (error: unknown) {
      const responseTime = Date.now() - startTime;
      
      // Log failed request
      logRequest({
        timestamp: new Date(),
        method: req.method,
        url: req.url,
        responseTime,
        statusCode: 500,
        userAgent: req.headers.get('user-agent') || '',
        ip: req.headers.get('x-forwarded-for') || 
             req.headers.get('x-real-ip') || 
             'unknown'
      });
      
      throw error;
    }
  };
}