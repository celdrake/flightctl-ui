import * as React from 'react';
import { DescriptionListDescription, DescriptionListGroup, DescriptionListTerm } from '@patternfly/react-core';
import type { TFunction } from 'react-i18next';

import { type Device, DeviceIntegrityStatusSummaryType, DeviceResourceStatusType } from '@flightctl/types';

import LabelWithHelperText from '../../common/WithHelperText';
import ApplicationSummaryStatus from '../../Status/ApplicationSummaryStatus';
import DeviceStatus from '../../Status/DeviceStatus';
import SystemUpdateStatus from '../../Status/SystemUpdateStatus';
import IntegrityStatus from '../../Status/IntegrityStatus';
import DeviceResourceStatus, { MonitorType } from '../../Status/DeviceResourceStatus';
import { type StatusLevel, getDefaultStatusColor } from '../../../utils/status/common';
import { getApplicationSummaryStatusItems } from '../../../utils/status/applications';
import { getDeviceStatusItems, getDeviceSummaryStatus } from '../../../utils/status/devices';
import { getSystemUpdateStatusItems } from '../../../utils/status/system';
import { getIntegrityStatusItems } from '../../../utils/status/integrity';

export type DeviceStatusField = {
  id: string;
  term: React.ReactNode;
  level: StatusLevel;
  value: React.ReactNode;
};

const RESOURCE_LEVEL: Record<DeviceResourceStatusType, StatusLevel> = {
  [DeviceResourceStatusType.DeviceResourceStatusHealthy]: 'success',
  [DeviceResourceStatusType.DeviceResourceStatusWarning]: 'warning',
  [DeviceResourceStatusType.DeviceResourceStatusCritical]: 'danger',
  [DeviceResourceStatusType.DeviceResourceStatusError]: 'danger',
  [DeviceResourceStatusType.DeviceResourceStatusUnknown]: 'unknown',
};

// TODO REVIEW FILE
export const useDeviceOverviewStatusFields = (device: Required<Device>, t: TFunction) => {
  const applicationStatusItem = getApplicationSummaryStatusItems(t).find(
    (item) => item.id === device.status.applicationsSummary?.status,
  );
  const deviceStatusItem = getDeviceStatusItems(t).find(
    (item) => item.id === getDeviceSummaryStatus(device.status.summary),
  );
  const updateStatusItem = getSystemUpdateStatusItems(t).find((item) => item.id === device.status.updated?.status);
  const integrityStatusId =
    device.status.integrity?.status || DeviceIntegrityStatusSummaryType.DeviceIntegrityStatusUnknown;
  const integrityStatusItem = getIntegrityStatusItems(t).find((item) => item.id === integrityStatusId);

  const systemFields: DeviceStatusField[] = [
    {
      id: 'application',
      term: (
        <LabelWithHelperText
          label={t('Application status')}
          content={t('Indicates the overall status of application workloads on the device.')}
        />
      ),
      level: applicationStatusItem?.level || 'unknown',
      value: <ApplicationSummaryStatus statusSummary={device.status.applicationsSummary} />,
    },
    {
      id: 'device',
      term: (
        <LabelWithHelperText
          label={t('Device status')}
          content={t('Indicates the overall status of the device hardware and operating system.')}
        />
      ),
      level: deviceStatusItem?.level || 'unknown',
      value: <DeviceStatus deviceStatus={device.status} />,
    },
    {
      id: 'update',
      term: (
        <LabelWithHelperText
          label={t('Update status')}
          content={t(
            'Indicates whether a system is running the latest target configuration or is updating towards it.',
          )}
        />
      ),
      level: updateStatusItem?.level || 'unknown',
      value: <SystemUpdateStatus deviceStatus={device.status} />,
    },
    {
      id: 'integrity',
      term: (
        <LabelWithHelperText
          label={t('Integrity status')}
          content={t('Indicates whether the device has been verified as secure and authentic.')}
        />
      ),
      level: integrityStatusItem?.level || 'unknown',
      value: <IntegrityStatus integrityStatus={device.status.integrity} />,
    },
  ];

  const resourceFields: DeviceStatusField[] = [
    {
      id: 'cpu',
      term: t('CPU pressure'),
      level: device.status.resources?.cpu ? RESOURCE_LEVEL[device.status.resources.cpu] : 'unknown',
      value: <DeviceResourceStatus device={device} monitorType={MonitorType.cpu} />,
    },
    {
      id: 'disk',
      term: t('Disk pressure'),
      level: device.status.resources?.disk ? RESOURCE_LEVEL[device.status.resources.disk] : 'unknown',
      value: <DeviceResourceStatus device={device} monitorType={MonitorType.disk} />,
    },
    {
      id: 'memory',
      term: t('Memory pressure'),
      level: device.status.resources?.memory ? RESOURCE_LEVEL[device.status.resources.memory] : 'unknown',
      value: <DeviceResourceStatus device={device} monitorType={MonitorType.memory} />,
    },
  ];

  return { systemFields, resourceFields };
};

export const DeviceStatusFieldGroup = ({ field }: { field: DeviceStatusField }) => {
  const isProblem = field.level === 'danger' || field.level === 'warning';

  return (
    <DescriptionListGroup
      className={isProblem ? 'fctl-device-status-field--problem' : undefined}
      style={
        isProblem
          ? {
              borderInlineStart: `3px solid ${getDefaultStatusColor(field.level)}`,
              paddingInlineStart: 'var(--pf-t--global--spacer--sm)',
            }
          : undefined
      }
    >
      <DescriptionListTerm>{field.term}</DescriptionListTerm>
      <DescriptionListDescription>{field.value}</DescriptionListDescription>
    </DescriptionListGroup>
  );
};
