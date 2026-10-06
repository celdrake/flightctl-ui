import { describe, expect, it } from 'vitest';
import { OsModeType } from '@flightctl/types';
import { DeviceFeatureBoolean } from '@flightctl/types/alpha';

import {
  DEVICE_FEATURE_LABEL_GPU_PRESENT,
  DEVICE_FEATURE_LABEL_KVM_ENABLED,
  DEVICE_FEATURE_LABEL_OS_MODE,
} from './catalogDeviceFeatures';
import { buildDeviceFeatureLabelSelectors, setLabelParams } from './query';
import { UNKNOWN_CAPABILITY_VALUE } from './status/devices';

const emptyFilters = {
  osMode: [],
  gpuPresent: [],
  kvmEnabled: [],
};

describe('buildDeviceFeatureLabelSelectors', () => {
  it.each([
    {
      name: 'When no features are selected it should return no selectors',
      filters: emptyFilters,
      expected: [],
    },
    {
      name: 'When only image OS mode is selected it should match the image label',
      filters: { ...emptyFilters, osMode: [OsModeType.OsModeImage] },
      expected: [`${DEVICE_FEATURE_LABEL_OS_MODE}=image`],
    },
    {
      name: 'When image and package OS modes are selected it should require the OS mode label to exist',
      filters: { ...emptyFilters, osMode: [OsModeType.OsModeImage, OsModeType.OsModePackage] },
      expected: [DEVICE_FEATURE_LABEL_OS_MODE],
    },
    {
      name: 'When only unknown OS mode is selected it should require the OS mode label to be absent',
      filters: { ...emptyFilters, osMode: [UNKNOWN_CAPABILITY_VALUE] },
      expected: [`!${DEVICE_FEATURE_LABEL_OS_MODE}`],
    },
    {
      name: 'When image and unknown OS modes are selected it should exclude package',
      filters: { ...emptyFilters, osMode: [OsModeType.OsModeImage, UNKNOWN_CAPABILITY_VALUE] },
      expected: [`${DEVICE_FEATURE_LABEL_OS_MODE}!=package`],
    },
    {
      name: 'When every OS mode is selected it should omit the OS mode selector',
      filters: {
        ...emptyFilters,
        osMode: [OsModeType.OsModeImage, OsModeType.OsModePackage, UNKNOWN_CAPABILITY_VALUE],
      },
      expected: [],
    },
    {
      name: 'When GPU is present and KVM is enabled it should AND both labels',
      filters: {
        ...emptyFilters,
        gpuPresent: [DeviceFeatureBoolean.DeviceFeatureBooleanTrue],
        kvmEnabled: [DeviceFeatureBoolean.DeviceFeatureBooleanTrue],
      },
      expected: [`${DEVICE_FEATURE_LABEL_GPU_PRESENT}=true`, `${DEVICE_FEATURE_LABEL_KVM_ENABLED}=true`],
    },
    {
      name: 'When GPU true and GPU unknown are selected it should exclude GPU false',
      filters: {
        ...emptyFilters,
        gpuPresent: [DeviceFeatureBoolean.DeviceFeatureBooleanTrue, UNKNOWN_CAPABILITY_VALUE],
      },
      expected: [`${DEVICE_FEATURE_LABEL_GPU_PRESENT}!=false`],
    },
    {
      name: 'When GPU true and GPU false are selected it should require the GPU label to exist',
      filters: {
        ...emptyFilters,
        gpuPresent: [DeviceFeatureBoolean.DeviceFeatureBooleanTrue, DeviceFeatureBoolean.DeviceFeatureBooleanFalse],
      },
      expected: [DEVICE_FEATURE_LABEL_GPU_PRESENT],
    },
  ])('$name', ({ filters, expected }) => {
    expect(buildDeviceFeatureLabelSelectors(filters)).toEqual(expected);
  });
});

describe('setLabelParams', () => {
  it('When user labels and feature selectors are set it should AND them in labelSelector', () => {
    const params = new URLSearchParams();
    setLabelParams(params, [{ key: 'site', value: 'edge' }], [`${DEVICE_FEATURE_LABEL_OS_MODE}=image`]);
    expect(params.get('labelSelector')).toBe(`site=edge,${DEVICE_FEATURE_LABEL_OS_MODE}=image`);
  });

  it('When only feature selectors are set it should still set labelSelector', () => {
    const params = new URLSearchParams();
    setLabelParams(params, undefined, [`${DEVICE_FEATURE_LABEL_GPU_PRESENT}=true`]);
    expect(params.get('labelSelector')).toBe(`${DEVICE_FEATURE_LABEL_GPU_PRESENT}=true`);
  });
});
