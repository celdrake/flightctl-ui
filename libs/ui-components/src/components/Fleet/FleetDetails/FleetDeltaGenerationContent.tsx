import * as React from 'react';
import {
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Icon,
  Label,
} from '@patternfly/react-core';
import InProgressIcon from '@patternfly/react-icons/dist/js/icons/in-progress-icon';

import { ConditionType, type DeltaGenerationStatus, type Fleet } from '@flightctl/types';
import { useTranslation } from '../../../hooks/useTranslation';
import LabelWithHelperText from '../../common/WithHelperText';
import { getTrueCondition } from '../../../utils/api';

const ProgressMessage = ({ deltaStatus }: { deltaStatus?: DeltaGenerationStatus }) => {
  const { t } = useTranslation();

  let message: string;
  if (deltaStatus) {
    message = t('{{ completed }}/{{ total }} delta pairs', {
      completed: deltaStatus.completed,
      total: deltaStatus.total,
    });
  } else {
    message = t('Progress unknown');
  }

  return (
    <Label
      variant="outline"
      icon={
        <Icon>
          <InProgressIcon />
        </Icon>
      }
    >
      {message}
    </Label>
  );
};

const FleetDeltaGenerationProgress = ({ fleet }: { fleet: Fleet }) => {
  const { t } = useTranslation();

  const deltaPreparingCondition = getTrueCondition(fleet.status?.conditions, ConditionType.FleetDeltaPreparing);
  if (!deltaPreparingCondition) {
    return null;
  }

  const deltaStatus = fleet.status?.deltaGeneration;

  return (
    <DescriptionListGroup>
      <DescriptionListTerm>
        <LabelWithHelperText
          label={t('Delta generation progress')}
          content={t(
            'Incremental update artifacts are being generated before rollout continues. Fleet rollout may be held until generation completes or the configured deadline is reached.',
          )}
        />
      </DescriptionListTerm>
      <DescriptionListDescription>
        <ProgressMessage deltaStatus={deltaStatus} />
      </DescriptionListDescription>
    </DescriptionListGroup>
  );
};

const FleetDeltaGenerationContent = ({ fleet }: { fleet: Fleet }) => {
  const { t } = useTranslation();

  const rolloutPolicy = fleet.spec.rolloutPolicy;
  const isDeltaDisabled = rolloutPolicy?.generateDelta === false;
  return (
    <>
      <DescriptionListGroup>
        <DescriptionListTerm>
          <LabelWithHelperText
            label={t('Delta generation')}
            content={t(
              'Fleet-level setting for server-side incremental update artifacts. Configured in fleet update policy; view or edit in fleet configurations.',
            )}
          />
        </DescriptionListTerm>
        <DescriptionListDescription>{isDeltaDisabled ? t('Disabled') : t('Enabled')}</DescriptionListDescription>
      </DescriptionListGroup>

      <FleetDeltaGenerationProgress fleet={fleet} />
    </>
  );
};

export default FleetDeltaGenerationContent;
