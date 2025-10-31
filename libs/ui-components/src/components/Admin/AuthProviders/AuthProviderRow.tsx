import * as React from 'react';
import { Td, Tr } from '@patternfly/react-table';
import { Label } from '@patternfly/react-core';

import { AuthProvider } from '@flightctl/types';
import { useTranslation } from '../../../hooks/useTranslation';
import { ROUTE } from '../../../hooks/useNavigate';
import ResourceLink from '../../common/ResourceLink';

type AuthProviderRowProps = {
  authProvider: AuthProvider;
  rowIndex: number;
};

const AuthProviderRow: React.FC<AuthProviderRowProps> = ({ authProvider }) => {
  const { t } = useTranslation();
  const providerName = authProvider.metadata.name || '';
  const providerType = authProvider.spec.providerType;
  const isEnabled = authProvider.spec.enabled;

  return (
    <Tr>
      <Td dataLabel={t('Name')}>
        <ResourceLink id={providerName} routeLink={ROUTE.AUTH_PROVIDER_DETAILS} />
      </Td>
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
