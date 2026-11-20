import * as React from 'react';
import { DatePicker, FormGroup } from '@patternfly/react-core';
import { useField } from 'formik';

import {
  calendarDatePlaceholder,
  formatCalendarDatePicker,
  getCalendarDateDisplay,
  parseCalendarDatePicker,
  toIsoCalendarDate,
} from '../../utils/dates';
import { useTranslation } from '../../hooks/useTranslation';
import ErrorHelperText, { DefaultHelperText } from './FieldHelperText';

type CalendarDateFieldProps = {
  name: string;
  isDisabled?: boolean;
  isRequired?: boolean;
  helperText?: React.ReactNode;
  disablePastDates?: boolean;
  onValueChange?: (value: string) => void;
};

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

/** Formik date field storing YYYY-MM-DD and displaying the short-month format. */
const CalendarDateField = ({
  name,
  isDisabled,
  isRequired,
  helperText,
  disablePastDates,
  onValueChange,
}: CalendarDateFieldProps) => {
  const { t } = useTranslation();
  const [field, meta, { setValue, setTouched }] = useField<string>({ name });

  const fieldId = `calendardate-${name}`;
  const hasError = meta.touched && !!meta.error;
  const isPastDate = (date: Date) => startOfDay(date) < startOfDay(new Date());

  const displayValue =
    field.value && /^\d{4}-\d{2}-\d{2}$/.test(field.value) ? getCalendarDateDisplay(field.value) : field.value || '';

  return (
    <FormGroup id={`form-control__${fieldId}`} fieldId={fieldId}>
      <DatePicker
        id={fieldId}
        name={name}
        value={displayValue}
        placeholder={calendarDatePlaceholder}
        isDisabled={isDisabled}
        requiredDateOptions={isRequired ? { isRequired: true, emptyDateText: t('Select a date') } : undefined}
        validators={
          disablePastDates ? [(date) => (isPastDate(date) ? t('Date must be today or later') : '')] : undefined
        }
        dateFormat={formatCalendarDatePicker}
        dateParse={parseCalendarDatePicker}
        invalidFormatText={t('Enter a valid date (e.g. Dec 15, 2026)')}
        inputProps={{ validated: hasError ? 'error' : 'default' }}
        onChange={(_event, value, date) => {
          if (date && !Number.isNaN(date.getTime())) {
            if (!disablePastDates || !isPastDate(date)) {
              const nextValue = toIsoCalendarDate(date);
              void setValue(nextValue);
              onValueChange?.(nextValue);
            }
          } else if (!value.trim()) {
            void setValue('');
            onValueChange?.('');
          }
          void setTouched(true);
        }}
        onBlur={() => void setTouched(true)}
        aria-label={t('Date')}
        buttonAriaLabel={t('Toggle date picker')}
      />
      <DefaultHelperText helperText={helperText} />
      <ErrorHelperText meta={meta} />
    </FormGroup>
  );
};

export default CalendarDateField;
