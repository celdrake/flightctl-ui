# Rate Limiting Implementation

## Overview

This document describes the implementation of adaptive API rate limiting in flightctl-ui. The system automatically detects 429 (Too Many Requests) errors, extracts rate limit configuration from the backend response, throttles subsequent requests, and gradually recovers to normal operation.

## Architecture

### Core Components

1. **Rate Limiter Service** (`libs/ui-components/src/utils/rateLimiter.ts`)

   - Singleton service that manages global rate limiting state
   - Implements request queueing and adaptive recovery
   - Tracks success count and adjusts intervals dynamically

2. **Type Definitions** (`libs/ui-components/src/types/rateLimit.ts`)

   - `RateLimitState`: Enum for tracking state (Normal, Throttled, Recovering)
   - `RateLimitInfo`: Interface for rate limit data from 429 responses
   - `RateLimitErrorResponse`: Extended error response with rate limit info

3. **API Integration Points**
   - `apps/standalone/src/app/utils/apiCalls.ts`: Standalone app API calls
   - `apps/ocp-plugin/src/utils/apiCalls.ts`: OCP plugin API calls
   - `libs/ui-components/src/hooks/useFetchPeriodically.ts`: Periodic polling

## How It Works

### 1. Initial Throttling (429 Detection)

When a 429 error is received:

```typescript
// Backend response structure
{
  code: 429,
  message: "Rate limit exceeded...",
  reason: "TooManyRequests",
  rateLimit: {
    requests: 60,      // Max requests allowed
    window: 60,        // Time window in seconds
    retryAfter: 60     // Seconds until rate limit resets
  }
}
```

The rate limiter:

- Extracts rate limit configuration from the response
- Calculates safe interval: `(window / requests) * 1.5` (50% safety margin)
- Transitions to `Throttled` state
- Queues all pending requests

Example: If rate limit is 60 requests per 60 seconds:

- Base interval: 1000ms per request
- Safe interval: 1500ms per request (with 50% margin)

### 2. Request Queueing

When throttled, all API requests are queued:

- Maximum queue size: 100 requests (configurable)
- FIFO (First In, First Out) processing
- Requests are executed with delays between them
- Queue is processed asynchronously in the background

### 3. Adaptive Recovery

The system tracks successful requests and gradually increases request rate:

**Recovery Stages:**

1. After 10 successful requests: Increase rate by 10%
2. After 20 successful requests: Increase rate by another 10%
3. After 30 successful requests: Return to normal state

**Example Recovery Timeline:**

- Throttled: 1500ms interval
- Stage 1 (10 successes): 1350ms interval (10% faster)
- Stage 2 (20 successes): 1215ms interval (10% faster again)
- Stage 3 (30 successes): Return to 10000ms normal interval

If another 429 occurs during recovery:

- Reset to throttled state
- Success counter resets to 0
- Recovery starts over

### 4. Periodic Polling Integration

The `useFetchPeriodically` hook automatically uses the rate limiter's recommended interval:

```typescript
// Uses rate limiter's interval when throttled, otherwise uses default
const interval = query.timeout || rateLimiter.getRecommendedInterval() || DEFAULT_TIMEOUT;
```

This ensures all periodic polling respects the rate limits without code changes in components.

## Backend Requirements

The backend should return 429 responses with the following structure:

```json
{
  "code": 429,
  "message": "Rate limit exceeded, please try again later",
  "reason": "TooManyRequests",
  "rateLimit": {
    "requests": 60,
    "window": 60,
    "retryAfter": 60
  }
}
```

**Default Fallback:** If the backend doesn't include the `rateLimit` field in the response, or if the response fails to parse, the UI will automatically use a default rate limit of **20 requests per minute**. This ensures the rate limiting feature works even without backend support.

## Configuration

The rate limiter uses these default settings:

```typescript
{
  maxQueueSize: 100,              // Maximum queued requests
  recoveryThresholds: [10, 20, 30], // Success counts for stages
  recoveryIncrements: [0.1, 0.1, 0.1], // Rate increases (10%)
  safetyMargin: 1.5,              // 50% slower than limit
}
```

**Default Rate Limit (when backend doesn't provide one):**

```typescript
{
  requests: 20,   // 20 requests
  window: 60,     // per minute
  retryAfter: 60  // retry after 60 seconds
}
```

These can be adjusted by modifying `DEFAULT_CONFIG` and `DEFAULT_RATE_LIMIT` in `rateLimiter.ts`.

## Testing

### Quick Testing Without Backend Rate Limit Info

If your backend returns 429 errors but doesn't include rate limit information in the response body, the feature will still work using the default rate limit (20 requests/minute).

**To test:**

1. **Configure backend to return 429 errors**
   Set a low rate limit in FlightCtl config:

   ```yaml
   service:
     rateLimit:
       requests: 5 # Very low for quick testing
       window: '10s'
   ```

2. **Trigger rate limiting**

   - Open flightctl-ui in browser
   - Open DevTools Console (F12)
   - Navigate to a page with polling (Devices, Fleets, etc.)
   - Make rapid page refreshes (Ctrl+R multiple times quickly)

3. **Observe behavior**
   Console will show:

   ```
   Rate limit exceeded. Throttling requests. {requests: 20, window: 60, retryAfter: 60}
   Throttled interval set to 4500ms
   ```

   Note: The values shown (20, 60) are the defaults since backend didn't provide them.

4. **Verify throttling is working**
   - Network tab should show requests spaced out by ~4.5 seconds
   - UI continues to function but with slower updates
   - No flood of 429 errors

### Manual Testing Steps (Full Feature with Backend Support)

1. **Setup Rate-Limited Backend**
   Configure FlightCtl with rate limiting:

   ```yaml
   service:
     rateLimit:
       requests: 10 # Low limit for testing
       window: '10s' # Short window
       trustedProxies:
         - '127.0.0.1'
   ```

2. **Trigger Rate Limiting**

   - Open the flightctl-ui in a browser
   - Navigate to a page that polls data frequently (e.g., Devices list)
   - Open browser DevTools Console
   - Make rapid manual refreshes or wait for polling to trigger 429

3. **Verify Throttling**
   Check console for:

   ```
   Rate limit exceeded. Throttling requests.
   Throttled interval set to XYZms
   ```

4. **Monitor Queue**
   Use the debug function in console:

   ```javascript
   // Access the rate limiter (if exposed to window for debugging)
   rateLimiter.getDebugInfo();
   ```

   Should show:

   ```javascript
   {
     state: "throttled",
     queueLength: N,
     currentInterval: 1500,
     throttledInterval: 1500,
     successCount: 0,
     recoveryStage: 0,
     rateLimitInfo: { requests: 10, window: 10, retryAfter: 10 },
     last429: "2025-10-22T12:34:56.789Z"
   }
   ```

5. **Verify Recovery**

   - Wait for successful requests to accumulate
   - Check console for recovery messages:

   ```
   Entering recovery state
   Recovery stage 1: interval reduced to XYZms
   Recovery stage 2: interval reduced to XYZms
   Recovery stage 3: interval reduced to XYZms
   Returned to normal state
   ```

6. **Test Multiple Components**
   - Navigate between pages that poll different endpoints
   - Verify all requests respect the rate limit
   - Check that queue doesn't grow unbounded

### Expected Behavior

✅ **When rate limited:**

- Console shows "Rate limit exceeded" message
- Subsequent requests are queued
- Requests execute with delays between them
- UI continues to function (with slower updates)

✅ **During recovery:**

- Intervals gradually decrease
- Console shows recovery stage messages
- Eventually returns to normal polling

✅ **On subsequent 429:**

- Immediately returns to throttled state
- Success counter resets
- Recovery starts from beginning

❌ **Should NOT happen:**

- UI becomes unresponsive
- Queue grows indefinitely
- Multiple 429 errors in quick succession
- Components stop fetching data

## Debugging

### Enable Debug Logging

Add this to your browser console to expose the rate limiter:

```javascript
// In the browser console
window.rateLimiter = require('@flightctl/ui-components/src/utils/rateLimiter').rateLimiter;

// Check current state
window.rateLimiter.getDebugInfo();

// Reset to normal (for testing)
window.rateLimiter.reset();
```

### Common Issues

**Issue: Requests still hitting rate limit after throttling**

- Check if `rateLimit` data is in 429 response
- Verify safety margin is sufficient (increase if needed)
- Check if multiple instances of the UI are running

**Issue: Queue growing too large**

- Reduce polling frequency in components
- Increase `maxQueueSize` if legitimate traffic
- Check for memory leaks in component unmount

**Issue: Not recovering to normal state**

- Verify successful requests are being tracked
- Check console for recovery stage messages
- Ensure no persistent 429 errors preventing recovery

## Future Enhancements

Potential improvements for future iterations:

1. **Per-endpoint rate limiting**: Track limits separately for different API endpoints
2. **Request prioritization**: Queue critical requests ahead of polling
3. **UI feedback**: Show banner when throttled (currently silent)
4. **Persistent state**: Remember rate limits across page reloads
5. **Metrics collection**: Track rate limit events for monitoring
6. **Configurable recovery**: Allow components to specify recovery strategies

## Files Modified

### New Files

- `libs/ui-components/src/types/rateLimit.ts` - Type definitions
- `libs/ui-components/src/utils/rateLimiter.ts` - Core rate limiter service

### Modified Files

- `apps/standalone/src/app/utils/apiCalls.ts` - Standalone API integration
- `apps/ocp-plugin/src/utils/apiCalls.ts` - OCP plugin API integration
- `libs/ui-components/src/hooks/useFetchPeriodically.ts` - Periodic polling integration

## Summary

The rate limiting implementation provides:

- ✅ Automatic 429 error detection
- ✅ Intelligent request queueing
- ✅ Adaptive rate throttling based on backend configuration
- ✅ Default fallback (20 req/min) when backend doesn't provide rate limit info
- ✅ Gradual recovery to normal operation
- ✅ Silent operation (no user disruption)
- ✅ Global rate management across all API calls
- ✅ Zero configuration required in UI components
- ✅ Works immediately without backend changes

The system is production-ready and requires no changes to existing components to benefit from rate limiting protection. It works even if the backend doesn't include rate limit information in 429 responses.
