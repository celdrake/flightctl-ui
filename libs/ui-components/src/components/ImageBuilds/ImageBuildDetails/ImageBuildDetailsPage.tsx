import * as React from 'react';
import { DropdownItem, DropdownList, Tab } from '@patternfly/react-core';

import { ImageBuild } from '@flightctl/types/imagebuilder';
import { RESOURCE, VERB } from '../../../types/rbac';
import PageWithPermissions from '../../common/PageWithPermissions';
import { useFetchPeriodically } from '../../../hooks/useFetchPeriodically';
import { useTranslation } from '../../../hooks/useTranslation';
import { ROUTE, useNavigate } from '../../../hooks/useNavigate';
import { usePermissionsContext } from '../../common/PermissionsContext';
import { useAppContext } from '../../../hooks/useAppContext';
import DetailsPage from '../../DetailsPage/DetailsPage';
import DetailsPageActions from '../../DetailsPage/DetailsPageActions';
import DeleteImageBuildModal from '../DeleteImageBuildModal/DeleteImageBuildModal';
import YamlEditor from '../../common/CodeEditor/YamlEditor';
import ImageBuildDetailsTab from './ImageBuildDetailsTab';
import ImageBuildExportsTab from './ImageBuildExportsTab';
import { useImageExports } from '../useImageExports';
import TabsNav from '../../TabsNav/TabsNav';
import { OciRegistriesContextProvider } from '../OciRegistriesContext';

const imageBuildDetailsPermissions = [{ kind: RESOURCE.IMAGE_BUILD, verb: VERB.DELETE }];

const ImageBuildDetailsPageContent = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    router: { useParams, Routes, Route, Navigate },
  } = useAppContext();

  const { imageBuildId } = useParams() as { imageBuildId: string };
  const [imageBuild, isLoading, error, refetch] = useFetchPeriodically<Required<ImageBuild>>({
    endpoint: `imagebuilds/${imageBuildId}`,
  });
  const { imageExports, isLoading: isLoadingExports, refetch: refetchExports } = useImageExports(imageBuildId);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState<boolean>();
  const { checkPermissions } = usePermissionsContext();
  const [canDelete] = checkPermissions(imageBuildDetailsPermissions);

  return (
    <DetailsPage
      loading={isLoading || isLoadingExports}
      error={error}
      id={imageBuildId}
      resourceLink={ROUTE.IMAGE_BUILDS}
      resourceType="Image builds"
      resourceTypeLabel={t('Image builds')}
      nav={
        <TabsNav aria-label="Image build details tabs" tabKeys={['details', 'exports', 'yaml', 'logs']}>
          <Tab eventKey="details" title={t('Image details')} />
          <Tab eventKey="exports" title={t('Export images')} />
          <Tab eventKey="yaml" title={t('YAML')} />
          <Tab eventKey="logs" title={t('Logs')} />
        </TabsNav>
      }
      actions={
        canDelete && (
          <DetailsPageActions>
            <DropdownList>
              <DropdownItem onClick={() => setIsDeleteModalOpen(true)}>{t('Delete image build')}</DropdownItem>
            </DropdownList>
          </DetailsPageActions>
        )
      }
    >
      {imageBuild && (
        <>
          <Routes>
            <Route index element={<Navigate to="details" replace />} />
            <Route
              path="details"
              element={<ImageBuildDetailsTab imageBuild={imageBuild} imageExports={imageExports} />}
            />
            <Route
              path="exports"
              element={
                <ImageBuildExportsTab imageExports={imageExports} imageBuild={imageBuild} refetch={refetchExports} />
              }
            />
            <Route path="yaml" element={<YamlEditor apiObj={imageBuild} refetch={refetch} canEdit={false} />} />
            <Route path="logs" element={<div>TODO Logs</div>} />
          </Routes>
          {isDeleteModalOpen && (
            <DeleteImageBuildModal
              imageBuildId={imageBuildId}
              onClose={(hasDeleted?: boolean) => {
                if (hasDeleted) {
                  refetch();
                  navigate(ROUTE.IMAGE_BUILDS);
                }
                setIsDeleteModalOpen(false);
              }}
            />
          )}
        </>
      )}
    </DetailsPage>
  );
};

const ImageBuildDetailsPage = () => {
  return (
    <OciRegistriesContextProvider>
      <ImageBuildDetailsPageContent />
    </OciRegistriesContextProvider>
  );
};

const ImageBuildDetailsWithPermissions = () => {
  const { checkPermissions, loading } = usePermissionsContext();
  const [allowed] = checkPermissions([{ kind: RESOURCE.IMAGE_BUILD, verb: VERB.GET }]);
  return (
    <PageWithPermissions allowed={allowed} loading={loading}>
      <ImageBuildDetailsPage />
    </PageWithPermissions>
  );
};

export default ImageBuildDetailsWithPermissions;
