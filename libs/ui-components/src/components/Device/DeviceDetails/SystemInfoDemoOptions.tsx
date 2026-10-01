import * as React from 'react';
import { Alert, Checkbox, Flex, FlexItem } from '@patternfly/react-core';
import {
  type DeviceSystemInfo,
  type DeviceSystemInfoStatus,
  type SystemInfoSourceStatus,
  SystemInfoSourceStatusType,
  SystemInfoSummaryStatusType,
} from '@flightctl/types';

// TEMP demo toggles — revert after colleague demos
export type SystemInfoDemoOptions = {
  /** When true, show "Changed {{time}}" instead of "Last changed {{time}}" */
  shortChangedLabel: boolean;
  /** When true, show human titles (Agent version) instead of raw keys (agentVersion) */
  prettifyNames: boolean;
  /** When true, split Labels vs Device-reported information (EDM-5268 provenance mock) */
  showDeviceReportedInfo: boolean;
  /**
   * When true, overlay demo reporting states on a few fields:
   * stale (2 days ago), Unknown, and Failed.
   */
  simulateReportingVariants: boolean;
};

const defaultOptions: SystemInfoDemoOptions = {
  shortChangedLabel: false,
  prettifyNames: false,
  showDeviceReportedInfo: false,
  simulateReportingVariants: false,
};

const SystemInfoDemoOptionsContext = React.createContext<SystemInfoDemoOptions>(defaultOptions);

export const useSystemInfoDemoOptions = () => React.useContext(SystemInfoDemoOptionsContext);

export const SystemInfoDemoOptionsProvider = ({
  value,
  children,
}: React.PropsWithChildren<{ value: SystemInfoDemoOptions }>) => (
  <SystemInfoDemoOptionsContext.Provider value={value}>{children}</SystemInfoDemoOptionsContext.Provider>
);

const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;

const sourceStatus = (
  status: SystemInfoSourceStatusType,
  lastTransitionTime: string,
  message?: string,
): SystemInfoSourceStatus => ({
  status,
  lastTransitionTime,
  message,
});

const pickKeys = (candidates: string[], available: string[], count: number): string[] => {
  const availableSet = new Set(available);
  const preferred = candidates.filter((key) => availableSet.has(key));
  if (preferred.length >= count) {
    return preferred.slice(0, count);
  }
  const rest = available.filter((key) => !preferred.includes(key));
  return [...preferred, ...rest].slice(0, count);
};

/**
 * TEMP: builds a DeviceSystemInfoStatus with mixed demo states for a few keys.
 * - 2 fields: Healthy, lastTransitionTime = 2 days ago
 * - 1 field: Unknown
 * - 2 fields: Error (+ message)
 */
export const buildDemoSystemInfoStatus = (
  systemInfo: DeviceSystemInfo | undefined,
  realStatus: DeviceSystemInfoStatus | undefined,
): DeviceSystemInfoStatus => {
  const now = new Date().toISOString();
  const twoDaysAgo = new Date(Date.now() - TWO_DAYS_MS).toISOString();

  const systemInfoMap: Record<string, SystemInfoSourceStatus> = {
    ...(realStatus?.statuses.systemInfo || {}),
  };
  const customInfoMap: Record<string, SystemInfoSourceStatus> = {
    ...(realStatus?.statuses.customInfo || {}),
  };

  // Seed Healthy/recent for keys that exist but have no status yet, so demos always show timestamps
  const systemKeys = [
    'agentVersion',
    'operatingSystem',
    'hostname',
    'architecture',
    'bootID',
    'kernel',
    'productName',
  ].filter((key) => systemInfo?.[key] !== undefined && systemInfo?.[key] !== '');
  const customKeys = Object.keys(systemInfo?.customInfo || {});

  [...systemKeys, ...Object.keys(systemInfoMap)].forEach((key) => {
    if (!systemInfoMap[key]) {
      systemInfoMap[key] = sourceStatus(SystemInfoSourceStatusType.SystemInfoSourceStatusHealthy, now);
    }
  });
  customKeys.forEach((key) => {
    if (!customInfoMap[key]) {
      customInfoMap[key] = sourceStatus(SystemInfoSourceStatusType.SystemInfoSourceStatusHealthy, now);
    }
  });

  const allSystemKeys = Object.keys(systemInfoMap);
  const allCustomKeys = Object.keys(customInfoMap);

  // Prefer spreading variants across system + custom when both exist
  const staleKeys = pickKeys(['agentVersion', 'hostname'], allSystemKeys, 2);
  const unknownKeys = pickKeys(['architecture'], allSystemKeys, 1);
  const failedSystemKeys = pickKeys(['kernel', 'bootID'], allSystemKeys, allCustomKeys.length > 0 ? 1 : 2);
  const failedCustomKeys = pickKeys(allCustomKeys, allCustomKeys, Math.min(2, Math.max(0, 2 - failedSystemKeys.length)));

  staleKeys.forEach((key) => {
    systemInfoMap[key] = sourceStatus(SystemInfoSourceStatusType.SystemInfoSourceStatusHealthy, twoDaysAgo);
  });
  unknownKeys.forEach((key) => {
    systemInfoMap[key] = sourceStatus(SystemInfoSourceStatusType.SystemInfoSourceStatusUnknown, now);
  });
  failedSystemKeys.forEach((key) => {
    systemInfoMap[key] = sourceStatus(
      SystemInfoSourceStatusType.SystemInfoSourceStatusError,
      now,
      `Demo: failed to collect ${key}`,
    );
  });
  failedCustomKeys.forEach((key) => {
    customInfoMap[key] = sourceStatus(
      SystemInfoSourceStatusType.SystemInfoSourceStatusError,
      twoDaysAgo,
      `Demo: custom script "${key}" exited with status 1`,
    );
  });

  // If we still need a second failed and only custom remains, already handled.
  // If no custom keys, ensure two system failures via pickKeys above.

  return {
    summary: realStatus?.summary || { status: SystemInfoSummaryStatusType.SystemInfoSummaryStatusDegraded },
    statuses: {
      systemInfo: systemInfoMap,
      customInfo: customInfoMap,
    },
  };
};

/** TEMP: returns real status, or demo-overlaid status when the simulate checkbox is on */
export const useDemoSystemInfoStatus = (
  systemInfo: DeviceSystemInfo | undefined,
  systemInfoStatus: DeviceSystemInfoStatus | undefined,
): DeviceSystemInfoStatus | undefined => {
  const { simulateReportingVariants } = useSystemInfoDemoOptions();
  return React.useMemo(() => {
    if (!simulateReportingVariants) {
      return systemInfoStatus;
    }
    return buildDemoSystemInfoStatus(systemInfo, systemInfoStatus);
  }, [simulateReportingVariants, systemInfo, systemInfoStatus]);
};

const allEnabled: SystemInfoDemoOptions = {
  shortChangedLabel: true,
  prettifyNames: true,
  showDeviceReportedInfo: true,
  simulateReportingVariants: true,
};

const isAllEnabled = (options: SystemInfoDemoOptions) =>
  options.shortChangedLabel &&
  options.prettifyNames &&
  options.showDeviceReportedInfo &&
  options.simulateReportingVariants;

/** TEMP: checkbox strip for demoing systemInfo / device-reported label variants */
export const SystemInfoDemoOptionsBar = ({
  options,
  onChange,
}: {
  options: SystemInfoDemoOptions;
  onChange: (next: SystemInfoDemoOptions) => void;
}) => (
  <Alert isInline variant="warning" title="Demo options">
    <Flex spaceItems={{ default: 'spaceItemsLg' }}>
      <FlexItem>
        <Checkbox
          id="temp-demo-enable-all"
          label="Enable all"
          isChecked={isAllEnabled(options)}
          onChange={(_e, checked) => onChange(checked ? allEnabled : defaultOptions)}
        />
      </FlexItem>
      <FlexItem>
        <Checkbox
          id="temp-demo-raw-field-names"
          label="Prettify names"
          isChecked={options.prettifyNames}
          onChange={(_e, checked) => onChange({ ...options, prettifyNames: checked })}
        />
      </FlexItem>
      <FlexItem>
        <Checkbox
          id="temp-demo-short-changed-label"
          label='Shorter "Changed" text'
          isChecked={options.shortChangedLabel}
          onChange={(_e, checked) => onChange({ ...options, shortChangedLabel: checked })}
        />
      </FlexItem>
      <FlexItem>
        <Checkbox
          id="temp-demo-device-reported-info"
          label="Device-reported information"
          isChecked={options.showDeviceReportedInfo}
          onChange={(_e, checked) => onChange({ ...options, showDeviceReportedInfo: checked })}
        />
      </FlexItem>
      <FlexItem>
        <Checkbox
          id="temp-demo-simulate-reporting"
          label="Simulate stale / Unknown / Failed reporting"
          isChecked={options.simulateReportingVariants}
          onChange={(_e, checked) => onChange({ ...options, simulateReportingVariants: checked })}
        />
      </FlexItem>
    </Flex>
  </Alert>
);
