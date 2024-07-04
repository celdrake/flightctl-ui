import * as Yup from 'yup';
import { TFunction } from 'i18next';
import { FlightCtlLabel } from '../../types/extraTypes';

type UnvalidatedLabel = Partial<FlightCtlLabel>;

const SYSTEMD_PATTERNS_REGEXP = /^[a-z][a-z0-9-_.]*$/;
const SYSTEMD_UNITS_MAX_PATTERNS = 256;

// Accepts uppercase characters, and "underscore" symbols
const K8S_LABEL_VALUE_START_END = /^[a-z0-9A-Z](.*[a-z0-9A-Z])?$/;
const K8S_LABEL_VALUE_ALLOWED_CHARACTERS = /^[a-z0-9A-Z._-]*$/;
const K8S_LABEL_VALUE_MAX_LENGTH = 63;

// Does not accept uppercase characters, nor "underscore" symbols
const K8S_DNS_SUBDOMAIN_START_END = /^[a-z0-9](.*[a-z0-9])?$/;
const K8S_DNS_SUBDOMAIN_ALLOWED_CHARACTERS = /^[a-z0-9.-]*$/;
const K8S_DNS_SUBDOMAIN_VALUE_MAX_LENGTH = 253;

export const getLabelValueValidations = (t: TFunction) => [
  { key: 'labelValueStartAndEnd', message: t('Starts and ends with a letter or a number.') },
  {
    key: 'labelValueAllowedChars',
    message: t('Contains only letters, numbers, dashes (-), dots (.), and underscores (_).'),
  },
  {
    key: 'labelValueMaxLength',
    message: t('1-{{ maxCharacters }} characters', { maxCharacters: K8S_LABEL_VALUE_MAX_LENGTH }),
  },
];

export const getDnsSubdomainValidations = (t: TFunction) => [
  { key: 'dnsSubdomainStartAndEnd', message: t('Starts and ends with a lowercase letter or a number.') },
  {
    key: 'dnsSubdomainAllowedChars',
    message: t('Contains only lowercase letters, numbers, dashes (-), and dots (.).'),
  },
  {
    key: 'dnsSubdomainMaxLength',
    message: t('1-{{ maxCharacters }} characters', { maxCharacters: K8S_DNS_SUBDOMAIN_VALUE_MAX_LENGTH }),
  },
];

export const validKubernetesDnsSubdomain = (
  t: TFunction,
  { isRequired, fieldName }: { isRequired: boolean; fieldName?: string },
) =>
  isRequired
    ? Yup.string()
        .defined(t('{{ fieldName }} is required', { fieldName: fieldName || t('Name') }))
        .test('k8sDnsSubdomainFormat', (value: string, testContext) => {
          const errorKeys: Partial<Record<string, string>> = {};
          if (!K8S_DNS_SUBDOMAIN_START_END.test(value)) {
            errorKeys.dnsSubdomainStartAndEnd = 'failed';
          }
          if (!K8S_DNS_SUBDOMAIN_ALLOWED_CHARACTERS.test(value)) {
            errorKeys.dnsSubdomainAllowedChars = 'failed';
          }
          if (value?.length > K8S_DNS_SUBDOMAIN_VALUE_MAX_LENGTH) {
            errorKeys.dnsSubdomainMaxLength = 'failed';
          }
          if (Object.keys(errorKeys).length === 0) {
            return true;
          }
          return testContext.createError({
            message: errorKeys,
          });
        })
    : Yup.string();

export const validKubernetesLabelValue = (
  t: TFunction,
  { isRequired, fieldName }: { isRequired: boolean; fieldName?: string },
) =>
  isRequired
    ? Yup.string()
        .defined(t('{{ fieldName }} is required', { fieldName: fieldName || t('Name') }))
        .test('k8sLabelValueFormat', (labelValue: string, testContext) => {
          const errorKeys: Partial<Record<string, string>> = {};
          if (!K8S_LABEL_VALUE_START_END.test(labelValue)) {
            errorKeys.labelValueStartAndEnd = 'failed';
          }
          if (!K8S_LABEL_VALUE_ALLOWED_CHARACTERS.test(labelValue)) {
            errorKeys.labelValueAllowedChars = 'failed';
          }
          if (labelValue?.length > K8S_LABEL_VALUE_MAX_LENGTH) {
            errorKeys.labelValueMaxLength = 'failed';
          }
          if (Object.keys(errorKeys).length === 0) {
            return true;
          }
          return testContext.createError({
            message: errorKeys,
          });
        })
    : Yup.string();

export const maxLengthString = (t: TFunction, props: { maxLength: number; fieldName: string }) =>
  Yup.string().max(props.maxLength, t('{{ fieldName }} must not exceed {{ maxLength }} characters', props));

export const validLabelsSchema = (t: TFunction) =>
  Yup.array()
    .of(
      Yup.object<UnvalidatedLabel>().shape({
        // We'll define the mandatory key restriction for all labels, not individually
        key: Yup.string(),
        value: Yup.string(),
      }),
    )
    .required()
    .test('missing keys', (labels: UnvalidatedLabel[], testContext) => {
      const missingKeyLabels = labels.filter((label) => !label.key).map((label) => label.value);
      if (missingKeyLabels.length > 0) {
        return testContext.createError({
          message: t('Label keys are required. Invalid labels: {{invalidLabels}}', {
            invalidLabels: `=${missingKeyLabels.join(', =')}`,
          }),
        });
      }
      return true;
    })
    .test('unique keys', t('Label keys must be unique'), (labels: UnvalidatedLabel[]) => {
      const uniqueKeys = new Set(labels.map((label) => label.key));
      return uniqueKeys.size === labels.length;
    })
    .test('invalid-labels', (labels: UnvalidatedLabel[], testContext) => {
      const invalidLabels = labels.filter((unvalidatedLabel) => {
        const key = unvalidatedLabel.key || '';
        const value = unvalidatedLabel.value || '';

        const keyParts = key.split('/');
        if (keyParts.length > 2) {
          return true;
        }

        // Key prefix validations
        const keyPrefix = keyParts.length === 2 ? keyParts[0] : '';
        if (keyPrefix) {
          if (
            keyPrefix.length > K8S_DNS_SUBDOMAIN_VALUE_MAX_LENGTH ||
            !K8S_DNS_SUBDOMAIN_START_END.test(keyPrefix) ||
            !K8S_DNS_SUBDOMAIN_ALLOWED_CHARACTERS.test(keyPrefix)
          ) {
            return true;
          }
        }

        // Key name validations
        const keyName = keyPrefix ? keyParts[1] : key;
        if (
          keyName.length > K8S_LABEL_VALUE_MAX_LENGTH ||
          !K8S_LABEL_VALUE_START_END.test(keyName) ||
          !K8S_LABEL_VALUE_ALLOWED_CHARACTERS.test(keyName)
        ) {
          return true;
        }

        // Value validations
        return value.length === 0
          ? false
          : value.length > K8S_LABEL_VALUE_MAX_LENGTH ||
              !K8S_LABEL_VALUE_START_END.test(value) ||
              !K8S_LABEL_VALUE_ALLOWED_CHARACTERS.test(value);
      });

      if (invalidLabels.length === 0) {
        return true;
      }

      return testContext.createError({
        message: t('The following labels are not valid Kubernetes labels: {{invalidLabels}}', {
          invalidLabels: `${invalidLabels
            .map((label) => {
              const suffix = label.value ? `=${label.value}` : '';
              return `${label.key}${suffix}`;
            })
            .join(', ')}`,
        }),
      });
    });

export const deviceSystemdUnitsValidationSchema = (t: TFunction) =>
  Yup.object({
    matchPatterns: Yup.array()
      .max(
        SYSTEMD_UNITS_MAX_PATTERNS,
        t('The maximum number of systemd units is {{maxSystemUnits}}.', { maxSystemUnits: SYSTEMD_UNITS_MAX_PATTERNS }),
      )
      .of(Yup.string().required('Unit name is required.'))
      .test('invalid patterns', (patterns: string[] | undefined, testContext) => {
        // TODO analyze https://github.com/systemd/systemd/blob/9cebda59e818cdb89dc1e53ab5bb51b91b3dc3ff/src/basic/unit-name.c#L42
        // and adjust the regular expression and / or the validation to accommodate for it
        const invalidPatterns = (patterns || []).filter((pattern) => {
          return pattern.length > SYSTEMD_UNITS_MAX_PATTERNS || !SYSTEMD_PATTERNS_REGEXP.test(pattern);
        });
        if (invalidPatterns.length === 0) {
          return true;
        }
        return testContext.createError({
          message: t('Invalid systemd unit names: {{invalidPatterns}}', {
            invalidPatterns: invalidPatterns.join(', '),
          }),
        });
      })
      .test('unique patterns', t('Systemd unit names must be unique'), (patterns: string[] | undefined) => {
        const uniqueKeys = new Set(patterns || []);
        return uniqueKeys.size === (patterns?.length || 0);
      }),
  });

export const deviceApprovalValidationSchema = (t: TFunction, conf: { isSingleDevice: boolean }) =>
  Yup.object({
    displayName: conf.isSingleDevice
      ? validKubernetesLabelValue(t, { isRequired: false, fieldName: t('Name') })
      : Yup.string().matches(
          /{{n}}/,
          t('Device names must be unique. Add a number to the template to generate unique names.'),
        ),
    labels: validLabelsSchema(t),
  });
