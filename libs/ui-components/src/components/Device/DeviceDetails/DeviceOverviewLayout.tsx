import * as React from 'react';
import { Grid, GridItem, Stack, StackItem } from '@patternfly/react-core';

import { type Device } from '@flightctl/types';
import { useDeviceCustomInfo, useDeviceSpecSystemInfo } from '../../../hooks/useDeviceSpecSystemInfo';
import { useDeviceOverallHealth } from '../../../hooks/useDeviceOverallHealth';
import { useTranslation } from '../../../hooks/useTranslation';
import { useVulnerabilitiesEnabled } from '../../../hooks/useServicesEnabled';
import DeviceApplications from './DeviceApplications';
import DeviceCustomDataCard from './DeviceCustomDataCard';
import DeviceHealthAlert from './DeviceHealthAlert';
import DeviceIdentityCard from './DeviceIdentityCard';
import DeviceInformationCard from './DeviceInformationCard';
import DeviceStatusCard from './DeviceStatusCard';
import DeviceSystemdUnits from './DeviceSystemdUnits';
import DeviceVulnerabilities from './DeviceVulnerabilities';
import {
  type SystemInfoDemoOptions,
  SystemInfoDemoOptionsBar,
  SystemInfoDemoOptionsProvider,
  useDemoSystemInfoStatus,
} from './SystemInfoDemoOptions';

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
  const deviceHealth = useDeviceOverallHealth(device);
  const [vulnerabilitiesEnabled, canListVulnerabilities] = useVulnerabilitiesEnabled();
  const showVulnerabilities = vulnerabilitiesEnabled && canListVulnerabilities;

  // TEMP demo toggles — revert after colleague demos
  const [demoOptions, setDemoOptions] = React.useState<SystemInfoDemoOptions>({
    shortChangedLabel: false,
    prettifyNames: true,
    showDeviceReportedInfo: false,
    simulateReportingVariants: false,
  });

  return (
    <SystemInfoDemoOptionsProvider value={demoOptions}>
      <DeviceOverviewLayoutContent
        device={device}
        refetch={refetch}
        canEdit={canEdit}
        deviceHealth={deviceHealth}
        showVulnerabilities={showVulnerabilities}
        demoOptions={demoOptions}
        setDemoOptions={setDemoOptions}
      >
        {children}
      </DeviceOverviewLayoutContent>
    </SystemInfoDemoOptionsProvider>
  );
};

// Inner content so useDemoSystemInfoStatus can read the provider above
const DeviceOverviewLayoutContent = ({
  device,
  refetch,
  canEdit,
  deviceHealth,
  showVulnerabilities,
  demoOptions,
  setDemoOptions,
  children,
}: React.PropsWithChildren<{
  device: Required<Device>;
  refetch: VoidFunction;
  canEdit: boolean;
  deviceHealth: ReturnType<typeof useDeviceOverallHealth>;
  showVulnerabilities: boolean;
  demoOptions: SystemInfoDemoOptions;
  setDemoOptions: React.Dispatch<React.SetStateAction<SystemInfoDemoOptions>>;
}>) => {
  const { t } = useTranslation();
  const systemInfoStatus = useDemoSystemInfoStatus(device.status?.systemInfo, device.status?.systemInfoStatus);
  const { entries: customInfoEntries, reporting: customInfoReporting } = useDeviceCustomInfo(
    device.status?.systemInfo,
    t,
    systemInfoStatus,
  );
  // Device information computes its own list; reuse the same demo status for the page-alert summary
  const { reporting: systemInfoReporting } = useDeviceSpecSystemInfo(device.status?.systemInfo, t, systemInfoStatus);

  return (
    <Stack hasGutter>
      <DeviceHealthAlert
        deviceHealth={deviceHealth}
        systemInfoHasErrors={systemInfoReporting.hasErrors}
        customInfoHasErrors={customInfoReporting.hasErrors}
      />
      <StackItem>
        <SystemInfoDemoOptionsBar options={demoOptions} onChange={setDemoOptions} />
      </StackItem>
      <Grid hasGutter>
        <GridItem lg={8}>
          <Stack hasGutter>
            <StackItem>
              <DeviceStatusCard device={device} health={deviceHealth.statusHealth} />
            </StackItem>
            <StackItem>
              <DeviceApplications device={device} health={deviceHealth.appsHealth} refetch={refetch} />
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
              <DeviceIdentityCard device={device} refetch={refetch} canEdit={canEdit}>
                {children}
              </DeviceIdentityCard>
            </StackItem>
            <StackItem>
              <DeviceInformationCard device={device} />
            </StackItem>
            {customInfoEntries.length > 0 && (
              <StackItem>
                <DeviceCustomDataCard entries={customInfoEntries} reporting={customInfoReporting} />
              </StackItem>
            )}
          </Stack>
        </GridItem>
        <GridItem md={12} className="fctl-device-overview__systemd-narrow">
          <DeviceSystemdUnits device={device} />
        </GridItem>
      </Grid>
    </Stack>
  );
};

export default DeviceOverviewLayout;
