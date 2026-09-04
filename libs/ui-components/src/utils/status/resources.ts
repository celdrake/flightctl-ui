import { DeviceResourceStatusType } from '@flightctl/types';
import { type StatusLevel } from './common';

const DEVICE_RESOURCE_STATUS_LEVELS: Record<DeviceResourceStatusType, StatusLevel> = {
  [DeviceResourceStatusType.DeviceResourceStatusCritical]: 'danger',
  [DeviceResourceStatusType.DeviceResourceStatusError]: 'danger',
  [DeviceResourceStatusType.DeviceResourceStatusWarning]: 'warning',
  [DeviceResourceStatusType.DeviceResourceStatusHealthy]: 'success',
  [DeviceResourceStatusType.DeviceResourceStatusUnknown]: 'unknown',
};

export const getDeviceResourceStatusLevel = (status?: DeviceResourceStatusType): StatusLevel =>
  (status && DEVICE_RESOURCE_STATUS_LEVELS[status]) || 'unknown';
