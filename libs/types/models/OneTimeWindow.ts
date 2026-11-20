/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Duration } from './Duration';
export type OneTimeWindow = {
  /**
   * Exact calendar date on which the one-time window opens.
   */
  date: string;
  /**
   * Local time at which the one-time window opens on the specified date.
   */
  at: string;
  startGraceDuration: Duration;
};

