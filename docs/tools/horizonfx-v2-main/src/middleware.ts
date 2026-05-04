import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { logRequest } from '@/lib/performance-metrics';

// Simple in-memory rate limiting (for production, use Redis or database)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Cleanup old entries every 30 minutes to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 30 * 60 * 1000);

// Bot detection patterns
const BOT_PATTERNS = [
  /bot/i,
  /crawler/i,
  /spider/i,
  /scraper/i,
  /curl/i,
  /wget/i,
  /python-requests/i,
  /axios/i,
  /postman/i,
];

function isSuspiciousBot(userAgent: string): boolean {
  return BOT_PATTERNS.some(pattern => pattern.test(userAgent));
}

// Rate limiting configuration
const RATE_LIMIT = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 200, // limit each IP to 200 requests per windowMs
  apiMaxRequests: 500, // limit for API routes (increased for development)
  adminMaxRequests: 500, // stricter limit for admin routes
  orderBookMaxRequests: 30, // strict limit for order-book endpoint (2 per minute)
  orderBookWindowMs: 1 * 60 * 1000, // 1 minute window for order-book
};

function getRateLimitKey(request: NextRequest): string {
  // In production, you might want to use a more sophisticated approach
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded ? forwarded.split(',')[0] : realIp || 'unknown';
  return ip;
}

function isRateLimited(request: NextRequest): boolean {
  const key = getRateLimitKey(request);
  const now = Date.now();
  const pathname = request.nextUrl.pathname;
  
  // Special handling for order-book endpoint
  if (pathname === '/api/order-book') {
    const orderBookKey = `orderbook:${key}`;
    const record = rateLimitMap.get(orderBookKey);
    
    if (!record || now > record.resetTime) {
      rateLimitMap.set(orderBookKey, {
        count: 1,
        resetTime: now + RATE_LIMIT.orderBookWindowMs
      });
      return false;
    }
    
    if (record.count >= RATE_LIMIT.orderBookMaxRequests) {
      console.warn(`Order-book rate limit exceeded for IP: ${key}`);
      return true;
    }
    
    record.count++;
    return false;
  }
  
  // General rate limiting for other routes
  let maxRequests = RATE_LIMIT.maxRequests;
  const windowMs = RATE_LIMIT.windowMs;
  
  if (pathname.startsWith('/api/admin') || pathname.startsWith('/ghost-admin')) {
    maxRequests = RATE_LIMIT.adminMaxRequests;
  } else if (pathname.startsWith('/api/')) {
    maxRequests = RATE_LIMIT.apiMaxRequests;
  }
  
  const record = rateLimitMap.get(key);
  
  if (!record || now > record.resetTime) {
    // Reset or create new record
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + windowMs
    });
    return false;
  }
  
  if (record.count >= maxRequests) {
    return true;
  }
  
  record.count++;
  return false;
}

export async function middleware(request: NextRequest) {
  const startTime = Date.now();
  const { pathname } = request.nextUrl;
  
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /\.\.\//,  // Path traversal
    /<script/i, // XSS attempts
    /union.*select/i, // SQL injection
    /javascript:/i, // JavaScript protocol
  ];
  
  const url = request.url;
  const userAgent = request.headers.get('user-agent') || '';
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(url) || pattern.test(userAgent)) {
      console.warn(`Blocked suspicious request from ${getRateLimitKey(request)}: ${url}`);
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
  }
  
  // Bot detection for order-book endpoint
  if (pathname === '/api/order-book') {
    if (!userAgent || userAgent.length < 10) {
      console.warn(`Blocked request with suspicious user-agent from ${getRateLimitKey(request)}`);
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    if (isSuspiciousBot(userAgent)) {
      console.warn(`Blocked bot request from ${getRateLimitKey(request)}: ${userAgent}`);
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
  }
  
  // Rate limiting
  if (isRateLimited(request)) {
    const response = NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
    
    // Add Retry-After header
    if (pathname === '/api/order-book') {
      response.headers.set('Retry-After', '60'); // 1 minute
    } else {
      response.headers.set('Retry-After', '900'); // 15 minutes
    }
    
    return response;
  }
  
  // Admin route protection
  if (pathname.startsWith('/ghost-admin') || pathname.startsWith('/api/admin')) {
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    });
    
    // Allow login and register pages
    if (pathname === '/ghost-admin/login' || pathname === '/ghost-admin/register') {
      if (token) {
        // Redirect authenticated users away from login/register
        return NextResponse.redirect(new URL('/ghost-admin/dashboard', request.url));
      }
    } else if (pathname === '/api/admin/register') {
      // Allow both GET and POST requests to /api/admin/register
      // GET: for checking registration availability
      // POST: for actual admin registration
    } else {
      // Require authentication for other admin routes
      if (!token) {
        if (pathname.startsWith('/api/admin')) {
          return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
          );
        } else {
          return NextResponse.redirect(new URL('/ghost-admin/login', request.url));
        }
      }
    }
  }

  // Other public API routes (news, etc.) - no authentication required
  // These routes are handled by their individual route handlers

  // Create response
  const response = NextResponse.next();
  
  // Add performance tracking
  const responseTime = Date.now() - startTime;
  response.headers.set('X-Response-Time', responseTime.toString());
  
  // Log request for performance metrics
  logRequest({
    timestamp: new Date(),
    method: request.method,
    url: request.url,
    responseTime,
    statusCode: 200, // Default success status
    userAgent: request.headers.get('user-agent') || '',
    ip: getRateLimitKey(request)
  });

  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://static.cloudflareinsights.com", // Next.js requires unsafe-eval and unsafe-inline
    "style-src 'self' 'unsafe-inline'", // Tailwind requires unsafe-inline
    "img-src 'self' data: https: http:",
    "font-src 'self'",
    "connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://*.doubleclick.net https://cloudflareinsights.com",
    "frame-ancestors 'none'",
  ].join('; ');
  
  response.headers.set('Content-Security-Policy', csp);

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};