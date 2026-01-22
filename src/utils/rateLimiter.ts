/**
 * Rate limiter utility to respect Taostats API limits
 * Limit: 240 calls per minute = 4 calls per second
 * Buffer: Using 200 calls/min to be safe and allow for other scripts
 */

interface RateLimiterConfig {
  maxCallsPerMinute: number;
  retryAttempts: number;
  retryDelayMs: number;
}

class RateLimiter {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private callTimestamps: number[] = [];
  private config: RateLimiterConfig;

  constructor(config: Partial<RateLimiterConfig> = {}) {
    this.config = {
      maxCallsPerMinute: config.maxCallsPerMinute || 200,
      retryAttempts: config.retryAttempts || 5,
      retryDelayMs: config.retryDelayMs || 1500,
    };
  }

  /**
   * Check if we can make a call now based on rate limit
   */
  private canMakeCall(): boolean {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Remove timestamps older than 1 minute
    this.callTimestamps = this.callTimestamps.filter(ts => ts > oneMinuteAgo);

    return this.callTimestamps.length < this.config.maxCallsPerMinute;
  }

  /**
   * Wait until we can make a call
   */
  private async waitForSlot(): Promise<void> {
    while (!this.canMakeCall()) {
      // Wait 1 second before checking again
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Record this call
    this.callTimestamps.push(Date.now());
  }

  /**
   * Execute a function with rate limiting and retry on 429
   */
  async execute<T>(
    fn: () => Promise<T>,
    context?: string
  ): Promise<T> {
    await this.waitForSlot();

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        const result = await fn();
        return result;
      } catch (error: any) {
        const is429 = error.message?.includes('429') || 
                      error.message?.includes('Too Many Requests');

        if (is429 && attempt < this.config.retryAttempts) {
          const delay = this.config.retryDelayMs * attempt; // Exponential backoff
          console.warn(`  Rate limit hit${context ? ` (${context})` : ''}, retrying in ${delay}ms (attempt ${attempt}/${this.config.retryAttempts})...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        throw error;
      }
    }

    throw new Error('Should not reach here');
  }

  /**
   * Get current rate limit status
   */
  getStatus(): { callsInLastMinute: number; limit: number; available: number } {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const callsInLastMinute = this.callTimestamps.filter(ts => ts > oneMinuteAgo).length;

    return {
      callsInLastMinute,
      limit: this.config.maxCallsPerMinute,
      available: this.config.maxCallsPerMinute - callsInLastMinute,
    };
  }
}

// Singleton instance for the entire application
// Using 200 calls/min (buffer of 40 under the 240 limit) to be safe
export const taostatsRateLimiter = new RateLimiter({
  maxCallsPerMinute: 200,
  retryAttempts: 5,
  retryDelayMs: 1500,
});
