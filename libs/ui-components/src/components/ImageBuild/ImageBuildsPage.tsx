import * as React from 'react';
import { EmptyStateBody } from '@patternfly/react-core';
import { ImageIcon } from '@patternfly/react-icons/dist/js/icons/image-icon';

import { RESOURCE, VERB } from '../../types/rbac';
import { useTranslation } from '../../hooks/useTranslation';
import ResourceListEmptyState from '../common/ResourceListEmptyState';
import PageWithPermissions from '../common/PageWithPermissions';
import { usePermissionsContext } from '../common/PermissionsContext';
import ListPage from '../ListPage/ListPage';
import ListPageBody from '../ListPage/ListPageBody';

const ImageBuildsEmptyState = () => {
  const { t } = useTranslation();
  return (
    <ResourceListEmptyState icon={ImageIcon} titleText={t('No image builds here!')}>
      <EmptyStateBody>
        {t('Image builds allow you to build and manage container images for your edge devices.')}
      </EmptyStateBody>
    </ResourceListEmptyState>
  );
};

const ImageBuildsPage = () => {
  const { t } = useTranslation();

  return (
    <ListPage title={t('Image builds')}>
      <ListPageBody error={undefined} loading={false}>
        <ImageBuildsEmptyState />
      </ListPageBody>
    </ListPage>
  );
};

const ImageBuildsPageWithPermissions = () => {
  const { checkPermissions, loading } = usePermissionsContext();
  const [allowed] = checkPermissions([{ kind: RESOURCE.IMAGE_BUILD, verb: VERB.LIST }]);

  return (
    <PageWithPermissions allowed={allowed} loading={loading}>
      <ImageBuildsPage />
    </PageWithPermissions>
  );
};

export default ImageBuildsPageWithPermissions;
