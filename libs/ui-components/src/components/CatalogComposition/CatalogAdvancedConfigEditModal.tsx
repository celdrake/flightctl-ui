import * as React from 'react';
import {
  ActionList,
  ActionListGroup,
  ActionListItem,
  Button,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Stack,
  StackItem,
} from '@patternfly/react-core';
import { Formik } from 'formik';
import { load } from 'js-yaml';
import validator from '@rjsf/validator-ajv8';
import type { RJSFSchema, RJSFValidationError } from '@rjsf/utils';
import * as Yup from 'yup';

import type { CatalogItem } from '@flightctl/types/alpha';
import { useTranslation } from '../../hooks/useTranslation';
import type { CatalogAppForm } from '../../types/deviceSpec';
import type { DynamicFormConfigFormik } from '../Catalog/InstallWizard/types';
import FlightCtlModal from '../common/FlightCtlModal';
import { validApplicationAndVolumeName } from '../form/validations';
import FlightCtlForm from '../form/FlightCtlForm';
import CheckboxField from '../form/CheckboxField';
import CatalogAdvancedConfigStep from './CatalogAdvancedConfigStep';
import CatalogApplicationNameField from './CatalogApplicationNameField';
import { isAppConfigStepValid } from '../Catalog/InstallWizard/steps/AppConfigStep';
import {
  type CatalogAdvancedConfigValues,
  catalogItemRequiresAdvancedConfig,
  getAdvancedConfigInitialValues,
  renameCatalogAppForm,
  updateCatalogAppFormConfig,
} from './catalogCompositionUtils';

type EditAppFormValues = DynamicFormConfigFormik & {
  wantAdvancedConfig: boolean;
};

enum Step {
  Configure = 'configure',
  AdvancedConfig = 'advanced-config',
}

type CatalogAdvancedConfigEditModalProps = {
  catalogItem: CatalogItem;
  appForm: CatalogAppForm;
  existingAppNames?: string[];
  onClose: VoidFunction;
  onSave: (app: CatalogAppForm) => void;
};

const CatalogAdvancedConfigEditModal = ({
  catalogItem,
  appForm,
  existingAppNames = [],
  onClose,
  onSave,
}: CatalogAdvancedConfigEditModalProps) => {
  const { t } = useTranslation();
  const [step, setStep] = React.useState<Step>(Step.Configure);
  const [schemaErrors, setSchemaErrors] = React.useState<RJSFValidationError[] | undefined>();

  const isConfigureStep = step === Step.Configure;

  const requiresAdvancedConfig = catalogItemRequiresAdvancedConfig(
    catalogItem,
    appForm.catalogItemRef.version,
    appForm.apiApp,
  );

  const initialValues = React.useMemo<EditAppFormValues>(
    () => ({
      ...getAdvancedConfigInitialValues(catalogItem, appForm),
      wantAdvancedConfig: true,
    }),
    [catalogItem, appForm],
  );

  const validationSchema = React.useMemo(
    () =>
      Yup.lazy((values: EditAppFormValues) => {
        const appName = validApplicationAndVolumeName(t)
          .required(t('Application name is required'))
          .test('is-unique', t('An application with this name already exists'), (value) => {
            if (!value || value === appForm.name) {
              return true;
            }
            return !existingAppNames.some((existingName) => existingName === value);
          });

        // Configure step only cares about the application name.
        if (isConfigureStep) {
          return Yup.object({ appName });
        }

        if (values.configureVia === 'form') {
          setSchemaErrors(undefined);
          return Yup.object({
            appName,
            dynamicFormValid: Yup.boolean().oneOf([true], t('Configuration is required')),
          });
        }

        return Yup.object({
          appName,
          editorContent: Yup.string().test('valid-config', function (value) {
            try {
              const yamlContent = load(value || '');
              if (values.configSchema) {
                const validationData = validator.validateFormData(yamlContent, values.configSchema as RJSFSchema);
                if (validationData.errors.length) {
                  setSchemaErrors(validationData.errors);
                  return this.createError({ message: t('Configuration is not valid') });
                }
              }
              setSchemaErrors(undefined);
              return true;
            } catch {
              setSchemaErrors(undefined);
              return this.createError({ message: t('Not a valid configuration') });
            }
          }),
        });
      }),
    [t, isConfigureStep, existingAppNames, appForm.name],
  );

  const handleClose = () => {
    setStep(Step.Configure);
    setSchemaErrors(undefined);
    onClose();
  };

  // CELIA-WIP REVIEW AGAIN NAME SETTING

  return (
    <FlightCtlModal variant="medium" isOpen>
      <ModalHeader title={t('Edit application')} />
      <Formik<EditAppFormValues>
        enableReinitialize
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={(values, { setSubmitting }) => {
          if (isConfigureStep) {
            if (requiresAdvancedConfig || values.wantAdvancedConfig) {
              // Sync onSubmit returns undefined → Formik leaves isSubmitting true unless we clear it.
              setSubmitting(false);
              setStep(Step.AdvancedConfig);
            } else {
              onSave(renameCatalogAppForm(appForm, values.appName));
              handleClose();
            }
            return;
          }

          const advancedConfig: CatalogAdvancedConfigValues = {
            configureVia: values.configureVia,
            editorContent: values.editorContent,
            volumeSelection: values.volumeSelection,
            formValues: values.formValues,
          };
          onSave(
            updateCatalogAppFormConfig({
              appForm,
              catalogItem,
              appName: values.appName,
              advancedConfig,
            }),
          );
          handleClose();
        }}
      >
        {({ values, submitForm, isSubmitting, errors }) => {
          const goToAdvancedConfig = requiresAdvancedConfig || values.wantAdvancedConfig;
          const canProceedConfigure = !errors.appName;
          const canSaveAdvanced = isAppConfigStepValid(values, errors);

          return (
            <>
              <ModalBody>
                <FlightCtlForm>
                  {isConfigureStep ? (
                    <Stack hasGutter>
                      <StackItem>
                        <CatalogApplicationNameField />
                      </StackItem>
                      <StackItem>
                        <CheckboxField
                          name="wantAdvancedConfig"
                          label={t('Configure advanced settings')}
                          description={t(
                            'Optionally override catalog defaults or provide additional settings for this application.',
                          )}
                          isDisabled={requiresAdvancedConfig}
                        />
                      </StackItem>
                    </Stack>
                  ) : (
                    <CatalogAdvancedConfigStep schemaErrors={schemaErrors} />
                  )}
                </FlightCtlForm>
              </ModalBody>
              <ModalFooter>
                <ActionList style={{ justifyContent: 'normal' }}>
                  <ActionListGroup>
                    <ActionListItem>
                      {isConfigureStep ? (
                        <Button variant="secondary" isDisabled>
                          {t('Back')}
                        </Button>
                      ) : (
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setSchemaErrors(undefined);
                            setStep(Step.Configure);
                          }}
                          isDisabled={isSubmitting}
                        >
                          {t('Back')}
                        </Button>
                      )}
                    </ActionListItem>
                    <ActionListItem>
                      <Button
                        variant="primary"
                        onClick={() => void submitForm()}
                        isDisabled={isSubmitting || (isConfigureStep ? !canProceedConfigure : !canSaveAdvanced)}
                      >
                        {isConfigureStep && goToAdvancedConfig ? t('Next') : t('Save')}
                      </Button>
                    </ActionListItem>
                  </ActionListGroup>
                  <ActionListGroup>
                    <ActionListItem>
                      <Button variant="link" onClick={handleClose} isDisabled={isSubmitting}>
                        {t('Cancel')}
                      </Button>
                    </ActionListItem>
                  </ActionListGroup>
                </ActionList>
              </ModalFooter>
            </>
          );
        }}
      </Formik>
    </FlightCtlModal>
  );
};

export default CatalogAdvancedConfigEditModal;
