import * as React from 'react';
import { CardBody, CardTitle, Stack, StackItem } from '@patternfly/react-core';

import { type Device } from '@flightctl/types';
import { useTranslation } from '../../../hooks/useTranslation';
import DetailsPageCard from '../../DetailsPage/DetailsPageCard';
import StatusContent from './DeviceDetailsTabContent/StatusContent';
import SystemResourcesContent from './DeviceDetailsTabContent/SystemResourcesContent';

const DEVICE_STATUS_CARD_ID = 'device-status-card';

const DeviceStatusCard = ({ device }: { device: Required<Device> }) => {
  const { t } = useTranslation();

  return (
    <DetailsPageCard id={DEVICE_STATUS_CARD_ID}>
      <CardTitle>{t('Status')}</CardTitle>
      <CardBody>
        <Stack hasGutter>
          <StackItem>
            <StatusContent device={device} embedded />
          </StackItem>
          <StackItem>
            <SystemResourcesContent device={device} embedded />
          </StackItem>
        </Stack>
      </CardBody>
    </DetailsPageCard>
  );
};

export default DeviceStatusCard;
