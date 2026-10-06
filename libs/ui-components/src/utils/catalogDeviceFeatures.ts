import type { OsModeType } from '@flightctl/types';
import type { DeviceFeatureBoolean, DeviceFeatures } from '@flightctl/types/alpha';

export const DEVICE_FEATURE_GPU_PRESENT = 'gpu.present';
export const DEVICE_FEATURE_KVM_ENABLED = 'kvm.enabled';
export const DEVICE_FEATURE_OS_MODE = 'os.mode';

const DEVICE_FEATURE_LABEL_PREFIX = 'feature.flightctl.io/';
export const DEVICE_FEATURE_LABEL_GPU_PRESENT = `${DEVICE_FEATURE_LABEL_PREFIX}${DEVICE_FEATURE_GPU_PRESENT}`;
export const DEVICE_FEATURE_LABEL_KVM_ENABLED = `${DEVICE_FEATURE_LABEL_PREFIX}${DEVICE_FEATURE_KVM_ENABLED}`;
export const DEVICE_FEATURE_LABEL_OS_MODE = `${DEVICE_FEATURE_LABEL_PREFIX}${DEVICE_FEATURE_OS_MODE}`;

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

export const deviceFeaturesFromApi = (features?: DeviceFeatures | null): DeviceFeaturesFormValues | null => {
  if (!features) {
    return null;
  }

  const form = getEmptyDeviceFeaturesFormValues();
  let hasSetFeatures = false;

  const gpuPresent = features[DEVICE_FEATURE_GPU_PRESENT] as DeviceFeatureBoolean | undefined;
  if (gpuPresent) {
    form.gpuPresent = gpuPresent;
    hasSetFeatures = true;
  }
  const kvmEnabled = features[DEVICE_FEATURE_KVM_ENABLED] as DeviceFeatureBoolean | undefined;
  if (kvmEnabled) {
    form.kvmEnabled = kvmEnabled;
    hasSetFeatures = true;
  }
  const osMode = features[DEVICE_FEATURE_OS_MODE] as OsModeType | undefined;
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
