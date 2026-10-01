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

import type { SystemInfoEntry } from '../../../hooks/useDeviceSpecSystemInfo';
import { useTranslation } from '../../../hooks/useTranslation';
import LabelWithHelperText from '../../common/WithHelperText';
import { useSystemInfoDemoOptions } from './SystemInfoDemoOptions';

const hasDisplayValue = (value: React.ReactNode) => value !== undefined && value !== null && value !== '';

const SystemInfoValue = ({ entry }: { entry: SystemInfoEntry }) => {
  const { t } = useTranslation();
  const { shortChangedLabel } = useSystemInfoDemoOptions();
  const reporting = entry.reporting;
  const isFailed = reporting?.status === SystemInfoSourceStatusType.SystemInfoSourceStatusError;

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
      {isFailed && (
        <StackItem>
          <Flex spaceItems={{ default: 'spaceItemsXs' }} alignItems={{ default: 'alignItemsCenter' }}>
            <FlexItem>
              <Label isCompact status="danger">
                {t('Failed')}
              </Label>
            </FlexItem>
            {reporting?.error && (
              <FlexItem>
                <LabelWithHelperText hideLabel label={t('Failed')} content={reporting.error} />
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
