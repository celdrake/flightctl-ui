import { DeviceFeatureBoolean, type DeviceFeatures } from '@flightctl/types/alpha';
import { OsModeType } from '@flightctl/types';

export const DEVICE_FEATURE_GPU_PRESENT = 'gpu.present';
export const DEVICE_FEATURE_KVM_ENABLED = 'kvm.enabled';
export const DEVICE_FEATURE_OS_MODE = 'os.mode';

export type DeviceFeatureBooleanFormValue = '' | DeviceFeatureBoolean;
export type DeviceFeatureOsModeFormValue = '' | OsModeType;

export type DeviceFeaturesFormValues = {
  gpuPresent: DeviceFeatureBooleanFormValue;
  kvmEnabled: DeviceFeatureBooleanFormValue;
  osMode: DeviceFeatureOsModeFormValue;
};

export type DeviceFeatureRequirementLine = {
  label: string;
  constraint: string;
};

export const getEmptyDeviceFeaturesFormValues = (): DeviceFeaturesFormValues => ({
  gpuPresent: '',
  kvmEnabled: '',
  osMode: '',
});

const isDeviceFeatureSet = (value: unknown): value is DeviceFeatureBoolean =>
  value === DeviceFeatureBoolean.DeviceFeatureBooleanTrue || value === DeviceFeatureBoolean.DeviceFeatureBooleanFalse;

const isOsModeType = (value: unknown): value is OsModeType =>
  value === OsModeType.OsModeImage || value === OsModeType.OsModePackage;

export const deviceFeaturesFromApi = (features?: DeviceFeatures | null): DeviceFeaturesFormValues | null => {
  if (!features) {
    return null;
  }

  const form = getEmptyDeviceFeaturesFormValues();

  // Features can either be set to true (must be present) or false (must be absent), or not set at all.
  let hasSetFeatures = false;
  const gpuPresent = features[DEVICE_FEATURE_GPU_PRESENT];
  if (isDeviceFeatureSet(gpuPresent)) {
    form.gpuPresent = gpuPresent;
    hasSetFeatures = true;
  }
  const kvmEnabled = features[DEVICE_FEATURE_KVM_ENABLED];
  if (isDeviceFeatureSet(kvmEnabled)) {
    form.kvmEnabled = kvmEnabled;
    hasSetFeatures = true;
  }
  const osMode = features[DEVICE_FEATURE_OS_MODE];
  if (isOsModeType(osMode)) {
    form.osMode = osMode;
    hasSetFeatures = true;
  }

  return form;
};

export const deviceFeaturesToApi = (form: DeviceFeaturesFormValues | null): DeviceFeatures | undefined => {
  if (!form) {
    return undefined;
  }
  const result: DeviceFeatures = {};
  if (form.gpuPresent) {
    result[DEVICE_FEATURE_GPU_PRESENT] = form.gpuPresent;
  }
  if (form.kvmEnabled) {
    result[DEVICE_FEATURE_KVM_ENABLED] = form.kvmEnabled;
  }
  if (form.osMode) {
    result[DEVICE_FEATURE_OS_MODE] = form.osMode;
  }
  return Object.keys(result).length > 0 ? result : undefined;
};
