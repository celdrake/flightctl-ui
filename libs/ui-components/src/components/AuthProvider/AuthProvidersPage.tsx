import * as React from 'react';
import {
  Button,
  EmptyStateActions,
  EmptyStateBody,
  EmptyStateFooter,
  Toolbar,
  ToolbarContent,
} from '@patternfly/react-core';
import { Tbody } from '@patternfly/react-table';
import { TFunction } from 'i18next';
import { CubeIcon } from '@patternfly/react-icons/dist/js/icons/cube-icon';

import ListPage from '../ListPage/ListPage';
import ListPageBody from '../ListPage/ListPageBody';
import Table, { ApiSortTableColumn } from '../Table/Table';
import { useTranslation } from '../../hooks/useTranslation';
import AuthProviderRow from './AuthProviderRow';
import { useAuthProviders } from './useAuthProviders';
import ResourceListEmptyState from '../common/ResourceListEmptyState';
import PageWithPermissions from '../common/PageWithPermissions';
import { RESOURCE, VERB } from '../../types/rbac';
import { useAccessReview } from '../../hooks/useAccessReview';
import { ROUTE, useNavigate } from '../../hooks/useNavigate';
import DeleteAuthProviderModal from './AuthProviderDetails/DeleteAuthProviderModal';

const getColumns = (t: TFunction): ApiSortTableColumn[] => [
  {
    name: t('Name'),
  },
  {
    name: t('Type'),
  },
  {
    name: t('Issuer URL'),
  },
  {
    name: t('Enabled'),
  },
];

const CreateAuthProviderButton = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [canCreate] = useAccessReview(RESOURCE.AUTH_PROVIDER, VERB.CREATE);

  return (
    canCreate && (
      <Button variant="primary" onClick={() => navigate(ROUTE.AUTH_PROVIDER_CREATE)}>
        {t('Create an authentication provider')}
      </Button>
    )
  );
};

const AuthProviderEmptyState = () => {
  const { t } = useTranslation();
  return (
    <ResourceListEmptyState icon={CubeIcon} titleText={t('No authentication providers')}>
      <EmptyStateBody>{t('No dynamic authentication providers configured.')}</EmptyStateBody>
      <EmptyStateFooter>
        <EmptyStateActions>
          <CreateAuthProviderButton />
        </EmptyStateActions>
      </EmptyStateFooter>
    </ResourceListEmptyState>
  );
};

const AuthProvidersTable = () => {
  const { t } = useTranslation();

  const providerColumns = React.useMemo(() => getColumns(t), [t]);
  const { providers, isLoading, error, isUpdating, refetch } = useAuthProviders();
  const [deleteModalProviderId, setDeleteModalProviderId] = React.useState<string>();

  return (
    <ListPageBody error={error} loading={isLoading}>
      <Table
        aria-label={t('Authentication providers list')}
        loading={isUpdating}
        columns={providerColumns}
        emptyData={providers.length === 0}
      >
        <Tbody>
          {providers.map((provider) => {
            const providerId = provider.metadata.name as string;
            return (
              <AuthProviderRow
                key={providerId}
                provider={provider}
                onDeleteClick={() => {
                  setDeleteModalProviderId(providerId);
                }}
              />
            );
          })}
        </Tbody>
      </Table>
      {!isUpdating && providers.length === 0 && <AuthProviderEmptyState />}
      {deleteModalProviderId && (
        <DeleteAuthProviderModal
          authProviderId={deleteModalProviderId}
          onClose={() => setDeleteModalProviderId(undefined)}
          onDeleteSuccess={() => {
            setDeleteModalProviderId(undefined);
            refetch();
          }}
        />
      )}
    </ListPageBody>
  );
};

const AuthProvidersPage = () => {
  const { t } = useTranslation();

  const [allowed, loading] = useAccessReview(RESOURCE.AUTH_PROVIDER, VERB.LIST);

  return (
    <PageWithPermissions allowed={allowed} loading={loading}>
      <ListPage title={t('Authentication Providers')}>
        <Toolbar>
          <ToolbarContent>
            <CreateAuthProviderButton />
          </ToolbarContent>
        </Toolbar>
        <AuthProvidersTable />
      </ListPage>
    </PageWithPermissions>
  );
};

export default AuthProvidersPage;
