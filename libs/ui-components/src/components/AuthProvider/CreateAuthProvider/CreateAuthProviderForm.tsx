import * as React from 'react';
import { Alert, Button, FormGroup, Grid, Split, SplitItem } from '@patternfly/react-core';
import { Formik, useFormikContext } from 'formik';
import * as Yup from 'yup';
import { AuthProvider } from '@flightctl/types';

import { useTranslation } from '../../../hooks/useTranslation';
import { useFetch } from '../../../hooks/useFetch';
import NameField from '../../form/NameField';
import TextField from '../../form/TextField';
import RadioField from '../../form/RadioField';
import SwitchField from '../../form/SwitchField';
import ListItemField from '../../form/ListItemField';
import FlightCtlForm from '../../form/FlightCtlForm';
import FlightCtlActionGroup from '../../form/FlightCtlActionGroup';
import { getDnsSubdomainValidations } from '../../form/validations';
import {
  AuthProviderFormValues,
  DEFAULT_ROLE_CLAIM,
  DEFAULT_USERNAME_CLAIM,
  OrgAssignmentType,
  ProviderType,
} from './types';

import { authProviderSchema, getAuthProvider, getAuthProviderPatches, getInitValues } from './utils';
import { getErrorMessage } from '../../../utils/error';
import LeaveFormConfirmation from '../../common/LeaveFormConfirmation';
import { FormGroupWithHelperText } from '../../common/WithHelperText';

import Oauth2ProviderFields from './Oauth2ProviderFields';
import OrganizationAssignmentSection from './AuthOrganizationAssignment';
import TestConnectionModal from '../TestConnectionModal/TestConnectionModal';
import { TestConnectionResponse } from './types';

const ProviderTypeSection = () => {
  const { t } = useTranslation();

  return (
    <Split hasGutter>
      <SplitItem>
        <RadioField id="oidc-provider-radio" name="providerType" label={t('OIDC')} checkedValue={ProviderType.OIDC} />
      </SplitItem>
      <SplitItem>
        <RadioField
          id="oauth2-provider-radio"
          name="providerType"
          label={t('OAuth2')}
          checkedValue={ProviderType.OAuth2}
        />
      </SplitItem>
    </Split>
  );
};

export const AuthProviderForm = ({ isEdit }: { isEdit?: boolean }) => {
  const { t } = useTranslation();
  const { values } = useFormikContext<AuthProviderFormValues>();

  const isOidcProvider = values.providerType === ProviderType.OIDC;

  return (
    <>
      <SwitchField label={t('Enabled')} labelOff={t('Disabled')} isReversed name="enabled" />

      <NameField
        name="name"
        aria-label={t('Provider name')}
        isRequired
        isDisabled={isEdit}
        resourceType="authproviders"
        validations={getDnsSubdomainValidations(t)}
      />

      <ProviderTypeSection />

      <Oauth2ProviderFields />

      <FormGroup label={t('Issuer URL')} isRequired={isOidcProvider}>
        <TextField
          name="issuer"
          aria-label={t('Issuer URL')}
          helperText={isOidcProvider ? t('The OIDC issuer URL') : t('The OAuth2 issuer URL (optional)')}
        />
      </FormGroup>

      <FormGroup label={t('Client ID')} isRequired>
        <TextField name="clientId" aria-label={t('Client ID')} />
      </FormGroup>

      <FormGroup label={t('Client secret')} isRequired>
        <TextField name="clientSecret" aria-label={t('Client secret')} type="password" />
      </FormGroup>

      <FormGroupWithHelperText
        label={t('Scopes')}
        content={t('Common scope examples: openid, profile, email')}
        isRequired
      >
        <ListItemField
          name="scopes"
          helperText={t('All scopes necessary to retrieve the claims below')}
          addButtonText={t('Add scope')}
        />
      </FormGroupWithHelperText>

      <FormGroupWithHelperText label={t('Username claim')} content={t('JSON path to the username claim in the token')}>
        <TextField name="usernameClaim" aria-label={t('Username claim')} placeholder={DEFAULT_USERNAME_CLAIM} />
      </FormGroupWithHelperText>

      <FormGroupWithHelperText label={t('Role claim')} content={t('JSON path to the role/group claim in the token')}>
        <TextField name="roleClaim" aria-label={t('Role claim')} placeholder={DEFAULT_ROLE_CLAIM} />
      </FormGroupWithHelperText>

      <OrganizationAssignmentSection />
    </>
  );
};

const CreateAuthProviderFormContent = ({
  isEdit,
  onClose,
  children,
}: React.PropsWithChildren<{
  onClose: VoidFunction;
  isEdit: boolean;
}>) => {
  const { t } = useTranslation();
  const { isValid, dirty, submitForm, isSubmitting, values } = useFormikContext<AuthProviderFormValues>();
  const { proxyFetch } = useFetch();
  const isSubmitDisabled = isSubmitting || !dirty || !isValid;

  const [isTesting, setIsTesting] = React.useState(false);
  const [testResults, setTestResults] = React.useState<TestConnectionResponse | null>(null);
  const [testError, setTestError] = React.useState<string>();

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestError(undefined);

    try {
      const requestBody = {
        providerType: values.providerType,
        issuer: values.issuer,
        authorizationUrl: values.authorizationUrl,
        tokenUrl: values.tokenUrl,
        userinfoUrl: values.userinfoUrl,
        clientId: values.clientId,
      };

      const response = await proxyFetch('test-auth-provider-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `HTTP ${response.status}`);
      }

      const data = (await response.json()) as TestConnectionResponse;
      setTestResults(data);
    } catch (err) {
      setTestError(getErrorMessage(err));
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <FlightCtlForm>
      <Grid hasGutter span={8}>
        <AuthProviderForm isEdit={isEdit} />
      </Grid>
      {children}
      {testError && (
        <Alert isInline variant="danger" title={t('Test connection failed')}>
          {testError}
        </Alert>
      )}
      <FlightCtlActionGroup>
        <Button variant="primary" onClick={submitForm} isLoading={isSubmitting} isDisabled={isSubmitDisabled}>
          {isEdit ? t('Save') : t('Create authentication provider')}
        </Button>
        <Button
          variant="secondary"
          onClick={handleTestConnection}
          isLoading={isTesting}
          isDisabled={!isValid || isSubmitting || isTesting}
        >
          {t('Test connection')}
        </Button>
        <Button variant="link" isDisabled={isSubmitting} onClick={onClose}>
          {t('Cancel')}
        </Button>
      </FlightCtlActionGroup>
      {testResults && <TestConnectionModal onClose={() => setTestResults(null)} results={testResults} />}
    </FlightCtlForm>
  );
};

export type CreateAuthProviderFormProps = {
  onClose: VoidFunction;
  onSuccess: (authProvider: AuthProvider) => void;
  authProvider?: AuthProvider;
};

const CreateAuthProviderForm = ({ authProvider, onClose, onSuccess }: CreateAuthProviderFormProps) => {
  const { t } = useTranslation();
  const { patch, post } = useFetch();
  const [error, setError] = React.useState<string>();

  return (
    <Formik<AuthProviderFormValues>
      initialValues={getInitValues(authProvider)}
      validationSchema={Yup.lazy(authProviderSchema(t))}
      onSubmit={async (values) => {
        setError(undefined);
        if (authProvider) {
          const patches = getAuthProviderPatches(values, authProvider);
          try {
            if (patches.length) {
              await patch<AuthProvider>(`authproviders/${authProvider.metadata.name}`, patches);
              onSuccess(authProvider);
            }
          } catch (e) {
            setError(getErrorMessage(e));
          }
        } else {
          try {
            const provider = await post<AuthProvider>('authproviders', getAuthProvider(values));
            onSuccess(provider);
          } catch (e) {
            setError(getErrorMessage(e));
          }
        }
      }}
    >
      <CreateAuthProviderFormContent isEdit={!!authProvider} onClose={onClose}>
        {error && (
          <Alert isInline variant="danger" title={t('An error occurred')}>
            {error}
          </Alert>
        )}
        <LeaveFormConfirmation />
      </CreateAuthProviderFormContent>
    </Formik>
  );
};

export default CreateAuthProviderForm;
