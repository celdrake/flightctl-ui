import * as React from 'react';
import { DropdownItem, DropdownList, Nav, NavList } from '@patternfly/react-core';

import { ImagePipelineResponse } from '@flightctl/types/imagebuilder';
import { RESOURCE, VERB } from '../../../types/rbac';
import PageWithPermissions from '../../common/PageWithPermissions';
import { useFetchPeriodically } from '../../../hooks/useFetchPeriodically';
import { useTranslation } from '../../../hooks/useTranslation';
import { ROUTE, useNavigate } from '../../../hooks/useNavigate';
import { usePermissionsContext } from '../../common/PermissionsContext';
import { useAppContext } from '../../../hooks/useAppContext';
import NavItem from '../../NavItem/NavItem';
import DetailsPage from '../../DetailsPage/DetailsPage';
import DetailsPageActions from '../../DetailsPage/DetailsPageActions';
import DeleteImageBuildModal from '../DeleteImageBuildModal/DeleteImageBuildModal';
import YamlEditor from '../../common/CodeEditor/YamlEditor';
import ImageBuildDetailsContent from './ImageBuildDetailsContent';

// Image pipelines have the same permissions as image builds
const imageBuildDetailsPermissions = [{ kind: RESOURCE.IMAGE_BUILD, verb: VERB.DELETE }];

const ImageBuildDetailsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    router: { useParams, Routes, Route, Navigate },
  } = useAppContext();

  const { imageBuildId } = useParams() as { imageBuildId: string };
  // By fetching "imagePipelines", we fetch the combined entity of the image build and its associated image exports.
  const [imagePipeline, isLoading, error, refetch] = useFetchPeriodically<Required<ImagePipelineResponse>>({
    endpoint: `imagepipelines/${imageBuildId}`,
  });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState<boolean>();
  const { checkPermissions } = usePermissionsContext();
  const [canDelete] = checkPermissions(imageBuildDetailsPermissions);

  return (
    <DetailsPage
      loading={isLoading}
      error={error}
      id={imageBuildId}
      resourceLink={ROUTE.IMAGE_BUILDS}
      resourceType="Image builds"
      resourceTypeLabel={t('Image builds')}
      nav={
        <Nav variant="tertiary">
          <NavList>
            <NavItem to="details">{t('Details')}</NavItem>
            <NavItem to="yaml">{t('YAML')}</NavItem>
          </NavList>
        </Nav>
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
      {imagePipeline && (
        <>
          <Routes>
            <Route index element={<Navigate to="details" replace />} />
            <Route path="details" element={<ImageBuildDetailsContent imagePipeline={imagePipeline} />} />
            <Route
              path="yaml"
              element={<YamlEditor apiObj={imagePipeline.imageBuild} refetch={refetch} canEdit={false} />}
            />
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
