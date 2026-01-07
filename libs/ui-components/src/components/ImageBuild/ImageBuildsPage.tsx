import * as React from 'react';
import {
  Button,
  EmptyStateActions,
  EmptyStateBody,
  EmptyStateFooter,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
} from '@patternfly/react-core';
import { Tbody } from '@patternfly/react-table';
import PlusCircleIcon from '@patternfly/react-icons/dist/js/icons/plus-circle-icon';
import { TFunction } from 'i18next';

import { RESOURCE, VERB } from '../../types/rbac';
import { useTranslation } from '../../hooks/useTranslation';
import ResourceListEmptyState from '../common/ResourceListEmptyState';
import PageWithPermissions from '../common/PageWithPermissions';
import { usePermissionsContext } from '../common/PermissionsContext';
import ListPage from '../ListPage/ListPage';
import ListPageBody from '../ListPage/ListPageBody';
import TablePagination from '../Table/TablePagination';
import TableTextSearch from '../Table/TableTextSearch';
import Table, { ApiSortTableColumn } from '../Table/Table';
import { useTableSelect } from '../../hooks/useTableSelect';
import { getResourceId } from '../../utils/resource';
import ImageBuildRow from './ImageBuildRow';
import { useImageBuildBackendFilters, useImageBuilds } from './useImageBuilds';

const ImageBuildsEmptyState = () => {
  const { t } = useTranslation();
  return (
    <ResourceListEmptyState icon={PlusCircleIcon} titleText={t('There are no image builds in your environment.')}>
      <EmptyStateBody>
        {t('Image builds allow you to build and manage container images for your edge devices.')}
      </EmptyStateBody>
      <EmptyStateFooter>
        <EmptyStateActions>
          <Button variant="primary" onClick={() => {}}>
            {t('Create an image build')}
          </Button>
        </EmptyStateActions>
      </EmptyStateFooter>
    </ResourceListEmptyState>
  );
};

const getColumns = (t: TFunction): ApiSortTableColumn[] => [
  {
    name: t('Name'),
  },
  {
    name: t('Source image'),
  },
  {
    name: t('Destination image'),
  },
  {
    name: t('Status'),
  },
];

const imageBuildTablePermissions = [
  { kind: RESOURCE.IMAGE_BUILD, verb: VERB.DELETE },
  { kind: RESOURCE.IMAGE_BUILD, verb: VERB.CREATE },
  { kind: RESOURCE.IMAGE_BUILD, verb: VERB.PATCH },
];

const ImageBuildTable = () => {
  const { t } = useTranslation();

  const imageBuildColumns = React.useMemo(() => getColumns(t), [t]);
  const { name, setName, hasFiltersEnabled } = useImageBuildBackendFilters();

  const { imageBuilds, isLoading, error, isUpdating, refetch, pagination } = useImageBuilds({ name });

  const [imageBuildToDeleteId, setImageBuildToDeleteId] = React.useState<string>();

  const { onRowSelect, isAllSelected, hasSelectedRows, isRowSelected, setAllSelected } = useTableSelect();

  const { checkPermissions } = usePermissionsContext();
  const [canDelete, canCreate, canEdit] = checkPermissions(imageBuildTablePermissions);

  return (
    <ListPageBody error={error} loading={isLoading}>
      <Toolbar inset={{ default: 'insetNone' }}>
        <ToolbarContent>
          <ToolbarGroup>
            <ToolbarItem variant="search-filter">
              <TableTextSearch value={name || ''} setValue={setName} placeholder={t('Search by name')} />
            </ToolbarItem>
          </ToolbarGroup>
          {canCreate && (
            <ToolbarItem>
              <Button variant="primary" onClick={() => {}}>
                {t('Create image build')}
              </Button>
            </ToolbarItem>
          )}
          {canDelete && (
            <ToolbarItem>
              <Button isDisabled={!hasSelectedRows} onClick={() => {}} variant="secondary">
                {t('Delete image builds')}
              </Button>
            </ToolbarItem>
          )}
        </ToolbarContent>
      </Toolbar>
      <Table
        aria-label={t('Image builds table')}
        loading={isUpdating}
        columns={imageBuildColumns}
        hasFilters={hasFiltersEnabled}
        emptyData={imageBuilds.length === 0}
        clearFilters={() => setName('')}
        isAllSelected={isAllSelected}
        onSelectAll={setAllSelected}
      >
        <Tbody>
          {imageBuilds.map((imageBuild, rowIndex) => (
            <ImageBuildRow
              key={getResourceId(imageBuild)}
              imageBuild={imageBuild}
              rowIndex={rowIndex}
              canDelete={canDelete}
              onDeleteClick={() => {
                setImageBuildToDeleteId(imageBuild.metadata.name || '');
              }}
              isRowSelected={isRowSelected}
              onRowSelect={onRowSelect}
              canEdit={canEdit}
            />
          ))}
        </Tbody>
      </Table>
      <TablePagination pagination={pagination} isUpdating={isUpdating} />
      {!isUpdating && imageBuilds.length === 0 && !name && <ImageBuildsEmptyState />}
      {imageBuildToDeleteId && (
        // TODO: Add DeleteImageBuildModal when available
        <div>{/* Delete modal would go here */}</div>
      )}
    </ListPageBody>
  );
};

const ImageBuildsPage = () => {
  const { t } = useTranslation();

  return (
    <ListPage title={t('Image builds')}>
      <ImageBuildTable />
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
