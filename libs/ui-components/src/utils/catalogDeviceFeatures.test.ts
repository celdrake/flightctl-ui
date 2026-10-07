import { describe, expect, it } from 'vitest';
import { DeviceFeatureBoolean } from '@flightctl/types/alpha';
import { OsModeType } from '@flightctl/types';

import {
  DEVICE_FEATURE_GPU_PRESENT,
  DEVICE_FEATURE_KVM_ENABLED,
  DEVICE_FEATURE_OS_MODE,
  deviceFeaturesFromApi,
  deviceFeaturesToApi,
  deviceFeaturesToFilters,
  getEmptyDeviceFeaturesFormValues,
  mergeDeviceFeatureFilters,
  OS_EXCLUDE_PACKAGE_MODE_FILTERS,
} from './catalogDeviceFeatures';
import { UNKNOWN_CAPABILITY_VALUE } from './status/devices';

describe('catalogDeviceFeatures', () => {
  it.each([
    {
      name: 'When deviceFeatures is absent it should return null',
      features: undefined,
      expected: null,
    },
    {
      name: 'When deviceFeatures is empty it should return null',
      features: {},
      expected: null,
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
      name: 'When boolean true or false is set it should map them to feature enums',
      features: {
        [DEVICE_FEATURE_GPU_PRESENT]: true,
        [DEVICE_FEATURE_KVM_ENABLED]: false,
      },
      expected: {
        gpuPresent: DeviceFeatureBoolean.DeviceFeatureBooleanTrue,
        kvmEnabled: DeviceFeatureBoolean.DeviceFeatureBooleanFalse,
        osMode: '',
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
      expected: null,
    },
  ])('$name', ({ features, expected }) => {
    expect(deviceFeaturesFromApi(features)).toEqual(expected);
  });

  it('When all known features are unspecified it should omit deviceFeatures from the API payload', () => {
    expect(deviceFeaturesToApi(getEmptyDeviceFeaturesFormValues())).toBeUndefined();
    expect(deviceFeaturesToApi(null)).toBeUndefined();
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

  it.each([
    {
      name: 'When deviceFeatures is absent it should return null',
      features: undefined,
      expected: null,
    },
    {
      name: 'When deviceFeatures is empty it should return null',
      features: {},
      expected: null,
    },
    {
      name: 'When known features are set it should return sparse filters with os.mode as boolean',
      features: {
        [DEVICE_FEATURE_GPU_PRESENT]: DeviceFeatureBoolean.DeviceFeatureBooleanTrue,
        [DEVICE_FEATURE_KVM_ENABLED]: DeviceFeatureBoolean.DeviceFeatureBooleanFalse,
        [DEVICE_FEATURE_OS_MODE]: OsModeType.OsModeImage,
      },
      expected: [
        { fieldId: 'gpuPresent', values: [DeviceFeatureBoolean.DeviceFeatureBooleanTrue] },
        { fieldId: 'kvmEnabled', values: [DeviceFeatureBoolean.DeviceFeatureBooleanFalse] },
        { fieldId: 'osMode', values: [DeviceFeatureBoolean.DeviceFeatureBooleanTrue] },
      ],
    },
    {
      name: 'When os.mode is package it should map to filter false',
      features: {
        [DEVICE_FEATURE_OS_MODE]: OsModeType.OsModePackage,
      },
      expected: [{ fieldId: 'osMode', values: [DeviceFeatureBoolean.DeviceFeatureBooleanFalse] }],
    },
  ])('$name', ({ features, expected }) => {
    expect(deviceFeaturesToFilters(features)).toEqual(expected);
  });

  it('When merging OS exclude with requirements it should let requirements override osMode', () => {
    expect(
      mergeDeviceFeatureFilters(OS_EXCLUDE_PACKAGE_MODE_FILTERS, [
        { fieldId: 'osMode', values: [DeviceFeatureBoolean.DeviceFeatureBooleanTrue] },
        { fieldId: 'gpuPresent', values: [DeviceFeatureBoolean.DeviceFeatureBooleanTrue] },
      ]),
    ).toEqual([
      { fieldId: 'osMode', values: [DeviceFeatureBoolean.DeviceFeatureBooleanTrue] },
      { fieldId: 'gpuPresent', values: [DeviceFeatureBoolean.DeviceFeatureBooleanTrue] },
    ]);
  });

  it('When OS exclude package filters are used they should keep image and unknown', () => {
    expect(OS_EXCLUDE_PACKAGE_MODE_FILTERS).toEqual([
      {
        fieldId: 'osMode',
        values: [DeviceFeatureBoolean.DeviceFeatureBooleanTrue, UNKNOWN_CAPABILITY_VALUE],
      },
    ]);
  });
});
