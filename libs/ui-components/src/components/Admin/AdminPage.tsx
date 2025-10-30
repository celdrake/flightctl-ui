import * as React from 'react';
import { PageSection, PageSectionVariants, Title } from '@patternfly/react-core';
import { useTranslation } from '../../hooks/useTranslation';
import { useAccessReview } from '../../hooks/useAccessReview';
import { RESOURCE, VERB } from '../../types/rbac';
import AccessDenied from '../common/AccessDenied';
import AuthProvidersSection from './AuthProviders/AuthProvidersSection';

// CELIA-WIP: Admin option should only be available to users with the appropriate RBAC permissions
const AdminPage = () => {
  const { t } = useTranslation();

  const [canCreate] = useAccessReview(RESOURCE.AUTH_PROVIDERS, VERB.CREATE);
  const [canUpdate] = useAccessReview(RESOURCE.AUTH_PROVIDERS, VERB.PATCH);

  const canManageAuthProviders = canCreate || canUpdate;

  return (
    <>
      <PageSection variant={PageSectionVariants.light}>
        <Title headingLevel="h1" size="3xl" role="heading">
          {t('System administration')}
        </Title>
      </PageSection>
      {canManageAuthProviders ? <AuthProvidersSection /> : <AccessDenied />}
    </>
  );
};

export default AdminPage;
