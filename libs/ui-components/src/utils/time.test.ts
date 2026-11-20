import { afterEach, describe, expect, it, vi } from 'vitest';

import { type UpdatePolicyForm } from '../types/deviceSpec';
import { updatePolicyFormToApi } from './patches/patch';
import {
  UpdateScheduleMode,
  assessOneTimeStandingOverlap,
  getStartGraceDuration,
  groupOneTimeWindowEntries,
  isOneTimeWindowExpired,
  isUiSupportedCron,
} from './time';

const oneTimePolicyForm = (overrides: Partial<UpdatePolicyForm> = {}): Required<UpdatePolicyForm> =>
  ({
    isCustomized: true,
    downloadAndInstallDiffer: false,
    downloadStartsAt: '00:00',
    downloadEndsAt: '23:59',
    downloadStartGraceDuration: '',
    downloadScheduleMode: UpdateScheduleMode.Daily,
    downloadWeekDays: [true, true, true, true, true, true, true],
    downloadTimeZone: 'UTC',
    installStartsAt: '00:00',
    installEndsAt: '23:59',
    installStartGraceDuration: '',
    installScheduleMode: UpdateScheduleMode.Daily,
    installWeekDays: [true, true, true, true, true, true, true],
    installTimeZone: 'UTC',
    downloadOneTimeWindows: [],
    installOneTimeWindows: [],
    ...overrides,
  }) as Required<UpdatePolicyForm>;

describe('one-time maintenance window helpers', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('converts start and end times to an API duration, including overnight ranges', () => {
    expect(getStartGraceDuration('22:00', '23:30')).toBe('90m');
    expect(getStartGraceDuration('04:00', '06:00')).toBe('2h');
    expect(getStartGraceDuration('23:00', '01:00')).toBe('2h');
  });

  it('expires a window after its local end time', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-20T12:00:00'));
    expect(isOneTimeWindowExpired('2026-11-20', '11:00')).toBe(true);
    expect(isOneTimeWindowExpired('2026-11-20', '13:00')).toBe(false);
    expect(isOneTimeWindowExpired('', '11:00')).toBe(false);
  });

  it('assesses overlaps with the recurring schedule on the matching weekday', () => {
    const standing = {
      startsAt: '02:00',
      endsAt: '06:00',
      scheduleMode: UpdateScheduleMode.Daily,
      weekDays: [true, true, true, true, true, true, true],
      timeZone: 'UTC',
    };
    expect(assessOneTimeStandingOverlap('2026-11-20', '03:00', '04:00', 'UTC', standing).kind).toBe('likely_covered');
    expect(assessOneTimeStandingOverlap('2026-11-20', '05:00', '07:00', 'UTC', standing).kind).toBe('clock_overlap');
    expect(assessOneTimeStandingOverlap('2026-11-20', '07:00', '08:00', 'UTC', standing).kind).toBe('none');
    expect(assessOneTimeStandingOverlap('2026-11-20', '03:00', '04:00', 'Local', standing).kind).toBe(
      'timezone_uncertain',
    );
  });

  it('groups only pairs of windows that share a date', () => {
    const entry = (date: string, id: string) => ({ window: { date, id }, index: 0 });
    const entries = [
      entry('2026-11-15', 'a'),
      entry('2026-11-15', 'b'),
      entry('2026-11-16', 'c'),
      entry('2026-11-17', 'd'),
      entry('2026-11-17', 'e'),
      entry('2026-11-17', 'f'),
      entry('', 'g'),
      entry('', 'h'),
    ];

    expect(groupOneTimeWindowEntries(entries).map((group) => group.map((item) => item.window.id))).toEqual([
      ['a', 'b'],
      ['c'],
      ['d'],
      ['e'],
      ['f'],
      ['g', 'h'],
    ]);
  });

  it('only treats Daily/Weekly cron expressions as editable', () => {
    expect(isUiSupportedCron('0 4 * * 2,5')).toBe(true);
    expect(isUiSupportedCron('0 4 * * *')).toBe(true);
    expect(isUiSupportedCron('*/15 4 * * *')).toBe(false);
    expect(isUiSupportedCron('0 4 1 * *')).toBe(false);
  });

  it('maps a one-time download window to both schedules when they are shared', () => {
    const form = oneTimePolicyForm({
      downloadOneTimeWindows: [{ id: '1', date: '2026-11-15', startsAt: '22:00', endsAt: '23:30' }],
    });
    const policy = updatePolicyFormToApi(form);

    const expectedSchedule = {
      timeZone: 'UTC',
      oneTimeWindows: [{ date: '2026-11-15', at: '22:00', startGraceDuration: '90m' }],
    };
    expect(policy.downloadSchedule).toEqual(expectedSchedule);
    expect(policy.updateSchedule).toEqual(expectedSchedule);
  });

  it('keeps a one-time-only update schedule independent from the download schedule', () => {
    const form = oneTimePolicyForm({
      downloadTimeZone: 'Europe/Madrid',
      installOneTimeWindows: [{ id: '1', date: '2026-11-16', startsAt: '01:00', endsAt: '02:00' }],
    });
    const policy = updatePolicyFormToApi(form);

    expect(policy.downloadSchedule).toBeUndefined();
    expect(policy.updateSchedule).toEqual({
      timeZone: 'Europe/Madrid',
      oneTimeWindows: [{ date: '2026-11-16', at: '01:00', startGraceDuration: '1h' }],
    });
  });

  it('uses the download timezone for update windows while both schedules are shared', () => {
    const form = oneTimePolicyForm({
      downloadCron: '0 2 * * *',
      downloadTimeZone: 'Europe/Madrid',
      installTimeZone: 'UTC',
      installOneTimeWindows: [{ id: '1', date: '2026-11-16', startsAt: '01:00', endsAt: '02:00' }],
    });

    expect(updatePolicyFormToApi(form).updateSchedule?.timeZone).toBe('Europe/Madrid');
  });

  it('builds the install recurring schedule from its own fields when schedules differ', () => {
    const form = oneTimePolicyForm({
      downloadAndInstallDiffer: true,
      downloadCron: '0 2 * * *',
      installStartGraceDuration: '2h',
      installScheduleMode: UpdateScheduleMode.Weekly,
      installWeekDays: [false, true, false, true, false, false, false],
      installTimeZone: 'UTC',
    });

    expect(updatePolicyFormToApi(form).updateSchedule).toEqual({
      at: '0 0 * * 1,3',
      startGraceDuration: '2h',
      timeZone: 'UTC',
    });
  });

  it('maps download and update windows independently', () => {
    const form = oneTimePolicyForm({
      downloadOneTimeWindows: [{ id: '1', date: '2026-11-15', startsAt: '22:00', endsAt: '23:30' }],
      installOneTimeWindows: [{ id: '2', date: '2026-11-16', startsAt: '01:00', endsAt: '02:00' }],
    });
    const policy = updatePolicyFormToApi(form);

    expect(policy.downloadSchedule?.oneTimeWindows).toEqual([
      { date: '2026-11-15', at: '22:00', startGraceDuration: '90m' },
    ]);
    expect(policy.updateSchedule?.oneTimeWindows).toEqual([
      { date: '2026-11-16', at: '01:00', startGraceDuration: '1h' },
    ]);
  });
});
