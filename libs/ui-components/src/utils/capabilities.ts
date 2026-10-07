import { type Device, type DeviceStatus, OsModeType } from '@flightctl/types';
import { DeviceFeatureBoolean } from '@flightctl/types/alpha';

import type { DeviceFeatureFilter, DeviceFeatureId } from './status/devices';

export const hasPackageModeCapability = (device: Device): boolean =>
  device.status?.systemInfo?.osMode === OsModeType.OsModePackage;

export const getGpuFeature = (deviceStatus?: DeviceStatus): DeviceFeatureBoolean | undefined => {
  const gpus = deviceStatus?.systemInfo?.gpus;
  if (!gpus) {
    return undefined;
  }
  return gpus.length > 0
    ? DeviceFeatureBoolean.DeviceFeatureBooleanTrue
    : DeviceFeatureBoolean.DeviceFeatureBooleanFalse;
};

export const getKvmFeature = (deviceStatus?: DeviceStatus): DeviceFeatureBoolean | undefined => {
  const kvm = deviceStatus?.systemInfo?.kvm;
  if (!kvm) {
    return undefined;
  }
  return kvm.enabled ? DeviceFeatureBoolean.DeviceFeatureBooleanTrue : DeviceFeatureBoolean.DeviceFeatureBooleanFalse;
};

export const getOsModeFeature = (deviceStatus?: DeviceStatus): DeviceFeatureBoolean | undefined => {
  const osMode = deviceStatus?.systemInfo?.osMode;
  if (osMode === OsModeType.OsModeImage) {
    return DeviceFeatureBoolean.DeviceFeatureBooleanTrue;
  }
  if (osMode === OsModeType.OsModePackage) {
    return DeviceFeatureBoolean.DeviceFeatureBooleanFalse;
  }
  return undefined;
};

export const getDeviceReportedFeatures = (
  deviceStatus: DeviceStatus,
): Partial<Record<DeviceFeatureId, DeviceFeatureBoolean | undefined>> => {
  return {
    gpuPresent: getGpuFeature(deviceStatus),
    kvmEnabled: getKvmFeature(deviceStatus),
    osMode: getOsModeFeature(deviceStatus),
  };
};

/** Whether the device meets all of the feature requirements. Returns undefined if at least one of the requirements is not reported. */
export const deviceMeetsFeatureRequirements = (
  deviceStatus: DeviceStatus,
  featureFilters: DeviceFeatureFilter[],
): DeviceFeatureBoolean | undefined => {
  const reported = getDeviceReportedFeatures(deviceStatus);
  const findings = featureFilters.reduce(
    (findings, filter) => {
      const { fieldId, values } = filter;
      const reportedValue = reported[fieldId];
      if (reportedValue === undefined) {
        findings.unknown++;
      } else if (reportedValue === values[0]) {
        findings.meet++;
      } else {
        findings.notMet++;
      }
      return findings;
    },
    {
      meet: 0,
      notMet: 0,
      unknown: 0,
    },
  );
  if (findings.unknown > 0) {
    return undefined;
  }
  if (findings.notMet > 0) {
    return DeviceFeatureBoolean.DeviceFeatureBooleanFalse;
  }
  return DeviceFeatureBoolean.DeviceFeatureBooleanTrue;
};
