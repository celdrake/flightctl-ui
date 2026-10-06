import { type TFunction } from 'react-i18next';
import { PowerOffIcon } from '@patternfly/react-icons/dist/js/icons/power-off-icon';
import { PauseCircleIcon } from '@patternfly/react-icons/dist/js/icons/pause-circle-icon';
import { BanIcon } from '@patternfly/react-icons/dist/js/icons/ban-icon';
import { PendingIcon } from '@patternfly/react-icons/dist/js/icons/pending-icon';
import suspendedColor from '@patternfly/react-tokens/dist/js/t_color_orange_40';
import pendingSyncColor from '@patternfly/react-tokens/dist/js/t_global_color_status_info_200';

import {
  type ApplicationsSummaryStatusType,
  type DeviceSummaryStatus as BEDeviceSummaryStatus,
  type Device,
  type DeviceIntegrityStatusSummaryType,
  DeviceLifecycleStatusType,
  DeviceSummaryStatusType,
  type DeviceUpdatedStatusType,
  OsModeType,
} from '@flightctl/types';
import { DeviceFeatureBoolean } from '@flightctl/types/alpha';
import {
  DEVICE_FEATURE_LABEL_GPU_PRESENT,
  DEVICE_FEATURE_LABEL_KVM_ENABLED,
  DEVICE_FEATURE_LABEL_OS_MODE,
} from '../catalogDeviceFeatures';
import { type StatusItem, type StatusLevel, getStatusLevelFromMap } from './common';

export enum FilterSearchParams {
  Fleet = 'fleetId',
  OnlyFleetless = 'onlyFleetless',
  DeviceStatus = 'devSt',
  AppStatus = 'appSt',
  UpdatedStatus = 'updSt',
  OsMode = 'osMode',
  GpuPresent = 'gpuPresent',
  KvmEnabled = 'kvmEnabled',
  Label = 'label',
  NameOrAlias = 'nameOrAlias',
  CveId = 'cveId',
}

/** Sentinel for devices that have not reported a feature label. */
export const UNKNOWN_CAPABILITY_VALUE = 'unknown' as const;

export type DeviceFeatureFilter = {
  field: string;
  values: string[];
};

export type DeviceCapabilityFeature = {
  field: string;
  labelKey: string;
};

export const DEVICE_CAPABILITY_FILTER_VALUES = [
  DeviceFeatureBoolean.DeviceFeatureBooleanTrue,
  DeviceFeatureBoolean.DeviceFeatureBooleanFalse,
  UNKNOWN_CAPABILITY_VALUE,
] as const;

export const DEVICE_OS_MODE_FEATURE: DeviceCapabilityFeature = {
  field: FilterSearchParams.OsMode,
  labelKey: DEVICE_FEATURE_LABEL_OS_MODE,
};

export const DEVICE_HARDWARE_FEATURES: DeviceCapabilityFeature[] = [
  { field: FilterSearchParams.GpuPresent, labelKey: DEVICE_FEATURE_LABEL_GPU_PRESENT },
  { field: FilterSearchParams.KvmEnabled, labelKey: DEVICE_FEATURE_LABEL_KVM_ENABLED },
];

export const getDeviceCapabilityFeatures = (): DeviceCapabilityFeature[] => [
  DEVICE_OS_MODE_FEATURE,
  ...DEVICE_HARDWARE_FEATURES,
];

const OS_MODE_URL_ALIASES: Record<string, string> = {
  [OsModeType.OsModeImage]: DeviceFeatureBoolean.DeviceFeatureBooleanTrue,
  [OsModeType.OsModePackage]: DeviceFeatureBoolean.DeviceFeatureBooleanFalse,
};

export const isDeviceCapabilityFilterValue = (value: string): boolean =>
  (DEVICE_CAPABILITY_FILTER_VALUES as readonly string[]).includes(value);

const getCapabilityFeatureName = (t: TFunction, field: string) => {
  switch (field) {
    case FilterSearchParams.GpuPresent:
      return t('GPU');
    case FilterSearchParams.KvmEnabled:
      return t('KVM virtualization');
    default:
      return field;
  }
};

export const getDeviceCapabilityFilterLabel = (t: TFunction, field: string, value: string) => {
  if (field === FilterSearchParams.OsMode) {
    switch (value) {
      case DeviceFeatureBoolean.DeviceFeatureBooleanTrue:
        return t('Image mode required');
      case DeviceFeatureBoolean.DeviceFeatureBooleanFalse:
        return t('Package mode required');
      default:
        return t('Not defined');
    }
  }

  const featureName = getCapabilityFeatureName(t, field);
  switch (value) {
    case DeviceFeatureBoolean.DeviceFeatureBooleanTrue:
      return featureName;
    case DeviceFeatureBoolean.DeviceFeatureBooleanFalse:
      return t('{{featureName}} not detected', { featureName });
    default:
      return t('{{featureName}} not reported', { featureName });
  }
};

/** Maps UI filter values (true/false/unknown) to the device label values used by the API. */
export const toDeviceFeatureLabelValues = (field: string, values: string[]): string[] => {
  if (field !== FilterSearchParams.OsMode) {
    return values;
  }
  return values.map((value) => {
    if (value === DeviceFeatureBoolean.DeviceFeatureBooleanTrue) {
      return OsModeType.OsModeImage;
    }
    if (value === DeviceFeatureBoolean.DeviceFeatureBooleanFalse) {
      return OsModeType.OsModePackage;
    }
    return value;
  });
};

export const getEmptyDeviceFeatureFilters = (): DeviceFeatureFilter[] =>
  getDeviceCapabilityFeatures().map(({ field }) => ({ field, values: [] }));

export const getFeatureFilterValues = (filters: DeviceFeatureFilter[], field: string): string[] =>
  filters.find((filter) => filter.field === field)?.values ?? [];

export const updateFeatureFilterValues = (
  filters: DeviceFeatureFilter[],
  field: string,
  values: string[],
): DeviceFeatureFilter[] =>
  getDeviceCapabilityFeatures().map((feature) => ({
    field: feature.field,
    values: feature.field === field ? values : getFeatureFilterValues(filters, feature.field),
  }));

export const toggleFeatureFilterValue = (
  filters: DeviceFeatureFilter[],
  field: string,
  value: string,
): DeviceFeatureFilter[] => {
  const current = getFeatureFilterValues(filters, field);
  const next = current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
  return updateFeatureFilterValues(filters, field, next);
};

const parseFeatureFilterValues = (searchParams: URLSearchParams, field: string): string[] =>
  (searchParams.getAll(field) || [])
    .map((value) => (field === FilterSearchParams.OsMode ? OS_MODE_URL_ALIASES[value] || value : value))
    .filter(isDeviceCapabilityFilterValue);

export const parseDeviceFeatureFilters = (searchParams: URLSearchParams): DeviceFeatureFilter[] =>
  getDeviceCapabilityFeatures().map((feature) => ({
    field: feature.field,
    values: parseFeatureFilterValues(searchParams, feature.field),
  }));

export const deviceFeatureFiltersToSearchParams = (filters: DeviceFeatureFilter[]): Record<string, string[]> =>
  Object.fromEntries(
    getDeviceCapabilityFeatures().map((feature) => [feature.field, getFeatureFilterValues(filters, feature.field)]),
  );

// Filters that require the user to enter some free-text
export const DEVICE_TEXT_FILTER_KEYS = [FilterSearchParams.NameOrAlias, FilterSearchParams.CveId];

export type DeviceTextFilterKey = (typeof DEVICE_TEXT_FILTER_KEYS)[number];
export type DeviceFilterTypes = DeviceTextFilterKey | FilterSearchParams.Label;
const CVE_ID_FILTER_PATTERN = /^CVE-\d{4}-\d{4,}$/i;

// Attempting to search for an invalid CVE ID will result in a 400 error from the backend.
export const isValidCveIdFilterValue = (value: string | undefined): boolean => {
  const trimmed = value?.trim() ?? '';
  if (trimmed.length === 0) {
    return true;
  }
  return CVE_ID_FILTER_PATTERN.test(trimmed);
};

export type DeviceSummaryStatus =
  | ApplicationsSummaryStatusType
  | DeviceUpdatedStatusType
  | DeviceSummaryStatusType
  | DeviceIntegrityStatusSummaryType;

export const getDeviceSummaryStatus = (deviceStatus?: BEDeviceSummaryStatus): DeviceSummaryStatusType =>
  deviceStatus?.status || DeviceSummaryStatusType.DeviceSummaryStatusUnknown;

export const getDeviceLifecycleStatus = (device: Device): DeviceLifecycleStatusType => {
  const lifecycleStatus = device.status?.lifecycle?.status || DeviceLifecycleStatusType.DeviceLifecycleStatusEnrolled;
  const isDecomStatus = [
    DeviceLifecycleStatusType.DeviceLifecycleStatusDecommissioning,
    DeviceLifecycleStatusType.DeviceLifecycleStatusDecommissioned,
  ].includes(lifecycleStatus);

  if (!isDecomStatus && device.spec?.decommissioning?.target) {
    return DeviceLifecycleStatusType.DeviceLifecycleStatusDecommissioning;
  }

  return lifecycleStatus;
};

const DEVICE_SUMMARY_STATUS_LEVELS: Record<DeviceSummaryStatusType, StatusLevel> = {
  [DeviceSummaryStatusType.DeviceSummaryStatusError]: 'danger',
  [DeviceSummaryStatusType.DeviceSummaryStatusDegraded]: 'warning',
  [DeviceSummaryStatusType.DeviceSummaryStatusConflictPaused]: 'custom',
  [DeviceSummaryStatusType.DeviceSummaryStatusPoweredOff]: 'custom',
  [DeviceSummaryStatusType.DeviceSummaryStatusAwaitingReconnect]: 'info',
  [DeviceSummaryStatusType.DeviceSummaryStatusRebooting]: 'info',
  [DeviceSummaryStatusType.DeviceSummaryStatusOnline]: 'success',
  [DeviceSummaryStatusType.DeviceSummaryStatusUnknown]: 'unknown',
};

export const getDeviceSummaryStatusLevel = (status?: DeviceSummaryStatusType) =>
  getStatusLevelFromMap(status, DEVICE_SUMMARY_STATUS_LEVELS);

const DEVICE_LIFECYCLE_STATUS_LEVELS: Record<DeviceLifecycleStatusType, StatusLevel> = {
  [DeviceLifecycleStatusType.DeviceLifecycleStatusDecommissioning]: 'warning',
  [DeviceLifecycleStatusType.DeviceLifecycleStatusDecommissioned]: 'unknown',
  [DeviceLifecycleStatusType.DeviceLifecycleStatusEnrolled]: 'success',
  [DeviceLifecycleStatusType.DeviceLifecycleStatusUnknown]: 'unknown',
};

export const getDeviceLifecycleStatusLevel = (status?: DeviceLifecycleStatusType) =>
  getStatusLevelFromMap(status, DEVICE_LIFECYCLE_STATUS_LEVELS);

export const getDeviceStatusItems = (t: TFunction): StatusItem<DeviceSummaryStatusType>[] => [
  {
    id: DeviceSummaryStatusType.DeviceSummaryStatusError,
    label: t('Error'),
    level: DEVICE_SUMMARY_STATUS_LEVELS[DeviceSummaryStatusType.DeviceSummaryStatusError],
  },
  {
    id: DeviceSummaryStatusType.DeviceSummaryStatusDegraded,
    label: t('Degraded'),
    level: DEVICE_SUMMARY_STATUS_LEVELS[DeviceSummaryStatusType.DeviceSummaryStatusDegraded],
  },
  {
    id: DeviceSummaryStatusType.DeviceSummaryStatusUnknown,
    label: t('Unknown'),
    level: DEVICE_SUMMARY_STATUS_LEVELS[DeviceSummaryStatusType.DeviceSummaryStatusUnknown],
  },
  {
    id: DeviceSummaryStatusType.DeviceSummaryStatusRebooting,
    label: t('Rebooting'),
    level: DEVICE_SUMMARY_STATUS_LEVELS[DeviceSummaryStatusType.DeviceSummaryStatusRebooting],
  },
  {
    id: DeviceSummaryStatusType.DeviceSummaryStatusPoweredOff,
    label: t('Powered Off'),
    level: DEVICE_SUMMARY_STATUS_LEVELS[DeviceSummaryStatusType.DeviceSummaryStatusPoweredOff],
    customIcon: PowerOffIcon,
  },
  {
    id: DeviceSummaryStatusType.DeviceSummaryStatusOnline,
    label: t('Online'),
    level: DEVICE_SUMMARY_STATUS_LEVELS[DeviceSummaryStatusType.DeviceSummaryStatusOnline],
  },
  {
    id: DeviceSummaryStatusType.DeviceSummaryStatusAwaitingReconnect,
    label: t('Pending sync'),
    level: DEVICE_SUMMARY_STATUS_LEVELS[DeviceSummaryStatusType.DeviceSummaryStatusAwaitingReconnect],
    customIcon: PendingIcon,
    customColor: pendingSyncColor.value,
  },
  {
    id: DeviceSummaryStatusType.DeviceSummaryStatusConflictPaused,
    label: t('Suspended'),
    level: DEVICE_SUMMARY_STATUS_LEVELS[DeviceSummaryStatusType.DeviceSummaryStatusConflictPaused],
    customIcon: PauseCircleIcon,
    customColor: suspendedColor.value,
  },
];

export const getDeviceFilterLabel = (t: TFunction, key: DeviceFilterTypes) => {
  switch (key) {
    case FilterSearchParams.NameOrAlias:
      return t('Name and alias');
    case FilterSearchParams.CveId:
      return t('CVE ID');
    case FilterSearchParams.Label:
      return t('Labels and fleets');
    default:
      return key;
  }
};

/**
 * Returns device status items for the Overview page, allowing to exclude statuses.
 * If "AwaitingReconnect" or "ConflictPaused" statuses are present, they are ordered at the beginning
 */
export const getOverviewDeviceStatusItems = (
  t: TFunction,
  excludeStatuses?: DeviceSummaryStatusType[],
): StatusItem<DeviceSummaryStatusType>[] => {
  const allStatusItems = getDeviceStatusItems(t);

  const filteredItems = excludeStatuses
    ? allStatusItems.filter((item) => !excludeStatuses.includes(item.id))
    : allStatusItems;

  const priorityStatuses = [
    DeviceSummaryStatusType.DeviceSummaryStatusAwaitingReconnect,
    DeviceSummaryStatusType.DeviceSummaryStatusConflictPaused,
  ];

  const priorityItems = filteredItems.filter((item) => priorityStatuses.includes(item.id));
  const otherItems = filteredItems.filter((item) => !priorityStatuses.includes(item.id));

  const orderedPriorityItems = priorityStatuses
    .map((status) => priorityItems.find((item) => item.id === status))
    .filter(Boolean) as StatusItem<DeviceSummaryStatusType>[];

  return [...orderedPriorityItems, ...otherItems];
};

export const getDeviceLifecycleStatusItems = (t: TFunction): StatusItem<DeviceLifecycleStatusType>[] => [
  {
    id: DeviceLifecycleStatusType.DeviceLifecycleStatusDecommissioned,
    label: t('Decommissioned'),
    level: DEVICE_LIFECYCLE_STATUS_LEVELS[DeviceLifecycleStatusType.DeviceLifecycleStatusDecommissioned],
    customIcon: BanIcon,
  },
  {
    id: DeviceLifecycleStatusType.DeviceLifecycleStatusDecommissioning,
    label: t('Decommissioning'),
    level: DEVICE_LIFECYCLE_STATUS_LEVELS[DeviceLifecycleStatusType.DeviceLifecycleStatusDecommissioning],
  },
  {
    id: DeviceLifecycleStatusType.DeviceLifecycleStatusUnknown,
    label: t('Unknown'),
    level: DEVICE_LIFECYCLE_STATUS_LEVELS[DeviceLifecycleStatusType.DeviceLifecycleStatusUnknown],
  },
  {
    id: DeviceLifecycleStatusType.DeviceLifecycleStatusEnrolled,
    label: t('Enrolled'),
    level: DEVICE_LIFECYCLE_STATUS_LEVELS[DeviceLifecycleStatusType.DeviceLifecycleStatusEnrolled],
  },
];

export const deviceStatusOrder = getDeviceStatusItems((s: string) => s).map((item) => item.id);
