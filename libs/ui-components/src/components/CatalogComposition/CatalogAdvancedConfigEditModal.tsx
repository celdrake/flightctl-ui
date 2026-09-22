import * as React from 'react';
import { Button, ModalBody, ModalFooter, ModalHeader, Stack, StackItem } from '@patternfly/react-core';
import { Formik } from 'formik';
import { load } from 'js-yaml';
import validator from '@rjsf/validator-ajv8';
import type { CatalogItemRefSpec } from '@flightctl/types';
import type { CatalogItem } from '@flightctl/types/alpha';
import type { RJSFSchema, RJSFValidationError } from '@rjsf/utils';

import { useTranslation } from '../../hooks/useTranslation';
import type { CatalogAppForm } from '../../types/deviceSpec';
import type { DynamicFormConfigFormik } from '../Catalog/InstallWizard/types';
import FlightCtlModal from '../common/FlightCtlModal';
import FlightCtlForm from '../form/FlightCtlForm';
import TextField from '../form/TextField';
import CheckboxField from '../form/CheckboxField';
import { FormGroupWithHelperText } from '../common/WithHelperText';
import CatalogAdvancedConfigStep from './CatalogAdvancedConfigStep';
import {
  type CatalogAdvancedConfigValues,
  getAdvancedConfigInitialValues,
  renameCatalogAppForm,
  updateCatalogAppFormConfig,
} from './catalogCompositionUtils';

type EditApplicationFormik = DynamicFormConfigFormik & {
  wantAdvancedConfig: boolean;
};

type CatalogAdvancedConfigEditModalProps = {
  isOpen: boolean;
  catalogItem: CatalogItem;
  catalogItemRef: CatalogItemRefSpec;
  app: CatalogAppForm;
  onClose: () => void;
  onSave: (app: CatalogAppForm) => void;
};

const CatalogAdvancedConfigEditModal = ({
  isOpen,
  catalogItem,
  app,
  onClose,
  onSave,
}: CatalogAdvancedConfigEditModalProps) => {
  const { t } = useTranslation();
  const [schemaErrors, setSchemaErrors] = React.useState<RJSFValidationError[] | undefined>();

  const initialValues = React.useMemo<EditApplicationFormik>(
    () => ({
      ...getAdvancedConfigInitialValues(catalogItem, app),
      appName: app.name || '',
      wantAdvancedConfig: false,
    }),
    [catalogItem, app],
  );

  const validate = (values: EditApplicationFormik) => {
    const errors: Record<string, string> = {};
    if (!values.appName?.trim()) {
      errors.appName = t('Application name is required');
    }

    if (!values.wantAdvancedConfig) {
      setSchemaErrors(undefined);
      return Object.keys(errors).length ? errors : undefined;
    }

    if (values.configureVia === 'form') {
      setSchemaErrors(undefined);
      if (!values.dynamicFormValid) {
        errors.dynamicFormValid = t('Configuration is required');
      }
      return Object.keys(errors).length ? errors : undefined;
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
      return Object.keys(errors).length ? errors : undefined;
    } catch {
      setSchemaErrors(undefined);
      errors.editorContent = t('Not a valid configuration');
      return errors;
    }
  };

  const handleSubmit = (values: EditApplicationFormik) => {
    const applicationName = values.appName.trim() || app.name || '';

    if (!values.wantAdvancedConfig) {
      onSave(renameCatalogAppForm(app, applicationName));
      onClose();
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
        app,
        catalogItem,
        applicationName,
        advancedConfig,
      }),
    );
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <FlightCtlModal variant="medium" isOpen={isOpen} onClose={onClose}>
      <ModalHeader title={t('Edit application')} />
      <Formik<EditApplicationFormik>
        enableReinitialize
        initialValues={initialValues}
        validate={validate}
        onSubmit={handleSubmit}
      >
        {({ values, submitForm, isSubmitting }) => (
          <>
            <ModalBody>
              <FlightCtlForm>
                <Stack hasGutter>
                  <StackItem>
                    <FormGroupWithHelperText
                      label={t('Application name')}
                      isRequired
                      content={t('The unique identifier for this application within the template.')}
                    >
                      <TextField name="appName" aria-label={t('Application name')} />
                    </FormGroupWithHelperText>
                  </StackItem>
                  <StackItem>
                    <CheckboxField
                      name="wantAdvancedConfig"
                      label={t('Configure advanced settings')}
                      description={t(
                        'Optionally override catalog defaults or provide additional settings for this application.',
                      )}
                    />
                  </StackItem>
                  {values.wantAdvancedConfig && (
                    <StackItem>
                      <CatalogAdvancedConfigStep schemaErrors={schemaErrors} />
                    </StackItem>
                  )}
                </Stack>
              </FlightCtlForm>
            </ModalBody>
            <ModalFooter>
              <Button variant="link" onClick={onClose}>
                {t('Cancel')}
              </Button>
              <Button variant="primary" onClick={() => void submitForm()} isDisabled={isSubmitting}>
                {t('Save')}
              </Button>
            </ModalFooter>
          </>
        )}
      </Formik>
    </FlightCtlModal>
  );
};

export default CatalogAdvancedConfigEditModal;
