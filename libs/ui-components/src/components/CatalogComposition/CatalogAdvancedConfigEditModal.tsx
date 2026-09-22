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

type EditConfigureFormValues = {
  appName: string;
  wantAdvancedConfig: boolean;
};

type Step = 'configure' | 'advanced-config';

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
  const [step, setStep] = React.useState<Step>('configure');
  const [pendingAppName, setPendingAppName] = React.useState('');
  const [schemaErrors, setSchemaErrors] = React.useState<RJSFValidationError[] | undefined>();

  const defaultAppName = appForm.name || '';
  const requiresAdvancedConfig = catalogItemRequiresAdvancedConfig(
    catalogItem,
    appForm.catalogItemRef.version,
    appForm.apiApp,
  );

  const configureInitialValues = React.useMemo<EditConfigureFormValues>(
    () => ({
      appName: pendingAppName || defaultAppName,
      wantAdvancedConfig: true,
    }),
    [defaultAppName, pendingAppName],
  );

  const advancedInitialValues = React.useMemo(
    () => getAdvancedConfigInitialValues(catalogItem, appForm),
    [catalogItem, appForm],
  );

  // TODO MOve to the name field
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

  const validateAdvancedConfig = (values: DynamicFormConfigFormik) => {
    if (values.configureVia === 'form') {
      setSchemaErrors(undefined);
      return values.dynamicFormValid ? undefined : { dynamicFormValid: t('Configuration is required') };
    }
    try {
      const yamlContent = load(values.editorContent);
      if (values.configSchema) {
        const validationData = validator.validateFormData(yamlContent, values.configSchema as RJSFSchema);
        if (validationData.errors.length) {
          setSchemaErrors(validationData.errors);
          return { editorContent: t('Configuration is not valid') };
        }
      }
      setSchemaErrors(undefined);
      return undefined;
    } catch {
      setSchemaErrors(undefined);
      return { editorContent: t('Not a valid configuration') };
    }
  };

  const handleClose = () => {
    setStep('configure');
    setSchemaErrors(undefined);
    onClose();
  };

  // CELIA: unify both forms into one
  return (
    <FlightCtlModal variant="medium" isOpen onClose={handleClose}>
      <ModalHeader title={t('Edit application')} />
      {step === 'configure' && (
        <Formik<EditConfigureFormValues>
          enableReinitialize
          initialValues={configureInitialValues}
          onSubmit={(values) => {
            if (requiresAdvancedConfig || values.wantAdvancedConfig) {
              setPendingAppName(values.appName);
              setStep('advanced-config');
              return;
            }
            onSave(renameCatalogAppForm(appForm, values.appName));
            handleClose();
          }}
        >
          {({ values, submitForm, isSubmitting, isValid }) => {
            const goToAdvancedConfig = requiresAdvancedConfig || values.wantAdvancedConfig;
            return (
              <>
                <ModalBody>
                  <FlightCtlForm>
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
                  </FlightCtlForm>
                </ModalBody>
                <ModalFooter>
                  <ActionList style={{ justifyContent: 'normal' }}>
                    <ActionListGroup>
                      <ActionListItem>
                        <Button variant="secondary" isDisabled>
                          {t('Back')}
                        </Button>
                      </ActionListItem>
                      <ActionListItem>
                        <Button
                          variant="primary"
                          onClick={() => void submitForm()}
                          isDisabled={isSubmitting || !isValid}
                        >
                          {goToAdvancedConfig ? t('Next') : t('Save')}
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
      )}

      {step === 'advanced-config' && (
        <Formik<DynamicFormConfigFormik>
          enableReinitialize
          initialValues={advancedInitialValues}
          validate={validateAdvancedConfig}
          onSubmit={(values) => {
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
                appName: pendingAppName,
                advancedConfig,
              }),
            );
            handleClose();
          }}
        >
          {({ submitForm, isSubmitting, isValid, values, errors }) => (
            <>
              <ModalBody>
                <FlightCtlForm>
                  <CatalogAdvancedConfigStep schemaErrors={schemaErrors} />
                </FlightCtlForm>
              </ModalBody>
              <ModalFooter>
                <ActionList style={{ justifyContent: 'normal' }}>
                  <ActionListGroup>
                    <ActionListItem>
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setSchemaErrors(undefined);
                          setStep('configure');
                        }}
                        isDisabled={isSubmitting}
                      >
                        {t('Back')}
                      </Button>
                    </ActionListItem>
                    <ActionListItem>
                      <Button
                        variant="primary"
                        onClick={() => void submitForm()}
                        isDisabled={isSubmitting || !isValid || !isAppConfigStepValid(values, errors)}
                      >
                        {t('Save')}
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
          )}
        </Formik>
      )}
    </FlightCtlModal>
  );
};

export default CatalogAdvancedConfigEditModal;
