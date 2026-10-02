import * as React from 'react';

import type { Device, DeviceSystemInfo, LabelSyncProvenanceList } from '@flightctl/types';
import type { FlightCtlLabel } from '../types/extraTypes';
import { useFetchPeriodically } from './useFetchPeriodically';

/** A managed label is primary when it's a direct mapping from a field within systemInfo or customInfo. */
const isPrimaryManagedLabel = (labelKey: string, systemInfo: DeviceSystemInfo | undefined): boolean => {
  if (systemInfo?.[labelKey] || systemInfo?.customInfo?.[labelKey]) {
    return true;
  }
  return false;
};

export type ManagedLabel = FlightCtlLabel & {
  isDerived: boolean;
};

export type ManagedLabels = {
  items: ManagedLabel[];
  totalCount: number;
  primaryCount: number;
  derivedCount: number;
};

const emptyResult: ManagedLabels = {
  items: [],
  totalCount: 0,
  primaryCount: 0,
  derivedCount: 0,
};

const buildManagedLabels = (device: Device, managedLabelKeys: string[]): ManagedLabels => {
  const systemInfo = device.status?.systemInfo;

  const items: ManagedLabel[] = [];
  let primaryCount = 0;

  Object.entries(device.metadata.labels || {}).forEach(([key, value]) => {
    if (managedLabelKeys.includes(key)) {
      const isPrimary = isPrimaryManagedLabel(key, systemInfo);
      items.push({ key, value, isDerived: !isPrimary });
      if (isPrimary) {
        primaryCount++;
      }
    }
  });

  return {
    items,
    primaryCount,
    derivedCount: items.length - primaryCount,
    totalCount: items.length,
  };
};

type DeviceLabelProvenance = {
  managedLabels: ManagedLabels;
  isLoading: boolean;
  error: unknown;
};

export const useDeviceLabelProvenance = (device: Device): DeviceLabelProvenance => {
  const deviceName = device.metadata.name || '';
  const [provenance, isLoading, error] = useFetchPeriodically<LabelSyncProvenanceList>({
    endpoint: deviceName ? `devices/${deviceName}/labelsyncprovenance` : '',
    timeout: 60000,
  });

  const managedLabels = React.useMemo(() => {
    if (!provenance) {
      return emptyResult;
    }
    const labelKeys = provenance.items.map((item) => item.key);
    return buildManagedLabels(device, labelKeys);
  }, [device, provenance]);

  return {
    managedLabels,
    isLoading: Boolean(deviceName) && isLoading,
    error,
  };
};

export default useDeviceLabelProvenance;
