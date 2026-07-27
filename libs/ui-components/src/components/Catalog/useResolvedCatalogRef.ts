import * as React from 'react';
import { CatalogItemRefSpec } from '@flightctl/types';
import { CatalogItem, CatalogItemVersion } from '@flightctl/types/alpha';

import { ResolvedCatalogRef, formatCatalogRefLabel, resolveCatalogRef, toCatalogItemId } from '../../utils/catalog';
import { useOptionalCatalogItemsContext } from './CatalogItemsContext';
import { useCatalogItemsLookup } from './useCatalogItemsLookup';

export type UseResolvedCatalogRefResult = {
  item: CatalogItem | undefined;
  version: CatalogItemVersion | undefined;
  channel: string;
  imageUri: string | undefined;
  label: string;
  isLoading: boolean;
  error?: unknown;
};

/**
 * Resolves one catalogItemRef to display label and optional OCI URI.
 * Uses CatalogItemsProvider when present; otherwise fetches locally.
 */
export const useResolvedCatalogRef = (ref: CatalogItemRefSpec | undefined): UseResolvedCatalogRefResult | undefined => {
  const contextLookup = useOptionalCatalogItemsContext();
  const localIds = React.useMemo(() => (!contextLookup && ref ? [toCatalogItemId(ref)] : []), [contextLookup, ref]);
  const localLookup = useCatalogItemsLookup(localIds);
  const lookup = contextLookup ?? localLookup;

  if (!ref) {
    return undefined;
  }

  const item = lookup.getItem(ref.catalog, ref.item);
  const resolved: ResolvedCatalogRef | undefined = item ? resolveCatalogRef(item, ref) : undefined;

  return {
    item,
    version: resolved?.version,
    channel: ref.channel || '',
    imageUri: resolved?.imageUri,
    label: formatCatalogRefLabel(item, ref),
    isLoading: lookup.isLoading,
    error: lookup.error,
  };
};
