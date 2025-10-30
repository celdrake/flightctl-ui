import * as React from 'react';
import { PageSection, PageSectionVariants, Title } from '@patternfly/react-core';

import { useTranslation } from '../../../hooks/useTranslation';
import { useAccessReview } from '../../../hooks/useAccessReview';
import { RESOURCE, VERB } from '../../../types/rbac';
import AccessDenied from '../../common/AccessDenied';

const AuthProvidersSection = () => {
  const { t } = useTranslation();

  const [canCreate] = useAccessReview(RESOURCE.AUTH_PROVIDERS, VERB.CREATE);
  const [canUpdate] = useAccessReview(RESOURCE.AUTH_PROVIDERS, VERB.PATCH);

  const canManageAuthProviders = canCreate || canUpdate;
  if (!canManageAuthProviders) {
    return <AccessDenied />;
  }

  return (
    <PageSection variant={PageSectionVariants.light} isFilled>
      <Title headingLevel="h2" size="xl">
        {t('Authentication providers')}
      </Title>
    </PageSection>
  );
};

export default AuthProvidersSection;
