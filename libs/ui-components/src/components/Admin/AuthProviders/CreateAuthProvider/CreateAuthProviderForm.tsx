import * as React from 'react';
import { Alert, Button, FormGroup, FormSection, Grid, Split, SplitItem, Switch } from '@patternfly/react-core';
import { Formik, useFormikContext } from 'formik';
import { AuthProvider } from '@flightctl/types';
import { useTranslation } from '../../../../hooks/useTranslation';
import { useFetch } from '../../../../hooks/useFetch';
import FlightCtlActionGroup from '../../../form/FlightCtlActionGroup';
import { AuthProviderFormValues, CreateAuthProviderFormProps } from './types';
import { ProviderType } from '../../../../types/extraTypes';
import { getAuthProvider, getAuthProviderPatches, getAuthProviderSchema, getInitValues } from './utils';
import { getErrorMessage } from '../../../../utils/error';
import LeaveFormConfirmation from '../../../common/LeaveFormConfirmation';
import NameField from '../../../form/NameField';
import RadioField from '../../../form/RadioField';
import TextField from '../../../form/TextField';
import FlightCtlForm from '../../../form/FlightCtlForm';
import { getAuthProviderNameValidations } from '../../../form/validations';
import { FormGroupWithHelperText } from '../../../common/WithHelperText';

const ProviderTypeSection = ({ isEdit }: { isEdit?: boolean }) => {
  const { t } = useTranslation();
  const { values } = useFormikContext<AuthProviderFormValues>();

  if (isEdit) {
    return (
      <FormGroup label={t('Provider type')}>
        <div>{values.type}</div>
      </FormGroup>
    );
  }

  return (
    <FormGroupWithHelperText
      label={t('Provider type')}
      content={t(
        'OIDC providers use OpenID Connect discovery. OAuth2 providers require manual endpoint configuration.',
      )}
    >
      <Split hasGutter>
        <SplitItem>
          <RadioField id="oidc-type-radio" name="type" label={t('OIDC')} checkedValue={ProviderType.OIDC} />
        </SplitItem>
        <SplitItem>
          <RadioField id="oauth2-type-radio" name="type" label={t('OAuth2')} checkedValue={ProviderType.OAuth2} />
        </SplitItem>
      </Split>
    </FormGroupWithHelperText>
  );
};

const OIDCFields = () => {
  const { t } = useTranslation();

  return (
    <FormSection>
      <FormGroupWithHelperText
        label={t('Issuer URL')}
        content={t('The OIDC issuer URL used for discovery (e.g., https://accounts.google.com)')}
        isRequired
      >
        <TextField name="issuer" aria-label={t('Issuer URL')} />
      </FormGroupWithHelperText>
    </FormSection>
  );
};

const OAuth2Fields = () => {
  const { t } = useTranslation();

  return (
    <FormSection>
      <FormGroup label={t('Authorization URL')} isRequired>
        <TextField name="authorizationUrl" aria-label={t('Authorization URL')} />
      </FormGroup>
      <FormGroup label={t('Token URL')} isRequired>
        <TextField name="tokenUrl" aria-label={t('Token URL')} />
      </FormGroup>
      <FormGroup label={t('User info URL')} isRequired>
        <TextField name="userInfoUrl" aria-label={t('User info URL')} />
      </FormGroup>
      <FormGroup label={t('Client secret')} isRequired>
        <TextField name="clientSecret" aria-label={t('Client secret')} type="password" />
      </FormGroup>
      <FormGroupWithHelperText label={t('Issuer URL')} content={t('Optional issuer URL for additional validation')}>
        <TextField name="issuer" aria-label={t('Issuer URL')} />
      </FormGroupWithHelperText>
    </FormSection>
  );
};

const ProviderClaims = () => {
  const { t } = useTranslation();

  return (
    <FormSection title={t('Claims')}>
      <FormGroupWithHelperText
        label={t('Username claim')}
        content={t('JSON path to extract username from the token (e.g., "preferred_username" or "email")')}
      >
        <TextField name="usernameClaim" aria-label={t('Username claim')} />
      </FormGroupWithHelperText>
      <FormGroupWithHelperText
        label={t('Role claim')}
        content={t('JSON path to extract user roles from the token (e.g., "groups" or "roles")')}
      >
        <TextField name="roleClaim" aria-label={t('Role claim')} />
      </FormGroupWithHelperText>
    </FormSection>
  );
};

type CreateAuthProviderFormContentProps = {
  onClose: VoidFunction;
  onSuccess: CreateAuthProviderFormProps['onSuccess'];
  authProvider?: AuthProvider;
};

const CreateAuthProviderFormContent = ({ onClose, onSuccess, authProvider }: CreateAuthProviderFormContentProps) => {
  const { t } = useTranslation();
  const { post, patch } = useFetch();
  const { values, isSubmitting, setFieldValue, errors } = useFormikContext<AuthProviderFormValues>();
  const [error, setError] = React.useState<string>();
  const isEdit = !!authProvider;

  const onSubmit = async () => {
    setError(undefined);
    try {
      if (authProvider) {
        const patches = getAuthProviderPatches(values, authProvider);
        if (patches.length === 0) {
          return;
        }
        const result = await patch<AuthProvider>(`authproviders/${values.name}`, patches);
        onSuccess(result);
      } else {
        const provider = getAuthProvider(values);
        const result = await post('authproviders', provider);
        onSuccess(result);
      }
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  return (
    <FlightCtlForm>
      <LeaveFormConfirmation />
      <Grid hasGutter>
        <div style={{ border: '2px solid lime' }}>{JSON.stringify(errors)}</div>
        <FormSection>
          <Switch
            id="enabled-provider"
            label={<span className="fctl-switch__label">{t('Enable this provider')}</span>}
            isChecked={values.enabled}
            onChange={(_, checked) => {
              setFieldValue('enabled', checked);
            }}
            ouiaId={t('Enable this provider')}
          />
        </FormSection>

        <FormSection>
          <NameField
            isRequired
            name="name"
            aria-label={t('Authentication provider name')}
            isDisabled={isEdit}
            helperText={t('A unique name for this authentication provider')}
            resourceType="authproviders"
            validations={getAuthProviderNameValidations(t)}
          />
          <FormGroup label={t('Client ID')} isRequired>
            <TextField name="clientId" aria-label={t('Client ID')} />
          </FormGroup>
          <FormGroup label={t('Scopes')} isRequired>
            <TextField name="scopes" aria-label={t('Scopes')} />
          </FormGroup>
        </FormSection>

        <ProviderTypeSection isEdit={isEdit} />

        {values.type === ProviderType.OIDC && <OIDCFields />}
        {values.type === ProviderType.OAuth2 && <OAuth2Fields />}

        <ProviderClaims />

        {error && (
          <Alert isInline variant="danger" title={t('An error occurred')}>
            {error}
          </Alert>
        )}

        <FlightCtlActionGroup>
          <Button
            variant="primary"
            onClick={onSubmit}
            isDisabled={/*CELIA-WIP PUT BACK ISVALID !isValid || */ isSubmitting}
            isLoading={isSubmitting}
          >
            {isEdit ? t('Save') : t('Create')}
          </Button>
          <Button variant="link" onClick={onClose} isDisabled={isSubmitting}>
            {t('Cancel')}
          </Button>
        </FlightCtlActionGroup>
      </Grid>
    </FlightCtlForm>
  );
};

const CreateAuthProviderForm = ({ onClose, onSuccess, authProvider }: CreateAuthProviderFormProps) => {
  const { t } = useTranslation();
  const isEdit = !!authProvider;

  return (
    <Formik<AuthProviderFormValues>
      initialValues={getInitValues(authProvider)}
      validationSchema={getAuthProviderSchema(t, isEdit)}
      onSubmit={() => {
        // Submit is handled in CreateAuthProviderFormContent
      }}
      validateOnMount
    >
      <CreateAuthProviderFormContent onClose={onClose} onSuccess={onSuccess} authProvider={authProvider} />
    </Formik>
  );
};

export default CreateAuthProviderForm;
