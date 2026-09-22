import * as React from 'react';
import {
  Alert,
  Button,
  Content,
  ContentVariants,
  EmptyState,
  EmptyStateActions,
  EmptyStateBody,
  Flex,
  FlexItem,
  FormGroup,
  Gallery,
  GalleryItem,
  Label,
  LabelGroup,
  ModalBody,
  ModalFooter,
  ModalHeader,
  SelectList,
  SelectOption,
  Spinner,
  Stack,
  StackItem,
  Title,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from '@patternfly/react-core';
import { CatalogItemType } from '@flightctl/types/alpha';
import { SearchIcon } from '@patternfly/react-icons/dist/js/icons/search-icon';
import semver from 'semver';
import { Formik } from 'formik';
import { load } from 'js-yaml';
import validator from '@rjsf/validator-ajv8';
import type { CatalogItem } from '@flightctl/types/alpha';
import type { RJSFSchema, RJSFValidationError } from '@rjsf/utils';

import { useTranslation } from '../../hooks/useTranslation';
import FlightCtlModal from '../common/FlightCtlModal';
import CatalogItemCard from '../Catalog/CatalogItemCard';
import FormSelect from '../form/FormSelect';
import TableTextSearch from '../Table/TableTextSearch';
import TablePagination from '../Table/TablePagination';
import FilterSelect, { FilterSelectGroup } from '../form/FilterSelect';
import { appTypeIds, useCatalogItems } from '../Catalog/useCatalogItems';
import FlightCtlForm from '../form/FlightCtlForm';
import {
  type CatalogAdvancedConfigValues,
  type CatalogSelectionConfirm,
  buildSelectionConfirm,
  catalogItemRequiresAdvancedConfig,
  getCatalogItemDefaultAppName,
  getChannelVersions,
  getDefaultChannel,
  getUniqueApplicationName,
} from './catalogCompositionUtils';
import { getCatalogItemBadge } from '../Catalog/CatalogItemBadges';
import { validateApplicationName } from '../form/validations';
import CheckboxField from '../form/CheckboxField';
import { getInitialAppConfig } from '../Catalog/InstallWizard/utils';
import type { DynamicFormConfigFormik } from '../Catalog/InstallWizard/types';
import CatalogAdvancedConfigStep from './CatalogAdvancedConfigStep';
import CatalogApplicationNameField from './CatalogApplicationNameField';
import { isAppConfigStepValid } from '../Catalog/InstallWizard/steps/AppConfigStep';

import './CatalogSelectionModal.css';

type CatalogSelectionModalProps = {
  appName?: string;
  existingAppNames?: string[];
  onClose: () => void;
  onConfirm: (
    selection: CatalogSelectionConfirm,
    appName: string,
    advancedConfig?: CatalogAdvancedConfigValues,
  ) => void;
};

type Step = 'browse' | 'configure' | 'advanced-config';

type ConfigureFormValues = {
  channel: string;
  version: string;
  appName: string;
  wantAdvancedConfig: boolean;
};

const applicationTypeOptions = appTypeIds.filter((type) => type !== CatalogItemType.CatalogItemTypeData);

const CatalogSelectionModal = ({
  appName = '',
  existingAppNames = [],
  onClose,
  onConfirm,
}: CatalogSelectionModalProps) => {
  const { t } = useTranslation();
  const [step, setStep] = React.useState<Step>('browse');
  const [nameFilter, setNameFilter] = React.useState('');
  const [selectedItem, setSelectedItem] = React.useState<CatalogItem | null>(null);
  const [selectedAppTypes, setSelectedAppTypes] = React.useState<CatalogItemType[]>([]);
  // Chips show filters from the last settled search, not live toolbar edits mid-debounce/fetch.
  const [appliedNameFilter, setAppliedNameFilter] = React.useState('');
  const [appliedAppTypes, setAppliedAppTypes] = React.useState<CatalogItemType[]>([]);
  const [pendingConfigureValues, setPendingConfigureValues] = React.useState<ConfigureFormValues | null>(null);
  const [pendingSelection, setPendingSelection] = React.useState<CatalogSelectionConfirm | null>(null);
  const [advancedSchemaErrors, setAdvancedSchemaErrors] = React.useState<RJSFValidationError[] | undefined>();

  const itemTypeFilter = React.useMemo(
    () => (selectedAppTypes.length === 0 ? applicationTypeOptions : selectedAppTypes),
    [selectedAppTypes],
  );

  const [catalogItems, loading, error, pagination, isUpdating] = useCatalogItems({
    catalogFilter: {
      itemType: itemTypeFilter,
      nameFilter: nameFilter || undefined,
    },
  });

  React.useEffect(() => {
    if (!isUpdating) {
      setAppliedNameFilter(nameFilter);
      setAppliedAppTypes(selectedAppTypes);
    }
    // Commit only when a search settles; ignore live filter edits while updating.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUpdating]);

  const toggleAppType = (type: CatalogItemType) => {
    setSelectedAppTypes((current) =>
      current.includes(type) ? current.filter((entry) => entry !== type) : [...current, type],
    );
  };

  const clearNameFilter = () => {
    setNameFilter('');
    setAppliedNameFilter('');
  };

  const clearAppTypes = () => {
    setSelectedAppTypes([]);
    setAppliedAppTypes([]);
  };

  const removeAppType = (type: CatalogItemType) => {
    setSelectedAppTypes((current) => current.filter((entry) => entry !== type));
    setAppliedAppTypes((current) => current.filter((entry) => entry !== type));
  };

  const clearAllFilters = () => {
    setNameFilter('');
    setSelectedAppTypes([]);
    setAppliedNameFilter('');
    setAppliedAppTypes([]);
  };

  const onNameFilterChange = (value: string) => {
    setNameFilter(value);
    if (value === '') {
      setAppliedNameFilter('');
    }
  };

  const handleClose = () => {
    onClose();
  };

  const defaultAppName = React.useMemo(() => {
    if (!selectedItem) {
      return appName;
    }
    return appName || getUniqueApplicationName(getCatalogItemDefaultAppName(selectedItem), existingAppNames);
  }, [selectedItem, appName, existingAppNames]);

  const configureInitialValues = React.useMemo((): ConfigureFormValues => {
    if (!selectedItem) {
      return { channel: 'stable', version: '', appName, wantAdvancedConfig: false };
    }
    const channel = getDefaultChannel(selectedItem);
    const versions = getChannelVersions(selectedItem, channel).sort((a, b) => semver.rcompare(a.version, b.version));
    const version = versions[0]?.version || '';
    return {
      channel,
      version,
      appName: defaultAppName,
      wantAdvancedConfig: false,
    };
  }, [selectedItem, appName, defaultAppName]);

  const hasNameFilter = Boolean(appliedNameFilter.trim());
  const hasTypeFilter = appliedAppTypes.length > 0;
  const hasFilters = hasNameFilter || hasTypeFilter;

  const advancedInitialValues = React.useMemo((): DynamicFormConfigFormik | null => {
    if (!selectedItem || !pendingConfigureValues) {
      return null;
    }
    const appConfig = getInitialAppConfig(selectedItem, pendingConfigureValues.version);
    return {
      ...appConfig,
      appName: pendingConfigureValues.appName,
    };
  }, [selectedItem, pendingConfigureValues]);

  const validateAdvancedConfig = (values: DynamicFormConfigFormik) => {
    if (values.configureVia === 'form') {
      setAdvancedSchemaErrors(undefined);
      return values.dynamicFormValid ? undefined : { dynamicFormValid: t('Configuration is required') };
    }
    try {
      const yamlContent = load(values.editorContent);
      if (values.configSchema) {
        const validationData = validator.validateFormData(yamlContent, values.configSchema as RJSFSchema);
        if (validationData.errors.length) {
          setAdvancedSchemaErrors(validationData.errors);
          return { editorContent: t('Configuration is not valid') };
        }
      }
      setAdvancedSchemaErrors(undefined);
      return undefined;
    } catch {
      setAdvancedSchemaErrors(undefined);
      return { editorContent: t('Not a valid configuration') };
    }
  };

  const hasCatalogItems = catalogItems.length > 0;

  return (
    <FlightCtlModal variant="large" isOpen onClose={handleClose}>
      <ModalHeader title={t('Add application from Software Catalog')}>
        {(step === 'configure' || step === 'advanced-config') && selectedItem && (
          <Title headingLevel="h2" size="md">
            {selectedItem.spec.displayName || selectedItem.metadata.name}
          </Title>
        )}
      </ModalHeader>
      <ModalBody>
        {step === 'browse' && (
          <Stack hasGutter>
            <StackItem>
              <Toolbar inset={{ default: 'insetNone' }} className="fctl-catalog-composition__toolbar">
                <ToolbarContent>
                  <ToolbarItem>
                    <TableTextSearch
                      value={nameFilter}
                      setValue={onNameFilterChange}
                      placeholder={t('Search by name')}
                    />
                  </ToolbarItem>
                  <ToolbarItem>
                    <FilterSelect
                      placeholder={t('Filter by type')}
                      selectedFilters={selectedAppTypes.length}
                      isFilterUpdating={isUpdating}
                    >
                      <SelectList>
                        <FilterSelectGroup label={t('Application type')}>
                          {applicationTypeOptions.map((type) => (
                            <SelectOption
                              key={type}
                              value={type}
                              hasCheckbox
                              isSelected={selectedAppTypes.includes(type)}
                              onClick={() => toggleAppType(type)}
                            >
                              {getCatalogItemBadge(type, t)}
                            </SelectOption>
                          ))}
                        </FilterSelectGroup>
                      </SelectList>
                    </FilterSelect>
                  </ToolbarItem>
                  <ToolbarItem variant="pagination" align={{ default: 'alignEnd' }}>
                    <TablePagination pagination={pagination} isUpdating={isUpdating} />
                  </ToolbarItem>
                </ToolbarContent>
              </Toolbar>
            </StackItem>

            {hasFilters && (
              <StackItem>
                <Flex>
                  {hasNameFilter && (
                    <FlexItem>
                      <LabelGroup categoryName={t('Name')} isClosable onClick={clearNameFilter}>
                        <Label variant="outline" onClose={clearNameFilter}>
                          {appliedNameFilter}
                        </Label>
                      </LabelGroup>
                    </FlexItem>
                  )}
                  {hasTypeFilter && (
                    <FlexItem>
                      <LabelGroup categoryName={t('Application type')} isClosable onClick={clearAppTypes}>
                        {appliedAppTypes.map((type) => (
                          <Label variant="outline" key={type} onClose={() => removeAppType(type)}>
                            {getCatalogItemBadge(type, t)}
                          </Label>
                        ))}
                      </LabelGroup>
                    </FlexItem>
                  )}
                  <FlexItem>
                    <Button variant="link" isInline onClick={clearAllFilters}>
                      {t('Clear all filters')}
                    </Button>
                  </FlexItem>
                </Flex>
              </StackItem>
            )}

            {error != null && (
              <StackItem>
                <Alert variant="danger" title={t('Failed to load catalog items')} isInline />
              </StackItem>
            )}
            {(loading || (isUpdating && !hasCatalogItems)) && (
              <StackItem>
                <EmptyState titleText={t('Loading catalog items')} headingLevel="h4" icon={Spinner} />
              </StackItem>
            )}
            {!loading && !isUpdating && !hasCatalogItems && (
              <StackItem>
                {hasFilters ? (
                  <EmptyState headingLevel="h4" icon={SearchIcon} titleText={t('No results found')} variant="full">
                    <EmptyStateBody>{t('Clear all filters and try again.')}</EmptyStateBody>
                    <EmptyStateActions>
                      <Button variant="link" onClick={clearAllFilters}>
                        {t('Clear all filters')}
                      </Button>
                    </EmptyStateActions>
                  </EmptyState>
                ) : (
                  <Alert variant="info" title={t('No catalog items available')} isInline>
                    {t('No application catalog items are available for this template.')}
                  </Alert>
                )}
              </StackItem>
            )}
            {!loading && !isUpdating && hasCatalogItems && (
              <StackItem>
                <Gallery hasGutter minWidths={{ default: '220px' }} className="fctl-catalog-composition__gallery">
                  {catalogItems.map((item) => (
                    <GalleryItem key={`${item.metadata.catalog}/${item.metadata.name}`}>
                      <CatalogItemCard
                        catalogItem={item}
                        onSelect={() => {
                          setSelectedItem(item);
                          setStep('configure');
                        }}
                      />
                    </GalleryItem>
                  ))}
                </Gallery>
              </StackItem>
            )}
          </Stack>
        )}

        {step === 'configure' && selectedItem && (
          <Formik<ConfigureFormValues>
            enableReinitialize
            initialValues={configureInitialValues}
            validate={(values) => {
              const errors: Partial<Record<keyof ConfigureFormValues, string>> = {};
              const name = values.appName;
              if (!name) {
                errors.appName = t('Application name is required');
              } else {
                const nameError = validateApplicationName(name, t);
                if (nameError) {
                  errors.appName = nameError;
                } else if (existingAppNames.some((existingName) => existingName === name) && name !== appName) {
                  errors.appName = t('An application with this name already exists');
                }
              }
              return errors;
            }}
            onSubmit={(values) => {
              const version = selectedItem.spec.versions.find((entry) => entry.version === values.version);
              if (!version) {
                return;
              }
              const selection = buildSelectionConfirm({
                catalogItem: selectedItem,
                version,
                channel: values.channel,
              });
              const goToAdvancedConfig =
                catalogItemRequiresAdvancedConfig(selectedItem, values.version) || values.wantAdvancedConfig;
              if (goToAdvancedConfig) {
                setPendingConfigureValues(values);
                setPendingSelection(selection);
                setStep('advanced-config');
                return;
              }
              onConfirm(selection, values.appName);
              handleClose();
            }}
          >
            {({ values, setFieldValue, submitForm, isSubmitting, isValid }) => {
              const requiresAdditionalInfo = catalogItemRequiresAdvancedConfig(selectedItem, values.version);
              const goToAdvancedConfig = requiresAdditionalInfo || values.wantAdvancedConfig;
              const channelVersions = getChannelVersions(selectedItem, values.channel).sort((a, b) =>
                semver.rcompare(a.version, b.version),
              );
              const versionItems = channelVersions.reduce<Record<string, string>>((acc, entry) => {
                acc[entry.version] = entry.version;
                return acc;
              }, {});

              const channels = selectedItem.spec.versions.reduce<Record<string, string>>((acc, entry) => {
                entry.channels.forEach((channel) => {
                  acc[channel] = channel;
                });
                return acc;
              }, {});

              return (
                <>
                  <FlightCtlForm>
                    <Stack hasGutter>
                      {selectedItem.spec.shortDescription && (
                        <StackItem>
                          <Content component={ContentVariants.p}>{selectedItem.spec.shortDescription}</Content>
                        </StackItem>
                      )}
                      <StackItem>
                        <CatalogApplicationNameField />
                      </StackItem>
                      <StackItem>
                        <FormGroup label={t('Channel')} fieldId="catalog-channel">
                          <FormSelect
                            name="channel"
                            items={channels}
                            onChange={(channel) => {
                              const versions = getChannelVersions(selectedItem, channel).sort((a, b) =>
                                semver.rcompare(a.version, b.version),
                              );
                              const nextVersion = versions.some((entry) => entry.version === values.version)
                                ? values.version
                                : versions[0]?.version || '';
                              if (nextVersion !== values.version) {
                                void setFieldValue('version', nextVersion, true);
                              }
                            }}
                          />
                        </FormGroup>
                      </StackItem>
                      <StackItem>
                        <FormGroup label={t('Version')} fieldId="catalog-version">
                          <FormSelect name="version" items={versionItems} />
                        </FormGroup>
                      </StackItem>
                      {requiresAdditionalInfo && (
                        <StackItem>
                          <Alert isInline variant="info" title={t('Additional information required')}>
                            {t(
                              'This version needs required configuration before it can be added to the template. Continue to provide those values.',
                            )}
                          </Alert>
                        </StackItem>
                      )}
                      <StackItem>
                        <CheckboxField
                          name="wantAdvancedConfig"
                          label={t('Configure advanced settings')}
                          description={t(
                            'Optionally override catalog defaults or provide additional settings before adding this application.',
                          )}
                        />
                      </StackItem>
                    </Stack>
                  </FlightCtlForm>
                  <ModalFooter>
                    <Button variant="link" onClick={() => setStep('browse')}>
                      {t('Back')}
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => void submitForm()}
                      isDisabled={isSubmitting || !isValid}
                    >
                      {goToAdvancedConfig ? t('Next') : t('Add to template')}
                    </Button>
                  </ModalFooter>
                </>
              );
            }}
          </Formik>
        )}

        {step === 'advanced-config' && selectedItem && advancedInitialValues && pendingSelection && (
          <Formik<DynamicFormConfigFormik>
            enableReinitialize
            initialValues={advancedInitialValues}
            validate={validateAdvancedConfig}
            onSubmit={(values) => {
              const name = pendingConfigureValues?.appName;
              if (name) {
                onConfirm(pendingSelection, name, {
                  configureVia: values.configureVia,
                  editorContent: values.editorContent,
                  volumeSelection: values.volumeSelection,
                  formValues: values.formValues,
                });
                handleClose();
              }
            }}
          >
            {({ submitForm, isSubmitting, isValid, values, errors }) => (
              <>
                <FlightCtlForm>
                  <CatalogAdvancedConfigStep schemaErrors={advancedSchemaErrors} />
                </FlightCtlForm>
                <ModalFooter>
                  <Button
                    variant="link"
                    onClick={() => {
                      setAdvancedSchemaErrors(undefined);
                      setStep('configure');
                    }}
                  >
                    {t('Back')}
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => void submitForm()}
                    isDisabled={isSubmitting || !isValid || !isAppConfigStepValid(values, errors)}
                  >
                    {t('Add to template')}
                  </Button>
                </ModalFooter>
              </>
            )}
          </Formik>
        )}
      </ModalBody>
      {step === 'browse' && (
        <ModalFooter>
          <Button variant="link" onClick={handleClose}>
            {t('Cancel')}
          </Button>
        </ModalFooter>
      )}
    </FlightCtlModal>
  );
};

export default CatalogSelectionModal;
