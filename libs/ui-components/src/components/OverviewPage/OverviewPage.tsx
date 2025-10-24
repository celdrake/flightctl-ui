import * as React from 'react';
import Overview from './Overview';
import { useTranslation } from '../../hooks/useTranslation';
import { Button, Flex, FlexItem, PageSection, PageSectionVariants, Title } from '@patternfly/react-core';
import TechPreviewBadge from '../common/TechPreviewBadge';
import TestProviderConnectionModal from '../modals/TestProviderConnectionModal';

const OverviewPage = () => {
  const { t } = useTranslation();
  const [isTestModalOpen, setIsTestModalOpen] = React.useState(false);

  return (
    <>
      <PageSection variant={PageSectionVariants.light}>
        <Flex gap={{ default: 'gapMd' }} alignItems={{ default: 'alignItemsCenter' }}>
          <FlexItem>
            <Title headingLevel="h1" size="3xl" role="heading">
              {t('Overview')}
            </Title>
          </FlexItem>
          <FlexItem>
            <TechPreviewBadge />
          </FlexItem>
          <FlexItem align={{ default: 'alignRight' }}>
            <Button variant="danger" onClick={() => setIsTestModalOpen(true)}>
              {t('Test Provider Connection')}
            </Button>
          </FlexItem>
        </Flex>
      </PageSection>
      <PageSection variant={PageSectionVariants.light} isFilled>
        <Overview />
      </PageSection>
      {isTestModalOpen && <TestProviderConnectionModal onClose={() => setIsTestModalOpen(false)} />}
    </>
  );
};

export default OverviewPage;
