import * as React from 'react';
import { ActionsColumn, Td, Tr } from '@patternfly/react-table';
import { Label } from '@patternfly/react-core';

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

  const actions = [
    {
      title: t('View details'),
      onClick: () => navigate({ route: ROUTE.AUTH_PROVIDER_DETAILS, postfix: providerName }),
    },
  ];

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

  let url: string = 'N/A';
  let urlTitle: string = '';
  if (isOAuth2Provider(provider.spec)) {
    url = provider.spec.authorizationUrl;
    urlTitle = t('Authorization URL');
  } else {
    url = provider.spec.issuer;
    urlTitle = t('Issuer URL');
  }

  const isEnabled = provider.spec.enabled ?? true;

  return (
    <Tr>
      <Td dataLabel={t('Name')}>
        <Link to={{ route: ROUTE.AUTH_PROVIDER_DETAILS, postfix: providerName }}>{providerName}</Link>
      </Td>
      <Td dataLabel={t('Type')}>{provider.spec.providerType}</Td>
      <Td dataLabel={urlTitle}>{url || 'N/A'}</Td>
      <Td dataLabel={t('Enabled')}>
        <Label color={isEnabled ? 'green' : undefined} isDisabled={!isEnabled}>
          {isEnabled ? t('Enabled') : t('Disabled')}
        </Label>
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
