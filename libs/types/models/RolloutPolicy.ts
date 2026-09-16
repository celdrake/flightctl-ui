/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DisruptionBudget } from './DisruptionBudget';
import type { Duration } from './Duration';
import type { Percentage } from './Percentage';
import type { RolloutDeviceSelection } from './RolloutDeviceSelection';
/**
 * RolloutPolicy is the rollout policy of the fleet.
 */
export type RolloutPolicy = {
  disruptionBudget?: DisruptionBudget;
  deviceSelection?: RolloutDeviceSelection;
  successThreshold?: Percentage;
  defaultUpdateTimeout?: Duration;
  /**
   * When false, skip control-plane OS delta generation for this fleet. Omitted means true.
   */
  generateDelta?: boolean;
  /**
   * How long a prepare may wait before periodic resume. Omitted uses DeltaGeneration.maxWaitForDelta. Ignored when generateDelta is false. 0s still generates then resumes immediately.
   */
  maxWaitForDelta?: Duration;
  /**
   * Context deadline for each generation job. Omitted uses DeltaGeneration.timeout.
   */
  deltaGenerationTimeout?: Duration;
};

