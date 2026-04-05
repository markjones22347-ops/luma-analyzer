/**
 * Rate Limiter for Luma API
 * Prevents abuse by limiting requests per IP address
 */
export class RateLimiter {
  private static readonly WINDOW_MS = 60000; // 1 minute window
  private static readonly MAX_REQUESTS = 10; // 10 requests per minute
  private static readonly BLOCK_DURATION_MS = 300000; // 5 minute block if exceeded

  private requests = new Map<string, { count: number; firstRequest: number; blocked?: boolean; blockedUntil?: number }>();

  /**
   * Check if IP is allowed to make a request
   */
  isAllowed(ip: string): { allowed: boolean; remaining: number; resetTime: number; blockTime?: number } {
    const now = Date.now();
    const record = this.requests.get(ip);

    // Check if currently blocked
    if (record?.blocked && record.blockedUntil && now < record.blockedUntil) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: record.blockedUntil,
        blockTime: record.blockedUntil - now,
      };
    }

    // Clear block if expired
    if (record?.blocked && record.blockedUntil && now >= record.blockedUntil) {
      this.requests.delete(ip);
    }

    // Clean up old entries periodically
    this.cleanup(now);

    // Check existing record
    if (record) {
      // Reset if window expired
      if (now - record.firstRequest > RateLimiter.WINDOW_MS) {
        record.count = 1;
        record.firstRequest = now;
        return {
          allowed: true,
          remaining: RateLimiter.MAX_REQUESTS - 1,
          resetTime: now + RateLimiter.WINDOW_MS,
        };
      }

      // Check if exceeded limit
      if (record.count >= RateLimiter.MAX_REQUESTS) {
        // Block the IP
        record.blocked = true;
        record.blockedUntil = now + RateLimiter.BLOCK_DURATION_MS;
        
        return {
          allowed: false,
          remaining: 0,
          resetTime: record.blockedUntil,
          blockTime: RateLimiter.BLOCK_DURATION_MS,
        };
      }

      // Increment count
      record.count++;
      return {
        allowed: true,
        remaining: RateLimiter.MAX_REQUESTS - record.count,
        resetTime: record.firstRequest + RateLimiter.WINDOW_MS,
      };
    }

    // First request from this IP
    this.requests.set(ip, {
      count: 1,
      firstRequest: now,
    });

    return {
      allowed: true,
      remaining: RateLimiter.MAX_REQUESTS - 1,
      resetTime: now + RateLimiter.WINDOW_MS,
    };
  }

  /**
   * Clean up old entries to prevent memory leak
   */
  private cleanup(now: number): void {
    for (const [ip, record] of this.requests.entries()) {
      // Remove if window expired and not blocked
      if (!record.blocked && now - record.firstRequest > RateLimiter.WINDOW_MS) {
        this.requests.delete(ip);
      }
      // Remove if block expired
      if (record.blocked && record.blockedUntil && now >= record.blockedUntil) {
        this.requests.delete(ip);
      }
    }
  }

  /**
   * Get rate limit status for IP
   */
  getStatus(ip: string): { requests: number; limit: number; windowMs: number } {
    const record = this.requests.get(ip);
    return {
      requests: record?.count || 0,
      limit: RateLimiter.MAX_REQUESTS,
      windowMs: RateLimiter.WINDOW_MS,
    };
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter();
