import * as React from 'react';
import { CardBody } from '@patternfly/react-core';
import CogIcon from '@patternfly/react-icons/dist/js/icons/cog-icon';

import { type Device } from '@flightctl/types';
import { useTranslation } from '../../../hooks/useTranslation';
import SystemdUnitsTable from '../../DetailsPage/Tables/SystemdUnitsTable';
import DetailsPageCard, { DetailsPageCardTitle } from '../../DetailsPage/DetailsPageCard';
import { MOCK_DEVICE_SYSTEMD_UNITS, USE_MOCK_DEVICE_SYSTEMD_UNITS } from './mockDeviceApplications';

type DeviceSystemdUnitsProps = {
  device: Required<Device>;
};

const DeviceSystemdUnits = ({ device }: DeviceSystemdUnitsProps) => {
  const { t } = useTranslation();
  const systemdUnitsStatus = USE_MOCK_DEVICE_SYSTEMD_UNITS ? MOCK_DEVICE_SYSTEMD_UNITS : device.status.systemd || [];

  return (
    <DetailsPageCard>
      <DetailsPageCardTitle icon={<CogIcon />}>{t('System services')}</DetailsPageCardTitle>
      <CardBody>
        <SystemdUnitsTable systemdUnitsStatus={systemdUnitsStatus} />
      </CardBody>
    </DetailsPageCard>
  );
};

export default DeviceSystemdUnits;
