import * as React from 'react';
import { CardBody, CardTitle, Grid, GridItem, Stack, StackItem } from '@patternfly/react-core';

import { type Device } from '@flightctl/types';
import { useTranslation } from '../../../hooks/useTranslation';
import { useDeviceSpecSystemInfo } from '../../../hooks/useDeviceSpecSystemInfo';
import DetailsPageCard from '../../DetailsPage/DetailsPageCard';

import './DeviceDetailsTab.css';

const DeviceCustomDataCard = ({ device }: { device: Required<Device> }) => {
  const { t } = useTranslation();
  const devSystemInfo = useDeviceSpecSystemInfo(device.status, t);

  if (devSystemInfo.customInfo.length === 0) {
    return null;
  }

  return (
    <DetailsPageCard>
      <CardTitle>{t('Custom data')}</CardTitle>
      <CardBody>
        <Grid hasGutter>
          {devSystemInfo.customInfo.map((systemInfo) => (
            <GridItem span={12} key={systemInfo.title}>
              <Stack>
                <StackItem className="fctl-device-details-tab__label">{systemInfo.title}</StackItem>
                <StackItem>{systemInfo.value}</StackItem>
              </Stack>
            </GridItem>
          ))}
        </Grid>
      </CardBody>
    </DetailsPageCard>
  );
};

export default DeviceCustomDataCard;
