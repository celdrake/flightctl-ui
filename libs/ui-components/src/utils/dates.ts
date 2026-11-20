import { type TFunction } from 'i18next';

const EMPTY_DATE = '0001-01-01T00:00:00Z';
const defaultLang = 'en-US';

const dateTimeFormatter = () =>
  new Intl.DateTimeFormat(defaultLang, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    year: 'numeric',
  });

const dateFormatter = () =>
  new Intl.DateTimeFormat(defaultLang, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

const getDateDisplay = (timestamp?: string) => {
  if (!timestamp) {
    return 'N/A';
  }

  return dateTimeFormatter().format(new Date(timestamp));
};

const getDateNoTimeDisplay = (timestamp?: string) => {
  if (!timestamp) {
    return 'N/A';
  }

  return dateFormatter().format(new Date(timestamp));
};

/** Date-only display for YYYY-MM-DD values without shifting the calendar day through UTC. */
const getCalendarDateDisplay = (isoDate?: string) => {
  if (!isoDate) {
    return 'N/A';
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
    return getDateNoTimeDisplay(`${isoDate}T00:00:00`);
  }
  return getDateNoTimeDisplay(isoDate);
};

const calendarDatePlaceholder = 'MMM D, YYYY';

const formatCalendarDatePicker = (date: Date) => dateFormatter().format(date);

const toIsoCalendarDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseCalendarDatePicker = (value: string): Date => {
  const trimmed = (value || '').trim();
  if (!trimmed) {
    return new Date(Number.NaN);
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return new Date(`${trimmed}T00:00:00`);
  }
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? parsed : new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
};

// https://stackoverflow.com/questions/3177836/how-to-format-time-since-xxx-e-g-4-minutes-ago-similar-to-stack-exchange-site
export const timeSinceEpochText = (t: TFunction, epochOffset: number) => {
  const seconds = Math.floor((Date.now() - epochOffset) / 1000);

  let interval = seconds / 31536000;

  if (interval > 1) {
    return t('{{count}} years ago', { count: Math.floor(interval) });
  }
  interval = seconds / 2592000;
  if (interval > 1) {
    return t('{{count}} months ago', { count: Math.floor(interval) });
  }
  interval = seconds / 86400;
  if (interval > 1) {
    return t('{{count}} days ago', { count: Math.floor(interval) });
  }
  interval = seconds / 3600;
  if (interval > 1) {
    return t('{{count}} hours ago', { count: Math.floor(interval) });
  }
  interval = seconds / 60;
  if (interval > 1) {
    return t('{{count}} minutes ago', { count: Math.floor(interval) });
  }
  return t('just now');
};

const timeSinceText = (t: TFunction, timestampStr?: string) => {
  if (!timestampStr || timestampStr === EMPTY_DATE) {
    return 'N/A';
  }

  return timeSinceEpochText(t, new Date(timestampStr).getTime());
};

const getNextCalendarDay = (isoDate: string): string => {
  const y = Number(isoDate.slice(0, 4));
  const mo = Number(isoDate.slice(5, 7)) - 1;
  const d = Number(isoDate.slice(8, 10));
  const next = new Date(Date.UTC(y, mo, d) + 86400000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${next.getUTCFullYear()}-${pad(next.getUTCMonth() + 1)}-${pad(next.getUTCDate())}`;
};

export {
  getNextCalendarDay,
  getDateDisplay,
  getDateNoTimeDisplay,
  getCalendarDateDisplay,
  calendarDatePlaceholder,
  formatCalendarDatePicker,
  toIsoCalendarDate,
  parseCalendarDatePicker,
  timeSinceText,
};
