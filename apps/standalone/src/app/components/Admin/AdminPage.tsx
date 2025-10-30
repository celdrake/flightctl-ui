import * as React from 'react';
import { PageSection, PageSectionVariants, Title } from '@patternfly/react-core';
import { useTranslation } from '@flightctl/ui-components/src/hooks/useTranslation';

const AdminPage = () => {
  const { t } = useTranslation();

  return (
    <>
      <PageSection variant={PageSectionVariants.light}>
        <Title headingLevel="h1" size="3xl" role="heading">
          {t('System administration')}
        </Title>
      </PageSection>
      <PageSection variant={PageSectionVariants.light} isFilled>
        <Title headingLevel="h2" size="xl">
          {t('Authentication providers')}
        </Title>
      </PageSection>
    </>
  );
};

export default AdminPage;
