import * as React from 'react';
import { EmptyStateBody } from '@patternfly/react-core';
import { ImageIcon } from '@patternfly/react-icons/dist/js/icons/image-icon';

import { ImageBuild } from '@flightctl/types/imagebuilder';
import { RESOURCE, VERB } from '../../types/rbac';
import { useTranslation } from '../../hooks/useTranslation';
import ResourceListEmptyState from '../common/ResourceListEmptyState';
import PageWithPermissions from '../common/PageWithPermissions';
import { usePermissionsContext } from '../common/PermissionsContext';
import ListPage from '../ListPage/ListPage';
import ListPageBody from '../ListPage/ListPageBody';

const listImageBuilds = async () => {
  const fakeImageBuild: ImageBuild = {
    apiVersion: 'v1',
    kind: 'ImageBuild',
    metadata: {
      name: 'image-build-1',
    },
    spec: {
      source: {
        repository: 'repository-1',
        imageName: 'image-1',
        imageTag: 'tag-1',
      },
      destination: {
        repository: 'repository-1',
        imageName: 'image-1',
        tag: 'tag-1',
      },
      binding: {
        type: 'early',
        certName: 'cert-1',
      },
    },
  };
  return [fakeImageBuild];
};

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
  const [imageBuilds, setImageBuilds] = React.useState<ImageBuild[]>([]);
  React.useEffect(() => {
    const fetchImageBuilds = async () => {
      const imageBuilds = await listImageBuilds();
      setImageBuilds(imageBuilds);
    };
    void fetchImageBuilds();
  }, []);

  if (imageBuilds.length === 0) {
    return <ImageBuildsEmptyState />;
  }

  return (
    <PageWithPermissions allowed={allowed} loading={loading}>
      <ImageBuildsPage />
    </PageWithPermissions>
  );
};

export default ImageBuildsPageWithPermissions;
