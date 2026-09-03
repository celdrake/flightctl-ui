import * as React from 'react';
import { CardBody, CardTitle, Grid, GridItem, Stack, StackItem } from '@patternfly/react-core';

import { type Device } from '@flightctl/types';
import { useTranslation } from '../../../hooks/useTranslation';
import { useDeviceSpecSystemInfo } from '../../../hooks/useDeviceSpecSystemInfo';
import DetailsPageCard from '../../DetailsPage/DetailsPageCard';
import ConfigurationsContent from './DeviceDetailsTabContent/ConfigurationsContent';

import './DeviceDetailsTab.css';

const DeviceSpecificationsCard = ({ device }: { device: Required<Device> }) => {
  const { t } = useTranslation();
  const devSystemInfo = useDeviceSpecSystemInfo(device.status, t);

  return (
    <DetailsPageCard>
      <CardTitle>{t('Device specifications')}</CardTitle>
      <CardBody>
        <Stack hasGutter>
          {devSystemInfo.baseInfo.length > 0 && (
            <StackItem>
              <Grid hasGutter>
                {devSystemInfo.baseInfo.map((systemInfo) => (
                  <GridItem span={12} key={systemInfo.title}>
                    <Stack>
                      <StackItem className="fctl-device-details-tab__label">{systemInfo.title}</StackItem>
                      <StackItem>{systemInfo.value}</StackItem>
                    </Stack>
                  </GridItem>
                ))}
              </Grid>
            </StackItem>
          )}
          <StackItem>
            <ConfigurationsContent device={device} embedded />
          </StackItem>
        </Stack>
      </CardBody>
    </DetailsPageCard>
  );
};

export default DeviceSpecificationsCard;
