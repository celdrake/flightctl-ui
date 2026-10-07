import { describe, expect, it } from 'vitest';
import { type Device, OsModeType } from '@flightctl/types';
import { DeviceFeatureBoolean } from '@flightctl/types/alpha';

import {
  DEVICE_FEATURE_GPU_PRESENT,
  DEVICE_FEATURE_KVM_ENABLED,
  DEVICE_FEATURE_OS_MODE,
} from './catalogDeviceFeatures';
import { deviceMeetsFeatureRequirements, getDeviceReportedFeatures } from './capabilities';

const deviceWith = (systemInfo: Device['status'] extends infer S ? NonNullable<S>['systemInfo'] : never): Device =>
  ({
    metadata: { name: 'dev-1' },
    status: { systemInfo },
  }) as Device;

describe('getDeviceReportedFeatures', () => {
  it('When systemInfo reports capabilities it should map them to boolean feature values', () => {
    expect(
      getDeviceReportedFeatures(
        deviceWith({
          osMode: OsModeType.OsModeImage,
          gpus: [{ vendor: 'NVIDIA', model: 'T4' }],
          kvm: { enabled: true },
        }).status!,
      ),
    ).toEqual({
      gpuPresent: DeviceFeatureBoolean.DeviceFeatureBooleanTrue,
      kvmEnabled: DeviceFeatureBoolean.DeviceFeatureBooleanTrue,
      osMode: DeviceFeatureBoolean.DeviceFeatureBooleanTrue,
    });
  });

  it('When capabilities are absent it should leave them undefined', () => {
    expect(getDeviceReportedFeatures(deviceWith({}).status!)).toEqual({
      gpuPresent: undefined,
      kvmEnabled: undefined,
      osMode: undefined,
    });
  });
});

describe('deviceMeetsFeatureRequirements', () => {
  it('When deviceFeatures is absent it should return null', () => {
    expect(deviceMeetsFeatureRequirements(deviceWith({}).status, undefined)).toBeNull();
    expect(deviceMeetsFeatureRequirements(deviceWith({}).status, {})).toBeNull();
  });

  it('When the device reports matching values it should return true', () => {
    const device = deviceWith({
      osMode: OsModeType.OsModeImage,
      gpus: [{ vendor: 'NVIDIA', model: 'T4' }],
      kvm: { enabled: false },
    });
    expect(
      deviceMeetsFeatureRequirements(device.status, {
        [DEVICE_FEATURE_GPU_PRESENT]: DeviceFeatureBoolean.DeviceFeatureBooleanTrue,
        [DEVICE_FEATURE_KVM_ENABLED]: DeviceFeatureBoolean.DeviceFeatureBooleanFalse,
        [DEVICE_FEATURE_OS_MODE]: OsModeType.OsModeImage,
      }),
    ).toBe(true);
  });

  it('When a required feature mismatches it should return false', () => {
    const device = deviceWith({
      gpus: [],
      kvm: { enabled: true },
    });
    expect(
      deviceMeetsFeatureRequirements(device.status, {
        [DEVICE_FEATURE_GPU_PRESENT]: DeviceFeatureBoolean.DeviceFeatureBooleanTrue,
      }),
    ).toBe(false);
  });

  it('When a required feature is unknown on the device it should return false', () => {
    expect(
      deviceMeetsFeatureRequirements(deviceWith({}).status, {
        [DEVICE_FEATURE_KVM_ENABLED]: DeviceFeatureBoolean.DeviceFeatureBooleanTrue,
      }),
    ).toBe(false);
  });
});
