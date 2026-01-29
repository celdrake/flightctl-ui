import * as React from 'react';

import {
  Button,
  Content,
  FormGroup,
  FormSection,
  Grid,
  Radio,
  Split,
  SplitItem,
  Stack,
  StackItem,
} from '@patternfly/react-core';
import { FieldArray, useField, useFormikContext } from 'formik';
import { MinusCircleIcon } from '@patternfly/react-icons/dist/js/icons/minus-circle-icon';
import { PlusCircleIcon } from '@patternfly/react-icons/dist/js/icons/plus-circle-icon';

import { AppType } from '@flightctl/types';
import {
  AppForm,
  AppSpecType,
  DeviceSpecConfigFormValues,
  VariablesForm,
  isComposeAppForm,
  isHelmImageAppForm,
  isQuadletImageAppForm,
  isQuadletInlineAppForm,
  isSingleContainerAppForm,
} from '../../../../types/deviceSpec';
import { createInitialAppForm } from '../deviceSpecUtils';
import { useTranslation } from '../../../../hooks/useTranslation';
import TextField from '../../../form/TextField';
import FormSelect from '../../../form/FormSelect';
import ErrorHelperText from '../../../form/FieldHelperText';
import ExpandableFormSection from '../../../form/ExpandableFormSection';
import { FormGroupWithHelperText } from '../../../common/WithHelperText';
import { appTypeOptions } from '../../../../utils/apps';
import ApplicationImageForm from './ApplicationImageForm';
import ApplicationInlineForm from './ApplicationInlineForm';
import ApplicationContainerForm from './ApplicationContainerForm';
import ApplicationHelmForm from './ApplicationHelmForm';
import ApplicationVolumeForm from './ApplicationVolumeForm';
import ApplicationIntegritySettings from './ApplicationIntegritySettings';

import './ApplicationsForm.css';

type ApplicationVariablesFormProps = {
  appFieldName: string;
  variables: VariablesForm;
  isReadOnly?: boolean;
  error?: string;
};

const ApplicationVariablesForm = ({ appFieldName, variables, isReadOnly, error }: ApplicationVariablesFormProps) => {
  const { t } = useTranslation();
  return (
    <FormGroup label={t('Environment variables')} className="fctl-application-variables-form">
      <FieldArray name={`${appFieldName}.variables`}>
        {({ push, remove }) => (
          <>
            {variables.map((variable, variableIndex) => {
              const variableFieldName = `${appFieldName}.variables[${variableIndex}]`;
              return (
                <FormSection key={variableIndex}>
                  <Split hasGutter>
                    <SplitItem isFilled>
                      <Grid hasGutter>
                        <FormGroup label={t('Name')} isRequired>
                          <TextField
                            name={`${variableFieldName}.name`}
                            aria-label={t('Variable name')}
                            isDisabled={isReadOnly}
                          />
                        </FormGroup>
                        <FormGroup label={t('Value')} isRequired>
                          <TextField
                            name={`${variableFieldName}.value`}
                            aria-label={t('Variable value')}
                            isDisabled={isReadOnly}
                          />
                        </FormGroup>
                      </Grid>
                    </SplitItem>
                    {!isReadOnly && (
                      <SplitItem>
                        <Button
                          aria-label={t('Delete variable')}
                          variant="link"
                          icon={<MinusCircleIcon />}
                          iconPosition="start"
                          onClick={() => remove(variableIndex)}
                        />
                      </SplitItem>
                    )}
                  </Split>
                </FormSection>
              );
            })}
            <ErrorHelperText error={error} />
            {!isReadOnly && (
              <FormGroup>
                <Button
                  variant="link"
                  icon={<PlusCircleIcon />}
                  iconPosition="start"
                  onClick={() => push({ name: '', value: '' })}
                >
                  {t('Add variable')}
                </Button>
              </FormGroup>
            )}
          </>
        )}
      </FieldArray>
    </FormGroup>
  );
};

const ApplicationSection = ({ index, isReadOnly }: { index: number; isReadOnly?: boolean }) => {
  const { t } = useTranslation();
  const { setFieldValue } = useFormikContext<DeviceSpecConfigFormValues>();
  const appFieldName = `applications[${index}]`;
  const [{ value: app }, { error }, { setValue }] = useField<AppForm>(appFieldName);
  const { appType, specType, name: appName } = app;

  const isContainer = isSingleContainerAppForm(app);
  const isHelm = isHelmImageAppForm(app);
  const isQuadlet = isQuadletImageAppForm(app) || isQuadletInlineAppForm(app);
  const isCompose = isComposeAppForm(app);
  const isImageIncomplete = !isContainer && specType === AppSpecType.OCI_IMAGE && !('image' in app);
  const isInlineIncomplete = !isContainer && specType === AppSpecType.INLINE && !('files' in app);
  const isContainerIncomplete = isContainer && (!('ports' in app) || !('volumes' in app));
  const isHelmIncomplete = isHelm && !('valuesFiles' in app);

  const shouldResetApp = isInlineIncomplete || isImageIncomplete || isContainerIncomplete || isHelmIncomplete;

  const errObj = error as unknown;
  const appVarsError =
    errObj && typeof errObj === 'object' && typeof (errObj as { variables?: unknown }).variables === 'string'
      ? (errObj as { variables: string }).variables
      : undefined;

  const appTypesOptions = appTypeOptions(t);

  React.useEffect(() => {
    // When switching types we must ensure all mandatory fields are initialized for the new type
    if (shouldResetApp) {
      const initialApp = createInitialAppForm(appType, specType, appName || '');
      setValue(initialApp, false);
    }
  }, [shouldResetApp, specType, appType, appName, setValue]);

  return (
    <ExpandableFormSection
      title={app.name || t('Application {{ appNum }}', { appNum: index + 1 })}
      fieldName={appFieldName}
    >
      <Grid hasGutter>
        <FormGroup label={t('Application type')} isRequired>
          <FormSelect
            items={appTypesOptions}
            name={`${appFieldName}.appType`}
            placeholderText={t('Select an application type')}
            isDisabled={isReadOnly}
          />
        </FormGroup>

        {isContainer ? (
          <ApplicationContainerForm app={app} index={index} isReadOnly={isReadOnly} />
        ) : isHelm ? (
          <ApplicationHelmForm app={app} index={index} isReadOnly={isReadOnly} />
        ) : (
          <>
            <FormGroupWithHelperText
              label={t('Definition source')}
              isRequired
              content={
                <Stack hasGutter>
                  <StackItem>
                    <strong>{t('Configuration Sources')}:</strong>
                  </StackItem>
                  <StackItem>
                    <u>
                      <li>
                        <strong>{t('OCI reference')}</strong> -{' '}
                        {t('Pull definitions from container registry (reusable, versioned).')}
                      </li>
                      <li>
                        <strong>{t('Inline')}</strong> -{' '}
                        {t('Define application files directly in this interface (custom, one-off).')}
                      </li>
                    </u>
                  </StackItem>
                </Stack>
              }
            >
              <Split hasGutter>
                <SplitItem>
                  <Radio
                    id={`${appFieldName}-spec-type-image`}
                    name={`${appFieldName}-spec-type-radio`}
                    label={t('OCI reference URL')}
                    isChecked={specType === AppSpecType.OCI_IMAGE}
                    isDisabled={isReadOnly}
                    onChange={() => {
                      if (specType !== AppSpecType.OCI_IMAGE) {
                        setFieldValue(appFieldName, createInitialAppForm(appType, AppSpecType.OCI_IMAGE, app.name));
                      }
                    }}
                  />
                </SplitItem>
                <SplitItem>
                  <Radio
                    id={`${appFieldName}-spec-type-inline`}
                    name={`${appFieldName}-spec-type-radio`}
                    label={t('Inline')}
                    isChecked={specType === AppSpecType.INLINE}
                    isDisabled={isReadOnly}
                    onChange={() => {
                      if (specType !== AppSpecType.INLINE) {
                        setFieldValue(appFieldName, createInitialAppForm(appType, AppSpecType.INLINE, app.name));
                      }
                    }}
                  />
                </SplitItem>{' '}
              </Split>
            </FormGroupWithHelperText>

            <FormGroupWithHelperText
              label={t('Application name')}
              content={
                specType === AppSpecType.INLINE
                  ? t('The unique identifier for this application.')
                  : t('If not specified, the image name will be used. Application name must be unique.')
              }
              isRequired={specType === AppSpecType.INLINE}
            >
              <TextField aria-label={t('Application name')} name={`${appFieldName}.name`} isDisabled={isReadOnly} />
            </FormGroupWithHelperText>

            {(isQuadlet || isCompose) && 'image' in app && (
              <ApplicationImageForm app={app} index={index} isReadOnly={isReadOnly} />
            )}
            {(isQuadlet || isCompose) && specType === AppSpecType.INLINE && (
              <ApplicationInlineForm app={app} index={index} isReadOnly={isReadOnly} />
            )}
            {isQuadlet && <ApplicationIntegritySettings index={index} isReadOnly={isReadOnly} />}
          </>
        )}

        {!isHelm && (
          <>
            <ApplicationVolumeForm
              appFieldName={appFieldName}
              volumes={app.volumes || []}
              isReadOnly={isReadOnly}
              isSingleContainerApp={isContainer}
            />
            <ApplicationVariablesForm
              appFieldName={appFieldName}
              variables={'variables' in app ? app.variables ?? [] : []}
              isReadOnly={isReadOnly}
              error={appVarsError}
            />
          </>
        )}
      </Grid>
    </ExpandableFormSection>
  );
};

const ApplicationTemplates = ({ isReadOnly }: { isReadOnly?: boolean }) => {
  const { t } = useTranslation();
  const { values } = useFormikContext<DeviceSpecConfigFormValues>();
  if (isReadOnly && values.applications.length === 0) {
    return null;
  }

  return (
    <FormGroupWithHelperText
      label={t('Application workloads')}
      content={t('Define the application workloads that shall run on the device.')}
    >
      <>
        <Content component="p">
          {t(
            'Configure containerized applications and services that will run on your fleet devices. You can deploy single containers, Quadlet applications for advanced container orchestration or inline applications with custom files.',
          )}
        </Content>
        <FieldArray name="applications">
          {({ push, remove }) => (
            <>
              {values.applications.map((_app, index) => (
                <FormSection key={index}>
                  <Split hasGutter>
                    <SplitItem isFilled>
                      <ApplicationSection index={index} isReadOnly={isReadOnly} />
                    </SplitItem>
                    {!isReadOnly && (
                      <SplitItem>
                        <Button
                          aria-label={t('Delete application')}
                          variant="link"
                          icon={<MinusCircleIcon />}
                          iconPosition="start"
                          onClick={() => remove(index)}
                        />
                      </SplitItem>
                    )}
                  </Split>
                </FormSection>
              ))}

              {!isReadOnly && (
                <FormSection>
                  <FormGroup>
                    <Button
                      variant="link"
                      icon={<PlusCircleIcon />}
                      iconPosition="start"
                      onClick={() => {
                        push(createInitialAppForm(AppType.AppTypeContainer, AppSpecType.OCI_IMAGE));
                      }}
                    >
                      {t('Add application')}
                    </Button>
                  </FormGroup>
                </FormSection>
              )}
            </>
          )}
        </FieldArray>
      </>
    </FormGroupWithHelperText>
  );
};

export default ApplicationTemplates;
