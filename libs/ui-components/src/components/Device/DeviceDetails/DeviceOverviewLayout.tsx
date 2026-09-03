import * as React from 'react';
import { Grid, GridItem, Stack, StackItem } from '@patternfly/react-core';

import { type Device } from '@flightctl/types';
import { useVulnerabilitiesEnabled } from '../../../hooks/useServicesEnabled';
import { useDeviceSpecSystemInfo } from '../../../hooks/useDeviceSpecSystemInfo';
import { useTranslation } from '../../../hooks/useTranslation';
import DeviceInformationCard from './DeviceInformationCard';
import DeviceSpecificationsCard from './DeviceSpecificationsCard';
import DeviceCustomDataCard from './DeviceCustomDataCard';
import DeviceStatusCard from './DeviceStatusCard';
import DeviceApplications from './DeviceApplications';
import DeviceVulnerabilities from './DeviceVulnerabilities';
import DeviceSystemdUnits from './DeviceSystemdUnits';

import './DeviceDetailsTab.css';

type DeviceOverviewLayoutProps = {
  device: Required<Device>;
  refetch: VoidFunction;
  canEdit: boolean;
};

const DeviceOverviewLayout = ({
  device,
  refetch,
  canEdit,
  children,
}: React.PropsWithChildren<DeviceOverviewLayoutProps>) => {
  const { t } = useTranslation();
  const [vulnerabilitiesEnabled, canListVulnerabilities] = useVulnerabilitiesEnabled();
  const showVulnerabilities = vulnerabilitiesEnabled && canListVulnerabilities;
  const devSystemInfo = useDeviceSpecSystemInfo(device.status, t);
  const hasCustomData = devSystemInfo.customInfo.length > 0;

  return (
    <Grid hasGutter>
      <GridItem lg={8}>
        <Stack hasGutter>
          <StackItem>
            <DeviceStatusCard device={device} />
          </StackItem>
          <StackItem>
            <DeviceApplications device={device} refetch={refetch} />
          </StackItem>
          {showVulnerabilities && (
            <StackItem>
              <DeviceVulnerabilities deviceId={device.metadata.name as string} />
            </StackItem>
          )}
          <StackItem className="fctl-device-overview__systemd-wide">
            <DeviceSystemdUnits device={device} />
          </StackItem>
        </Stack>
      </GridItem>
      <GridItem lg={4}>
        <Stack hasGutter>
          <StackItem>
            <DeviceInformationCard device={device} refetch={refetch} canEdit={canEdit}>
              {children}
            </DeviceInformationCard>
          </StackItem>
          <StackItem>
            <DeviceSpecificationsCard device={device} />
          </StackItem>
          {hasCustomData && (
            <StackItem>
              <DeviceCustomDataCard device={device} />
            </StackItem>
          )}
        </Stack>
      </GridItem>
      <GridItem md={12} className="fctl-device-overview__systemd-narrow">
        <DeviceSystemdUnits device={device} />
      </GridItem>
    </Grid>
  );
};

export default DeviceOverviewLayout;
