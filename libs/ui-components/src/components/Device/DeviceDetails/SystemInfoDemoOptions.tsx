import * as React from 'react';
import { Alert, Checkbox, Flex, FlexItem } from '@patternfly/react-core';

// TEMP demo toggles — revert after colleague demos
export type SystemInfoDemoOptions = {
  /** When true, show "Changed {{time}}" instead of "Last changed {{time}}" */
  shortChangedLabel: boolean;
  /** When true, show raw keys (agentVersion) instead of human titles (Agent version) */
  prettifyNames: boolean;
};

const defaultOptions: SystemInfoDemoOptions = {
  shortChangedLabel: false,
  prettifyNames: false,
};

const SystemInfoDemoOptionsContext = React.createContext<SystemInfoDemoOptions>(defaultOptions);

export const useSystemInfoDemoOptions = () => React.useContext(SystemInfoDemoOptionsContext);

export const SystemInfoDemoOptionsProvider = ({
  value,
  children,
}: React.PropsWithChildren<{ value: SystemInfoDemoOptions }>) => (
  <SystemInfoDemoOptionsContext.Provider value={value}>{children}</SystemInfoDemoOptionsContext.Provider>
);

/** TEMP: checkbox strip for demoing systemInfo label variants */
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
    </Flex>
  </Alert>
);
