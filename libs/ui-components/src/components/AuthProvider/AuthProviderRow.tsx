import * as React from 'react';
import { ActionsColumn, Td, Tr } from '@patternfly/react-table';
import { Switch } from '@patternfly/react-core';

import { AuthProvider } from '@flightctl/types';
import { useTranslation } from '../../hooks/useTranslation';
import { Link, ROUTE, useNavigate } from '../../hooks/useNavigate';
import { useAccessReview } from '../../hooks/useAccessReview';
import { RESOURCE, VERB } from '../../types/rbac';
import { isOAuth2Provider } from './CreateAuthProvider/types';

const AuthProviderRow = ({ provider, onDeleteClick }: { provider: AuthProvider; onDeleteClick: VoidFunction }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const providerName = provider.metadata.name || '';

  const [canUpdate] = useAccessReview(RESOURCE.AUTH_PROVIDER, VERB.UPDATE);
  const [canDelete] = useAccessReview(RESOURCE.AUTH_PROVIDER, VERB.DELETE);

  const actions: Array<{ title: string; onClick: () => void }> = [];

  if (canUpdate) {
    actions.push({
      title: t('Edit'),
      onClick: () => navigate({ route: ROUTE.AUTH_PROVIDER_EDIT, postfix: providerName }),
    });
  }

  if (canDelete) {
    actions.push({
      title: t('Delete'),
      onClick: onDeleteClick,
    });
  }

  const url = isOAuth2Provider(provider.spec) ? provider.spec.authorizationUrl : provider.spec.issuer;

  return (
    <Tr>
      <Td dataLabel={t('Name')}>
        <Link to={{ route: ROUTE.AUTH_PROVIDER_DETAILS, postfix: providerName }}>{providerName}</Link>
      </Td>
      <Td dataLabel={t('Type')}>{provider.spec.providerType}</Td>
      <Td dataLabel={t('Issuer/Authorization URL')}>{url || 'N/A'}</Td>
      <Td dataLabel={t('Enabled')}>
        <Switch isChecked={provider.spec.enabled ?? true} aria-label={t('Is provider enabled')} />
      </Td>
      {actions.length > 0 && (
        <Td isActionCell>
          <ActionsColumn items={actions} />
        </Td>
      )}
    </Tr>
  );
};

export default AuthProviderRow;
