import { TFunction } from 'i18next';

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

// Helper function to calculate time interval from seconds
// Returns the interval type and count, or null if less than 1 minute
type TimeIntervalType = 'years' | 'months' | 'days' | 'hours' | 'minutes';
type TimeInterval = {
  type: TimeIntervalType;
  count: number;
} | null;

const getTimeSinceLabel = (t: TFunction, interval: TimeInterval) => {
  if (!interval) {
    return t('< 1 minute ago');
  }

  switch (interval.type) {
    case 'years':
      return t('{{count}} years ago', { count: interval.count });
    case 'months':
      return t('{{count}} months ago', { count: interval.count });
    case 'days':
      return t('{{count}} days ago', { count: interval.count });
    case 'hours':
      return t('{{count}} hours ago', { count: interval.count });
    case 'minutes':
      return t('{{count}} minutes ago', { count: interval.count });
  }
};

const getTimeUntilLabel = (t: TFunction, interval: TimeInterval) => {
  if (!interval) {
    return t('in < 1 minute');
  }

  switch (interval.type) {
    case 'years':
      return t('in {{count}} years', { count: interval.count });
    case 'months':
      return t('in {{count}} months', { count: interval.count });
    case 'days':
      return t('in {{count}} days', { count: interval.count });
    case 'hours':
      return t('in {{count}} hours', { count: interval.count });
    case 'minutes':
      return t('in {{count}} minutes', { count: interval.count });
  }
};

const calculateTimeInterval = (seconds: number): TimeInterval => {
  const intervals = [
    { seconds: 31536000, type: 'years' as const },
    { seconds: 2592000, type: 'months' as const },
    { seconds: 86400, type: 'days' as const },
    { seconds: 3600, type: 'hours' as const },
    { seconds: 60, type: 'minutes' as const },
  ];

  for (const { seconds: intervalSeconds, type } of intervals) {
    const interval = seconds / intervalSeconds;
    if (interval > 1) {
      return { type, count: Math.floor(interval) };
    }
  }

  return null;
};

// https://stackoverflow.com/questions/3177836/how-to-format-time-since-xxx-e-g-4-minutes-ago-similar-to-stack-exchange-site
export const timeSinceEpochText = (t: TFunction, epochOffset: number) => {
  const seconds = Math.floor((Date.now() - epochOffset) / 1000);
  const interval = calculateTimeInterval(seconds);
  return getTimeSinceLabel(t, interval);
};

export const timeSinceText = (t: TFunction, timestampStr?: string) => {
  if (!timestampStr || timestampStr === EMPTY_DATE) {
    return 'N/A';
  }
  return timeSinceEpochText(t, new Date(timestampStr).getTime());
};

export const timeUntilText = (t: TFunction, timestampStr?: string) => {
  if (!timestampStr || timestampStr === EMPTY_DATE) {
    return 'N/A';
  }

  const epochOffset = new Date(timestampStr).getTime();
  const seconds = Math.floor((epochOffset - Date.now()) / 1000);
  if (seconds < 0) {
    return t('Past due');
  }

  const interval = calculateTimeInterval(seconds);
  return getTimeUntilLabel(t, interval);
};

export const getDateTimeDisplay = (timestamp?: string) => {
  if (!timestamp) {
    return 'N/A';
  }

  return dateTimeFormatter().format(new Date(timestamp));
};

export const getDateDisplay = (timestamp?: string) => {
  if (!timestamp) {
    return 'N/A';
  }

  return dateFormatter().format(new Date(timestamp));
};
