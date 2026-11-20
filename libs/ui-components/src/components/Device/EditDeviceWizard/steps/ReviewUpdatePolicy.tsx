import React from 'react';
import {
  Content,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Stack,
  StackItem,
} from '@patternfly/react-core';

import type {
  DeltaGenerationForm,
  DisruptionBudgetForm,
  OneTimeWindowForm,
  RolloutPolicyForm,
  UpdatePolicyForm,
} from '../../../../types/deviceSpec';

import { useTranslation } from '../../../../hooks/useTranslation';
import { getCalendarDateDisplay } from '../../../../utils/dates';
import LabelsView from '../../../common/LabelsView';
import { getDownloadPolicyText, getInstallPolicyText } from '../../../Fleet/CreateFleet/fleetSpecUtils';
import { hasRecurringSchedule, localDeviceTimezone } from '../../../../utils/time';

export const ReviewRolloutPolicy = ({ rolloutPolicy }: { rolloutPolicy: RolloutPolicyForm }) => {
  const { t } = useTranslation();

  return rolloutPolicy.isCustomized
    ? t('{{ count }} batches have been defined', { count: rolloutPolicy.batches.length })
    : '-';
};

export const ReviewDisruptionBudget = ({ disruptionBudget }: { disruptionBudget: DisruptionBudgetForm }) => {
  const { t } = useTranslation();
  if (!disruptionBudget.isCustomized) {
    return '-';
  }

  const groupBy = disruptionBudget.groupBy || [];
  const labels =
    groupBy.length === 0
      ? null
      : groupBy.reduce((acc, labelKey) => {
          acc[labelKey] = '';
          return acc;
        }, {});

  return (
    <Stack hasGutter>
      {labels ? (
        <StackItem>
          <LabelsView labels={labels} prefix="disruption" />
        </StackItem>
      ) : (
        t('Applies to all the fleet devices')
      )}

      {disruptionBudget.minAvailable && (
        <StackItem>
          {t('Minimum available devices: {{ minAvailable }}', { minAvailable: disruptionBudget.minAvailable })}
        </StackItem>
      )}
      {disruptionBudget.maxUnavailable && (
        <StackItem>
          {t('Maximum unavailable devices: {{ maxUnavailable }}', {
            maxUnavailable: disruptionBudget.maxUnavailable,
          })}
        </StackItem>
      )}
    </Stack>
  );
};

export const ReviewUpdatePolicy = ({ updatePolicy }: { updatePolicy: UpdatePolicyForm }) => {
  const { t } = useTranslation();
  const downloadWindows = updatePolicy.downloadOneTimeWindows || [];
  const installWindows = updatePolicy.installOneTimeWindows || [];
  const installTimeZone = updatePolicy.downloadAndInstallDiffer
    ? updatePolicy.installTimeZone
    : updatePolicy.downloadTimeZone;

  const describeWindows = (windows: OneTimeWindowForm[], timeZone: string) => {
    const timeZoneLabel = timeZone === localDeviceTimezone ? t('device local') : timeZone;
    const windowsText = windows
      .map((window) => `${getCalendarDateDisplay(window.date)} ${window.startsAt}–${window.endsAt}`)
      .join('; ');
    return `${windowsText} (${timeZoneLabel})`;
  };

  return (
    <Stack hasGutter>
      {updatePolicy.downloadCron ? (
        <StackItem>
          {t('Download window')}: {getDownloadPolicyText(updatePolicy, t)}
        </StackItem>
      ) : null}
      {updatePolicy.downloadAndInstallDiffer || updatePolicy.installCron ? (
        <StackItem>
          {t('Update window')}: {getInstallPolicyText(updatePolicy, t)}
        </StackItem>
      ) : null}
      {!hasRecurringSchedule(updatePolicy) && (
        <StackItem>
          {t('Recurring schedule')}: {t('None')}
        </StackItem>
      )}
      {downloadWindows.length > 0 && (
        <StackItem>
          {t('One-time download windows')}: {describeWindows(downloadWindows, updatePolicy.downloadTimeZone)}
        </StackItem>
      )}
      {installWindows.length > 0 && (
        <StackItem>
          {t('One-time update windows')}: {describeWindows(installWindows, installTimeZone)}
        </StackItem>
      )}
    </Stack>
  );
};

export const ReviewDeltaGeneration = ({ deltaGeneration }: { deltaGeneration: DeltaGenerationForm }) => {
  const { t } = useTranslation();

  let content: React.ReactNode = null;
  if (!deltaGeneration.generateDelta) {
    content = <Content>{t('Disabled for this fleet')}</Content>;
  } else if (!deltaGeneration.isCustomized) {
    content = <Content>{t("Enabled (admin's settings)")}</Content>;
  } else {
    content = (
      <Stack>
        <StackItem>{t('Enabled (custom timeouts)')}</StackItem>
        {deltaGeneration.maxWaitForDelta && (
          <StackItem>
            {t('Rollout hold deadline')}: {deltaGeneration.maxWaitForDelta}
          </StackItem>
        )}
        {deltaGeneration.deltaGenerationTimeout && (
          <StackItem>
            {t('Per-job timeout')}: {deltaGeneration.deltaGenerationTimeout}
          </StackItem>
        )}
      </Stack>
    );
  }

  return (
    <DescriptionListGroup>
      <DescriptionListTerm>{t('Delta generation for this fleet')}</DescriptionListTerm>
      <DescriptionListDescription>{content}</DescriptionListDescription>
    </DescriptionListGroup>
  );
};
