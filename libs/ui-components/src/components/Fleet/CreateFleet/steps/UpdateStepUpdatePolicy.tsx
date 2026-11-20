import * as React from 'react';
import {
  Alert,
  Button,
  CodeBlock,
  CodeBlockCode,
  Divider,
  Flex,
  FlexItem,
  FormGroup,
  FormSection,
  Label,
  Split,
  SplitItem,
  Stack,
  StackItem,
  type Weekday,
} from '@patternfly/react-core';
import { FieldArray, useFormikContext } from 'formik';
import type { TFunction } from 'i18next';
import { MinusCircleIcon } from '@patternfly/react-icons/dist/js/icons/minus-circle-icon';
import { PlusCircleIcon } from '@patternfly/react-icons/dist/js/icons/plus-circle-icon';

import { useTranslation } from '../../../../hooks/useTranslation';
import * as timeUtils from '../../../../utils/time';
import { type FleetFormValues, type UpdatePolicyForm } from '../../../../types/deviceSpec';
import { FormGroupWithHelperText } from '../../../common/WithHelperText';
import CheckboxField, { CheckboxFieldGroupValidation } from '../../../form/CheckboxField';
import FormSelectTypeahead from '../../../form/FormSelectTypeahead';
import RadioField from '../../../form/RadioField';
import ErrorHelperText, { DefaultHelperText } from '../../../form/FieldHelperText';
import TextField from '../../../form/TextField';
import ExpandableFormCard from './ExpandableFormCard';
import OneTimeWindowsSection from './OneTimeWindowsSection';
import ScheduleTimeZone, { ReadOnlyScheduleTimeZone, ScheduleBlockType } from './ScheduleTimeZone';

import './UpdateStepUpdatePolicy.css';

type ScheduleBlockProps = {
  updatePolicy: UpdatePolicyForm;
  blockType: ScheduleBlockType;
  weekDayError?: string[] | string | Weekday;
  isReadOnly?: boolean;
};

const ScheduleBlock = ({ blockType, updatePolicy, weekDayError, isReadOnly }: ScheduleBlockProps) => {
  const { t } = useTranslation();
  const { setFieldValue } = useFormikContext<FleetFormValues>();

  let ariaLabel: string;
  let helperContent: string;

  switch (blockType) {
    case ScheduleBlockType.Download:
      {
        if (updatePolicy.downloadAndInstallDiffer) {
          ariaLabel = t('Downloading window');
          helperContent = t(
            'When devices may start downloading. Work already in progress can finish after this window ends.',
          );
        } else {
          ariaLabel = t('Time window');
          helperContent = t(
            'When devices may start downloading and installing. Work already in progress can finish after this window ends.',
          );
        }
      }

      break;
    case ScheduleBlockType.Install:
      ariaLabel = t('Installing window');
      helperContent = t(
        'When devices may start installing. Work already in progress can finish after this window ends.',
      );
      break;
  }

  const selectableTimes = React.useMemo(() => timeUtils.getSelectableTimes(), []);

  const isValidTypedItem = React.useCallback((value: string) => timeUtils.valid24HourClockRegExp.test(value), []);

  const transformTypedItem = React.useCallback((time: string) => {
    if (timeUtils.formatted24HourClockRegExp.test(time)) {
      return time;
    }

    const match = time.match(/^(\d{1,2})?:?(\d{2})?$/);
    return match ? `${timeUtils.formatTimePart(match[1])}:${match[2]}` : timeUtils.defaultStartTime;
  }, []);

  const isDiffer = updatePolicy.downloadAndInstallDiffer;
  const scheduleMode =
    blockType === ScheduleBlockType.Download ? updatePolicy.downloadScheduleMode : updatePolicy.installScheduleMode;
  const isWeekly = scheduleMode === timeUtils.UpdateScheduleMode.Weekly;
  const weekDays =
    (blockType === ScheduleBlockType.Download ? updatePolicy.downloadWeekDays : updatePolicy.installWeekDays) || [];
  const weekDayLabels = [t('Sun'), t('Mon'), t('Tue'), t('Wed'), t('Thu'), t('Fri'), t('Sat')];

  const onSelectMode = (mode: unknown) => {
    if (!isDiffer) {
      setFieldValue('updatePolicy.installScheduleMode', mode);
    }
    if (mode === timeUtils.UpdateScheduleMode.Weekly && weekDays.every(Boolean)) {
      const cleared = [false, false, false, false, false, false, false];
      setFieldValue(`updatePolicy.${blockType}WeekDays`, cleared);
      if (!isDiffer) {
        setFieldValue('updatePolicy.installWeekDays', cleared);
      }
    }
  };

  return (
    <Stack hasGutter>
      <StackItem>
        <FormGroupWithHelperText isRequired label={ariaLabel} content={helperContent}>
          <Flex
            alignItems={{ default: 'alignItemsCenter' }}
            gap={{ default: 'gapSm' }}
            className="fctl-recurring-schedule__time-row"
          >
            <FlexItem>
              <FormSelectTypeahead
                name={`updatePolicy.${blockType}StartsAt`}
                placeholderText={t('Start (hh:mm)', { nsSeparator: '|' })}
                defaultId={timeUtils.defaultStartTime}
                items={selectableTimes}
                isValidTypedItem={isValidTypedItem}
                transformTypedItem={transformTypedItem}
                isDisabled={isReadOnly}
              />
            </FlexItem>
            <FlexItem className="fctl-recurring-schedule__time-sep">{t('to')}</FlexItem>
            <FlexItem>
              <FormSelectTypeahead
                name={`updatePolicy.${blockType}EndsAt`}
                placeholderText={t('End (hh:mm)', { nsSeparator: '|' })}
                defaultId={timeUtils.defaultEndTime}
                items={selectableTimes}
                isValidTypedItem={isValidTypedItem}
                transformTypedItem={transformTypedItem}
                isDisabled={isReadOnly}
              />
            </FlexItem>
            <FlexItem>
              <RadioField
                id={`${blockType}-daily`}
                name={`updatePolicy.${blockType}ScheduleMode`}
                label={t('Daily')}
                checkedValue={timeUtils.UpdateScheduleMode.Daily}
                onChangeCustom={onSelectMode}
                isDisabled={isReadOnly}
              />
            </FlexItem>
            <FlexItem>
              <RadioField
                id={`${blockType}-weekly`}
                name={`updatePolicy.${blockType}ScheduleMode`}
                label={t('Weekly')}
                checkedValue={timeUtils.UpdateScheduleMode.Weekly}
                onChangeCustom={onSelectMode}
                isDisabled={isReadOnly}
              />
            </FlexItem>
          </Flex>

          {isWeekly && (
            <FieldArray name={`updatePolicy.${blockType}WeekDays`}>
              {() => (
                <>
                  <Flex
                    gap={{ default: 'gapMd' }}
                    flexWrap={{ default: 'wrap' }}
                    className="fctl-recurring-schedule__weekdays"
                  >
                    {weekDayLabels.map((label, index) => (
                      <FlexItem key={label}>
                        <CheckboxFieldGroupValidation
                          name={`updatePolicy.${blockType}WeekDays[${index}]`}
                          label={label}
                          onChangeCustom={
                            isDiffer
                              ? undefined
                              : (checked) => setFieldValue(`updatePolicy.installWeekDays[${index}]`, checked)
                          }
                          isDisabled={isReadOnly}
                        />
                      </FlexItem>
                    ))}
                  </Flex>
                  <ErrorHelperText error={weekDayError} />
                </>
              )}
            </FieldArray>
          )}
        </FormGroupWithHelperText>
      </StackItem>
      <StackItem>
        {isReadOnly ? <ReadOnlyScheduleTimeZone blockType={blockType} /> : <ScheduleTimeZone blockType={blockType} />}
      </StackItem>
      <StackItem>
        <FormGroup isRequired label={t('Start grace duration')}>
          <TextField
            name={`updatePolicy.${blockType}StartGraceDuration`}
            label={t('Start grace duration')}
            helperText={t('Devices can start the update within this time window after the scheduled trigger.')}
            isRequired
            isDisabled={isReadOnly}
            placeholder={t('e.g. 30m')}
          />
        </FormGroup>
      </StackItem>
    </Stack>
  );
};

const getRecurringModeLabel = (updatePolicy: UpdatePolicyForm, t: TFunction) => {
  if (!updatePolicy.downloadAndInstallDiffer) {
    return updatePolicy.downloadWeekDays.some(Boolean) ? t('Weekly') : t('Daily');
  }
  const downloadFrequency = updatePolicy.downloadWeekDays.some(Boolean) ? t('Weekly') : t('Daily');
  const installFrequency = updatePolicy.installWeekDays.some(Boolean) ? t('Weekly') : t('Daily');
  if (downloadFrequency === installFrequency) {
    return downloadFrequency;
  }
  return t('Download: {{ downloadFrequency }}, Install: {{ installFrequency }}', {
    downloadFrequency,
    installFrequency,
  });
};

const UnsupportedCronBlock = ({
  label,
  at,
  startGraceDuration,
  timeZone,
}: {
  label: string;
  at: string;
  startGraceDuration?: string;
  timeZone?: string;
}) => {
  const { t } = useTranslation();
  const timeZoneLabel =
    !timeZone || timeZone === timeUtils.localDeviceTimezone ? t("device's local timezone") : timeZone;
  const grace = startGraceDuration && startGraceDuration !== '0s' ? startGraceDuration : undefined;

  return (
    <Stack hasGutter>
      <StackItem>
        <FormGroup label={label}>
          <CodeBlock>
            <CodeBlockCode>{at}</CodeBlockCode>
          </CodeBlock>
        </FormGroup>
      </StackItem>
      <StackItem>
        <DefaultHelperText
          helperText={
            grace
              ? t('Timezone: {{ tz }}. Grace: {{ grace }}.', { tz: timeZoneLabel, grace })
              : t('Timezone: {{ tz }}.', { tz: timeZoneLabel })
          }
        />
      </StackItem>
    </Stack>
  );
};

const RecurringScheduleCard = ({ isReadOnly }: { isReadOnly?: boolean }) => {
  const { t } = useTranslation();
  const {
    values: { updatePolicy },
    errors,
    setFieldValue,
  } = useFormikContext<FleetFormValues>();

  const [isExpanded, setIsExpanded] = React.useState(true);

  const hasDownload = Boolean(updatePolicy.downloadCron);
  const hasInstall = Boolean(updatePolicy.installCron);
  if (!hasDownload && !hasInstall) {
    return null;
  }

  const downloadUnsupported = hasDownload && !timeUtils.isUiSupportedCron(updatePolicy.downloadCron);
  const installUnsupported = hasInstall && !timeUtils.isUiSupportedCron(updatePolicy.installCron);
  const hasUnsupportedCron = downloadUnsupported || installUnsupported;

  const clearRecurring = () => {
    setFieldValue('updatePolicy.downloadCron', undefined);
    setFieldValue('updatePolicy.installCron', undefined);
    setIsExpanded(false);
  };

  return (
    <FormSection>
      <Split hasGutter>
        <SplitItem isFilled>
          <ExpandableFormCard
            title={t('Recurring schedule')}
            isExpanded={isExpanded}
            onToggle={() => setIsExpanded((value) => !value)}
            expandLabel={t('Expand recurring schedule')}
            collapseLabel={t('Collapse recurring schedule')}
            headerActions={
              <Label isCompact variant="filled" color="purple">
                {hasUnsupportedCron ? t('Custom') : getRecurringModeLabel(updatePolicy, t)}
              </Label>
            }
          >
            {hasUnsupportedCron ? (
              <Stack hasGutter>
                <StackItem>
                  <Alert variant="info" isInline title={t('Custom schedule (read-only)')}>
                    {t(
                      'This recurring schedule uses a cron expression that cannot be edited as Daily or Weekly. Remove it here, or change it in the fleet YAML. Saving will not rewrite the expression.',
                    )}
                  </Alert>
                </StackItem>
                {downloadUnsupported && (
                  <StackItem>
                    <UnsupportedCronBlock
                      label={
                        installUnsupported || updatePolicy.downloadAndInstallDiffer
                          ? t('Download schedule (cron)')
                          : t('Schedule (cron)')
                      }
                      at={updatePolicy.downloadCron || ''}
                      startGraceDuration={updatePolicy.downloadStartGraceDuration}
                      timeZone={updatePolicy.downloadTimeZone}
                    />
                  </StackItem>
                )}
                {installUnsupported && (
                  <StackItem>
                    <UnsupportedCronBlock
                      label={t('Install schedule (cron)')}
                      at={updatePolicy.installCron || ''}
                      startGraceDuration={updatePolicy.installStartGraceDuration}
                      timeZone={updatePolicy.installTimeZone}
                    />
                  </StackItem>
                )}
                {!downloadUnsupported && (
                  <StackItem>
                    <ScheduleBlock
                      blockType={ScheduleBlockType.Download}
                      updatePolicy={updatePolicy}
                      weekDayError={errors.updatePolicy?.downloadWeekDays}
                      isReadOnly={isReadOnly}
                    />
                  </StackItem>
                )}
                {!installUnsupported && updatePolicy.downloadAndInstallDiffer && (
                  <>
                    <Divider />
                    <StackItem>
                      <ScheduleBlock
                        blockType={ScheduleBlockType.Install}
                        updatePolicy={updatePolicy}
                        weekDayError={errors.updatePolicy?.installWeekDays}
                        isReadOnly={isReadOnly}
                      />
                    </StackItem>
                  </>
                )}
              </Stack>
            ) : (
              <Stack hasGutter>
                <StackItem>
                  <CheckboxField
                    label={t('Use different update schedules for downloading and installing updates')}
                    name="updatePolicy.downloadAndInstallDiffer"
                    isDisabled={isReadOnly}
                  />
                </StackItem>
                <StackItem>
                  <ScheduleBlock
                    blockType={ScheduleBlockType.Download}
                    updatePolicy={updatePolicy}
                    weekDayError={errors.updatePolicy?.downloadWeekDays}
                    isReadOnly={isReadOnly}
                  />
                </StackItem>
                {updatePolicy.downloadAndInstallDiffer && (
                  <>
                    <Divider />
                    <StackItem>
                      <ScheduleBlock
                        blockType={ScheduleBlockType.Install}
                        updatePolicy={updatePolicy}
                        weekDayError={errors.updatePolicy?.installWeekDays}
                        isReadOnly={isReadOnly}
                      />
                    </StackItem>
                  </>
                )}
              </Stack>
            )}
          </ExpandableFormCard>
        </SplitItem>
        {!isReadOnly && (
          <SplitItem>
            <Button
              aria-label={t('Remove recurring schedule')}
              variant="link"
              isDanger
              icon={<MinusCircleIcon />}
              iconPosition="start"
              onClick={clearRecurring}
            />
          </SplitItem>
        )}
      </Split>
    </FormSection>
  );
};

const UpdateStepUpdatePolicy = ({ isReadOnly }: { isReadOnly?: boolean }) => {
  const { t } = useTranslation();
  const {
    values: { updatePolicy },
    setFieldValue,
  } = useFormikContext<FleetFormValues>();

  const hasRecurring = timeUtils.hasRecurringSchedule(updatePolicy);
  const oneTimeWindows = [
    ...(updatePolicy.downloadOneTimeWindows || []),
    ...(updatePolicy.installOneTimeWindows || []),
  ];
  const hasActiveOneTimeWindows = oneTimeWindows.some(
    (window) => !timeUtils.isOneTimeWindowExpired(window.date, window.endsAt),
  );

  const addOneTimeWindow = () => {
    void setFieldValue('updatePolicy.downloadOneTimeWindows', [
      ...(updatePolicy.downloadOneTimeWindows || []),
      timeUtils.createEmptyOneTimeWindow(),
    ]);
    void setFieldValue('updatePolicy.installOneTimeWindows', [
      ...(updatePolicy.installOneTimeWindows || []),
      timeUtils.createEmptyOneTimeWindow(),
    ]);
  };

  return (
    <Stack hasGutter>
      <StackItem>
        <DefaultHelperText
          helperText={t(
            'Add a recurring Daily/Weekly window and/or one-time windows. Windows control when updates may start; work that has already started can finish afterward. Recurring is optional — remove it if you only need specific dates.',
          )}
        />
      </StackItem>

      <StackItem>
        <RecurringScheduleCard isReadOnly={isReadOnly} />
      </StackItem>

      <StackItem>
        <OneTimeWindowsSection isReadOnly={isReadOnly} />
      </StackItem>

      {!isReadOnly && (
        <StackItem>
          <FormSection>
            <Flex
              alignItems={{ default: 'alignItemsCenter' }}
              gap={{ default: 'gapMd' }}
              flexWrap={{ default: 'wrap' }}
            >
              {!hasRecurring && (
                <Button
                  variant="secondary"
                  icon={<PlusCircleIcon />}
                  iconPosition="start"
                  onClick={() => setFieldValue('updatePolicy.downloadCron', timeUtils.getDefaultUpdateCron())}
                >
                  {t('Add recurring schedule')}
                </Button>
              )}
              <Button variant="link" icon={<PlusCircleIcon />} iconPosition="start" onClick={addOneTimeWindow}>
                {t('Add one-time window')}
              </Button>
            </Flex>
            {!hasRecurring && !hasActiveOneTimeWindows && (
              <DefaultHelperText
                helperText={t('No maintenance windows yet. Add a recurring schedule or a one-time window.')}
              />
            )}
          </FormSection>
        </StackItem>
      )}
    </Stack>
  );
};

export default UpdateStepUpdatePolicy;
