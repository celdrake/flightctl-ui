import * as React from 'react';

import { useAccessReview } from '../../../hooks/useAccessReview';
import { RESOURCE, VERB } from '../../../types/rbac';
import AccessDenied from '../../common/AccessDenied';
import AuthProvidersTable from './AuthProvidersTable';
import ListPage from '../../ListPage/ListPage';
import { useTranslation } from '../../../hooks/useTranslation';
import PageWithPermissions from '../../common/PageWithPermissions';

const AuthProvidersSection = () => {
  const { t } = useTranslation();
  const [canList, isLoading] = useAccessReview(RESOURCE.AUTH_PROVIDERS, VERB.LIST);
  const [canCreate] = useAccessReview(RESOURCE.AUTH_PROVIDERS, VERB.CREATE);
  const [canUpdate] = useAccessReview(RESOURCE.AUTH_PROVIDERS, VERB.PATCH);

  const canManageAuthProviders = canCreate || canUpdate;
  if (!canManageAuthProviders) {
    return <AccessDenied />;
  }

  return (
    <PageWithPermissions allowed={canList} loading={isLoading}>
      <ListPage title={t('Authentication providers')}>
        <AuthProvidersTable />
      </ListPage>
    </PageWithPermissions>
  );
};

export default AuthProvidersSection;
