/* eslint-disable no-console */
import {
  RateLimitState,
  RateLimitInfo,
  QueuedRequest,
  RateLimiterConfig,
  RateLimitNotification,
  NotificationCallback,
} from '../types/rateLimit';

const DEFAULT_CONFIG: RateLimiterConfig = {
  maxQueueSize: 100,
  recoveryThresholds: [10, 20, 30], // After 10, 20, 30 successful cycles
  recoveryIncrements: [0.1, 0.1, 0.1], // Increase by 10% at each stage
  safetyMargin: 1.5, // 50% slower than limit
};

const DEFAULT_POLLING_INTERVAL = 10000; // 10 seconds (matches useFetchPeriodically TIMEOUT)

// Default rate limit to use when backend doesn't provide one: 20 requests per minute
const DEFAULT_RATE_LIMIT: RateLimitInfo = {
  requests: 20,
  window: 60, // 1 minute in seconds
  retryAfter: 60,
};

// Queue thresholds for notifications and progressive throttling
const QUEUE_THRESHOLDS = {
  WARNING_PERCENTAGE: 10, // Show warning banner
  HIGH_PRESSURE: 75, // 1.5x delay multiplier
  CRITICAL_PRESSURE: 90, // 2.0x delay multiplier
  FULL: 100, // Critical banner
};

class RateLimiter {
  private state: RateLimitState = RateLimitState.Normal;
  private config: RateLimiterConfig;
  private queue: QueuedRequest<unknown>[] = [];
  private processing = false;

  // Rate limit tracking
  private rateLimitInfo: RateLimitInfo | null = null;
  private throttledInterval: number | null = null; // milliseconds between requests
  private currentInterval: number = DEFAULT_POLLING_INTERVAL;

  // Recovery tracking
  private successCount = 0;
  private recoveryStage = 0;
  private last429Timestamp: number | null = null;

  // Notification subscribers
  private subscribers: NotificationCallback[] = [];

  constructor(config: Partial<RateLimiterConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Get the current recommended polling interval in milliseconds
   */
  public getRecommendedInterval(): number {
    return this.currentInterval;
  }

  /**
   * Get the current rate limit state
   */
  public getState(): RateLimitState {
    return this.state;
  }

  /**
   * Notify the rate limiter of a 429 error
   */
  public notify429(rateLimitInfo: RateLimitInfo): void {
    console.warn('Rate limit exceeded. Throttling requests.', rateLimitInfo);

    this.last429Timestamp = Date.now();
    this.rateLimitInfo = rateLimitInfo;
    this.state = RateLimitState.Throttled;

    // Calculate safe interval: (window / requests) * safetyMargin
    // Convert to milliseconds
    const baseInterval = (rateLimitInfo.window / rateLimitInfo.requests) * 1000;
    this.throttledInterval = baseInterval * this.config.safetyMargin;
    this.currentInterval = this.throttledInterval;

    // Reset recovery tracking
    this.successCount = 0;
    this.recoveryStage = 0;

    console.log(`Throttled interval set to ${this.throttledInterval}ms`);

    // Notify subscribers of state change
    this.notifySubscribers();
  }

  /**
   * Notify the rate limiter of a successful request
   */
  public notifySuccess(): void {
    if (this.state === RateLimitState.Normal) {
      return; // Nothing to track in normal state
    }

    this.successCount++;

    // Check if we should progress to recovery or normal state
    if (this.state === RateLimitState.Throttled && this.successCount >= this.config.recoveryThresholds[0]) {
      this.state = RateLimitState.Recovering;
      this.recoveryStage = 0;
      console.log('Entering recovery state');
    }

    if (this.state === RateLimitState.Recovering) {
      this.updateRecoveryProgress();
    }
  }

  /**
   * Update recovery progress and adjust intervals
   */
  private updateRecoveryProgress(): void {
    if (!this.throttledInterval) {
      return;
    }

    const nextStage = this.recoveryStage + 1;
    const threshold = this.config.recoveryThresholds[nextStage];

    if (threshold && this.successCount >= threshold) {
      // Progress to next recovery stage
      this.recoveryStage = nextStage;
      const increment = this.config.recoveryIncrements[nextStage - 1] || 0;

      // Decrease interval (increase rate) by the increment percentage
      this.currentInterval = Math.max(DEFAULT_POLLING_INTERVAL, this.currentInterval * (1 - increment));

      console.log(`Recovery stage ${this.recoveryStage}: interval reduced to ${this.currentInterval}ms`);

      // Check if we've completed all recovery stages
      if (this.recoveryStage >= this.config.recoveryThresholds.length) {
        this.state = RateLimitState.Normal;
        this.currentInterval = DEFAULT_POLLING_INTERVAL;
        this.throttledInterval = null;
        this.rateLimitInfo = null;
        this.successCount = 0;
        this.recoveryStage = 0;
        console.log('Returned to normal state');
        // Notify subscribers of return to normal
        this.notifySubscribers();
      }
    }
  }

  /**
   * Enqueue a request to be executed with rate limiting
   */
  public async enqueueRequest<T>(executor: () => Promise<T>): Promise<T> {
    if (this.state === RateLimitState.Normal) {
      // No throttling needed, execute immediately
      return executor();
    }

    // Check queue size limit
    if (this.queue.length >= this.config.maxQueueSize) {
      throw new Error('Rate limit queue is full. Too many pending requests.');
    }

    return new Promise<T>((resolve, reject) => {
      this.queue.push({
        executor: executor as () => Promise<unknown>,
        resolve: resolve as (value: unknown) => void,
        reject,
        timestamp: Date.now(),
      });

      // Notify subscribers of queue change
      this.notifySubscribers();

      // Start processing if not already running
      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  /**
   * Process the request queue with appropriate delays
   */
  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const item = this.queue.shift();
      if (!item) {
        break;
      }

      // Notify subscribers of queue change
      this.notifySubscribers();

      try {
        const result = await item.executor();
        item.resolve(result);
      } catch (error) {
        item.reject(error);
      }

      // Apply progressive throttling: wait before processing next request
      if (this.queue.length > 0 && this.throttledInterval) {
        const pressureMultiplier = this.getQueuePressure();
        const effectiveInterval = this.throttledInterval * pressureMultiplier;
        await this.sleep(effectiveInterval);
      }
    }

    this.processing = false;
    // Notify that queue is now empty
    this.notifySubscribers();
  }

  /**
   * Utility to sleep for a given duration
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Check if currently throttled
   */
  public isThrottled(): boolean {
    return this.state !== RateLimitState.Normal;
  }

  /**
   * Subscribe to rate limiter notifications
   */
  public subscribe(callback: NotificationCallback): () => void {
    this.subscribers.push(callback);
    // Immediately notify with current state
    this.notifySubscribers();
    // Return unsubscribe function
    return () => {
      this.subscribers = this.subscribers.filter((cb) => cb !== callback);
    };
  }

  /**
   * Calculate queue pressure multiplier for progressive throttling
   */
  private getQueuePressure(): number {
    const percentage = (this.queue.length / this.config.maxQueueSize) * 100;
    if (percentage >= QUEUE_THRESHOLDS.CRITICAL_PRESSURE) return 2.0; // 100% slower
    if (percentage >= QUEUE_THRESHOLDS.HIGH_PRESSURE) return 1.5; // 50% slower
    return 1.0; // Normal
  }

  /**
   * Notify all subscribers about current rate limit state
   */
  private notifySubscribers(): void {
    const queueSize = this.queue.length;
    const queuePercentage = (queueSize / this.config.maxQueueSize) * 100;

    let level: 'warning' | 'critical' | 'normal' = 'normal';
    let message = '';

    if (queuePercentage >= QUEUE_THRESHOLDS.FULL) {
      level = 'critical';
      message = 'Unable to process requests. Please wait for the system to recover.';
    } else if (queuePercentage >= QUEUE_THRESHOLDS.WARNING_PERCENTAGE) {
      level = 'warning';
      message = 'The system is experiencing high traffic. Some requests may be delayed.';
    }

    const notification: RateLimitNotification = {
      level,
      queueSize,
      queueCapacity: this.config.maxQueueSize,
      queuePercentage,
      state: this.state,
      message,
    };

    this.subscribers.forEach((callback) => callback(notification));
  }

  /**
   * Reset the rate limiter to normal state (useful for testing)
   */
  public reset(): void {
    this.state = RateLimitState.Normal;
    this.queue = [];
    this.processing = false;
    this.rateLimitInfo = null;
    this.throttledInterval = null;
    this.currentInterval = DEFAULT_POLLING_INTERVAL;
    this.successCount = 0;
    this.recoveryStage = 0;
    this.last429Timestamp = null;
  }

  /**
   * Get debug information about the rate limiter state
   */
  public getDebugInfo(): Record<string, unknown> {
    return {
      state: this.state,
      queueLength: this.queue.length,
      currentInterval: this.currentInterval,
      throttledInterval: this.throttledInterval,
      successCount: this.successCount,
      recoveryStage: this.recoveryStage,
      rateLimitInfo: this.rateLimitInfo,
      last429: this.last429Timestamp ? new Date(this.last429Timestamp).toISOString() : null,
    };
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiter();

// Export class for testing
export { RateLimiter };

// Export default rate limit for fallback cases
export { DEFAULT_RATE_LIMIT };
