import React from 'react';
import type { TFunction } from 'react-i18next';

import type { CustomDeviceInfo, DeviceSystemInfo, SystemInfoSourceStatus } from '@flightctl/types';
import { SystemInfoSourceStatusType } from '@flightctl/types';
import { timeSinceText } from '../utils/dates';

export type SystemInfoReporting = {
  status: SystemInfoSourceStatusType;
  timeSince?: string;
  error?: string;
};

export type SystemInfoEntry = {
  key: string;
  value: React.ReactNode;
  reporting: SystemInfoReporting | null;
};

export type SystemInfoListResult = {
  entries: SystemInfoEntry[];
  hasErrors: boolean;
};

const hasReportingError = (entryReport: SystemInfoReporting | null): boolean => {
  return entryReport?.status === SystemInfoSourceStatusType.SystemInfoSourceStatusError || !!entryReport?.error;
};

const excludedKnownProps = [
  'customInfo', // Custom properies are evaluated separately from the predefined, known properties
  'attestation', // In Phase1 this includes only the raw data, without a report of success or failure.
  // "deltaEligible", "bootcVersion", and "ociDeltaVersion" are shown in a separate section on the device details page
  'deltaEligible',
  'bootcVersion',
  'ociDeltaVersion',
];

const systemInfoKnownKeys = [
  'agentVersion',
  'operatingSystem',
  'hostname',
  'tpmVendorInfo',
  'architecture',
  'distroName',
  'bootcVersion',
  'bootID',
  'kernel',
  'netInterfaceDefault',
  'netIpDefault',
  'netMacDefault',
  'productName',
  'productSerial',
  'productUuid',
];

const toReporting = (sourceStatus: SystemInfoSourceStatus | undefined, t: TFunction): SystemInfoReporting | null => {
  if (!sourceStatus) {
    return null;
  }
  return {
    status: sourceStatus.status,
    timeSince: timeSinceText(t, sourceStatus.lastTransitionTime),
    error: sourceStatus.message,
  };
};

const addSystemInfoEntry = (result: SystemInfoListResult, newEntry: SystemInfoEntry) => {
  result.entries.push(newEntry);
  result.hasErrors = result.hasErrors || hasReportingError(newEntry.reporting);
};

const emptyResult: SystemInfoListResult = {
  entries: [],
  hasErrors: false,
};

export const useDeviceSystemInfo = (
  t: TFunction,
  systemInfo: DeviceSystemInfo | undefined,
  infoStatus?: Record<string, SystemInfoSourceStatus>,
): SystemInfoListResult => {
  if (!systemInfo) {
    return emptyResult;
  }

  const result = {
    entries: [],
    hasErrors: false,
  };
  const includedKeys = new Set<string>();

  console.log('%c reculating deviceSystemInfo', 'color: red; font-size:18px', Date.now());

  // Add the known fields first, in their desired order of appearance
  systemInfoKnownKeys
    .filter((infoKey) => systemInfo[infoKey] || !!infoStatus?.[infoKey])
    .forEach((infoKey) => {
      includedKeys.add(infoKey);

      const reporting = toReporting(infoStatus?.[infoKey], t);
      addSystemInfoEntry(result, {
        key: infoKey,
        value: systemInfo[infoKey],
        reporting,
      });
    });

  // Add any other fields that weren't included yet, in arbitrary order
  Object.keys(systemInfo).forEach((infoKey) => {
    if (systemInfoKnownKeys.includes(infoKey) || excludedKnownProps.includes(infoKey) || includedKeys.has(infoKey)) {
      return;
    }
    const value = systemInfo[infoKey];
    const itemStatus = infoStatus?.[infoKey];
    if (!value && !itemStatus) {
      return;
    }
    const reporting = toReporting(itemStatus, t);
    addSystemInfoEntry(result, {
      key: infoKey,
      value,
      reporting,
    });
  });
  return result;
};

export const useDeviceCustomInfo = (
  t: TFunction,
  systemInfo: CustomDeviceInfo | undefined,
  infoStatus?: Record<string, SystemInfoSourceStatus>,
): SystemInfoListResult => {
  const customInfo = systemInfo?.customInfo || {};

  const result = {
    entries: [],
    hasErrors: false,
  };

  Object.keys(customInfo).forEach((key) => {
    const reporting = toReporting(infoStatus?.[key], t);
    addSystemInfoEntry(result, {
      key,
      value: customInfo[key],
      reporting,
    });
  });
  return result;
};
