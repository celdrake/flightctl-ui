import * as React from 'react';
import { FormGroup } from '@patternfly/react-core';
import { useFormikContext } from 'formik';

import { useTranslation } from '../../../hooks/useTranslation';
import TextField from '../../form/TextField';
import { AuthProviderFormValues, ProviderType } from './types';

const OAuth2Fields = () => {
  const { t } = useTranslation();
  const { values } = useFormikContext<AuthProviderFormValues>();

  if (values.providerType !== ProviderType.OAuth2) {
    return null;
  }

  return (
    <>
      <FormGroup label={t('Authorization URL')} isRequired>
        <TextField
          name="authorizationUrl"
          aria-label={t('Authorization URL')}
          helperText={t('The OAuth2 authorization endpoint URL')}
        />
      </FormGroup>
      <FormGroup label={t('Token URL')} isRequired>
        <TextField name="tokenUrl" aria-label={t('Token URL')} helperText={t('The OAuth2 token endpoint URL')} />
      </FormGroup>
      <FormGroup label={t('Userinfo URL')} isRequired>
        <TextField
          name="userinfoUrl"
          aria-label={t('Userinfo URL')}
          helperText={t('The OAuth2 userinfo endpoint URL')}
        />
      </FormGroup>
    </>
  );
};

export default OAuth2Fields;
