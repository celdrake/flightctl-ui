import { type TFunction } from 'i18next';
import { type Duration, type OneTimeWindow, type UpdateSchedule } from '@flightctl/types';
import { type OneTimeWindowForm, type UpdatePolicyForm } from '../types/deviceSpec';

export const formatTimePart = (val: number | string) => val.toString().padStart(2, '0');

export const getSelectableTimes = () => {
  const times = {};
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const timeString = `${formatTimePart(hour)}:${formatTimePart(minute)}`;
      times[timeString] = timeString;
    }
  }
  return times;
};

export const valid24HourClockRegExp = /^([01]?[0-9]|2[0-3]):?([0-5][0-9])$/;
export const formatted24HourClockRegExp = /^([01][0-9]|2[0-3]):([0-5][0-9])$/;
export const defaultStartTime = '00:00';
export const defaultEndTime = '23:59';
export const localDeviceTimezone = 'Local'; // matches the API's default value
const defaultUpdateDuration = '30m';

export enum UpdateScheduleMode {
  Weekly = 'weekly',
  Daily = 'daily',
}

export enum Weekday {
  Sunday = 0,
  Monday,
  Tuesday,
  Wednesday,
  Thursday,
  Friday,
  Saturday,
}

enum CronParts {
  Minutes = 0,
  Hours = 1,
  Days = 2,
  Months = 3,
  WeekDays = 4,
}

export const durationToMinutes = (duration: Duration) => {
  const timeoutVal = Number(duration.replace(/[shm]/, ''));
  if (!timeoutVal) {
    return 0;
  }

  if (duration.includes('s')) {
    return Math.round(timeoutVal / 60);
  }
  if (duration.includes('h')) {
    return Math.round(timeoutVal * 60);
  }
  return timeoutVal;
};

export const getEndTime = (startTime: string, duration?: Duration) => {
  if (startTime === defaultStartTime && !duration) {
    return defaultEndTime;
  }

  const [hours, minutes] = startTime.split(':').map(Number);
  const durationMinutes = durationToMinutes(duration || defaultUpdateDuration);

  const totalMinutes = hours * 60 + minutes + durationMinutes;
  const newHours = Math.floor(totalMinutes / 60) % 24;
  const newMinutes = totalMinutes % 60;

  return `${formatTimePart(newHours)}:${formatTimePart(newMinutes)}`;
};

/** Minutes between two HH:mm values, crossing midnight when the end is earlier than the start. */
const minutesBetween = (startsAt: string, endsAt: string): number => {
  const [startHour, startMinute] = (startsAt || defaultStartTime).split(':').map(Number);
  const [endHour, endMinute] = (endsAt || defaultEndTime).split(':').map(Number);
  const minutes = endHour * 60 + endMinute - (startHour * 60 + startMinute);
  return minutes > 0 ? minutes : minutes + 24 * 60;
};

/** API duration for a time range. The API accepts one unit, so 1h30m is sent as 90m. */
export const getStartGraceDuration = (startsAt: string, endsAt: string): string => {
  const minutes = minutesBetween(startsAt, endsAt);
  return minutes % 60 === 0 ? `${minutes / 60}h` : `${minutes}m`;
};

/** True when cron can be represented as the UI's Daily/Weekly controls. */
export const isUiSupportedCron = (cronExp?: string): boolean => {
  if (!cronExp) {
    return true;
  }
  const tokens = cronExp.split(' ').filter(Boolean);
  if (tokens.length !== 5) {
    return false;
  }
  const [minutes, hours, days, months, weekDays] = tokens;
  if (!/^\d{1,2}$/.test(minutes) || Number(minutes) > 59) {
    return false;
  }
  if (!/^\d{1,2}$/.test(hours) || Number(hours) > 23) {
    return false;
  }
  if (days !== '*' || months !== '*') {
    return false;
  }
  return weekDays === '*' || /^([0-6])(,[0-6])*$/.test(weekDays);
};

// Cron expression example: "0 4 * * 2,5"
export const getTime = (cronExp?: string) => {
  const tokens = (cronExp || '').split(' ').filter(Boolean);

  if (tokens.length !== 5) {
    return defaultStartTime;
  }
  const hours = tokens[CronParts.Hours];
  const minutes = tokens[CronParts.Minutes];

  // Ensure hours and minutes are valid numbers (eg. fails when specifying ranges or steps)
  if (Number.isNaN(Number(hours)) || Number.isNaN(Number(minutes))) {
    return defaultStartTime;
  }

  return `${formatTimePart(hours)}:${formatTimePart(minutes)}`;
};

export const getWeekDays = (cronExp?: string): { allSelected: boolean; selectedDays: boolean[] } => {
  const defaultDays = [true, true, true, true, true, true, true];

  let selectedDays = defaultDays;
  if (cronExp) {
    const weekDayExp = cronExp.split(' ')[CronParts.WeekDays];
    if (weekDayExp !== '*') {
      const days = weekDayExp.split(',').map(Number);
      selectedDays = defaultDays.map((_, index) => {
        return days.includes(index);
      });
    }
  }

  return {
    allSelected: selectedDays.every(Boolean),
    selectedDays,
  };
};

export const getUpdateCronExpression = (startTime: string, scheduleMode: UpdateScheduleMode, weekDays: boolean[]) => {
  const [hours, minutes] = startTime.split(':').map(Number);

  const weekDayVals = weekDays
    .map((isActive, index) => {
      return isActive || scheduleMode === UpdateScheduleMode.Daily ? index : null;
    })
    .filter((num) => num !== null);
  return `${minutes} ${hours} * * ${weekDayVals.join(',')}`;
};

/** A recurring schedule exists when the loaded policy has a cron (`at`) on either schedule. */
export const hasRecurringSchedule = (updatePolicy: Pick<UpdatePolicyForm, 'downloadCron' | 'installCron'>) =>
  Boolean(updatePolicy.downloadCron || updatePolicy.installCron);

/** Cron for a newly added recurring schedule: daily at the default start time. */
export const getDefaultUpdateCron = () =>
  getUpdateCronExpression(defaultStartTime, UpdateScheduleMode.Daily, [true, true, true, true, true, true, true]);

const oneTimeWindowsEqual = (a?: OneTimeWindow[], b?: OneTimeWindow[]) => {
  const left = a || [];
  const right = b || [];
  return (
    left.length === right.length &&
    left.every(
      (window, index) =>
        window.date === right[index].date &&
        window.at === right[index].at &&
        window.startGraceDuration === right[index].startGraceDuration,
    )
  );
};

export const schedulesAreEqual = (a: UpdateSchedule | undefined, b: UpdateSchedule | undefined) => {
  if (!a && !b) {
    return true;
  }
  if (!a || !b) {
    return false;
  }
  if (a.at !== b.at) {
    return false;
  }
  if ((a.timeZone || localDeviceTimezone) !== (b.timeZone || localDeviceTimezone)) {
    return false;
  }
  if ((a.startGraceDuration || '0s') !== (b.startGraceDuration || '0s')) {
    return false;
  }
  return oneTimeWindowsEqual(a.oneTimeWindows, b.oneTimeWindows);
};

const timeToMinutes = (hhmm: string): number => {
  const [hours, minutes] = (hhmm || '00:00').split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
};

/** True when two [start,end] ranges overlap; supports overnight (end < start). */
export const timeRangesOverlap = (aStart: string, aEnd: string, bStart: string, bEnd: string): boolean => {
  const expand = (start: string, end: string): Array<[number, number]> => {
    const startMinutes = timeToMinutes(start);
    const endMinutes = timeToMinutes(end);
    return endMinutes > startMinutes
      ? [[startMinutes, endMinutes]]
      : [
          [startMinutes, 24 * 60],
          [0, endMinutes],
        ];
  };

  const aRanges = expand(aStart, aEnd);
  const bRanges = expand(bStart, bEnd);
  return aRanges.some(([aFrom, aTo]) => bRanges.some(([bFrom, bTo]) => aFrom < bTo && bFrom < aTo));
};

export type StandingScheduleFields = {
  startsAt?: string;
  endsAt?: string;
  scheduleMode: UpdateScheduleMode;
  weekDays: boolean[];
  timeZone?: string;
};

export type OneTimeOverlapKind = 'none' | 'clock_overlap' | 'likely_covered' | 'timezone_uncertain';

const normalizeTimeZone = (timeZone?: string) => timeZone || localDeviceTimezone;

const timeRangeContained = (aStart: string, aEnd: string, bStart: string, bEnd: string): boolean => {
  const aFrom = timeToMinutes(aStart);
  const aTo = timeToMinutes(aEnd);
  const bFrom = timeToMinutes(bStart);
  const bTo = timeToMinutes(bEnd);
  // Containment is only reliable for same-day standing windows.
  if (bTo <= bFrom || aTo <= aFrom) {
    return false;
  }
  return aFrom >= bFrom && aTo <= bTo;
};

/** Non-blocking overlap assessment between one-time and recurring windows. */
export const assessOneTimeStandingOverlap = (
  date: string,
  startsAt: string,
  endsAt: string,
  oneTimeTimeZone: string | undefined,
  standing: StandingScheduleFields,
): { kind: OneTimeOverlapKind } => {
  if (!date || !startsAt || !endsAt || !standing.startsAt || !standing.endsAt) {
    return { kind: 'none' };
  }
  const parts = date.split('-').map(Number);
  if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) {
    return { kind: 'none' };
  }
  const weekday = new Date(parts[0], parts[1] - 1, parts[2]).getDay();
  const appliesThatDay = standing.scheduleMode === UpdateScheduleMode.Daily || Boolean(standing.weekDays[weekday]);
  if (!appliesThatDay) {
    return { kind: 'none' };
  }
  if (normalizeTimeZone(oneTimeTimeZone) !== normalizeTimeZone(standing.timeZone)) {
    return { kind: 'timezone_uncertain' };
  }
  if (!timeRangesOverlap(startsAt, endsAt, standing.startsAt, standing.endsAt)) {
    return { kind: 'none' };
  }
  return {
    kind: timeRangeContained(startsAt, endsAt, standing.startsAt, standing.endsAt) ? 'likely_covered' : 'clock_overlap',
  };
};

export const createEmptyOneTimeWindow = (): OneTimeWindowForm => ({
  id: `otw-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  date: '',
  startsAt: defaultStartTime,
  endsAt: defaultEndTime,
});

/**
 * Groups windows sharing a date into one entry, unless more than two share it.
 * Undated windows (just added) share the empty date until one is picked.
 */
export const groupOneTimeWindowEntries = <T extends { window: Pick<OneTimeWindowForm, 'date'> }>(
  entries: T[],
): T[][] => {
  const groups: T[][] = [];
  const groupsByDate = new Map<string, T[]>();
  entries.forEach((entry) => {
    const dateGroup = groupsByDate.get(entry.window.date);
    if (dateGroup) {
      dateGroup.push(entry);
    } else {
      const group = [entry];
      groups.push(group);
      groupsByDate.set(entry.window.date, group);
    }
  });
  return groups.flatMap((group) => (group.length > 2 ? group.map((entry) => [entry]) : [group]));
};

/** A window is expired once its local end time has passed. Windows are never auto-removed. */
export const isOneTimeWindowExpired = (date: string, endsAt: string): boolean => {
  if (!date) {
    return false;
  }
  const endMinutes = timeToMinutes(endsAt || defaultEndTime);
  const parts = date.split('-').map(Number);
  if (parts.length !== 3) {
    return false;
  }
  const end = new Date(parts[0], parts[1] - 1, parts[2], Math.floor(endMinutes / 60), endMinutes % 60);
  return end.getTime() < Date.now();
};

export type UpdateScheduleDisplayFields = {
  startsAt?: string;
  endsAt?: string;
  scheduleMode: UpdateScheduleMode;
  weekDays: boolean[];
  timeZone?: string;
  startGraceDuration?: string;
};

const getWeekDayShortLabels = (t: TFunction) => [t('Sun'), t('Mon'), t('Tue'), t('Wed'), t('Thu'), t('Fri'), t('Sat')];

export const getScheduleUpdateText = (schedule: UpdateScheduleDisplayFields, t: TFunction): string => {
  const start = schedule.startsAt || defaultStartTime;
  const end = schedule.endsAt || defaultEndTime;
  const timeZone =
    !schedule.timeZone || schedule.timeZone === localDeviceTimezone ? t("device's local timezone") : schedule.timeZone;

  let scheduleText: string;
  if (schedule.scheduleMode === UpdateScheduleMode.Weekly) {
    const dayLabels = getWeekDayShortLabels(t);
    const days = schedule.weekDays
      .map((isSelected, index) => (isSelected ? dayLabels[index] : null))
      .filter(Boolean)
      .join(', ');
    scheduleText = t('Weekly on {{ days }} from {{ start }} to {{ end }} ({{ timeZone }})', {
      days: days || '-',
      start,
      end,
      timeZone,
    });
  } else {
    scheduleText = t('Daily from {{ start }} to {{ end }} ({{ timeZone }})', {
      start,
      end,
      timeZone,
    });
  }

  if (schedule.startGraceDuration && schedule.startGraceDuration !== '0s') {
    return t('{{ schedule }}, grace {{ duration }}', {
      schedule: scheduleText,
      duration: schedule.startGraceDuration,
    });
  }

  return scheduleText;
};

// Adds an artificial delay to make sure that the user notices the data is refreshing.
export const showSpinnerBriefly = (time: number = 450) => new Promise((resolve) => setTimeout(resolve, time));
