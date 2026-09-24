import * as React from 'react';
import {
  Alert,
  Button,
  EmptyState,
  EmptyStateActions,
  EmptyStateBody,
  Flex,
  FlexItem,
  Label,
  LabelGroup,
  SelectList,
  SelectOption,
  Spinner,
  Stack,
  StackItem,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from '@patternfly/react-core';
import { type CatalogItem, CatalogItemType } from '@flightctl/types/alpha';
import { SearchIcon } from '@patternfly/react-icons/dist/js/icons/search-icon';

import { useTranslation } from '../../hooks/useTranslation';
import TableTextSearch from '../Table/TableTextSearch';
import TablePagination from '../Table/TablePagination';
import FilterSelect, { FilterSelectGroup } from '../form/FilterSelect';
import { appTypeIds, useCatalogItems } from '../Catalog/useCatalogItems';
import { getCatalogItemBadge } from '../Catalog/CatalogItemBadges';
import CatalogItemGallery from '../Catalog/CatalogItemGallery';

const applicationTypeOptions = appTypeIds.filter((type) => type !== CatalogItemType.CatalogItemTypeData);

export type CatalogBrowseStepProps = {
  onSelect: (item: CatalogItem) => void;
};

const CatalogBrowseStep = ({ onSelect }: CatalogBrowseStepProps) => {
  const { t } = useTranslation();
  const [nameFilter, setNameFilter] = React.useState('');
  const [selectedAppTypes, setSelectedAppTypes] = React.useState<CatalogItemType[]>([]);
  // Chips show filters from the last settled search, not live toolbar edits mid-debounce/fetch.
  const [appliedNameFilter, setAppliedNameFilter] = React.useState('');
  const [appliedAppTypes, setAppliedAppTypes] = React.useState<CatalogItemType[]>([]);

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

  const hasNameFilter = Boolean(appliedNameFilter.trim());
  const hasTypeFilter = appliedAppTypes.length > 0;
  const hasFilters = hasNameFilter || hasTypeFilter;
  const hasCatalogItems = catalogItems.length > 0;

  return (
    <Stack hasGutter>
      <StackItem>
        <Toolbar inset={{ default: 'insetNone' }}>
          <ToolbarContent>
            <ToolbarItem>
              <TableTextSearch value={nameFilter} setValue={onNameFilterChange} placeholder={t('Search by name')} />
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
              {t('No application catalog items are available.')}
            </Alert>
          )}
        </StackItem>
      )}
      {!loading && !isUpdating && hasCatalogItems && (
        <StackItem>
          <CatalogItemGallery catalogItems={catalogItems} onSelect={onSelect} />
        </StackItem>
      )}
    </Stack>
  );
};

export default CatalogBrowseStep;
