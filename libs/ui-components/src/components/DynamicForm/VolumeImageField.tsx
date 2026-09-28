import * as React from 'react';
import {
  Alert,
  Bullseye,
  Button,
  Divider,
  EmptyState,
  EmptyStateActions,
  EmptyStateBody,
  FormGroup,
  MenuToggle,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Select,
  SelectList,
  SelectOption,
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
import cloneDeep from 'lodash/cloneDeep';
import type { FieldProps, RJSFSchema } from '@rjsf/utils';

import type { CatalogItemRefSpec, ImagePullPolicy, ImageVolumeSource } from '@flightctl/types';
import {
  type CatalogItem,
  type CatalogItemList,
  CatalogItemType,
  type CatalogItemVersion,
} from '@flightctl/types/alpha';

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

/** Schema fragment for catalogItemRef, injected when Both-mode schemas omit it. */
export const CATALOG_ITEM_REF_PROPERTY_SCHEMA: RJSFSchema = {
  type: 'object',
  title: 'Catalog data asset',
  description: 'Reference to a data catalog item (set via software catalog picker)',
  required: ['catalog', 'item', 'version'],
  properties: {
    catalog: { type: 'string' },
    item: { type: 'string' },
    version: { type: 'string' },
    channel: { type: 'string' },
  },
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

export const getVolumeImageSourceMode = (rootSchema: RJSFSchema | undefined): VolumeImageSourceMode => {
  const volumeImageSchema = getVolumeImageSchema(rootSchema);
  const requiredList = Array.isArray(volumeImageSchema?.required) ? volumeImageSchema.required : [];
  if (requiredList.includes('catalogItemRef')) {
    return VolumeImageSourceMode.CatalogOnly;
  }
  if (requiredList.includes('reference')) {
    return VolumeImageSourceMode.ImageOnly;
  }
  return VolumeImageSourceMode.Both;
};

/**
 * For Both-mode volume image schemas that only declare `reference`, inject `catalogItemRef`
 * so catalog picks can live in RJSF formData (no side-channel state).
 */
export const enrichConfigSchemaForVolumeImages = (rootSchema: RJSFSchema): RJSFSchema => {
  const imageSchema = getVolumeImageSchema(rootSchema);
  if (!imageSchema) {
    return rootSchema;
  }
  if (getVolumeImageSourceMode(rootSchema) !== VolumeImageSourceMode.Both) {
    return rootSchema;
  }
  if (hasVolumeImageCatalogItemRefProperty(imageSchema)) {
    return rootSchema;
  }

  const enriched = cloneDeep(rootSchema);
  const enrichedImage = getVolumeImageSchema(enriched);
  if (!enrichedImage) {
    return rootSchema;
  }
  enrichedImage.properties = {
    ...(enrichedImage.properties || {}),
    catalogItemRef: CATALOG_ITEM_REF_PROPERTY_SCHEMA,
  };
  return enriched;
};

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

const asImageFormData = (formData: unknown): ImageVolumeSource =>
  formData && typeof formData === 'object' ? (formData as ImageVolumeSource) : {};

/** RJSF default-form-state may seed required catalogItemRef as {} or empty strings — ignore those. */
const isCompleteCatalogItemRef = (ref: unknown): ref is CatalogItemRefSpec => {
  if (!ref || typeof ref !== 'object') {
    return false;
  }
  const { catalog, item, version } = ref as CatalogItemRefSpec;
  return !!catalog && !!item && !!version;
};

const getSourceLabel = (schema: RJSFSchema, name: string, id: string, mode: VolumeImageSourceMode) => {
  if (typeof schema.title === 'string' && schema.title) {
    return schema.title;
  }
  const properties = schema.properties || {};
  const preferredKey = mode === VolumeImageSourceMode.CatalogOnly ? 'catalogItemRef' : 'reference';
  const preferred = properties[preferredKey];
  if (preferred && typeof preferred === 'object' && typeof preferred.title === 'string' && preferred.title) {
    return preferred.title;
  }
  return name || id;
};

/** Apply reference XOR catalogItemRef and optional pullPolicy onto the image object. */
const buildImageFormData = (
  current: ImageVolumeSource,
  updates: {
    reference?: string;
    catalogItemRef?: CatalogItemRefSpec;
    pullPolicy?: ImagePullPolicy;
    /** When true, replace source from reference/catalogItemRef (possibly clearing both). */
    replaceSource?: boolean;
  },
): ImageVolumeSource => {
  const next: ImageVolumeSource = {};
  const pullPolicy = updates.pullPolicy ?? current.pullPolicy;
  if (pullPolicy) {
    next.pullPolicy = pullPolicy;
  }

  if (updates.replaceSource) {
    if (isCompleteCatalogItemRef(updates.catalogItemRef)) {
      next.catalogItemRef = updates.catalogItemRef;
    } else if (updates.reference) {
      next.reference = updates.reference;
    }
  } else if (isCompleteCatalogItemRef(current.catalogItemRef)) {
    next.catalogItemRef = current.catalogItemRef;
  } else if (current.reference) {
    next.reference = current.reference;
  }

  return next;
};

const getPullPolicySchema = (schema: RJSFSchema): RJSFSchema | undefined => {
  const pullPolicy = schema.properties?.pullPolicy;
  return pullPolicy && typeof pullPolicy === 'object' ? pullPolicy : undefined;
};

/**
 * Custom field for volumes[].image: OCI reference and/or catalog item, plus pullPolicy.
 * Mounted on root_volumes_N_image. Writes XOR source + pullPolicy into formData.
 */
const VolumeImageField = ({
  idSchema,
  schema,
  name,
  formData,
  onChange,
  rawErrors,
  disabled,
  readonly,
  required,
  mode,
}: FieldProps & { mode: VolumeImageSourceMode }) => {
  const { t } = useTranslation();
  const { checkPermissions } = usePermissionsContext();
  const [canListCatalogItems] = checkPermissions(catalogItemListPermission);
  const isCatalogOnly = mode === VolumeImageSourceMode.CatalogOnly;
  const canSelectFromCatalog = canListCatalogItems && mode !== VolumeImageSourceMode.ImageOnly;
  const image = asImageFormData(formData);
  const imageReference = typeof image.reference === 'string' ? image.reference : '';
  // Ignore empty placeholder objects RJSF creates for required catalogItemRef
  const catalogRef = isCompleteCatalogItemRef(image.catalogItemRef) ? image.catalogItemRef : undefined;
  console.log('%c formData', 'color: red; font-size:18px', formData);

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isPullPolicyOpen, setIsPullPolicyOpen] = React.useState(false);
  const catalogItem = useResolvedCatalogRef(catalogRef)?.item;

  const requiredList = Array.isArray(schema.required) ? schema.required : [];
  const sourceRequired = !!required || requiredList.includes('reference') || requiredList.includes('catalogItemRef');
  const sourceLabel = getSourceLabel(schema, name, idSchema.$id, mode);

  const pullPolicySchema = getPullPolicySchema(schema);
  const pullPolicyOptions = Array.isArray(pullPolicySchema?.enum)
    ? pullPolicySchema.enum.filter((value): value is string => typeof value === 'string')
    : [];
  const pullPolicyId = `${idSchema.$id}_pullPolicy`;
  const pullPolicyLabel = (typeof pullPolicySchema?.title === 'string' && pullPolicySchema.title) || t('Pull policy');
  const pullPolicyValue = image.pullPolicy || pullPolicyOptions[0] || '';

  const handleTextChange = (_event: React.FormEvent<HTMLInputElement>, newImgValue: string) => {
    onChange(buildImageFormData(image, { reference: newImgValue, replaceSource: true }));
  };

  const onSelect = (item: CatalogItem, version: CatalogItemVersion, channel: string) => {
    onChange(
      buildImageFormData(image, {
        catalogItemRef: buildCatalogItemRef({
          catalogItem: item,
          catalogItemVersion: version,
          channel,
        }),
        replaceSource: true,
      }),
    );
  };

  const onClearCatalog = () => {
    onChange(buildImageFormData(image, { replaceSource: true }));
  };

  const handlePullPolicyChange = (value: string) => {
    onChange(buildImageFormData(image, { pullPolicy: value as ImagePullPolicy }));
    setIsPullPolicyOpen(false);
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

  let sourceControl: React.ReactNode;
  if (catalogRef) {
    sourceControl = catalogCard;
  } else if (isCatalogOnly) {
    sourceControl = (
      <Button
        variant="secondary"
        icon={<CatalogIcon />}
        onClick={() => setIsModalOpen(true)}
        isDisabled={disabled || readonly || !canSelectFromCatalog}
      >
        {t('Add from software catalog')}
      </Button>
    );
  } else {
    sourceControl = (
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
    );
  }

  return (
    <Stack hasGutter>
      <StackItem>
        <FormGroup fieldId={idSchema.$id} label={sourceLabel} isRequired={sourceRequired}>
          {sourceControl}
        </FormGroup>
      </StackItem>
      {pullPolicySchema && pullPolicyOptions.length > 0 && (
        <StackItem>
          <FormGroup fieldId={pullPolicyId} label={pullPolicyLabel} isRequired={requiredList.includes('pullPolicy')}>
            <Select
              id={pullPolicyId}
              isOpen={isPullPolicyOpen}
              selected={pullPolicyValue}
              onSelect={(_event, value) => handlePullPolicyChange(String(value))}
              onOpenChange={setIsPullPolicyOpen}
              toggle={(toggleRef) => (
                <MenuToggle
                  ref={toggleRef}
                  onClick={() => setIsPullPolicyOpen(!isPullPolicyOpen)}
                  isExpanded={isPullPolicyOpen}
                  isDisabled={disabled || readonly}
                  style={{ width: '100%' }}
                >
                  {pullPolicyValue}
                </MenuToggle>
              )}
              shouldFocusToggleOnSelect
            >
              <SelectList>
                {pullPolicyOptions.map((option) => (
                  <SelectOption key={option} value={option}>
                    {option}
                  </SelectOption>
                ))}
              </SelectList>
            </Select>
          </FormGroup>
        </StackItem>
      )}
      {isModalOpen && <SelectAssetModal onClose={() => setIsModalOpen(false)} onSelect={onSelect} />}
    </Stack>
  );
};

export default VolumeImageField;
