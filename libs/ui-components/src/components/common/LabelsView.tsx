import * as React from 'react';
import { Label, LabelGroup, Tooltip } from '@patternfly/react-core';

import { useTranslation } from '../../hooks/useTranslation';
import { FlightCtlLabel } from '../../types/extraTypes';
import { ManagedLabelsPartition } from '../../hooks/useDeviceLabelProvenance';

interface LabelsViewProps {
  prefix: string;
  labels: Record<string, string | undefined> | undefined;
}

const ManagedLabel = ({ label, isInline }: { label: FlightCtlLabel; isInline?: boolean }) => {
  const { t } = useTranslation();
  const text = label.value ? `${label.key}=${label.value}` : label.key;

  return (
    <Tooltip
      content={t(
        'Promoted from device status by organization mappings. Used for device selection and mapping; cannot be edited on the device.',
      )}
    >
      <span tabIndex={0}>
        <Label color="grey" textMaxWidth={isInline ? '12ch' : undefined}>
          {text}
        </Label>
      </span>
    </Tooltip>
  );
};

export const ManagedLabelsView = ({
  managedLabels,
  showOnly,
}: {
  managedLabels: ManagedLabelsPartition;
  showOnly?: number;
}) => {
  return (
    <LabelGroup numLabels={showOnly || managedLabels.totalCount}>
      {managedLabels.items
        .filter((_, index) => index < (showOnly || managedLabels.totalCount))
        .map((label) => (
          <ManagedLabel key={label.key} label={label} isInline={Boolean(showOnly)} />
        ))}
    </LabelGroup>
  );
};

const LabelsView = ({ prefix, labels }: LabelsViewProps) => {
  const { t } = useTranslation();
  const labelItems = Object.entries(labels || {});
  if (labelItems.length === 0) {
    return '-';
  }

  return (
    <LabelGroup numLabels={5} expandedText={t('Show less')} collapsedText={'${remaining} ' + t('more')}>
      {labelItems.map(([key, value], index: number) => (
        <Label color="blue" key={`${prefix}_${index}`} id={`${prefix}_${index}`}>
          {value ? `${key}=${value}` : key}
        </Label>
      ))}
    </LabelGroup>
  );
};

export default LabelsView;
