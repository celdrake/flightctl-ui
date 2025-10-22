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
