import * as React from 'react';
import { Alert, Label } from '@patternfly/react-core';
import { useRateLimitNotification } from '../../hooks/useRateLimitNotification';
import { RateLimitState } from '../../types/rateLimit';

const SystemNotifications = () => {
  const { notification } = useRateLimitNotification();

  if (!notification) {
    return null;
  }

  const variant = notification.level === 'critical' ? 'danger' : 'warning';

  const getStateLabel = () => {
    if (notification.state === RateLimitState.Throttled) {
      return <Label color="red">Throttled</Label>;
    }
    if (notification.state === RateLimitState.Recovering) {
      return <Label color="orange">Recovering</Label>;
    }
    return null;
  };

  return (
    <Alert
      className="pf-v5-u-mx-lg"
      variant={variant}
      isInline
      title={
        <>
          {notification.message} {getStateLabel()}
        </>
      }
    />
  );
};

export default SystemNotifications;
