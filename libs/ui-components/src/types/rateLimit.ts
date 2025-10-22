// Rate limit state enum
export enum RateLimitState {
  Normal = 'normal',
  Throttled = 'throttled',
  Recovering = 'recovering',
}

// Rate limit information from 429 response
export interface RateLimitInfo {
  requests: number; // Max requests allowed
  window: number; // Time window in seconds
  retryAfter: number; // Seconds until rate limit resets
}

// API error response with rate limit info
export interface RateLimitErrorResponse {
  code: number;
  message: string;
  reason: string;
  rateLimit?: RateLimitInfo;
}

// Internal queue item
export interface QueuedRequest<T> {
  executor: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: unknown) => void;
  timestamp: number;
  metadata?: RequestMetadata;
}

// Request metadata for deduplication
export interface RequestMetadata {
  method: string; // GET, POST, PUT, PATCH, DELETE
  path: string; // API endpoint path
  allowDeduplication?: boolean; // Whether to allow deduplication (default: true)
}

// Rate limiter configuration
export interface RateLimiterConfig {
  maxQueueSize: number; // Maximum number of queued requests
  recoveryThresholds: number[]; // Success counts for recovery stages
  recoveryIncrements: number[]; // Rate increase percentages at each stage
  safetyMargin: number; // Multiplier for safety (e.g., 1.5 = 50% slower)
}

// Notification levels
export type NotificationLevel = 'warning' | 'critical' | 'normal';

// Rate limit notification
export interface RateLimitNotification {
  level: NotificationLevel;
  queueSize: number;
  queueCapacity: number;
  queuePercentage: number;
  state: RateLimitState;
  message: string;
}

// Notification callback type
export type NotificationCallback = (notification: RateLimitNotification) => void;

// Custom error for duplicate GET requests
export class DuplicateRequestError extends Error {
  constructor(path: string) {
    super(`Duplicate GET request for ${path} already queued`);
    this.name = 'DuplicateRequestError';
  }
}

// Custom error for rate limiting (user-friendly message)
export class RateLimitedError extends Error {
  constructor(message: string = 'The system is experiencing high traffic. Retrying automatically...') {
    super(message);
    this.name = 'RateLimitedError';
  }
}
