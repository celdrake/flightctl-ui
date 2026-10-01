import * as React from 'react';
import {
  Content,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Flex,
  FlexItem,
  Label,
  Stack,
  StackItem,
} from '@patternfly/react-core';
import { SystemInfoSourceStatusType } from '@flightctl/types';

import type { SystemInfoEntry } from '../../../hooks/useDeviceSystemInfo';
import { useTranslation } from '../../../hooks/useTranslation';
import LabelWithHelperText from '../../common/WithHelperText';
import { useSystemInfoDemoOptions } from './SystemInfoDemoOptions';

const hasDisplayValue = (value: React.ReactNode) => value !== undefined && value !== null && value !== '';

const SystemInfoValue = ({ entry }: { entry: SystemInfoEntry }) => {
  const { t } = useTranslation();
  const { shortChangedLabel } = useSystemInfoDemoOptions();
  const reporting = entry.reporting;
  const isFailed = reporting?.status === SystemInfoSourceStatusType.SystemInfoSourceStatusError;
  const isUnknown = reporting?.status === SystemInfoSourceStatusType.SystemInfoSourceStatusUnknown;

  return (
    <Stack>
      <StackItem>
        {hasDisplayValue(entry.value) ? entry.value : <Content component="small">{t('No value reported')}</Content>}
      </StackItem>
      {reporting && (
        <StackItem>
          <Content component="small">
            {shortChangedLabel
              ? t('Changed {{time}}', { time: reporting.timeSince })
              : t('Last changed {{time}}', { time: reporting.timeSince })}
          </Content>
        </StackItem>
      )}
      {isUnknown && (
        <StackItem>
          <Label isCompact>{t('Unknown')}</Label>
        </StackItem>
      )}
      {isFailed && (
        <StackItem>
          <Flex spaceItems={{ default: 'spaceItemsXs' }} alignItems={{ default: 'alignItemsCenter' }}>
            <FlexItem>
              <Label isCompact status="warning">
                {t('Stale')}
              </Label>
            </FlexItem>
            {reporting?.error && (
              <FlexItem>
                <LabelWithHelperText
                  hideLabel
                  label={t('Reported {{fieldKey}} value is stale', { fieldKey: entry.key })}
                  content={
                    <Stack hasGutter>
                      <StackItem>
                        {t(
                          'This is the last known value. It has not been refreshed within the expected reporting interval.',
                        )}
                      </StackItem>
                      <StackItem>
                        <details>
                          <summary>{t('Error details')}</summary>
                          {reporting.error}
                        </details>
                      </StackItem>
                    </Stack>
                  }
                />
              </FlexItem>
            )}
          </Flex>
        </StackItem>
      )}
    </Stack>
  );
};

const SystemInfoDescriptionGroup = ({ entry }: { entry: SystemInfoEntry }) => {
  const { prettifyNames } = useSystemInfoDemoOptions();

  return (
    <DescriptionListGroup key={entry.key}>
      <DescriptionListTerm>{prettifyNames ? entry.title : entry.key}</DescriptionListTerm>
      <DescriptionListDescription>
        <SystemInfoValue entry={entry} />
      </DescriptionListDescription>
    </DescriptionListGroup>
  );
};

export default SystemInfoDescriptionGroup;
