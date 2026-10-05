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

export const getEmptyDeviceFeaturesFormValues = (): DeviceFeaturesFormValues => ({
  gpuPresent: '',
  kvmEnabled: '',
  osMode: '',
});

const parseBooleanFeature = (value: unknown): DeviceFeatureBoolean | undefined => {
  if (value === true || value === DeviceFeatureBoolean.DeviceFeatureBooleanTrue) {
    return DeviceFeatureBoolean.DeviceFeatureBooleanTrue;
  }
  if (value === false || value === DeviceFeatureBoolean.DeviceFeatureBooleanFalse) {
    return DeviceFeatureBoolean.DeviceFeatureBooleanFalse;
  }
  return undefined;
};

const parseOsMode = (value: unknown): OsModeType | undefined => {
  if (value === OsModeType.OsModeImage || value === OsModeType.OsModePackage) {
    return value;
  }
  return undefined;
};

export const deviceFeaturesFromApi = (features?: DeviceFeatures | null): DeviceFeaturesFormValues | null => {
  if (!features) {
    return null;
  }

  const form = getEmptyDeviceFeaturesFormValues();
  let hasSetFeatures = false;

  const gpuPresent = parseBooleanFeature(features[DEVICE_FEATURE_GPU_PRESENT]);
  if (gpuPresent) {
    form.gpuPresent = gpuPresent;
    hasSetFeatures = true;
  }
  const kvmEnabled = parseBooleanFeature(features[DEVICE_FEATURE_KVM_ENABLED]);
  if (kvmEnabled) {
    form.kvmEnabled = kvmEnabled;
    hasSetFeatures = true;
  }
  const osMode = parseOsMode(features[DEVICE_FEATURE_OS_MODE]);
  if (osMode) {
    form.osMode = osMode;
    hasSetFeatures = true;
  }

  return hasSetFeatures ? form : null;
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
