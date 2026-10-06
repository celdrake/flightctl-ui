import { type Device, type DeviceStatus, OsModeType } from '@flightctl/types';
import { DeviceFeatureBoolean } from '@flightctl/types/alpha';

export const hasPackageModeCapability = (device: Device): boolean =>
  device.status?.systemInfo?.osMode === OsModeType.OsModePackage;

export const getGpuCapability = (deviceStatus?: DeviceStatus): DeviceFeatureBoolean | undefined => {
  const gpus = deviceStatus?.systemInfo?.gpus;
  if (!gpus) {
    return undefined;
  }
  return gpus.length > 0
    ? DeviceFeatureBoolean.DeviceFeatureBooleanTrue
    : DeviceFeatureBoolean.DeviceFeatureBooleanFalse;
};

export const getKvmCapability = (deviceStatus?: DeviceStatus): DeviceFeatureBoolean | undefined => {
  const kvm = deviceStatus?.systemInfo?.kvm;
  if (!kvm) {
    return undefined;
  }
  return kvm.enabled ? DeviceFeatureBoolean.DeviceFeatureBooleanTrue : DeviceFeatureBoolean.DeviceFeatureBooleanFalse;
};
