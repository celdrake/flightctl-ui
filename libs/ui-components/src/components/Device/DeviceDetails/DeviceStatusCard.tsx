import * as React from 'react';
import { CardBody, Stack, StackItem } from '@patternfly/react-core';
import TachometerAltIcon from '@patternfly/react-icons/dist/js/icons/tachometer-alt-icon';

import { type Device } from '@flightctl/types';
import { useTranslation } from '../../../hooks/useTranslation';
import DetailsPageCard, { DetailsPageCardTitle } from '../../DetailsPage/DetailsPageCard';
import StatusContent from './DeviceDetailsTabContent/StatusContent';
import SystemResourcesContent from './DeviceDetailsTabContent/SystemResourcesContent';

const DEVICE_STATUS_CARD_ID = 'device-status-card';

const DeviceStatusCard = ({ device }: { device: Required<Device> }) => {
  const { t } = useTranslation();

  return (
    <DetailsPageCard id={DEVICE_STATUS_CARD_ID}>
      <DetailsPageCardTitle icon={<TachometerAltIcon />}>{t('Status')}</DetailsPageCardTitle>
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
