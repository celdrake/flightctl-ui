import * as React from 'react';

import type { Device } from '@flightctl/types';
import { FlightCtlLabel } from '../types/extraTypes';

type ApiLabels = Record<string, string>;

// CELIA-WIP check for unnecessary format conversions

export const SYSTEMINFO_LABEL_PREFIX = 'systeminfo.flightctl.io/';
export const CUSTOMINFO_LABEL_PREFIX = 'custominfo.flightctl.io/';
/** TEMP demo: novel derived mapping that does not reuse systeminfo/custominfo prefixes. */
export const COMBINED_PROPS_LABEL_PREFIX = 'my-combined-props/';

// CELIA-WIP: temp impleementation
const isDerivedLabelKey = (key: string): boolean => key.startsWith(COMBINED_PROPS_LABEL_PREFIX);
const isManagedLabelKey = (key: string): boolean =>
  key.startsWith(SYSTEMINFO_LABEL_PREFIX) || key.startsWith(CUSTOMINFO_LABEL_PREFIX) || isDerivedLabelKey(key);

/** TEMP until the API is implemented: Managed (mapping-promoted) labels on the device, keyed by full label key. */
const getManagedLabelsFromDevice = (device: Device): ApiLabels => {
  const labels = device.metadata.labels || {};
  const managed: ApiLabels = {};
  Object.entries(labels).forEach(([key, value]) => {
    if (isManagedLabelKey(key)) {
      managed[key] = value;
    }
  });
  return managed;
};

/**
 * True when this managed label already has a page home as systemInfo / customInfo.
 * Novel labels (e.g. edgeTier from a derived mapping) return false.
 */
// CELIA-WIP: check this function
/*
const isDerivedLabel = (labelKey: string, systemInfo: DeviceSystemInfo): boolean => {
  const field = getManagedLabelFieldName(labelKey);
  if (field !== 'customInfo' && Object.prototype.hasOwnProperty.call(systemInfo, field)) {
    return true;
  }
  const customInfo = systemInfo.customInfo;
  if (customInfo && Object.prototype.hasOwnProperty.call(customInfo, field)) {
    return true;
  }
  return false;
};
*/

export const partitionManagedLabels = (
  device: Device,
  managedLabelKeys: string[],
): { primaryLabels: FlightCtlLabel[]; derivedLabels: FlightCtlLabel[] } => {
  const primaryLabels: FlightCtlLabel[] = [];
  const derivedLabels: FlightCtlLabel[] = [];
  // CELIA-WIP can we use owner here? to identify where the label might be coming from?
  // CELIA-WIP FIx algorithm based on the API response
  Object.entries(device.metadata.labels || {}).forEach(([key, value]) => {
    if (managedLabelKeys.includes(key)) {
      if (isDerivedLabelKey(key)) {
        derivedLabels.push({ key, value });
      } else {
        primaryLabels.push({ key, value });
      }
    }
  });
  return { primaryLabels, derivedLabels };
};

/**
 * TEMP: mocks GET /devices/{name}/labelsyncprovenance from device.metadata.labels.
 * Real shape (no apiVersion/kind/metadata; items only):
 *
 * {
 *   "items": [
 *     { "key": "systeminfo.flightctl.io/hostname", "owners": ["system-info"] },
 *     { "key": "custominfo.flightctl.io/site", "owners": ["custom-info"] },
 *     { "key": "my-combined-props/edgeTier", "owners": ["edge-tier"] }
 *   ]
 * }
 *
 * Empty owners means the key has no current mapping owner. Device queries omit
 * unowned keys and sort by key. Replace with a real fetch when the API lands.
 */
export const useDeviceLabelProvenance = (device: Device) => {
  const labelKeys = React.useMemo((): string[] => {
    const managed = getManagedLabelsFromDevice(device);
    return Object.keys(managed);
  }, [device]);

  return { labelKeys, isLoading: false };
};

export default useDeviceLabelProvenance;
