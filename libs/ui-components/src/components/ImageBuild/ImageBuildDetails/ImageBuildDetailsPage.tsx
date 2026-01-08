import * as React from 'react';
import { DropdownItem, DropdownList, Nav, NavList } from '@patternfly/react-core';

import { ImageBuild } from '@flightctl/types/imagebuilder';
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
import ImageBuildDetailsContent from './ImageBuildDetailsContent';
import YamlEditor from '../../common/CodeEditor/YamlEditor';

const imageBuildDetailsPermissions = [
  { kind: RESOURCE.IMAGE_BUILD, verb: VERB.DELETE },
  { kind: RESOURCE.IMAGE_BUILD, verb: VERB.PATCH },
];

const ImageBuildDetailsPage = () => {
  const { t } = useTranslation();

  const {
    router: { useParams, Routes, Route, Navigate },
  } = useAppContext();

  const { imageBuildId } = useParams() as { imageBuildId: string };
  const [imageBuild, isLoading, error, refetch] = useFetchPeriodically<Required<ImageBuild>>({
    endpoint: `imagebuilds/${imageBuildId}`,
  });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState<boolean>();

  const navigate = useNavigate();

  const { checkPermissions } = usePermissionsContext();
  const [canDelete, canEdit] = checkPermissions(imageBuildDetailsPermissions);

  const hasActions = canDelete || canEdit;

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
        hasActions && (
          <DetailsPageActions>
            <DropdownList>
              {canDelete && (
                <DropdownItem onClick={() => setIsDeleteModalOpen(true)}>{t('Delete image build')}</DropdownItem>
              )}
            </DropdownList>
          </DetailsPageActions>
        )
      }
    >
      {imageBuild && (
        <>
          <Routes>
            <Route index element={<Navigate to="details" replace />} />
            <Route path="details" element={<ImageBuildDetailsContent imageBuild={imageBuild} />} />
            <Route path="yaml" element={<YamlEditor apiObj={imageBuild} refetch={refetch} canEdit={canEdit} />} />
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
