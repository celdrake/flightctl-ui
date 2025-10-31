import * as React from 'react';
import { Card, CardBody, DropdownItem, DropdownList, Grid, GridItem, Nav, NavList } from '@patternfly/react-core';

import { useFetchPeriodically } from '../../../../hooks/useFetchPeriodically';
import { AuthProvider } from '@flightctl/types';

import DetailsPage from '../../../DetailsPage/DetailsPage';
import DetailsPageActions from '../../../DetailsPage/DetailsPageActions';

import { useTranslation } from '../../../../hooks/useTranslation';
import { ROUTE, useNavigate } from '../../../../hooks/useNavigate';
import { useAppContext } from '../../../../hooks/useAppContext';
import { useAccessReview } from '../../../../hooks/useAccessReview';
import { RESOURCE, VERB } from '../../../../types/rbac';
import PageWithPermissions from '../../../common/PageWithPermissions';
import YamlEditor from '../../../common/CodeEditor/YamlEditor';
import NavItem from '../../../NavItem/NavItem';
import AuthProviderGeneralDetailsCard from './AuthProviderGeneralDetailsCard';
import DeleteAuthProviderModal from './DeleteAuthProviderModal';

const AuthProviderDetails = () => {
  const { t } = useTranslation();
  const {
    router: { useParams, Routes, Route, Navigate },
  } = useAppContext();
  const { providerId } = useParams() as { providerId: string };
  const [providerDetails, isLoading, error, refetch] = useFetchPeriodically<Required<AuthProvider>>({
    endpoint: `authproviders/${providerId}`,
  });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState<boolean>(false);

  const navigate = useNavigate();

  const onDeleteSuccess = () => {
    navigate(ROUTE.AUTH_PROVIDERS);
  };

  const [canDelete] = useAccessReview(RESOURCE.AUTH_PROVIDERS, VERB.DELETE);
  const [canEdit] = useAccessReview(RESOURCE.AUTH_PROVIDERS, VERB.PATCH);

  return (
    <DetailsPage
      loading={isLoading}
      error={error}
      id={providerId}
      title={providerDetails?.metadata.name as string}
      resourceLink={ROUTE.AUTH_PROVIDERS}
      resourceType="Repositories"
      resourceTypeLabel={t('Authentication providers')}
      actions={
        (canDelete || canEdit) && (
          <DetailsPageActions>
            <DropdownList>
              {canEdit && (
                <DropdownItem onClick={() => navigate({ route: ROUTE.AUTH_PROVIDER_EDIT, postfix: providerId })}>
                  {t('Edit authentication provider')}
                </DropdownItem>
              )}
              {canDelete && (
                <DropdownItem onClick={() => setIsDeleteModalOpen(true)}>
                  {t('Delete authentication provider')}
                </DropdownItem>
              )}
            </DropdownList>
          </DetailsPageActions>
        )
      }
      nav={
        <Nav variant="tertiary">
          <NavList>
            <NavItem to="details">{t('Details')}</NavItem>
            <NavItem to="yaml">{t('YAML')}</NavItem>
          </NavList>
        </Nav>
      }
    >
      {providerDetails && (
        <>
          <Routes>
            <Route index element={<Navigate to="details" replace />} />

            <Route
              path="details"
              element={
                <Grid hasGutter>
                  <GridItem md={12}>
                    <Card>
                      <CardBody>
                        <AuthProviderGeneralDetailsCard providerDetails={providerDetails} />
                      </CardBody>
                    </Card>
                  </GridItem>
                </Grid>
              }
            />
            <Route
              path="yaml"
              element={<YamlEditor filename={providerId} apiObj={providerDetails} refetch={refetch} />}
            />
          </Routes>
          {isDeleteModalOpen && (
            <DeleteAuthProviderModal
              onClose={() => setIsDeleteModalOpen(false)}
              onDeleteSuccess={onDeleteSuccess}
              providerId={providerId}
            />
          )}
        </>
      )}
    </DetailsPage>
  );
};

const AuthProviderDetailsWithPermissions = () => {
  const [allowed, loading] = useAccessReview(RESOURCE.AUTH_PROVIDERS, VERB.GET);
  return (
    <PageWithPermissions allowed={allowed} loading={loading}>
      <AuthProviderDetails />
    </PageWithPermissions>
  );
};

export default AuthProviderDetailsWithPermissions;
