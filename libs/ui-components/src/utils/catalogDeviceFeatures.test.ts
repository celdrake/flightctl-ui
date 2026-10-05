import { describe, expect, it } from 'vitest';
import { DeviceFeatureBoolean } from '@flightctl/types/alpha';
import { OsModeType } from '@flightctl/types';

import {
  DEVICE_FEATURE_GPU_PRESENT,
  DEVICE_FEATURE_KVM_ENABLED,
  DEVICE_FEATURE_OS_MODE,
  deviceFeaturesFromApi,
  deviceFeaturesToApi,
  getDeviceFeatureRequirementLines,
  getEmptyDeviceFeaturesFormValues,
  hasKnownDeviceFeatureRequirements,
} from './catalogDeviceFeatures';

const t = (key: string) => key;

describe('catalogDeviceFeatures', () => {
  it.each([
    {
      name: 'When deviceFeatures is absent it should return empty form values',
      features: undefined,
      expected: getEmptyDeviceFeaturesFormValues(),
    },
    {
      name: 'When known include and exclude values are set it should map them to form fields',
      features: {
        [DEVICE_FEATURE_GPU_PRESENT]: DeviceFeatureBoolean.DeviceFeatureBooleanTrue,
        [DEVICE_FEATURE_KVM_ENABLED]: DeviceFeatureBoolean.DeviceFeatureBooleanFalse,
        [DEVICE_FEATURE_OS_MODE]: OsModeType.OsModeImage,
      },
      expected: {
        gpuPresent: DeviceFeatureBoolean.DeviceFeatureBooleanTrue,
        kvmEnabled: DeviceFeatureBoolean.DeviceFeatureBooleanFalse,
        osMode: OsModeType.OsModeImage,
      },
    },
    {
      name: 'When unknown keys are present it should ignore them',
      features: {
        [DEVICE_FEATURE_GPU_PRESENT]: DeviceFeatureBoolean.DeviceFeatureBooleanTrue,
        'custom.feature': 'enabled',
      },
      expected: {
        gpuPresent: DeviceFeatureBoolean.DeviceFeatureBooleanTrue,
        kvmEnabled: '',
        osMode: '',
      },
    },
    {
      name: 'When a known key has an invalid value it should treat it as unspecified',
      features: {
        [DEVICE_FEATURE_GPU_PRESENT]: 'maybe',
      },
      expected: getEmptyDeviceFeaturesFormValues(),
    },
  ])('$name', ({ features, expected }) => {
    expect(deviceFeaturesFromApi(features)).toEqual(expected);
  });

  it('When all known features are unspecified it should omit deviceFeatures from the API payload', () => {
    expect(deviceFeaturesToApi(getEmptyDeviceFeaturesFormValues())).toBeUndefined();
  });

  it('When known features are set it should emit dotted API keys', () => {
    expect(
      deviceFeaturesToApi({
        gpuPresent: DeviceFeatureBoolean.DeviceFeatureBooleanTrue,
        kvmEnabled: DeviceFeatureBoolean.DeviceFeatureBooleanFalse,
        osMode: OsModeType.OsModePackage,
      }),
    ).toEqual({
      [DEVICE_FEATURE_GPU_PRESENT]: DeviceFeatureBoolean.DeviceFeatureBooleanTrue,
      [DEVICE_FEATURE_KVM_ENABLED]: DeviceFeatureBoolean.DeviceFeatureBooleanFalse,
      [DEVICE_FEATURE_OS_MODE]: OsModeType.OsModePackage,
    });
  });

  it('When converting to API and back it should keep only known fields', () => {
    const original = {
      [DEVICE_FEATURE_KVM_ENABLED]: DeviceFeatureBoolean.DeviceFeatureBooleanFalse,
      'vendor.extra': 1,
    };
    expect(deviceFeaturesToApi(deviceFeaturesFromApi(original))).toEqual({
      [DEVICE_FEATURE_KVM_ENABLED]: DeviceFeatureBoolean.DeviceFeatureBooleanFalse,
    });
  });

  it('When no known requirements are set it should report none', () => {
    expect(hasKnownDeviceFeatureRequirements(getEmptyDeviceFeaturesFormValues())).toBe(false);
  });

  it('When known requirements are set it should format display lines', () => {
    expect(
      getDeviceFeatureRequirementLines(t, {
        [DEVICE_FEATURE_GPU_PRESENT]: DeviceFeatureBoolean.DeviceFeatureBooleanTrue,
        [DEVICE_FEATURE_KVM_ENABLED]: DeviceFeatureBoolean.DeviceFeatureBooleanFalse,
        [DEVICE_FEATURE_OS_MODE]: OsModeType.OsModeImage,
      }),
    ).toEqual([
      { label: 'GPU acceleration', constraint: 'required' },
      { label: 'KVM virtualization', constraint: 'must not be present' },
      { label: 'OS mode', constraint: 'Image' },
    ]);
  });
});
