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
} from '@patternfly/react-core';
import { Formik } from 'formik';
import type { RJSFValidationError } from '@rjsf/utils';
import * as Yup from 'yup';

import type { CatalogItem } from '@flightctl/types/alpha';
import { useTranslation } from '../../hooks/useTranslation';
import type { CatalogAppForm } from '../../types/deviceSpec';
import FlightCtlModal from '../common/FlightCtlModal';
import { validApplicationAndVolumeName } from '../form/validations';
import FlightCtlForm from '../form/FlightCtlForm';
import {
  type CatalogAdvancedConfigValues,
  catalogItemRequiresAdvancedConfig,
  renameCatalogAppForm,
  updateCatalogAppFormConfig,
  validateCatalogAdvancedConfig,
} from './catalogCompositionUtils';
import type { DynamicFormConfigFormik } from '../Catalog/InstallWizard/types';
import { getInitialAppConfig } from '../Catalog/InstallWizard/utils';
import { isAppConfigStepValid } from '../Catalog/InstallWizard/steps/AppConfigStep';

import CatalogAdvancedConfigStep from './CatalogAdvancedConfigStep';
import CatalogConfigureFields from './CatalogConfigureFields';

type EditAppFormValues = DynamicFormConfigFormik & {
  wantAdvancedConfig: boolean;
};

enum Step {
  Configure = 'configure',
  AdvancedConfig = 'advanced-config',
}

type CatalogEditAppModalProps = {
  catalogItem: CatalogItem;
  appForm: CatalogAppForm;
  existingAppNames?: string[];
  onClose: VoidFunction;
  onSave: (app: CatalogAppForm) => void;
};

const CatalogEditAppModal = ({
  catalogItem,
  appForm,
  existingAppNames = [],
  onClose,
  onSave,
}: CatalogEditAppModalProps) => {
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
      ...getInitialAppConfig(catalogItem, appForm.catalogItemRef.version, appForm.apiApp),
      wantAdvancedConfig: true,
    }),
    [catalogItem, appForm],
  );

  const configureValidationSchema = React.useMemo(
    () =>
      Yup.object({
        appName: validApplicationAndVolumeName(t)
          .required(t('Application name is required'))
          .test('is-unique', t('An application with this name already exists'), (value) => {
            if (!value || value === appForm.name) {
              return true;
            }
            return !existingAppNames.some((existingName) => existingName === value);
          }),
      }),
    [t, existingAppNames, appForm.name],
  );

  const handleClose = () => {
    setStep(Step.Configure);
    setSchemaErrors(undefined);
    onClose();
  };

  // CELIA-WIP REVIEW AGAIN NAME SETTING

  return (
    <FlightCtlModal variant="medium" isOpen style={{ border: '2px solid purple' }}>
      <ModalHeader title={t('Edit application')} />
      <Formik<EditAppFormValues>
        enableReinitialize
        initialValues={initialValues}
        validationSchema={isConfigureStep ? configureValidationSchema : undefined}
        validate={(values) => {
          if (isConfigureStep) {
            return {};
          }
          const result = validateCatalogAdvancedConfig(values, t);
          setSchemaErrors(result.schemaErrors);
          return result.errors;
        }}
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
                <div style={{ border: '2px solid orange' }}>{JSON.stringify(errors)}</div>
                <FlightCtlForm>
                  {isConfigureStep ? (
                    <Stack hasGutter>
                      <CatalogConfigureFields
                        requiresAdvancedConfig={requiresAdvancedConfig}
                        requiredConfigPresentation="disabled-checkbox"
                        checkboxDescription={t(
                          'Optionally override catalog defaults or provide additional settings for this application.',
                        )}
                      />
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

export default CatalogEditAppModal;
