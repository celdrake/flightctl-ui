import * as React from 'react';

import { AllDeviceSummaryStatusType, FlightCtlLabel } from '../../../../types/extraTypes';

import { useTranslation } from '../../../../hooks/useTranslation';
import { getDeviceStatusHelperText } from '../../../Status/utils';
import { getDeviceStatusItems } from '../../../../utils/status/devices';
import { FilterSearchParams } from '../../../../utils/status/devices';
import { toOverviewChartData } from './utils';
import DonutChart from '../../../charts/DonutChart';

const DeviceStatusChart = ({
  deviceStatus,
  labels,
  fleets,
}: {
  deviceStatus: Record<string, number>;
  labels: FlightCtlLabel[];
  fleets: string[];
}) => {
  const { t } = useTranslation();

  const statusItems = getDeviceStatusItems(t);

  // TODO should we add the "Pending" devices, now that the Device table does not contain ERs?
  const devStatusData = toOverviewChartData<AllDeviceSummaryStatusType>(
    deviceStatus,
    statusItems,
    labels,
    fleets,
    FilterSearchParams.DeviceStatus,
  );

  return <DonutChart title={t('Device status')} data={devStatusData} helperText={getDeviceStatusHelperText(t)} />;
};

export default DeviceStatusChart;
