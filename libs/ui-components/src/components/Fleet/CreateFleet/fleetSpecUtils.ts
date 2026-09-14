import { type DeviceUpdatePolicySpec, type FleetSpec, type Percentage, type RolloutPolicy } from '@flightctl/types';

import {
  type BatchForm,
  BatchLimitType,
  type DeltaGenerationForm,
  type FleetFormValues,
  type RolloutPolicyForm,
  UpdateMode,
  type UpdatePolicyForm,
} from './../../../types/deviceSpec';
import { fromAPILabel } from '../../../utils/labels';
import * as timeUtils from '../../../utils/time';
import { schedulesAreEqual } from '../../../utils/time';

export const DEFAULT_BACKEND_UPDATE_TIMEOUT_MINUTES = 1140; // 24h, expressed in minutes
const DEFAULT_BACKEND_SUCCESS_THRESHOLD_PERCENTAGE = '90%';

const numberValue = (value: Percentage | number | undefined) => {
  if (value === undefined || typeof value === 'number') {
    return value;
  }
  return Number(value.replace(/[%]/, ''));
};

export const getEmptyInitializedBatch = (): BatchForm => ({
  limit: undefined,
  limitType: BatchLimitType.BatchLimitPercent,
  successThreshold: numberValue(DEFAULT_BACKEND_SUCCESS_THRESHOLD_PERCENTAGE),
  selector: [],
});

export const getRolloutPolicyValues = (fleetSpec?: FleetSpec): RolloutPolicyForm => {
  const batches = (fleetSpec?.rolloutPolicy?.deviceSelection?.sequence || []).map((batch) => ({
    selector: fromAPILabel(batch.selector?.matchLabels || {}),
    limit: numberValue(batch.limit),
    limitType:
      typeof batch.limit === 'number' ? BatchLimitType.BatchLimitAbsoluteNumber : BatchLimitType.BatchLimitPercent,
    // If the policy does not specify the threshold, we set the backend's default as the field is required in the UI
    successThreshold: numberValue(batch.successThreshold || DEFAULT_BACKEND_SUCCESS_THRESHOLD_PERCENTAGE),
  }));

  // If the policy does not specify the timeout, we set the backend's default as the field is required in the UI
  const updateTimeout = fleetSpec?.rolloutPolicy?.defaultUpdateTimeout || `${DEFAULT_BACKEND_UPDATE_TIMEOUT_MINUTES}m`;
  return {
    isCustomized: batches.length > 0,
    batches: batches.length ? batches : [getEmptyInitializedBatch()],
    updateTimeout: timeUtils.durationToMinutes(updateTimeout),
  };
};

export const getDisruptionBudgetValues = (fleetSpec?: FleetSpec) => {
  const budget = fleetSpec?.rolloutPolicy?.disruptionBudget || {};
  const groupLabels = budget.groupBy || [];
  return {
    isCustomized: Boolean(groupLabels.length > 0 || budget.minAvailable || budget.maxUnavailable),
    groupBy: groupLabels,
    minAvailable: budget.minAvailable,
    maxUnavailable: budget.maxUnavailable,
  };
};

export const getUpdatePolicyValues = (updateSpec?: DeviceUpdatePolicySpec): UpdatePolicyForm => {
  const isEqual = schedulesAreEqual(updateSpec?.updateSchedule, updateSpec?.downloadSchedule);

  const downloadStartsAt = timeUtils.getTime(updateSpec?.downloadSchedule?.at);
  const installStartsAt = timeUtils.getTime(updateSpec?.updateSchedule?.at);

  const downloadWeekDays = timeUtils.getWeekDays(updateSpec?.downloadSchedule?.at);
  const installWeekDays = timeUtils.getWeekDays(updateSpec?.updateSchedule?.at);

  const downloadStartGraceDuration = updateSpec?.downloadSchedule?.startGraceDuration;
  const installStartGraceDuration = isEqual
    ? downloadStartGraceDuration
    : updateSpec?.updateSchedule?.startGraceDuration;

  return {
    isCustomized: Boolean(updateSpec?.downloadSchedule?.at || updateSpec?.updateSchedule?.at),
    downloadAndInstallDiffer: !isEqual,
    downloadStartsAt,
    downloadEndsAt: timeUtils.getEndTime(downloadStartsAt, downloadStartGraceDuration),
    downloadStartGraceDuration,
    downloadWeekDays: downloadWeekDays.selectedDays,
    downloadScheduleMode: downloadWeekDays.allSelected
      ? timeUtils.UpdateScheduleMode.Daily
      : timeUtils.UpdateScheduleMode.Weekly,
    downloadTimeZone: updateSpec?.downloadSchedule?.timeZone || timeUtils.localDeviceTimezone,
    installStartsAt,
    installEndsAt: timeUtils.getEndTime(installStartsAt, installStartGraceDuration),
    installStartGraceDuration,
    installWeekDays: installWeekDays.selectedDays,
    installScheduleMode: installWeekDays.allSelected
      ? timeUtils.UpdateScheduleMode.Daily
      : timeUtils.UpdateScheduleMode.Weekly,
    installTimeZone: updateSpec?.updateSchedule?.timeZone || timeUtils.localDeviceTimezone,
  };
};

// CELIA-WIP Confirm which are the actual values
export const DEFAULT_DELTA_GENERATION_MAX_WAIT = '30m';
export const DEFAULT_DELTA_GENERATION_TIMEOUT = '15m';

/** True when the user customized rollout hold and/or per-job timeout (non-empty inputs). */
export const hasCustomDeltaTiming = (deltaGeneration?: DeltaGenerationForm): boolean =>
  Boolean(deltaGeneration?.isCustomized && (deltaGeneration.maxWaitForDelta || deltaGeneration.deltaGenerationTimeout));

export const rolloutPolicyHasSchedulingFields = (policy?: RolloutPolicy): boolean =>
  policy?.defaultUpdateTimeout !== undefined ||
  (policy?.deviceSelection?.sequence?.length ?? 0) > 0 ||
  Boolean(policy?.disruptionBudget);

/**
 * Maps deltaGeneration form → RolloutPolicy delta fields.
 *
 * | Form state                         | generateDelta                         | maxWait / timeout        |
 * | ---------------------------------- | ------------------------------------- | ------------------------ |
 * | Disabled                           | false                                 | omitted                  |
 * | Enabled + default timing           | omitted (or true if scheduling exists)| omitted                  |
 * | Enabled + custom timing            | true                                  | set for non-empty fields |
 */
export const deltaGenerationToApiFields = (
  deltaForm: DeltaGenerationForm,
  policyHasSchedulingFields: boolean,
): Pick<RolloutPolicy, 'generateDelta' | 'maxWaitForDelta' | 'deltaGenerationTimeout'> => {
  const result: Pick<RolloutPolicy, 'generateDelta' | 'maxWaitForDelta' | 'deltaGenerationTimeout'> = {};

  if (!deltaForm.generateDelta) {
    result.generateDelta = false;
    return result;
  }

  if (hasCustomDeltaTiming(deltaForm)) {
    result.generateDelta = true;
    if (deltaForm.maxWaitForDelta) {
      result.maxWaitForDelta = deltaForm.maxWaitForDelta;
    }
    if (deltaForm.deltaGenerationTimeout) {
      result.deltaGenerationTimeout = deltaForm.deltaGenerationTimeout;
    }
  } else if (policyHasSchedulingFields) {
    result.generateDelta = true;
  }

  return result;
};

/** Whether the fleet spec should include rolloutPolicy (scheduling, delta opt-out, or custom timing). */
export const shouldIncludeRolloutPolicy = (fleetValues: FleetFormValues): boolean => {
  const hasCustomRolloutScheduling =
    fleetValues.updateMode === UpdateMode.Customized &&
    (fleetValues.rolloutPolicy.isCustomized || fleetValues.disruptionBudget.isCustomized);

  return (
    hasCustomRolloutScheduling ||
    !fleetValues.deltaGeneration.generateDelta ||
    hasCustomDeltaTiming(fleetValues.deltaGeneration)
  );
};

export const getDeltaGenerationValues = (fleetSpec?: FleetSpec): DeltaGenerationForm => {
  const rolloutPolicy = fleetSpec?.rolloutPolicy;
  const generateDelta = rolloutPolicy?.generateDelta ?? true;
  const maxWaitForDelta = rolloutPolicy?.maxWaitForDelta;
  const deltaGenerationTimeout = rolloutPolicy?.deltaGenerationTimeout;
  const hasCustomTiming = Boolean(maxWaitForDelta || deltaGenerationTimeout);

  return {
    isCustomized: hasCustomTiming,
    generateDelta,
    maxWaitForDelta: maxWaitForDelta || '',
    deltaGenerationTimeout: deltaGenerationTimeout || '',
  };
};
