import * as React from 'react';

import type { Device } from '@flightctl/types';

/** TEMP demo — mirrors design LabelSyncProvenance item until the API ships. */
export type LabelSyncProvenanceItem = {
  key: string;
  mappingName: string;
  source: 'DeviceOwnership' | 'ScalarReservation';
};

export const SYSTEMINFO_LABEL_PREFIX = 'systeminfo.flightctl.io/';
export const CUSTOMINFO_LABEL_PREFIX = 'custominfo.flightctl.io/';
/** TEMP demo: novel derived mapping that does not reuse systeminfo/custominfo prefixes. */
export const COMBINED_PROPS_LABEL_PREFIX = 'my-combined-props/';

const isManagedLabelKey = (key: string): boolean =>
  key.startsWith(SYSTEMINFO_LABEL_PREFIX) ||
  key.startsWith(CUSTOMINFO_LABEL_PREFIX) ||
  key.startsWith(COMBINED_PROPS_LABEL_PREFIX);

/** Short field name after the mapping DNS prefix (or the full key if unprefixed). */
export const getManagedLabelFieldName = (labelKey: string): string => {
  if (labelKey.startsWith(SYSTEMINFO_LABEL_PREFIX)) {
    return labelKey.slice(SYSTEMINFO_LABEL_PREFIX.length);
  }
  if (labelKey.startsWith(CUSTOMINFO_LABEL_PREFIX)) {
    return labelKey.slice(CUSTOMINFO_LABEL_PREFIX.length);
  }
  if (labelKey.startsWith(COMBINED_PROPS_LABEL_PREFIX)) {
    return labelKey.slice(COMBINED_PROPS_LABEL_PREFIX.length);
  }
  return labelKey;
};

const mappingNameForKey = (key: string): string => {
  if (key.startsWith(COMBINED_PROPS_LABEL_PREFIX)) {
    return 'edge-tier';
  }
  if (key.startsWith(CUSTOMINFO_LABEL_PREFIX)) {
    return 'custom-info';
  }
  if (key.startsWith(SYSTEMINFO_LABEL_PREFIX)) {
    return 'system-info';
  }
  return 'unknown';
};

/** Managed (mapping-promoted) labels on the device, keyed by full label key. */
export const getManagedLabelsFromDevice = (device: Device): Record<string, string> => {
  const labels = device.metadata.labels || {};
  const managed: Record<string, string> = {};
  Object.entries(labels).forEach(([key, value]) => {
    if (isManagedLabelKey(key)) {
      managed[key] = value;
    }
  });
  return managed;
};

/** Operator-editable labels (excludes mapping-managed keys). */
export const getOperatorLabelsFromDevice = (device: Device): Record<string, string> => {
  const labels = device.metadata.labels || {};
  const operator: Record<string, string> = {};
  Object.entries(labels).forEach(([key, value]) => {
    if (!isManagedLabelKey(key)) {
      operator[key] = value;
    }
  });
  return operator;
};

/**
 * True when this managed label already has a page home as systemInfo / customInfo.
 * Novel labels (e.g. edgeTier from a derived mapping) return false.
 */
export const isManagedLabelShownElsewhere = (labelKey: string, device: Device): boolean => {
  const field = getManagedLabelFieldName(labelKey);
  const systemInfo = device.status?.systemInfo;
  if (!systemInfo) {
    return false;
  }
  if (field !== 'customInfo' && Object.prototype.hasOwnProperty.call(systemInfo, field)) {
    return true;
  }
  const customInfo = systemInfo.customInfo;
  if (customInfo && Object.prototype.hasOwnProperty.call(customInfo, field)) {
    return true;
  }
  return false;
};

export const partitionManagedLabels = (
  managedLabels: Record<string, string>,
  device: Device,
): { duplicated: Record<string, string>; novel: Record<string, string> } => {
  const duplicated: Record<string, string> = {};
  const novel: Record<string, string> = {};
  Object.entries(managedLabels).forEach(([key, value]) => {
    if (isManagedLabelShownElsewhere(key, device)) {
      duplicated[key] = value;
    } else {
      novel[key] = value;
    }
  });
  return { duplicated, novel };
};

export const labelEntries = (labels: Record<string, string>): { key: string; value: string }[] =>
  Object.entries(labels)
    .map(([key, value]) => ({ key, value }))
    .sort((a, b) => a.key.localeCompare(b.key));

/**
 * TEMP: mocks GET /devices/{name}/labelsyncprovenance from device.metadata.labels.
 * Replace with a real fetch when the provenance API lands.
 */
export const useDeviceLabelProvenance = (device: Device) => {
  const items = React.useMemo((): LabelSyncProvenanceItem[] => {
    const managed = getManagedLabelsFromDevice(device);
    return Object.keys(managed)
      .sort()
      .map((key) => ({
        key,
        mappingName: mappingNameForKey(key),
        source: 'DeviceOwnership' as const,
      }));
  }, [device]);

  return { items, isLoading: false };
};

export default useDeviceLabelProvenance;
