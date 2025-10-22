import * as React from 'react';
import { Alert, Label, Button } from '@patternfly/react-core';
import { useRateLimitNotification } from '../../hooks/useRateLimitNotification';
import { RateLimitState } from '../../types/rateLimit';
import { rateLimiter } from '../../utils/rateLimiter';
import { useFetch } from '../../hooks/useFetch';
import { FleetList } from '@flightctl/types';

const SystemNotifications = () => {
  const { notification } = useRateLimitNotification();
  const [debugInfo, setDebugInfo] = React.useState(rateLimiter.getDebugInfo());
  const { get } = useFetch();
  const [isTriggeringRequests, setIsTriggeringRequests] = React.useState(false);

  // Update debug info periodically
  React.useEffect(() => {
    const interval = setInterval(() => {
      setDebugInfo(rateLimiter.getDebugInfo());
    }, 500); // Update every 500ms

    return () => clearInterval(interval);
  }, []);

  const triggerRateLimiting = async () => {
    setIsTriggeringRequests(true);
    console.log('[TEST] Triggering 6 rapid fleet requests...');

    // Trigger 6 requests in rapid succession
    const requests: Promise<void>[] = [];
    for (let i = 0; i < 6; i++) {
      console.log(`[TEST] Triggering request ${i + 1}/6`);
      requests.push(
        get<FleetList>('fleets?limit=1')
          .then(() => console.log(`[TEST] Request ${i + 1}/6 completed`))
          .catch(() => console.log(`[TEST] Request ${i + 1}/6 failed:`)),
      );
      // Small delay between triggers (100ms) to simulate rapid clicks
      if (i < 5) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    // Wait for all to complete
    await Promise.allSettled(requests);
    console.log('[TEST] All requests completed');
    setIsTriggeringRequests(false);
  };

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
      <div style={{ marginBottom: '12px' }}>
        <Button variant="danger" onClick={triggerRateLimiting} isDisabled={isTriggeringRequests} size="sm">
          {isTriggeringRequests ? 'Triggering requests...' : 'Trigger Rate Limiting (6 requests)'}
        </Button>
        <span style={{ marginLeft: '12px', fontSize: '12px', color: '#6a6e73' }}>
          Click to send 6 rapid fleet requests to force rate limiting
        </span>
      </div>
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
