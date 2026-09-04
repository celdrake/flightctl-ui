import * as React from 'react';
import { CardBody } from '@patternfly/react-core';
import CubesIcon from '@patternfly/react-icons/dist/js/icons/cubes-icon';

import { type Device } from '@flightctl/types';
import { useTranslation } from '../../../hooks/useTranslation';
import { useAppContext } from '../../../hooks/useAppContext';
import { getLifecycleDisabledReason } from '../../../utils/devices';
import { getDeviceAppLifecycleOverrides } from '../../../utils/applicationLifecycle';
import ApplicationsTable from '../../DetailsPage/Tables/ApplicationsTable';
import DetailsPageCard, { DetailsPageCardTitle } from '../../DetailsPage/DetailsPageCard';
import {
  MOCK_DEVICE_APPLICATIONS_SPECS,
  MOCK_DEVICE_APPLICATIONS_STATUS,
  MOCK_DEVICE_APP_LIFECYCLE_OVERRIDES,
  USE_MOCK_DEVICE_APPLICATIONS,
} from './mockDeviceApplications';

type DeviceDetailsTabProps = {
  device: Required<Device>;
  refetch?: VoidFunction;
};

const DeviceApplications = ({ device, refetch = () => undefined }: DeviceDetailsTabProps) => {
  const { t } = useTranslation();
  const {
    router: { useNavigate: useRouterNavigate },
  } = useAppContext();
  const routerNavigate = useRouterNavigate();

  const lifecycleDisabledReason = getLifecycleDisabledReason(device, t);
  const deviceAppLifecycleOverrides = USE_MOCK_DEVICE_APPLICATIONS
    ? MOCK_DEVICE_APP_LIFECYCLE_OVERRIDES
    : getDeviceAppLifecycleOverrides(device.metadata.annotations ?? {});
  const appsStatus = USE_MOCK_DEVICE_APPLICATIONS ? MOCK_DEVICE_APPLICATIONS_STATUS : device.status.applications;
  const appsSpecs = USE_MOCK_DEVICE_APPLICATIONS ? MOCK_DEVICE_APPLICATIONS_SPECS : device.spec.applications;

  const handleOpenConsole = React.useCallback(
    (name: string) => {
      routerNavigate(`../terminal?console=${encodeURIComponent(name)}`);
    },
    [routerNavigate],
  );

  return (
    <DetailsPageCard id="device-applications-card" isCompact>
      <DetailsPageCardTitle icon={<CubesIcon />}>{t('Applications')}</DetailsPageCardTitle>
      <CardBody>
        <ApplicationsTable
          deviceName={device.metadata.name as string}
          refetch={refetch}
          lifecycleDisabledReason={lifecycleDisabledReason}
          deviceAppLifecycleOverrides={deviceAppLifecycleOverrides}
          appsStatus={appsStatus}
          appsSpecs={appsSpecs}
          onOpenConsole={handleOpenConsole}
        />
      </CardBody>
    </DetailsPageCard>
  );
};

export default DeviceApplications;
