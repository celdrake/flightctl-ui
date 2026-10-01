import React from 'react';
import type { TFunction } from 'react-i18next';

import type { DeviceSystemInfo, DeviceSystemInfoStatus, SystemInfoSourceStatus } from '@flightctl/types';
import { SystemInfoSourceStatusType } from '@flightctl/types';

import { timeSinceText } from '../utils/dates';

export type SystemInfoReporting = {
  status: SystemInfoSourceStatusType;
  /** Relative time from lastTransitionTime, via timeSinceText(t, ...) */
  timeSince: string;
  /** Collection error detail from SystemInfoSourceStatus.message */
  error?: string;
};

export type SystemInfoEntry = {
  key: string;
  title: string;
  value: React.ReactNode;
  reporting?: SystemInfoReporting;
};

export type SystemInfoReportingSummary = {
  /** At least one entry has reporting metadata (systemInfoStatus present for that key) */
  hasReporting: boolean;
  /** Any entry with API status Error, or a non-empty reporting.error message */
  hasErrors: boolean;
};

export type SystemInfoListResult = {
  entries: SystemInfoEntry[];
  reporting: SystemInfoReportingSummary;
};

export const buildReportingSummary = (entries: SystemInfoEntry[]): SystemInfoReportingSummary => {
  const acc = {
    hasReporting: false,
    hasErrors: false,
  };
  return entries.reduce((acc, entry) => {
    if (
      entry.reporting?.status === SystemInfoSourceStatusType.SystemInfoSourceStatusError ||
      !!entry.reporting?.error
    ) {
      acc.hasErrors = true;
    }
    if (!!entry.reporting) {
      acc.hasReporting = true;
    }
    return acc;
  }, acc);
};

// Converts a camelCase variable into words. Example: "someInfoData" --> "Some info data"
// Keeps acronyms together, converted to lowercase. Example: "bootID" --> Boot id
export const propNameToTitle = (input: string) => {
  const words = input.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');
  return words.charAt(0).toUpperCase() + words.slice(1).toLowerCase();
};

const excludedKnownProps = [
  'distroVersion', // It's combined with "distroName"
  'customInfo', // Custom properies are evaluated separately from the predefined, known properties
  'attestation', // In Phase1 this includes only the raw data, without a report of success or failure.
  // "deltaEligible", "bootcVersion", and "ociDeltaVersion" are shown in a separate section on the device details page
  'deltaEligible',
  'bootcVersion',
  'ociDeltaVersion',
];

const getInfoDataKnownKeys = (t: TFunction): Record<string, string> => ({
  agentVersion: t('Agent version'),
  operatingSystem: t('Operating system'),
  hostname: t('Hostname'),
  tpmVendorInfo: t('TPM vendor info'),
  architecture: t('Architecture'),
  distroName: t('Distro'),
  bootcVersion: t('Bootc version'),
  bootID: t('Boot ID'),
  kernel: t('Kernel'),
  netInterfaceDefault: t('Net interface default'),
  netIpDefault: t('Net IP default'),
  netMacDefault: t('Net MAC default'),
  productName: t('Product name'),
  productSerial: t('Product serial'),
  productUuid: t('Product UUID'),
});

const toReporting = (
  sourceStatus: SystemInfoSourceStatus | undefined,
  t: TFunction,
): SystemInfoReporting | undefined => {
  if (!sourceStatus) {
    return undefined;
  }
  return {
    status: sourceStatus.status,
    timeSince: timeSinceText(t, sourceStatus.lastTransitionTime),
    error: sourceStatus.message,
  };
};

const getSystemInfoValue = (systemInfo: DeviceSystemInfo, infoKey: string) => {
  switch (infoKey) {
    case 'distroName': {
      if (systemInfo.distroVersion) {
        return `${systemInfo.distroName} ${systemInfo.distroVersion}`;
      }
      return systemInfo.distroName;
    }
    default:
      return systemInfo[infoKey];
  }
};

const hasDisplayValue = (value: React.ReactNode) => value !== undefined && value !== null && value !== '';

const emptyResult: SystemInfoListResult = {
  entries: [],
  reporting: { hasReporting: false, hasErrors: false },
};

export const useDeviceSpecSystemInfo = (
  systemInfo: DeviceSystemInfo | undefined,
  t: TFunction,
  systemInfoStatus?: DeviceSystemInfoStatus,
): SystemInfoListResult => {
  const infoDataKnownKeys = React.useMemo(() => getInfoDataKnownKeys(t), [t]);
  if (!systemInfo) {
    return emptyResult;
  }

  const statusMap = systemInfoStatus?.statuses.systemInfo;
  const includedKeys = new Set<string>();

  // Add the known fields first, in their desired order of appearance
  const systemInfoItems: SystemInfoEntry[] = Object.entries(infoDataKnownKeys)
    .filter(([infoKey]) => {
      if (excludedKnownProps.includes(infoKey)) {
        return false;
      }
      return hasDisplayValue(getSystemInfoValue(systemInfo, infoKey)) || !!statusMap?.[infoKey];
    })
    .map(([infoKey, infoTitle]) => {
      includedKeys.add(infoKey);
      return {
        key: infoKey,
        title: infoTitle,
        value: getSystemInfoValue(systemInfo, infoKey),
        reporting: toReporting(statusMap?.[infoKey], t),
      };
    });

  // Add any other fields that weren't included yet, in arbitrary order
  Object.keys(systemInfo).forEach((infoKey) => {
    if (infoDataKnownKeys[infoKey] || excludedKnownProps.includes(infoKey) || includedKeys.has(infoKey)) {
      return;
    }
    const value = systemInfo[infoKey];
    const reporting = toReporting(statusMap?.[infoKey], t);
    if (!hasDisplayValue(value) && !reporting) {
      return;
    }
    includedKeys.add(infoKey);
    systemInfoItems.push({
      key: infoKey,
      title: propNameToTitle(infoKey),
      value,
      reporting,
    });
  });

  // Include status-only systemInfo keys (e.g. Error with no retained value)
  Object.keys(statusMap || {}).forEach((infoKey) => {
    if (excludedKnownProps.includes(infoKey) || includedKeys.has(infoKey)) {
      return;
    }
    includedKeys.add(infoKey);
    systemInfoItems.push({
      key: infoKey,
      title: infoDataKnownKeys[infoKey] || propNameToTitle(infoKey),
      value: systemInfo[infoKey],
      reporting: toReporting(statusMap?.[infoKey], t),
    });
  });

  return {
    entries: systemInfoItems,
    reporting: buildReportingSummary(systemInfoItems),
  };
};

export const useDeviceCustomInfo = (
  systemInfo: DeviceSystemInfo | undefined,
  t: TFunction,
  systemInfoStatus?: DeviceSystemInfoStatus,
): SystemInfoListResult => {
  const customInfo = systemInfo?.customInfo || {};
  const statusMap = systemInfoStatus?.statuses.customInfo;
  const keys = new Set([...Object.keys(customInfo), ...Object.keys(statusMap || {})]);

  const entries = [...keys].map((key) => ({
    key,
    title: propNameToTitle(key),
    value: customInfo[key],
    reporting: toReporting(statusMap?.[key], t),
  }));

  return {
    entries,
    reporting: buildReportingSummary(entries),
  };
};
