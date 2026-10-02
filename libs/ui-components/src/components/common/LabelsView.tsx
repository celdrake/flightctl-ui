import * as React from 'react';
import { Label, LabelGroup, Tooltip } from '@patternfly/react-core';

import type { ManagedLabel } from '../../hooks/useDeviceLabelProvenance';
import { useTranslation } from '../../hooks/useTranslation';
import type { FlightCtlLabel } from '../../types/extraTypes';

interface LabelsViewProps {
  prefix: string;
  labels: Record<string, string | undefined> | undefined;
}

const ManagedLabelChip = ({ label, withMaxWidth }: { label: FlightCtlLabel; withMaxWidth?: boolean }) => {
  const { t } = useTranslation();
  const text = label.value ? `${label.key}=${label.value}` : label.key;

  const labelContent = (
    <Label color="grey" textMaxWidth={withMaxWidth ? '20ch' : undefined}>
      {text}
    </Label>
  );

  return withMaxWidth ? (
    labelContent
  ) : (
    <Tooltip
      content={t(
        'Promoted from device status by organization mappings. Used for device selection and mapping; cannot be edited on the device.',
      )}
    >
      <span tabIndex={0}>{labelContent}</span>
    </Tooltip>
  );
};

export const ManagedLabelsView = ({
  managedLabels,
  showOnly,
  onlyDerived,
}: {
  managedLabels: ManagedLabel[];
  showOnly?: number;
  onlyDerived?: boolean;
}) => {
  let visibleLabels: ManagedLabel[] = [];
  if (onlyDerived || showOnly) {
    visibleLabels = managedLabels.filter((label, index) => {
      if (showOnly && index >= showOnly) {
        return false;
      }
      return onlyDerived ? label.isDerived : true;
    });
  } else {
    visibleLabels = managedLabels;
  }

  return (
    <LabelGroup numLabels={visibleLabels.length}>
      {visibleLabels.map((label) => (
        <ManagedLabelChip key={label.key} label={label} withMaxWidth={onlyDerived} />
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
