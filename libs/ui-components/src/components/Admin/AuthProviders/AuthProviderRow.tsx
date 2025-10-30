import * as React from 'react';
import { Td, Tr } from '@patternfly/react-table';
import { Label } from '@patternfly/react-core';

import { AuthenticationProvider } from '../../../types/extraTypes';
import { useTranslation } from '../../../hooks/useTranslation';

type AuthProviderRowProps = {
  authProvider: AuthenticationProvider;
  rowIndex: number;
};

const AuthProviderRow: React.FC<AuthProviderRowProps> = ({ authProvider }) => {
  const { t } = useTranslation();
  const providerName = authProvider.metadata.name || '';
  const providerType = authProvider.spec.type;
  const isEnabled = authProvider.spec.enabled;

  return (
    <Tr>
      <Td dataLabel={t('Name')}>{providerName}</Td>
      <Td dataLabel={t('Type')}>{providerType}</Td>
      <Td dataLabel={t('Client ID')}>{authProvider.spec.clientId}</Td>
      <Td dataLabel={t('Issuer')}>{authProvider.spec.issuer || '-'}</Td>
      <Td dataLabel={t('Status')}>
        {isEnabled ? <Label color="green">{t('Enabled')}</Label> : <Label color="grey">{t('Disabled')}</Label>}
      </Td>
    </Tr>
  );
};

export default AuthProviderRow;
