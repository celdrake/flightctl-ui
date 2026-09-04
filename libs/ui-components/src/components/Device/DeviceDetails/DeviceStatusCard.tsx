import * as React from 'react';
import { CardBody, Stack, StackItem, Title } from '@patternfly/react-core';
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
            <Stack hasGutter>
              <StackItem>
                <Title headingLevel="h3" size="md">
                  {t('System status')}
                </Title>
              </StackItem>
              <StackItem>
                <StatusContent device={device} />
              </StackItem>
            </Stack>
          </StackItem>
          <StackItem>
            <Stack hasGutter>
              <StackItem>
                <Title headingLevel="h3" size="md">
                  {t('Resource status')}
                </Title>
              </StackItem>
              <StackItem>
                <SystemResourcesContent device={device} />
              </StackItem>
            </Stack>
          </StackItem>
        </Stack>
      </CardBody>
    </DetailsPageCard>
  );
};

export default DeviceStatusCard;
