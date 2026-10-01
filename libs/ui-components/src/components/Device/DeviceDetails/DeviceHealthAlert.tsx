import * as React from 'react';
import { Alert, Button, List, ListItem } from '@patternfly/react-core';

import { useTranslation } from '../../../hooks/useTranslation';
import type { DeviceHealthItem, DeviceOverallHealth } from '../../../hooks/useDeviceOverallHealth';

const DEVICE_STATUS_CARD_ID = 'device-status-card';
const DEVICE_APPLICATIONS_CARD_ID = 'device-applications-card';
const DEVICE_INFORMATION_CARD_ID = 'device-information-card';
const DEVICE_CUSTOM_DATA_CARD_ID = 'device-custom-data-card';

const scrollToSection = (targetId: string) => {
  requestAnimationFrame(() => {
    document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
};

const DeviceHealthAlertLink = ({ healthItem }: { healthItem: DeviceHealthItem }) => {
  const { t } = useTranslation();
  const { type, itemCount } = healthItem;
  if (itemCount === 0) {
    return null;
  }
  const targetId = type === 'apps' ? DEVICE_APPLICATIONS_CARD_ID : DEVICE_STATUS_CARD_ID;
  return (
    <Button variant="link" isInline onClick={() => scrollToSection(targetId)}>
      {type === 'apps'
        ? t('{{count}} application issues', { count: itemCount })
        : t('{{count}} status issues', { count: itemCount })}
    </Button>
  );
};

type DeviceHealthAlertProps = {
  deviceHealth: DeviceOverallHealth;
  systemInfoHasErrors?: boolean;
  customInfoHasErrors?: boolean;
};

const DeviceHealthAlert = ({
  deviceHealth,
  systemInfoHasErrors = false,
  customInfoHasErrors = false,
}: DeviceHealthAlertProps) => {
  const { t } = useTranslation();
  const alertRef = React.useRef<HTMLDivElement>(null);

  const hasReportingErrors = systemInfoHasErrors || customInfoHasErrors;
  const hasDeviceHealthIssues = deviceHealth.level !== null;

  // PatternFly Alert manages expand state internally (defaults collapsed); expand on mount so jump links are visible.
  React.useLayoutEffect(() => {
    const toggle = alertRef.current?.querySelector<HTMLButtonElement>('.pf-v6-c-alert__toggle button');
    if (toggle?.getAttribute('aria-expanded') !== 'true') {
      toggle?.click();
    }
  }, []);

  if (!hasDeviceHealthIssues && !hasReportingErrors) {
    return null;
  }

  const { statusHealth, appsHealth } = deviceHealth;
  // Keep danger if status/apps already danger; otherwise warning when only reporting errors
  const variant = deviceHealth.level === 'danger' ? 'danger' : 'warning';

  return (
    <div ref={alertRef}>
      <Alert variant={variant} isInline isExpandable title={t('Issues detected')}>
        <List isPlain>
          {statusHealth.itemCount > 0 && (
            <ListItem>
              <DeviceHealthAlertLink healthItem={statusHealth} />
            </ListItem>
          )}
          {appsHealth.itemCount > 0 && (
            <ListItem>
              <DeviceHealthAlertLink healthItem={appsHealth} />
            </ListItem>
          )}
          {systemInfoHasErrors && (
            <ListItem>
              <Button variant="link" isInline onClick={() => scrollToSection(DEVICE_INFORMATION_CARD_ID)}>
                {t('System information reporting is stale')}
              </Button>
            </ListItem>
          )}
          {customInfoHasErrors && (
            <ListItem>
              <Button variant="link" isInline onClick={() => scrollToSection(DEVICE_CUSTOM_DATA_CARD_ID)}>
                {t('Custom data reporting is stale')}
              </Button>
            </ListItem>
          )}
        </List>
      </Alert>
    </div>
  );
};

export default DeviceHealthAlert;
