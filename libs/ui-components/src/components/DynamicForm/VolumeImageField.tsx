import * as React from 'react';
import {
  Alert,
  Bullseye,
  Button,
  Divider,
  EmptyState,
  EmptyStateActions,
  EmptyStateBody,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Spinner,
  Split,
  SplitItem,
  Stack,
  StackItem,
  TextInput,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from '@patternfly/react-core';
import { Formik } from 'formik';
import { SearchIcon } from '@patternfly/react-icons/dist/js/icons/search-icon';
import { CubeIcon } from '@patternfly/react-icons/dist/js/icons/cube-icon';
import { MinusCircleIcon } from '@patternfly/react-icons/dist/js/icons/minus-circle-icon';
import { CatalogIcon } from '@patternfly/react-icons/dist/js/icons/catalog-icon';
import type { FieldProps, RJSFSchema } from '@rjsf/utils';

import type { CatalogItemRefSpec } from '@flightctl/types';
import {
  type CatalogItem,
  type CatalogItemList,
  CatalogItemType,
  type CatalogItemVersion,
} from '@flightctl/types/alpha';

import { type DynamicFormContext } from './DynamicForm';
import { useTranslation } from '../../hooks/useTranslation';
import { usePermissionsContext } from '../common/PermissionsContext';
import { RESOURCE, VERB } from '../../types/rbac';
import TableTextSearch from '../Table/TableTextSearch';
import TablePagination from '../Table/TablePagination';
import {
  CatalogItemDetailsContent,
  CatalogItemDetailsHeader,
  getDefaultChannelAndVersion,
} from '../Catalog/CatalogItemDetails';
import FlightCtlForm from '../form/FlightCtlForm';
import { type PaginationDetails } from '../../hooks/useTablePagination';
import { getErrorMessage } from '../../utils/error';
import { buildCatalogItemRef, formatCatalogItemRef } from '../../utils/catalog';
import ResourceListEmptyState from '../common/ResourceListEmptyState';
import FlightCtlModal from '../common/FlightCtlModal';
import { InstallSpec } from '../Catalog/InstallWizard/steps/SpecificationsStep';
import { type InstallSpecFormik } from '../Catalog/InstallWizard/types';
import { useCatalogItems } from '../Catalog/useCatalogItems';
import { useResolvedCatalogRef } from '../Catalog/useResolvedCatalogRef';
import CatalogItemGallery from '../Catalog/CatalogItemGallery';
import CatalogRefCard from '../CatalogRef/CatalogRefCard';

export enum VolumeImageSourceMode {
  // Volume accepts only an image reference
  ImageOnly = 'imageOnly',
  // Volume accepts only a catalog item reference
  CatalogOnly = 'catalogOnly',
  // Volume accepts can use either
  Both = 'both',
}

/**
 * Regex for volume image object field IDs.
 * Matches IDs like: root_volumes_0_image, root_volumes_1_image, etc.
 */
export const ROOT_VOLUMES_IMAGE_FIELD_REGEX = /root_volumes_(\d+)_image$/;

/**
 * Regex for volume image reference field IDs.
 * Matches IDs like: root_volumes_0_image_reference, root_volumes_1_image_reference, etc.
 */
export const ROOT_VOLUMES_IMAGE_REFERENCE_FIELD_REGEX = /root_volumes_(\d+)_image_reference$/;

/**
 * Regex for volume image catalogItemRef field IDs.
 * Matches IDs like: root_volumes_0_image_catalogItemRef, etc.
 */
export const ROOT_VOLUMES_IMAGE_CATALOG_REF_FIELD_REGEX = /root_volumes_(\d+)_image_catalogItemRef$/;

/**
 * Extract the volume index from a volume image-related field ID.
 */
export const getVolumeIndexFromId = (fieldId: string): number => {
  const match =
    fieldId.match(ROOT_VOLUMES_IMAGE_REFERENCE_FIELD_REGEX) ||
    fieldId.match(ROOT_VOLUMES_IMAGE_CATALOG_REF_FIELD_REGEX) ||
    fieldId.match(ROOT_VOLUMES_IMAGE_FIELD_REGEX);
  return match ? parseInt(match[1], 10) : -1;
};

/** Resolve the shared volumes[].image schema from the form root schema. */
export const getVolumeImageSchema = (rootSchema: RJSFSchema | undefined): RJSFSchema | undefined => {
  const volumes = rootSchema?.properties?.volumes;
  if (!volumes || typeof volumes === 'boolean') {
    return undefined;
  }
  const items = Array.isArray(volumes.items) ? volumes.items[0] : volumes.items;
  if (!items || typeof items === 'boolean') {
    return undefined;
  }
  const image = items.properties?.image;
  return typeof image === 'object' ? image : undefined;
};

export const hasVolumeImageCatalogItemRefProperty = (imageSchema: RJSFSchema | undefined): boolean =>
  !!imageSchema?.properties && 'catalogItemRef' in imageSchema.properties;

type SelectAssetModalProps = {
  onClose: VoidFunction;
  onSelect: (item: CatalogItem, version: CatalogItemVersion, channel: string) => void;
};

const assetItemTypeFilter = [CatalogItemType.CatalogItemTypeData];

const SelectAssetModal = ({ onClose, onSelect }: SelectAssetModalProps) => {
  const [selectedAsset, setSelectedAsset] = React.useState<CatalogItem>();
  const [nameFilter, setNameFilter] = React.useState('');
  const { t } = useTranslation();
  const [assetCatalogItems, isLoading, error, pagination, isUpdating] = useCatalogItems({
    catalogFilter: {
      typeFilter: {
        itemTypes: assetItemTypeFilter,
      },
      nameFilter,
    },
  });

  return (
    <FlightCtlModal isOpen onClose={onClose} variant="large" aria-label={t('Choose asset from catalog')}>
      {selectedAsset ? (
        <CatalogItemDetails
          item={selectedAsset}
          onCancel={onClose}
          onBack={() => setSelectedAsset(undefined)}
          onSelect={(version, channel) => {
            onSelect(selectedAsset, version, channel);
            onClose();
          }}
        />
      ) : (
        <AssetsList
          onSelect={setSelectedAsset}
          onClose={onClose}
          assetCatalogItems={assetCatalogItems}
          isLoading={isLoading}
          isUpdating={isUpdating}
          error={error}
          pagination={pagination}
          nameFilter={nameFilter}
          setNameFilter={setNameFilter}
        />
      )}
    </FlightCtlModal>
  );
};

type AssetsListProps = {
  assetCatalogItems: CatalogItem[];
  isLoading: boolean;
  isUpdating: boolean;
  error: unknown;
  pagination: PaginationDetails<CatalogItemList>;
  onSelect: (asset: CatalogItem) => void;
  onClose: VoidFunction;
  nameFilter: string;
  setNameFilter: (name: string) => void;
};

const AssetsList = ({
  assetCatalogItems,
  isLoading,
  isUpdating,
  error,
  pagination,
  onSelect,
  onClose,
  nameFilter,
  setNameFilter,
}: AssetsListProps) => {
  const { t } = useTranslation();
  const hasFilters = !!nameFilter?.trim();

  let modalContent = (
    <>
      <Toolbar inset={{ default: 'insetNone' }}>
        <ToolbarContent>
          <ToolbarItem>
            <TableTextSearch value={nameFilter} setValue={setNameFilter} placeholder={t('Search by name')} />
          </ToolbarItem>
          <ToolbarItem variant="pagination" align={{ default: 'alignEnd' }}>
            <TablePagination pagination={pagination} isUpdating={isUpdating} />
          </ToolbarItem>
        </ToolbarContent>
      </Toolbar>
      {assetCatalogItems.length === 0 ? (
        hasFilters ? (
          <EmptyState headingLevel="h4" icon={SearchIcon} titleText={t('No results found')} variant="full">
            <EmptyStateBody>{t('Clear all filters and try again.')}</EmptyStateBody>
            <EmptyStateActions>
              <Button variant="link" onClick={() => setNameFilter('')}>
                {t('Clear all filters')}
              </Button>
            </EmptyStateActions>
          </EmptyState>
        ) : (
          <ResourceListEmptyState icon={CubeIcon} titleText={t('No assets available in catalog')}>
            <EmptyStateBody>
              {t('There are no asset catalog items to choose from. Add assets to your catalogs to select them here.')}
            </EmptyStateBody>
          </ResourceListEmptyState>
        )
      ) : (
        <CatalogItemGallery catalogItems={assetCatalogItems} onSelect={(asset) => onSelect(asset)} />
      )}
    </>
  );

  if (error) {
    modalContent = (
      <Alert variant="danger" title={t('An error occurred')} isInline>
        {getErrorMessage(error)}
      </Alert>
    );
  } else if (isLoading) {
    modalContent = (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );
  }

  return (
    <>
      <ModalHeader title={t('Choose asset from catalog')} />
      <ModalBody>{modalContent}</ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          {t('Cancel')}
        </Button>
      </ModalFooter>
    </>
  );
};

const CatalogItemDetails = ({
  item,
  onBack,
  onCancel,
  onSelect,
}: {
  item: CatalogItem;
  onBack: VoidFunction;
  onCancel: VoidFunction;
  onSelect: (selectedVersion: CatalogItemVersion, channel: string) => void;
}) => {
  const { t } = useTranslation();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const initialValues = React.useMemo(() => getDefaultChannelAndVersion(item), []);

  const onSubmit = (values: InstallSpecFormik) => {
    const selectedVersion = item.spec.versions.find((v) => v.version === values.version);
    if (item && selectedVersion) {
      onSelect(selectedVersion, values.channel);
    }
  };

  return (
    <Formik<InstallSpecFormik> initialValues={initialValues} enableReinitialize onSubmit={onSubmit}>
      {({ submitForm }) => (
        <>
          <ModalHeader>
            <CatalogItemDetailsHeader item={item} />
          </ModalHeader>
          <ModalBody>
            <Stack hasGutter>
              <StackItem>
                <FlightCtlForm>
                  <InstallSpec catalogItem={item} hideReadmeLink />
                </FlightCtlForm>
              </StackItem>
              <StackItem>
                <Divider />
              </StackItem>
              <StackItem>
                <CatalogItemDetailsContent item={item} />
              </StackItem>
            </Stack>
          </ModalBody>
          <ModalFooter>
            <Button variant="secondary" onClick={onBack}>
              {t('Back')}
            </Button>
            <Button onClick={submitForm}>{t('Select')}</Button>
            <Button variant="link" onClick={onCancel}>
              {t('Cancel')}
            </Button>
          </ModalFooter>
        </>
      )}
    </Formik>
  );
};

const catalogItemListPermission = [{ kind: RESOURCE.CATALOG_ITEM, verb: VERB.LIST }];

// Setting "reference" to an empty string satisfies JSON Schema `required`, making the field valid.
const VALID_EMPTY_IMAGE_REFERENCE = '';
// Setting "reference" to undefined makes the field invalid, as required validation fails.
const INVALID_EMPTY_IMAGE_REFERENCE = undefined;

// CELIA-WIP: UNIfy managing of formData
// CELIA-WIP: Unify double template

/**
 * Custom field for volume image source (OCI reference and/or catalog item).
 * Mounted on root_volumes_N_image_reference, or on catalogItemRef when mode is catalogOnly.
 * Catalog selections are tracked via "volumeSelection" and persisted as catalogItemRef on submit.
 */
const VolumeImageField = ({
  idSchema,
  formData,
  onChange,
  rawErrors,
  formContext,
  disabled,
  readonly,
  mode,
}: FieldProps & { mode: VolumeImageSourceMode }) => {
  const { t } = useTranslation();
  const { checkPermissions } = usePermissionsContext();
  const [canListCatalogItems] = checkPermissions(catalogItemListPermission);
  const { onVolumeSelected, volumeSelection, onVolumeCleared } = formContext as DynamicFormContext;
  const isCatalogOnly = mode === 'catalogOnly';
  const canSelectFromCatalog = canListCatalogItems && mode !== 'imageOnly';
  const imageReference = typeof formData === 'string' ? formData : '';
  const volumeIndex = getVolumeIndexFromId(idSchema.$id);

  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const currentVolumeSelection = volumeSelection.find((a) => a.volumeIndex === volumeIndex);
  const formCatalogRef =
    isCatalogOnly && formData && typeof formData === 'object' && 'catalog' in formData && 'item' in formData
      ? (formData as CatalogItemRefSpec)
      : undefined;
  const catalogRef = currentVolumeSelection?.catalogItemRef || formCatalogRef;
  const catalogItem = useResolvedCatalogRef(catalogRef)?.item;

  const handleTextChange = (_event: React.FormEvent<HTMLInputElement>, newImgValue: string) => {
    if (currentVolumeSelection) {
      onVolumeCleared(volumeIndex);
    }
    onChange(newImgValue === '' ? INVALID_EMPTY_IMAGE_REFERENCE : newImgValue);
  };

  const onSelect = (item: CatalogItem, version: CatalogItemVersion, channel: string) => {
    const nextCatalogItemRef = buildCatalogItemRef({
      catalogItem: item,
      catalogItemVersion: version,
      channel,
    });
    onVolumeSelected({
      volumeIndex,
      catalogItemRef: nextCatalogItemRef,
    });
    if (isCatalogOnly) {
      onChange(nextCatalogItemRef);
    } else {
      // Clear reference so submit path writes catalogItemRef exclusively
      onChange(VALID_EMPTY_IMAGE_REFERENCE);
    }
  };

  const onClearCatalog = () => {
    onVolumeCleared(volumeIndex);
    onChange(isCatalogOnly ? undefined : INVALID_EMPTY_IMAGE_REFERENCE);
  };

  const hasErrors = !!rawErrors?.length;

  const catalogCard = catalogRef ? (
    <Split hasGutter>
      <SplitItem isFilled>
        {catalogItem ? (
          <CatalogRefCard
            catalogItemRef={catalogRef}
            headerTitle={catalogItem?.spec.displayName || catalogItem?.metadata.name || ''}
            showUpdateStatus={false}
            isCompact
          />
        ) : (
          t('Catalog item {{ catalogItemRef }}', {
            catalogItemRef: formatCatalogItemRef(catalogRef),
          })
        )}
      </SplitItem>
      <SplitItem>
        <Button
          aria-label={t('Delete item')}
          variant="link"
          isDanger
          icon={<MinusCircleIcon />}
          iconPosition="start"
          isDisabled={disabled || readonly}
          onClick={onClearCatalog}
        />
      </SplitItem>
    </Split>
  ) : null;

  // Render only the control content; parent FieldTemplate provides the FormGroup label and errors
  return (
    <div>
      {catalogRef ? (
        catalogCard
      ) : isCatalogOnly ? (
        <Button
          variant="secondary"
          icon={<CatalogIcon />}
          onClick={() => setIsModalOpen(true)}
          isDisabled={disabled || readonly || !canSelectFromCatalog}
        >
          {t('Add from software catalog')}
        </Button>
      ) : (
        <Split hasGutter>
          <SplitItem isFilled>
            <TextInput
              id={idSchema.$id}
              value={imageReference}
              onChange={handleTextChange}
              isDisabled={disabled}
              readOnlyVariant={readonly ? 'default' : undefined}
              validated={hasErrors ? 'error' : 'default'}
              placeholder={
                canSelectFromCatalog ? t('Enter image reference or choose from catalog') : t('Enter image reference')
              }
            />
          </SplitItem>
          {canSelectFromCatalog && (
            <SplitItem>
              <Button
                variant="secondary"
                icon={<CatalogIcon />}
                onClick={() => setIsModalOpen(true)}
                isDisabled={disabled || readonly}
              >
                {t('Add from software catalog')}
              </Button>
            </SplitItem>
          )}
        </Split>
      )}
      {isModalOpen && <SelectAssetModal onClose={() => setIsModalOpen(false)} onSelect={onSelect} />}
    </div>
  );
};

export default VolumeImageField;
