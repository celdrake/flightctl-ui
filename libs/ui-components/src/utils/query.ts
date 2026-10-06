import { DeviceSummaryStatusType } from '@flightctl/types';

import { type FlightCtlLabel } from '../types/extraTypes';
import {
  DEVICE_FEATURE_LABEL_GPU_PRESENT,
  DEVICE_FEATURE_LABEL_KVM_ENABLED,
  DEVICE_FEATURE_LABEL_OS_MODE,
} from './catalogDeviceFeatures';
import { labelToExactApiMatchString, textToPartialApiMatchString } from './labels';
import {
  DEVICE_BOOLEAN_FEATURE_FILTER_VALUES,
  DEVICE_OS_MODE_FILTER_VALUES,
  type DeviceFeatureFilters,
  KNOWN_BOOLEAN_FEATURE_FILTER_VALUES,
  KNOWN_OS_MODE_FILTER_VALUES,
  UNKNOWN_CAPABILITY_VALUE,
} from './status/devices';

const addQueryConditions = (fieldSelectors: string[], fieldSelector: string, values?: string[]) => {
  if (values?.length === 1) {
    fieldSelectors.push(`${fieldSelector}=${values[0]}`);
  } else if (values?.length) {
    fieldSelectors.push(`${fieldSelector} in (${values.join(',')})`);
  }
};

/**
 * Builds a Kubernetes label selector for a feature that accepts known values plus "unknown" (label absent).
 * Returns undefined when no values are selected, or when every possible value is selected.
 */
const buildOptionalValueLabelSelector = (
  labelKey: string,
  selected: string[] | undefined,
  knownValues: string[],
  allValuesLength: number,
): string | undefined => {
  const uniqueSelected = [...new Set(selected ?? [])];
  if (!uniqueSelected.length || uniqueSelected.length === allValuesLength) {
    return undefined;
  }

  const includeUnknown = uniqueSelected.includes(UNKNOWN_CAPABILITY_VALUE);
  const selectedKnown = uniqueSelected.filter((value) => value !== UNKNOWN_CAPABILITY_VALUE);
  const excludedKnown =
    selectedKnown.length === 1 ? knownValues.find((value) => value !== selectedKnown[0]) : undefined;

  if (includeUnknown) {
    if (selectedKnown.length === 0) {
      return `!${labelKey}`;
    }
    return `${labelKey}!=${excludedKnown}`;
  }

  if (selectedKnown.length === 1) {
    return `${labelKey}=${selectedKnown[0]}`;
  }

  return labelKey;
};

const buildDeviceFeatureLabelSelectors = (filters?: DeviceFeatureFilters): string[] => {
  if (!filters) {
    return [];
  }

  return [
    buildOptionalValueLabelSelector(
      DEVICE_FEATURE_LABEL_OS_MODE,
      filters.osMode,
      KNOWN_OS_MODE_FILTER_VALUES,
      DEVICE_OS_MODE_FILTER_VALUES.length,
    ),
    buildOptionalValueLabelSelector(
      DEVICE_FEATURE_LABEL_GPU_PRESENT,
      filters.gpuPresent,
      KNOWN_BOOLEAN_FEATURE_FILTER_VALUES,
      DEVICE_BOOLEAN_FEATURE_FILTER_VALUES.length,
    ),
    buildOptionalValueLabelSelector(
      DEVICE_FEATURE_LABEL_KVM_ENABLED,
      filters.kvmEnabled,
      KNOWN_BOOLEAN_FEATURE_FILTER_VALUES,
      DEVICE_BOOLEAN_FEATURE_FILTER_VALUES.length,
    ),
  ].filter((selector): selector is string => !!selector);
};

const addTextContainsCondition = (fieldSelectors: string[], fieldSelector: string, value: string) => {
  fieldSelectors.push(`${fieldSelector} contains ${value}`); // contains operator
};

const setLabelParams = (params: URLSearchParams, labels?: FlightCtlLabel[], extraSelectors?: string[]) => {
  const parts: string[] = [];
  if (labels?.length) {
    parts.push(labels.map((label) => `${label.key}=${label.value || ''}`).join(','));
  }
  extraSelectors?.forEach((selector) => {
    if (selector) {
      parts.push(selector);
    }
  });
  if (parts.length) {
    params.append('labelSelector', parts.join(','));
  }
};

type CommonQueryOptions = {
  limit: number | undefined;
};

export const commonQueries = {
  getDevicesWithExactLabelMatching: (labels: FlightCtlLabel[], options?: CommonQueryOptions) => {
    const searchParams = new URLSearchParams();

    const exactLabelsMatch = labels.map(labelToExactApiMatchString).join(',');
    searchParams.set('labelSelector', exactLabelsMatch);

    if (options?.limit) {
      searchParams.set('limit', `${options.limit}`);
    }
    return `devices?${searchParams.toString()}`;
  },
  getDevicesWithPartialLabelMatching: (text: string, options?: CommonQueryOptions) => {
    const searchParams = new URLSearchParams({
      kind: 'Device',
    });

    searchParams.set('fieldSelector', textToPartialApiMatchString(text));

    if (options?.limit) {
      searchParams.set('limit', `${options.limit}`);
    }
    return `labels?${searchParams.toString()}`;
  },
  getFleetsWithNameMatching: (matchName: string, options?: CommonQueryOptions) => {
    const searchParams = new URLSearchParams();
    searchParams.set('fieldSelector', `metadata.name contains ${matchName}`);

    if (options?.limit) {
      searchParams.set('limit', `${options.limit}`);
    }
    return `fleets?${searchParams.toString()}`;
  },
  getResourceSyncsByRepo: ({
    repositoryId,
    rsName,
    options,
  }: {
    repositoryId: string;
    rsName?: string;
    options?: CommonQueryOptions;
  }) => {
    const selectors: string[] = [`spec.repository=${repositoryId}`];
    if (rsName) {
      selectors.push(`metadata.name contains ${rsName}`);
    }

    const searchParams = new URLSearchParams();
    searchParams.set('fieldSelector', selectors.join(','));
    if (options?.limit) {
      searchParams.set('limit', `${options.limit}`);
    }
    return `resourcesyncs?${searchParams.toString()}`;
  },
  getRepositoryById: (repositoryId: string) => `repositories/${repositoryId}`,
  getSuspendedDeviceCountByLabels: (labels: FlightCtlLabel[]) => {
    const searchParams = new URLSearchParams({
      limit: '1',
    });
    searchParams.set('labelSelector', labels.map(labelToExactApiMatchString).join(','));
    searchParams.set(
      'fieldSelector',
      `status.summary.status=${DeviceSummaryStatusType.DeviceSummaryStatusConflictPaused}`,
    );
    return `devices?${searchParams.toString()}`;
  },
  getAllSuspendedDevicesCount: () => {
    const searchParams = new URLSearchParams({
      limit: '1',
    });
    searchParams.set(
      'fieldSelector',
      `status.summary.status=${DeviceSummaryStatusType.DeviceSummaryStatusConflictPaused}`,
    );
    return `devices?${searchParams.toString()}`;
  },
};

export { addQueryConditions, addTextContainsCondition, buildDeviceFeatureLabelSelectors, setLabelParams };
