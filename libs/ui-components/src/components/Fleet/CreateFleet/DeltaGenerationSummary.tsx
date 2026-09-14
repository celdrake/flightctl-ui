import * as React from 'react';
import { Content, Flex, FlexItem, Stack, StackItem } from '@patternfly/react-core';

import { type DeltaGenerationForm } from '../../../types/deviceSpec';
import { useTranslation } from '../../../hooks/useTranslation';
import { DEFAULT_DELTA_GENERATION_MAX_WAIT, DEFAULT_DELTA_GENERATION_TIMEOUT } from './fleetSpecUtils';

type DeltaGenerationSummaryProps = {
  deltaGeneration: DeltaGenerationForm;
};

const DeltaGenerationDuration = ({
  fieldName,
  deltaGeneration,
}: {
  fieldName: 'maxWaitForDelta' | 'deltaGenerationTimeout';
  deltaGeneration: DeltaGenerationForm;
}) => {
  const { t } = useTranslation();

  const fieldValue = deltaGeneration.isCustomized ? deltaGeneration[fieldName] : undefined;
  const defaultValue =
    fieldName === 'maxWaitForDelta' ? DEFAULT_DELTA_GENERATION_MAX_WAIT : DEFAULT_DELTA_GENERATION_TIMEOUT;
  return (
    <Flex justifyContent={{ default: 'justifyContentFlexStart' }} gap={{ default: 'gapXs' }}>
      <FlexItem>{fieldName === 'maxWaitForDelta' ? t('Rollout hold deadline') : t('Per-job timeout')}:</FlexItem>
      <FlexItem>{fieldValue || defaultValue}</FlexItem>
      {!fieldValue && <FlexItem> ({t('deployment default')})</FlexItem>}
    </Flex>
  );
};

const DeltaGenerationSummary = ({ deltaGeneration }: DeltaGenerationSummaryProps) => {
  const { t } = useTranslation();

  if (!deltaGeneration.generateDelta) {
    return <Content>{t('Disabled for this fleet')}</Content>;
  }

  return (
    <Stack>
      <StackItem>{t('Enabled')}</StackItem>
      <StackItem>
        <DeltaGenerationDuration fieldName="maxWaitForDelta" deltaGeneration={deltaGeneration} />
      </StackItem>
      <StackItem>
        <DeltaGenerationDuration fieldName="deltaGenerationTimeout" deltaGeneration={deltaGeneration} />
      </StackItem>
    </Stack>
  );
};

export default DeltaGenerationSummary;
