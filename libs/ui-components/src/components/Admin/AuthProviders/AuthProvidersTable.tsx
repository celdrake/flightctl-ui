import * as React from 'react';
import {
  Button,
  EmptyStateBody,
  Stack,
  StackItem,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
} from '@patternfly/react-core';
import { Tbody } from '@patternfly/react-table';
import { KeyIcon } from '@patternfly/react-icons/dist/js/icons/key-icon';
import { TFunction } from 'i18next';

import ListPageBody from '../../ListPage/ListPageBody';
import TablePagination from '../../Table/TablePagination';
import TableTextSearch from '../../Table/TableTextSearch';
import Table, { ApiSortTableColumn } from '../../Table/Table';
import { getResourceId } from '../../../utils/resource';
import AuthProviderRow from './AuthProviderRow';
import ResourceListEmptyState from '../../common/ResourceListEmptyState';
import { useTranslation } from '../../../hooks/useTranslation';
import { useAuthProviderBackendFilters, useAuthProviders } from './useAuthProviders';
import { useAccessReview } from '../../../hooks/useAccessReview';
import { RESOURCE, VERB } from '../../../types/rbac';
import { ROUTE, useNavigate } from '../../../hooks/useNavigate';

const AuthProviderEmptyState = ({ onCreate }: { onCreate?: VoidFunction }) => {
  const { t } = useTranslation();
  return (
    <ResourceListEmptyState icon={KeyIcon} titleText={t('No authentication providers yet')}>
      <EmptyStateBody>
        <Stack>
          <StackItem>
            {t('Authentication providers allow users to sign in using external identity providers.')}
          </StackItem>
          <StackItem>{t('Configure authentication providers to enable additional authentication methods.')}</StackItem>
          {onCreate && (
            <StackItem>
              <Button variant="primary" onClick={onCreate}>
                {t('Create authentication provider')}
              </Button>
            </StackItem>
          )}
        </Stack>
      </EmptyStateBody>
    </ResourceListEmptyState>
  );
};

const getColumns = (t: TFunction): ApiSortTableColumn[] => [
  {
    name: t('Name'),
  },
  {
    name: t('Type'),
  },
  {
    name: t('Client ID'),
  },
  {
    name: t('Issuer'),
  },
  {
    name: t('Enabled'),
  },
];

const AuthProvidersTable = () => {
  const { t } = useTranslation();

  const authProviderColumns = React.useMemo(() => getColumns(t), [t]);
  const { name, setName, hasFiltersEnabled } = useAuthProviderBackendFilters();

  const { authProviders, isLoading, error, isUpdating, pagination } = useAuthProviders({ name });
  const [canCreate] = useAccessReview(RESOURCE.AUTH_PROVIDERS, VERB.CREATE);
  const navigate = useNavigate();

  const onCreate = canCreate
    ? () => {
        navigate(ROUTE.AUTH_PROVIDER_CREATE);
      }
    : undefined;

  return (
    <ListPageBody error={error} loading={isLoading}>
      <Toolbar inset={{ default: 'insetNone' }}>
        <ToolbarContent>
          <ToolbarGroup>
            <ToolbarItem variant="search-filter">
              <TableTextSearch value={name} setValue={setName} placeholder={t('Search by name')} />
            </ToolbarItem>
          </ToolbarGroup>
        </ToolbarContent>
      </Toolbar>
      <Table
        aria-label={t('Authentication providers table')}
        loading={isUpdating}
        columns={authProviderColumns}
        hasFilters={hasFiltersEnabled}
        emptyData={authProviders.length === 0}
        clearFilters={() => setName('')}
      >
        <Tbody>
          {authProviders.map((authProvider, rowIndex) => (
            <AuthProviderRow key={getResourceId(authProvider)} authProvider={authProvider} rowIndex={rowIndex} />
          ))}
        </Tbody>
      </Table>
      <TablePagination pagination={pagination} isUpdating={isUpdating} />
      {!isUpdating && authProviders.length === 0 && !name && <AuthProviderEmptyState onCreate={onCreate} />}
    </ListPageBody>
  );
};

export default AuthProvidersTable;
