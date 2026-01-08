import * as React from 'react';
import {
  Alert,
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

import {
  BindingType,
  ExportFormatType,
  ImageBuild,
  ImageExport,
  ImagePipelineRequest,
} from '@flightctl/types/imagebuilder';
import { RESOURCE, VERB } from '../../types/rbac';
import { getResourceId } from '../../utils/resource';
import { getErrorMessage } from '../../utils/error';
import { useTableSelect } from '../../hooks/useTableSelect';
import { useTranslation } from '../../hooks/useTranslation';
import { useFetch } from '../../hooks/useFetch';
import ResourceListEmptyState from '../common/ResourceListEmptyState';
import PageWithPermissions from '../common/PageWithPermissions';
import { usePermissionsContext } from '../common/PermissionsContext';
import ListPage from '../ListPage/ListPage';
import ListPageBody from '../ListPage/ListPageBody';
import TablePagination from '../Table/TablePagination';
import TableTextSearch from '../Table/TableTextSearch';
import Table, { ApiSortTableColumn } from '../Table/Table';

import DeleteImageBuildModal from './DeleteImageBuildModal/DeleteImageBuildModal';
import { useImageBuildBackendFilters, useImageBuilds } from './useImageBuilds';
import ImageBuildRow from './ImageBuildRow';
import MassDeleteImageBuildModal from '../modals/massModals/MassDeleteImageBuildModal/MassDeleteImageBuildModal';

const getColumns = (t: TFunction): ApiSortTableColumn[] => [
  {
    name: t('Name'),
  },
  {
    name: t('Base image'),
  },
  {
    name: t('Output image'),
  },
  {
    name: t('Status'),
  },
  {
    name: t('Export images'),
  },
  {
    name: t('Date'),
  },
];

const imageBuildTablePermissions = [
  { kind: RESOURCE.IMAGE_BUILD, verb: VERB.CREATE },
  { kind: RESOURCE.IMAGE_BUILD, verb: VERB.DELETE },
];

const ImageBuildsEmptyState = ({ onCreateClick }: { onCreateClick: () => void }) => {
  const { t } = useTranslation();
  return (
    <ResourceListEmptyState icon={PlusCircleIcon} titleText={t('There are no image builds in your environment.')}>
      <EmptyStateBody>
        {t('Image builds allow you to build and manage container images for your edge devices.')}
      </EmptyStateBody>
      <EmptyStateFooter>
        <EmptyStateActions>
          <Button variant="primary" onClick={onCreateClick}>
            {t('Create an image build')}
          </Button>
        </EmptyStateActions>
      </EmptyStateFooter>
    </ResourceListEmptyState>
  );
};

const imageBuild: ImageBuild = {
  apiVersion: 'imagebuilder.flightctl.io/v1beta1',
  kind: 'ImageBuild',
  metadata: {
    name: `test-image-build-${Date.now()}`,
  },
  spec: {
    source: {
      repository: 'test-source-repo',
      imageName: 'test-source-image',
      imageTag: 'latest',
    },
    destination: {
      repository: 'test-dest-repo',
      imageName: 'test-dest-image',
      tag: 'latest',
    },
    binding: {
      type: BindingType.BindingTypeLate,
    },
  },
};

const imageExport: ImageExport = {
  apiVersion: 'imagebuilder.flightctl.io/v1beta1',
  kind: 'ImageExport',
  metadata: {
    name: `test-image-export-${Date.now()}`,
  },
  spec: {
    source: {
      type: 'imageReference',
      repository: 'test-source-repo',
      imageName: 'test-source-image',
      imageTag: 'latest',
    },
    destination: {
      repository: 'test-export-repo',
      imageName: 'test-export-image',
      tag: 'latest',
    },
    format: ExportFormatType.ExportFormatTypeISO,
  },
};

const ImageBuildTable = () => {
  const { t } = useTranslation();

  const imageBuildColumns = React.useMemo(() => getColumns(t), [t]);
  const { name, setName, hasFiltersEnabled } = useImageBuildBackendFilters();

  const { imageBuilds, isLoading, error, isUpdating, refetch, pagination } = useImageBuilds({ name });

  const [imageBuildToDeleteId, setImageBuildToDeleteId] = React.useState<string>();
  const [isMassDeleteModalOpen, setIsMassDeleteModalOpen] = React.useState(false);
  const [isCreating, setIsCreating] = React.useState(false);
  const [createError, setCreateError] = React.useState<string | undefined>();

  const { onRowSelect, isAllSelected, hasSelectedRows, isRowSelected, setAllSelected } = useTableSelect();

  const { checkPermissions } = usePermissionsContext();
  const [canCreate, canDelete] = checkPermissions(imageBuildTablePermissions);

  const { post } = useFetch();

  const handleCreateImageBuild = React.useCallback(async () => {
    setIsCreating(true);
    setCreateError(undefined);

    try {
      // Hardcoded image build data for testing
      const imageBuildRequest: ImagePipelineRequest = {
        imageBuild,
        imageExport,
      };

      await post<ImagePipelineRequest>('imagepipelines', imageBuildRequest);
      refetch();
    } catch (e) {
      setCreateError(getErrorMessage(e));
    } finally {
      setIsCreating(false);
    }
  }, [post, refetch]);

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
              <Button variant="primary" onClick={handleCreateImageBuild} isLoading={isCreating}>
                {t('Create image build')}
              </Button>
            </ToolbarItem>
          )}
          {canDelete && (
            <ToolbarItem>
              <Button isDisabled={!hasSelectedRows} onClick={() => setIsMassDeleteModalOpen(true)} variant="secondary">
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
            />
          ))}
        </Tbody>
      </Table>
      <TablePagination pagination={pagination} isUpdating={isUpdating} />
      {!isUpdating && imageBuilds.length === 0 && !name && (
        <ImageBuildsEmptyState onCreateClick={handleCreateImageBuild} />
      )}
      {createError && (
        <Alert variant="danger" title={t('Error creating image build')} isInline>
          {createError}
        </Alert>
      )}

      {imageBuildToDeleteId && (
        <DeleteImageBuildModal
          imageBuildId={imageBuildToDeleteId}
          onClose={(hasDeleted) => {
            setImageBuildToDeleteId(undefined);
            if (hasDeleted) {
              refetch();
            }
          }}
        />
      )}
      {isMassDeleteModalOpen && (
        <MassDeleteImageBuildModal
          onClose={() => setIsMassDeleteModalOpen(false)}
          imageBuilds={imageBuilds.filter(isRowSelected)}
          onDeleteSuccess={() => {
            setIsMassDeleteModalOpen(false);
            refetch();
          }}
        />
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
