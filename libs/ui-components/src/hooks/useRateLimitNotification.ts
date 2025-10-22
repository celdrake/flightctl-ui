import * as React from 'react';
import { rateLimiter } from '../utils/rateLimiter';
import { RateLimitNotification } from '../types/rateLimit';

export const useRateLimitNotification = () => {
  const [notification, setNotification] = React.useState<RateLimitNotification | null>(null);

  React.useEffect(() => {
    // Subscribe to rate limiter notifications
    const unsubscribe = rateLimiter.subscribe((newNotification: RateLimitNotification) => {
      setNotification(newNotification);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Only show notification if level is not normal
  const shouldShow = notification && notification.level !== 'normal';

  return {
    notification: shouldShow ? notification : null,
  };
};
