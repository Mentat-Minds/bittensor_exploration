/**
 * Rate limiter utility to respect Taostats API limits
 * Limit: 60 calls per minute = 1 call per second
 */
import { errorLogger } from './errorLogger';

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
      maxCallsPerMinute: config.maxCallsPerMinute || 60,
      retryAttempts: config.retryAttempts || 3,
      retryDelayMs: config.retryDelayMs || 2000,
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
   * CRITICAL: Garantit 0 erreur 429 non gérée avec retry agressif
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
        const is502 = error.message?.includes('502') || 
                      error.message?.includes('Bad Gateway');
        const isRetryable = is429 || is502;

        if (isRetryable && attempt < this.config.retryAttempts) {
          // Exponential backoff: 3s, 6s, 12s, 24s, 48s
          const delay = this.config.retryDelayMs * Math.pow(2, attempt - 1);
          const errorType = is429 ? 'Rate limit (429)' : 'Server error (502)';
          
          // LOG le retry
          errorLogger.logRetry(context || 'unknown', attempt, this.config.retryAttempts, errorType, delay);
          
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // Pour les 429, attendre un slot supplémentaire pour être sûr
          if (is429) {
            await this.waitForSlot();
          }
          continue;
        }

        // Si on a épuisé tous les retries, c'est une vraie erreur
        if (isRetryable && attempt >= this.config.retryAttempts) {
          errorLogger.logCriticalError(context || 'unknown', error.message);
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
// Configuration conservatrice pour garantir 0 erreur 429
export const taostatsRateLimiter = new RateLimiter({
  maxCallsPerMinute: 55,  // Marge de sécurité (limite API = 60)
  retryAttempts: 5,        // 5 tentatives max avec backoff exponentiel
  retryDelayMs: 3000,      // Délai initial 3s (puis 6s, 12s, 24s, 48s)
});
