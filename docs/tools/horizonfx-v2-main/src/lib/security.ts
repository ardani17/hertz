/**
 * Security utilities for input sanitization and XSS prevention
 */

/**
 * Decode HTML entities to readable text
 * @param input - String with HTML entities
 * @returns Decoded string
 */
export function decodeHtmlEntities(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&amp;#x27;/g, "'"); // Handle double-encoded entities
}

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param input - Raw HTML string
 * @returns Sanitized string safe for display
 */
export function sanitizeHtml(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  // Basic HTML entity encoding to prevent XSS
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitize search input for safe display
 * @param input - Search query string
 * @returns Sanitized search string
 */
export function sanitizeSearchInput(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .trim()
    .slice(0, 200) // Limit length
    .replace(/[<>"'&]/g, '') // Remove potentially dangerous characters
    .replace(/\s+/g, ' '); // Normalize whitespace
}

/**
 * Validate and sanitize news content for safe display
 * @param content - News content object
 * @returns Sanitized content object with decoded HTML entities
 */
export function sanitizeNewsContent(content: {
  title: string;
  body: string;
  providerId: string;
}) {
  return {
    title: decodeHtmlEntities(content.title || ''),
    body: decodeHtmlEntities(content.body || ''),
    providerId: decodeHtmlEntities(content.providerId || '')
  };
}

/**
 * Check if a string contains potentially malicious content
 * @param input - String to check
 * @returns true if content appears safe
 */
export function isContentSafe(input: string): boolean {
  if (!input || typeof input !== 'string') return true;
  
  // Check for common XSS patterns
  const dangerousPatterns = [
    /<script[^>]*>/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe[^>]*>/i,
    /<object[^>]*>/i,
    /<embed[^>]*>/i,
    /data:text\/html/i
  ];
  
  return !dangerousPatterns.some(pattern => pattern.test(input));
}

/**
 * Rate limiting helper for client-side
 * @param key - Unique key for the operation
 * @param limit - Maximum operations per window
 * @param windowMs - Time window in milliseconds
 * @returns true if operation is allowed
 */
export function clientRateLimit(key: string, limit: number = 10, windowMs: number = 60000): boolean {
  const now = Date.now();
  const storageKey = `rate_limit_${key}`;
  
  try {
    const stored = localStorage.getItem(storageKey);
    const data = stored ? JSON.parse(stored) : { count: 0, resetTime: now + windowMs };
    
    // Reset if window has passed
    if (now > data.resetTime) {
      data.count = 0;
      data.resetTime = now + windowMs;
    }
    
    // Check if limit exceeded
    if (data.count >= limit) {
      return false;
    }
    
    // Increment counter
    data.count++;
    localStorage.setItem(storageKey, JSON.stringify(data));
    
    return true;
  } catch (error) {
    // If localStorage fails, allow the operation
    console.warn('Rate limiting failed:', error);
    return true;
  }
}