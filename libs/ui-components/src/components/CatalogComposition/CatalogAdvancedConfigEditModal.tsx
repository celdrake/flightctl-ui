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
import { Formik, type FormikErrors } from 'formik';
import { load } from 'js-yaml';
import validator from '@rjsf/validator-ajv8';
import type { RJSFSchema, RJSFValidationError } from '@rjsf/utils';

import type { CatalogItem } from '@flightctl/types/alpha';
import { useTranslation } from '../../hooks/useTranslation';
import type { CatalogAppForm } from '../../types/deviceSpec';
import type { DynamicFormConfigFormik } from '../Catalog/InstallWizard/types';
import FlightCtlModal from '../common/FlightCtlModal';
import { validateApplicationName } from '../form/validations';
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
  onClose: () => void;
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

  // TODO TO VALIDATION UTILS, OR IN THE NAME FIELD
  const validateAppName = (name: string): string | undefined => {
    if (!name) {
      return t('Application name is required');
    }
    const nameError = validateApplicationName(name, t);
    if (nameError) {
      return nameError;
    }
    if (existingAppNames.some((existingName) => existingName === name) && name !== appForm.name) {
      return t('An application with this name already exists');
    }
    return undefined;
  };

  // CELIA WIP MOVE TO VALIDATION UTILS
  const validate = (values: EditAppFormValues): FormikErrors<EditAppFormValues> => {
    const errors: FormikErrors<EditAppFormValues> = {};
    const nameError = validateAppName(values.appName);
    if (nameError) {
      errors.appName = nameError;
    }

    if (!isConfigureStep) {
      setSchemaErrors(undefined);
      return errors;
    }

    if (values.configureVia === 'form') {
      setSchemaErrors(undefined);
      if (!values.dynamicFormValid) {
        errors.dynamicFormValid = t('Configuration is required');
      }
      return errors;
    }

    try {
      const yamlContent = load(values.editorContent);
      if (values.configSchema) {
        const validationData = validator.validateFormData(yamlContent, values.configSchema as RJSFSchema);
        if (validationData.errors.length) {
          setSchemaErrors(validationData.errors);
          errors.editorContent = t('Configuration is not valid');
          return errors;
        }
      }
      setSchemaErrors(undefined);
      return errors;
    } catch {
      setSchemaErrors(undefined);
      errors.editorContent = t('Not a valid configuration');
      return errors;
    }
  };

  const handleClose = () => {
    setStep(Step.Configure);
    setSchemaErrors(undefined);
    onClose();
  };

  // CELIA WIP DO WE NEED TO SET ERROR TO EMPTY ON BACK?
  // CELIA-WIP REVIEW AGAIN NAME SETTING

  return (
    <FlightCtlModal variant="medium" isOpen onClose={handleClose}>
      <ModalHeader title={t('Edit application')} />
      <Formik<EditAppFormValues>
        enableReinitialize
        initialValues={initialValues}
        validate={validate}
        onSubmit={(values) => {
          if (isConfigureStep) {
            if (requiresAdvancedConfig || values.wantAdvancedConfig) {
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
        {({ values, submitForm, isSubmitting, errors, setErrors }) => {
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
                            setErrors(errors.appName ? { appName: errors.appName } : {});
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
