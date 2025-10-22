import * as React from 'react';
import { Alert, Label } from '@patternfly/react-core';
import { useRateLimitNotification } from '../../hooks/useRateLimitNotification';
import { RateLimitState } from '../../types/rateLimit';
import { rateLimiter } from '../../utils/rateLimiter';

const SystemNotifications = () => {
  const { notification } = useRateLimitNotification();
  const [debugInfo, setDebugInfo] = React.useState(rateLimiter.getDebugInfo());

  // Update debug info periodically
  React.useEffect(() => {
    const interval = setInterval(() => {
      setDebugInfo(rateLimiter.getDebugInfo());
    }, 500); // Update every 500ms

    return () => clearInterval(interval);
  }, []);

  // Always show for testing
  const variant =
    notification?.level === 'critical' ? 'danger' : notification?.level === 'warning' ? 'warning' : 'info';

  const getStateLabel = () => {
    if (!notification) return <Label color="blue">No notification</Label>;
    if (notification.state === RateLimitState.Throttled) {
      return <Label color="red">Throttled</Label>;
    }
    if (notification.state === RateLimitState.Recovering) {
      return <Label color="orange">Recovering</Label>;
    }
    if (notification.state === RateLimitState.Normal) {
      return <Label color="green">Normal</Label>;
    }
    return null;
  };

  return (
    <Alert
      className="pf-v5-u-mx-lg"
      variant={variant}
      isInline
      title={<>[DEBUG] Rate Limiter Status {getStateLabel()}</>}
    >
      <pre style={{ fontSize: '12px', marginTop: '8px', maxHeight: '300px', overflow: 'auto' }}>
        {JSON.stringify(debugInfo, null, 2)}
      </pre>
      {notification && (
        <>
          <hr style={{ margin: '8px 0' }} />
          <strong>Notification:</strong>
          <pre style={{ fontSize: '12px', marginTop: '8px' }}>{JSON.stringify(notification, null, 2)}</pre>
        </>
      )}
    </Alert>
  );
};

export default SystemNotifications;
