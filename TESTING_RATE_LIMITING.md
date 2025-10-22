# Quick Testing Guide for Rate Limiting

## Prerequisites

- FlightCtl backend configured with rate limiting enabled
- flightctl-ui running (standalone or OCP plugin)
- Browser with DevTools

## Quick Test (Without Backend Rate Limit Response Body)

Since your backend currently returns 429 errors without rate limit information in the response body, the UI will use the **default fallback: 20 requests per minute**.

### Steps

1. **Start the UI**

   ```bash
   cd apps/standalone
   npm start
   ```

2. **Open Browser DevTools**

   - Press F12 or right-click → Inspect
   - Go to Console tab
   - Also open Network tab to monitor requests

3. **Trigger Rate Limiting**

   **Option A - Rapid Refreshes:**

   - Navigate to any page (e.g., `/devices`)
   - Hit Ctrl+R (or Cmd+R) rapidly 10-15 times
   - This should trigger 429 errors

   **Option B - Wait for Polling:**

   - Navigate to a page with data (Devices, Fleets, etc.)
   - Let the automatic polling trigger the limit
   - This may take longer depending on backend config

4. **Verify Rate Limiting is Working**

   **In Console, you should see:**

   ```
   Rate limit exceeded. Throttling requests. {requests: 20, window: 60, retryAfter: 60}
   Throttled interval set to 4500ms
   ```

   **In Network Tab:**

   - Requests should be spaced ~4.5 seconds apart
   - No continuous stream of 429 errors
   - Occasional requests going through successfully

5. **Verify Recovery**

   After successful requests accumulate, console should show:

   ```
   Entering recovery state
   Recovery stage 1: interval reduced to 4050ms
   Recovery stage 2: interval reduced to 3645ms
   Recovery stage 3: interval reduced to 3280ms
   Returned to normal state
   ```

## What to Look For

### ✅ Good Signs

- Console shows "Rate limit exceeded. Throttling requests."
- Subsequent requests are delayed (visible in Network tab)
- UI continues to work (may be slower)
- Eventually returns to "normal state"
- No cascading failures

### ❌ Warning Signs

- Continuous 429 errors without throttling
- UI becomes completely unresponsive
- Console errors about queue being full
- Memory usage climbing rapidly

## Debugging

### Check Rate Limiter State

Add this to browser console:

```javascript
// Expose rate limiter for debugging
window.rateLimiter = require('@flightctl/ui-components/src/utils/rateLimiter').rateLimiter;

// Check current state
window.rateLimiter.getDebugInfo();
```

Expected output when throttled:

```javascript
{
  state: "throttled",
  queueLength: 2,
  currentInterval: 4500,
  throttledInterval: 4500,
  successCount: 0,
  recoveryStage: 0,
  rateLimitInfo: { requests: 20, window: 60, retryAfter: 60 },
  last429: "2025-10-22T15:30:45.123Z"
}
```

### Reset Rate Limiter

If you need to reset during testing:

```javascript
window.rateLimiter.reset();
```

## Understanding the Numbers

With **default rate limit of 20 requests/minute**:

- **Base interval:** 60s / 20 = 3 seconds per request
- **Safe interval (1.5x):** 3s × 1.5 = 4.5 seconds per request
- **Recovery stage 1 (after 10 successful):** 4.5s × 0.9 = 4.05 seconds
- **Recovery stage 2 (after 20 successful):** 4.05s × 0.9 = 3.645 seconds
- **Recovery stage 3 (after 30 successful):** Return to normal (10s polling)

## Common Issues

### "Rate limit but no throttling"

- Check console for errors
- Verify rate limiter code is loaded
- Try hard refresh (Ctrl+Shift+R)

### "Queue full" error

- Rate limit is very strict
- Too many components polling simultaneously
- May need to increase maxQueueSize or reduce polling frequency

### Can't trigger 429

- Backend rate limit may be too high
- Try making many rapid requests manually
- Check backend logs to verify rate limiting is active

## Testing Checklist

- [ ] Can trigger 429 error from backend
- [ ] Console shows throttling message with default values
- [ ] Network requests are delayed appropriately
- [ ] UI remains functional (slower but working)
- [ ] Success counter increases with successful requests
- [ ] Recovery stages are logged
- [ ] Eventually returns to normal state
- [ ] Another 429 resets the recovery process

## Next Steps

Once this is working, you can:

1. **Update backend** to include rate limit info in 429 response
2. **Test with different rate limits** by changing backend config
3. **Monitor in production** using the debug info
4. **Adjust defaults** if needed (in `rateLimiter.ts`)

## Frequently Asked Questions

### Will requests from different components execute out of order?

**No.** The rate limiter guarantees FIFO (First-In-First-Out) ordering:

- All requests go into a single queue regardless of source
- They execute in the exact order they were made
- Example: PATCH from component A → GET from polling → PATCH from component B executes in that exact order

### If I open multiple tabs, will they share the same rate limiter?

**No.** Each browser tab has its own independent rate limiter:

- Tab 1 hitting rate limit doesn't affect Tab 2
- Each tab tracks its own state and queue
- They're completely isolated JavaScript instances

### Will one user's rate limiting affect other users?

**No.** Rate limiting is entirely client-side and per-tab:

- User A's browser is independent from User B's browser
- Backend enforces rate limits per IP address
- UI rate limiter just responds to backend 429 errors
- One user hitting the limit only affects their specific browser tab

### What happens if I close the tab while requests are queued?

The queue is lost when the tab closes:

- All pending requests are abandoned
- On next page load, the rate limiter starts fresh in normal state
- This is expected behavior (browser cleanup)

### Can high-priority requests bypass the queue?

**Not currently.** All requests are treated equally (FIFO):

- Future enhancement could add priority levels
- For now, all requests wait their turn
- This ensures fairness and predictability

## Support

If issues persist:

- Check browser console for errors
- Verify backend is returning 429
- Check Network tab timing
- Review `RATE_LIMITING_IMPLEMENTATION.md` for details
