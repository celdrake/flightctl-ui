import * as React from 'react';

import type { Device, DeviceSystemInfo, LabelSyncProvenanceList } from '@flightctl/types';
import type { FlightCtlLabel } from '../types/extraTypes';
import { useFetchPeriodically } from './useFetchPeriodically';

const getLabelFieldName = (labelKey: string): string => {
  const slash = labelKey.lastIndexOf('/');
  return slash >= 0 ? labelKey.slice(slash + 1) : labelKey;
};

/** Primary = managed label whose field maps 1:1 to a systemInfo or customInfo property. */
const isPrimaryManagedLabel = (labelKey: string, systemInfo: DeviceSystemInfo | undefined): boolean => {
  if (!systemInfo) {
    return false;
  }
  const field = getLabelFieldName(labelKey);
  if (field === 'customInfo') {
    return false;
  }
  if (Object.prototype.hasOwnProperty.call(systemInfo, field)) {
    return true;
  }
  const customInfo = systemInfo.customInfo;
  return !!customInfo && Object.prototype.hasOwnProperty.call(customInfo, field);
};

type ManagedLabel = FlightCtlLabel & {
  isPrimary: boolean;
};

export type ManagedLabelsPartition = {
  items: ManagedLabel[];
  totalCount: number;
  primaryCount: number;
  derivedCount: number;
};
/**
 * Split mapping-owned labels into primary (direct systemInfo/customInfo props)
 * vs derived (combined / novel mapping output). managedLabelKeys come from provenance.
 */
export const partitionManagedLabels = (
  device: Device,
  managedLabelKeys: string[],
  systemInfo?: DeviceSystemInfo,
): ManagedLabelsPartition => {
  const managedLabels: ManagedLabel[] = [];
  let primaryCount = 0;

  Object.entries(device.metadata.labels || {}).forEach(([key, value]) => {
    if (!managedLabelKeys.includes(key)) {
      return;
    }
    const label = { key, value };
    const isPrimary = isPrimaryManagedLabel(key, systemInfo);
    managedLabels.push({ ...label, isPrimary });
    if (isPrimary) {
      primaryCount++;
    }
  });

  return {
    items: managedLabels,
    primaryCount,
    derivedCount: managedLabels.length - primaryCount,
    totalCount: managedLabels.length,
  };
};

/**
 * Fetches GET /devices/{name}/labelsyncprovenance.
 * Keys in the response are mapping-owned (managed); other device labels are operator-defined.
 */
export const useDeviceLabelProvenance = (device: Device) => {
  const deviceName = device.metadata.name || '';
  const [provenance, isLoading, error] = useFetchPeriodically<LabelSyncProvenanceList>({
    endpoint: deviceName ? `devices/${deviceName}/labelsyncprovenance` : '',
    timeout: 60000,
  });

  const labelKeys = React.useMemo(() => (provenance?.items || []).map((item) => item.key), [provenance]);

  return { labelKeys, provenance, isLoading: Boolean(deviceName) && isLoading, error };
};

export default useDeviceLabelProvenance;
