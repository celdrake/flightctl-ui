import * as React from 'react';
import { useDebounce } from 'use-debounce';
import { type CatalogItem, type CatalogItemDeploymentList, type CatalogItemList } from '@flightctl/types/alpha';
import { CatalogItemType } from '@flightctl/types/alpha';
import { useFetchPeriodically } from '../../hooks/useFetchPeriodically';
import { type PaginationDetails, useTablePagination } from '../../hooks/useTablePagination';
import { PAGE_SIZE } from '../../constants';

export const appTypeIds = [
  CatalogItemType.CatalogItemTypeContainer,
  CatalogItemType.CatalogItemTypeHelm,
  CatalogItemType.CatalogItemTypeQuadlet,
  CatalogItemType.CatalogItemTypeCompose,
  CatalogItemType.CatalogItemTypeData,
];

const systemTypeIds = [CatalogItemType.CatalogItemTypeOS];

export type CatalogTypeFilter = {
  itemTypes?: CatalogItemType[];
};

const getItemTypesFilters = (itemTypes: CatalogItemType[] | undefined, excludeItemType?: CatalogItemType): string[] => {
  const parts: string[] = [];

  const allTypesSelected = [...systemTypeIds, ...appTypeIds].every((id) => itemTypes?.includes(id));
  const selectedTypes = allTypesSelected || !itemTypes ? [] : [...itemTypes];

  const isInvalidSelection = selectedTypes.length === 1 && selectedTypes[0] === excludeItemType;
  if (isInvalidSelection) {
    // When there's a single type to filter for, and at the same time it's been excluded,
    // the query should return no catalog items. (Forced this by querying for a required field not being present)
    parts.push('!spec.type');
  } else if (selectedTypes.length > 0) {
    const typesToQuery = excludeItemType ? selectedTypes.filter((t) => t !== excludeItemType) : selectedTypes;
    parts.push(`spec.type in (${typesToQuery.join(',')})`);
  } else if (excludeItemType) {
    parts.push(`spec.type != ${excludeItemType}`);
  }

  return parts;
};

const buildCatalogItemsFieldSelector = (
  catalogs: string[],
  typeFilter?: CatalogTypeFilter,
  nameFilter?: string,
  excludeItemType?: CatalogItemType,
): string | undefined => {
  const parts: string[] = [];

  parts.push(...getItemTypesFilters(typeFilter?.itemTypes, excludeItemType));

  if (nameFilter) {
    parts.push(`metadata.name contains ${nameFilter}`);
  }
  if (catalogs.length) {
    parts.push(`metadata.catalog in (${catalogs.join(',')})`);
  }
  return parts.length > 0 ? parts.join(',') : undefined;
};

export type UseAllCatalogItemsFilter = {
  catalogFilter: {
    typeFilter?: CatalogTypeFilter;
    nameFilter?: string | undefined;
    catalogs?: string[];
  };
} & { excludeItemType?: CatalogItemType };

export const useCatalogItems = ({
  catalogFilter,
  excludeItemType,
}: UseAllCatalogItemsFilter): [
  CatalogItem[],
  boolean,
  unknown,
  PaginationDetails<CatalogItemList>,
  boolean,
  VoidFunction,
] => {
  const pagination = useTablePagination<CatalogItemList>();
  const { typeFilter, nameFilter, catalogs } = catalogFilter;

  const fieldSelector = React.useMemo(
    () =>
      typeFilter || nameFilter || catalogs || excludeItemType
        ? buildCatalogItemsFieldSelector(catalogs || [], typeFilter, nameFilter, excludeItemType)
        : undefined,
    [typeFilter, nameFilter, catalogs, excludeItemType],
  );

  const endpoint = React.useMemo(() => {
    const params = new URLSearchParams();
    params.set('limit', `${PAGE_SIZE}`);
    if (pagination.nextContinue) {
      params.set('continue', pagination.nextContinue);
    }
    if (fieldSelector) {
      params.set('fieldSelector', fieldSelector);
    }
    const query = params.toString();
    return query ? `catalogitems?${query}` : 'catalogitems';
  }, [fieldSelector, pagination.nextContinue]);

  const [endpointDebounced] = useDebounce(endpoint, 1000);
  const isDebouncing = endpoint !== endpointDebounced;

  React.useEffect(() => {
    pagination.setCurrentPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nameFilter, typeFilter, catalogs, excludeItemType]);

  const [catalogItemsList, loading, error, refetch, isFetchUpdating] = useFetchPeriodically<CatalogItemList>(
    { endpoint: endpointDebounced },
    pagination.onPageFetched,
  );

  const isUpdating = loading || isDebouncing || isFetchUpdating;

  return [catalogItemsList?.items || [], loading, error, pagination, isUpdating, refetch];
};

export const useItemIsInUse = (catalogItem: CatalogItem): boolean => {
  const [deployments] = useFetchPeriodically<CatalogItemDeploymentList>({
    endpoint: `catalogs/${catalogItem.metadata.catalog}/items/${catalogItem.metadata.name}/deployments?limit=1`,
  });

  return (deployments?.items?.length ?? 0) > 0;
};
