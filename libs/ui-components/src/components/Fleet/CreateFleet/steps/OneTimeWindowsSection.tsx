import * as React from 'react';
import {
  Alert,
  Button,
  Flex,
  FlexItem,
  FormGroup,
  FormSection,
  Label,
  Split,
  SplitItem,
  Stack,
  StackItem,
} from '@patternfly/react-core';
import { useFormikContext } from 'formik';
import { MinusCircleIcon } from '@patternfly/react-icons/dist/js/icons/minus-circle-icon';

import { useTranslation } from '../../../../hooks/useTranslation';
import { getCalendarDateDisplay } from '../../../../utils/dates';
import * as timeUtils from '../../../../utils/time';
import { type OneTimeWindowForm, type UpdatePolicyForm } from '../../../../types/deviceSpec';
import CalendarDateField from '../../../form/CalendarDateField';
import { DefaultHelperText } from '../../../form/FieldHelperText';
import FormSelectTypeahead from '../../../form/FormSelectTypeahead';
import ExpandableFormCard from './ExpandableFormCard';
import ScheduleTimeZone, { ReadOnlyScheduleTimeZone, ScheduleBlockType } from './ScheduleTimeZone';

type FormWithUpdatePolicy = {
  updatePolicy: UpdatePolicyForm;
};

const OverlapAlert = ({ config, entry }: { config: ScheduleTimeZoneConfig; entry: OneTimeWindowEntry }) => {
  const { t } = useTranslation();
  if (!config.hasRecurring || !config.canAssessOverlap) {
    return null;
  }
  const assessment = timeUtils.assessOneTimeStandingOverlap(
    entry.window.date,
    entry.window.startsAt,
    entry.window.endsAt,
    config.standing.timeZone,
    config.standing,
  );
  if (assessment.kind === 'none') {
    return null;
  }

  const standingRange =
    config.standing.startsAt && config.standing.endsAt
      ? `${config.standing.startsAt}–${config.standing.endsAt}`
      : undefined;

  let bodyText = '';
  let title = '';
  switch (assessment.kind) {
    case 'likely_covered':
      bodyText = standingRange
        ? t(
            'This one-time window falls entirely inside the recurring schedule ({{ range }}) on that day. Confirm you still need a separate one-time window. Saving is not blocked.',
            { range: standingRange },
          )
        : t(
            'This one-time window falls entirely inside the recurring schedule on that day. Confirm you still need a separate one-time window. Saving is not blocked.',
          );
      title = t('May already be covered');
      break;
    case 'clock_overlap':
      bodyText = standingRange
        ? t(
            'This one-time window overlaps the recurring schedule ({{ range }}) on that day. Updates may start in either period. Saving is not blocked.',
            { range: standingRange },
          )
        : t(
            'This one-time window overlaps the recurring schedule on that day. Updates may start in either period. Saving is not blocked.',
          );
      title = t('Overlapping windows');
      break;
    case 'timezone_uncertain':
      bodyText = t(
        'This one-time window uses a different timezone than the recurring schedule. Overlap cannot be confirmed accurately. Review both schedules carefully. Saving is not blocked.',
      );
      title = t('Timezone differs from recurring schedule');
      break;
  }

  return (
    <Alert variant="warning" isInline title={title}>
      {bodyText}
    </Alert>
  );
};

const TimePair = ({ startName, endName, isReadOnly }: { startName: string; endName: string; isReadOnly?: boolean }) => {
  const { t } = useTranslation();
  const selectableTimes = React.useMemo(() => timeUtils.getSelectableTimes(), []);
  const isValidTypedItem = React.useCallback((value: string) => timeUtils.valid24HourClockRegExp.test(value), []);
  const transformTypedItem = React.useCallback((time: string) => {
    if (timeUtils.formatted24HourClockRegExp.test(time)) {
      return time;
    }
    const match = time.match(/^(\d{1,2})?:?(\d{2})?$/);
    return match ? `${timeUtils.formatTimePart(match[1])}:${match[2]}` : timeUtils.defaultStartTime;
  }, []);

  return (
    <Flex>
      <FlexItem>
        <FormSelectTypeahead
          name={startName}
          placeholderText={t('Enter time (hh:mm)', { nsSeparator: '|' })}
          defaultId={timeUtils.defaultStartTime}
          items={selectableTimes}
          isValidTypedItem={isValidTypedItem}
          transformTypedItem={transformTypedItem}
          isDisabled={isReadOnly}
        />
      </FlexItem>
      <FlexItem>
        <span className="fctl-one-time-windows__to">{t('to')}</span>
      </FlexItem>
      <FlexItem>
        <FormSelectTypeahead
          name={endName}
          placeholderText={t('Enter time (hh:mm)', { nsSeparator: '|' })}
          defaultId={timeUtils.defaultEndTime}
          items={selectableTimes}
          isValidTypedItem={isValidTypedItem}
          transformTypedItem={transformTypedItem}
          isDisabled={isReadOnly}
        />
      </FlexItem>
    </Flex>
  );
};

type OneTimeWindowSchedule = 'download' | 'install';

type RemovableWindow = {
  schedule: OneTimeWindowSchedule;
  window: OneTimeWindowForm;
};

type OneTimeWindowEntry = RemovableWindow & {
  index: number;
  displayIndex: number;
};

type ScheduleTimeZoneConfig = {
  blockType: ScheduleBlockType;
  hasRecurring: boolean;
  canAssessOverlap: boolean;
  timeZone: string;
  standing: timeUtils.StandingScheduleFields;
};

const getScheduleTimeZoneConfig = (
  updatePolicy: UpdatePolicyForm,
  schedule: OneTimeWindowSchedule,
): ScheduleTimeZoneConfig => {
  const useInstallFields = schedule === 'install' && updatePolicy.downloadAndInstallDiffer;
  const cron = useInstallFields ? updatePolicy.installCron : updatePolicy.downloadCron;
  const hasRecurring = Boolean(cron);
  return {
    // One-time windows only get their own timezone when the schedules are explicitly split.
    blockType: useInstallFields ? ScheduleBlockType.Install : ScheduleBlockType.Download,
    hasRecurring,
    canAssessOverlap: !cron || timeUtils.isUiSupportedCron(cron),
    timeZone: useInstallFields ? updatePolicy.installTimeZone : updatePolicy.downloadTimeZone,
    standing: {
      startsAt: useInstallFields ? updatePolicy.installStartsAt : updatePolicy.downloadStartsAt,
      endsAt: useInstallFields ? updatePolicy.installEndsAt : updatePolicy.downloadEndsAt,
      scheduleMode: useInstallFields ? updatePolicy.installScheduleMode : updatePolicy.downloadScheduleMode,
      weekDays: useInstallFields ? updatePolicy.installWeekDays : updatePolicy.downloadWeekDays,
      timeZone: useInstallFields ? updatePolicy.installTimeZone : updatePolicy.downloadTimeZone,
    },
  };
};

const getWindowFieldPrefix = (entry: Pick<OneTimeWindowEntry, 'schedule' | 'index'>) =>
  `updatePolicy.${entry.schedule === 'install' ? 'installOneTimeWindows' : 'downloadOneTimeWindows'}[${entry.index}]`;

const getScheduleWindows = (updatePolicy: UpdatePolicyForm, schedule: OneTimeWindowSchedule) =>
  (schedule === 'install' ? updatePolicy.installOneTimeWindows : updatePolicy.downloadOneTimeWindows) || [];

const OneTimeWindowCard = ({
  entries,
  editableTimeZoneBlocks,
  isReadOnly,
  onRemove,
}: {
  entries: OneTimeWindowEntry[];
  editableTimeZoneBlocks: ScheduleBlockType[];
  isReadOnly?: boolean;
  onRemove: (items: RemovableWindow[]) => void;
}) => {
  const { t } = useTranslation();
  const {
    values: { updatePolicy },
    setFieldValue,
  } = useFormikContext<FormWithUpdatePolicy>();
  const firstEntry = entries[0];
  const [isExpanded, setIsExpanded] = React.useState(!firstEntry.window.date);
  const isGrouped = entries.length > 1;
  const purposes = new Set(entries.map((entry) => entry.schedule));
  const isMixed = purposes.size > 1;

  const syncGroupedDate = (date: string) =>
    entries.slice(1).forEach((entry) => void setFieldValue(`${getWindowFieldPrefix(entry)}.date`, date));

  const purposeLabel = isMixed
    ? t('One-time window')
    : firstEntry.schedule === 'install'
      ? t('One-time update window')
      : t('One-time download window');
  const title = firstEntry.window.date
    ? `${purposeLabel} · ${getCalendarDateDisplay(firstEntry.window.date)}`
    : `${purposeLabel} ${firstEntry.displayIndex}`;

  const helperText = isMixed
    ? t(
        'Devices may start downloading or updating during this window. Work that has already started can finish after the window ends.',
      )
    : firstEntry.schedule === 'install'
      ? t(
          'Devices may start updating during this window. Work that has already started can finish after the window ends.',
        )
      : t(
          'Devices may start downloading during this window. Work that has already started can finish after the window ends.',
        );

  const hasRecurringCard = timeUtils.hasRecurringSchedule(updatePolicy);

  // Each timezone is rendered once, under the first window row that uses it.
  const entryTimeZones = new Map<string, ScheduleTimeZoneConfig>();
  const shownTimeZoneBlocks = new Set<ScheduleBlockType>();
  entries.forEach((entry) => {
    const config = getScheduleTimeZoneConfig(updatePolicy, entry.schedule);
    if (!shownTimeZoneBlocks.has(config.blockType)) {
      shownTimeZoneBlocks.add(config.blockType);
      entryTimeZones.set(entry.window.id, config);
    }
  });

  const renderTimeZone = (config: ScheduleTimeZoneConfig) => {
    const isEditable = !isReadOnly && !hasRecurringCard && editableTimeZoneBlocks.includes(config.blockType);
    let helperText: string | undefined;
    if (hasRecurringCard) {
      helperText = t('Timezone is shared with the recurring schedule and one-time windows.');
    } else if (!isEditable && !isReadOnly) {
      helperText = t('Timezone is shared by the one-time windows. Change it in the first one.');
    }

    return isEditable ? (
      <ScheduleTimeZone blockType={config.blockType} idSuffix={`otw-${config.blockType}-${firstEntry.index}`} />
    ) : (
      <ReadOnlyScheduleTimeZone blockType={config.blockType} helperText={helperText} />
    );
  };

  return (
    <FormSection>
      <Split hasGutter>
        <SplitItem isFilled>
          <ExpandableFormCard
            title={title}
            isExpanded={isExpanded}
            onToggle={() => setIsExpanded((value) => !value)}
            expandLabel={t('Expand one-time window')}
            collapseLabel={t('Collapse one-time window')}
            headerActions={
              <Label isCompact variant="filled" color="blue">
                {t('One-time')}
              </Label>
            }
          >
            <Stack hasGutter>
              <StackItem>
                <DefaultHelperText helperText={helperText} />
              </StackItem>
              <StackItem>
                <FormGroup label={t('Date')} isRequired>
                  <CalendarDateField
                    name={`${getWindowFieldPrefix(firstEntry)}.date`}
                    isRequired
                    isDisabled={isReadOnly}
                    disablePastDates
                    onValueChange={isGrouped ? syncGroupedDate : undefined}
                  />
                </FormGroup>
              </StackItem>

              {entries.map((entry) => {
                const config = getScheduleTimeZoneConfig(updatePolicy, entry.schedule);
                const fieldPrefix = getWindowFieldPrefix(entry);
                const timeZoneConfig = entryTimeZones.get(entry.window.id);

                return (
                  <StackItem key={entry.window.id}>
                    <Stack hasGutter>
                      <StackItem>
                        <FormGroup
                          label={entry.schedule === 'install' ? t('Update window') : t('Download window')}
                          isRequired
                        >
                          <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapMd' }}>
                            <FlexItem>
                              <TimePair
                                startName={`${fieldPrefix}.startsAt`}
                                endName={`${fieldPrefix}.endsAt`}
                                isReadOnly={isReadOnly}
                              />
                            </FlexItem>
                            {isGrouped && !isReadOnly && (
                              <FlexItem>
                                <Button
                                  aria-label={t('Remove one-time window')}
                                  variant="link"
                                  isDanger
                                  icon={<MinusCircleIcon />}
                                  onClick={() => onRemove([entry])}
                                />
                              </FlexItem>
                            )}
                          </Flex>
                        </FormGroup>
                      </StackItem>
                      {timeZoneConfig && <StackItem>{renderTimeZone(timeZoneConfig)}</StackItem>}
                      <OverlapAlert config={config} entry={entry} />
                    </Stack>
                  </StackItem>
                );
              })}
            </Stack>
          </ExpandableFormCard>
        </SplitItem>
        {!isReadOnly && (
          <SplitItem>
            <Button
              aria-label={t('Remove one-time window')}
              variant="link"
              isDanger
              icon={<MinusCircleIcon />}
              iconPosition="start"
              onClick={() => onRemove(entries)}
            />
          </SplitItem>
        )}
      </Split>
    </FormSection>
  );
};

const OneTimeWindowsSection = ({ isReadOnly }: { isReadOnly?: boolean }) => {
  const { t } = useTranslation();
  const {
    values: { updatePolicy },
    setFieldValue,
  } = useFormikContext<FormWithUpdatePolicy>();

  const schedules: OneTimeWindowSchedule[] = ['download', 'install'];
  const entries: OneTimeWindowEntry[] = [];
  let displayCounter = 0;
  schedules.forEach((schedule) => {
    getScheduleWindows(updatePolicy, schedule).forEach((window, index) => {
      if (!timeUtils.isOneTimeWindowExpired(window.date, window.endsAt)) {
        displayCounter += 1;
        entries.push({ schedule, window, index, displayIndex: displayCounter });
      }
    });
  });

  const windowGroups = timeUtils.groupOneTimeWindowEntries(entries);

  // A schedule's timezone is edited once, from the first window that shows it.
  const firstCardByBlockType = new Map<ScheduleBlockType, string>();
  windowGroups.forEach((group) => {
    group.forEach((entry) => {
      const { blockType } = getScheduleTimeZoneConfig(updatePolicy, entry.schedule);
      if (!firstCardByBlockType.has(blockType)) {
        firstCardByBlockType.set(blockType, group[0].window.id);
      }
    });
  });

  const removeWindows = (items: RemovableWindow[]) => {
    schedules.forEach((schedule) => {
      const removedIds = new Set(items.filter((item) => item.schedule === schedule).map((item) => item.window.id));
      if (!removedIds.size) {
        return;
      }
      const fieldName = `updatePolicy.${schedule === 'install' ? 'installOneTimeWindows' : 'downloadOneTimeWindows'}`;
      void setFieldValue(
        fieldName,
        getScheduleWindows(updatePolicy, schedule).filter((window) => !removedIds.has(window.id)),
      );
    });
  };

  return (
    <>
      {windowGroups.map((group) => (
        <OneTimeWindowCard
          key={group[0].window.id}
          entries={group}
          editableTimeZoneBlocks={Array.from(firstCardByBlockType.entries())
            .filter(([, cardId]) => cardId === group[0].window.id)
            .map(([blockType]) => blockType)}
          isReadOnly={isReadOnly}
          onRemove={removeWindows}
        />
      ))}

      {schedules.map((schedule) => {
        const expiredWindows = getScheduleWindows(updatePolicy, schedule).filter((window) =>
          timeUtils.isOneTimeWindowExpired(window.date, window.endsAt),
        );
        if (!expiredWindows.length) {
          return null;
        }
        const { timeZone } = getScheduleTimeZoneConfig(updatePolicy, schedule);
        return (
          <details key={schedule} className="fctl-one-time-windows__past" open>
            <summary>
              {schedule === 'install'
                ? t('Past update windows ({{ count }})', { count: expiredWindows.length })
                : t('Past download windows ({{ count }})', { count: expiredWindows.length })}
            </summary>
            <ul className="fctl-one-time-windows__past-list">
              {expiredWindows.map((window) => (
                <li key={window.id} className="fctl-one-time-windows__expired">
                  <span>
                    {getCalendarDateDisplay(window.date)} · {window.startsAt}–{window.endsAt} ·{' '}
                    {timeZone === timeUtils.localDeviceTimezone ? t('device local') : timeZone}
                  </span>
                  <span className="fctl-one-time-windows__expired-actions">
                    <span className="fctl-one-time-windows__expired-label">{t('Expired')}</span>
                    {!isReadOnly && (
                      <Button
                        variant="link"
                        isDanger
                        isInline
                        aria-label={t('Remove expired one-time window')}
                        onClick={() => removeWindows([{ schedule, window }])}
                      >
                        {t('Remove')}
                      </Button>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </details>
        );
      })}
    </>
  );
};

export default OneTimeWindowsSection;
