import * as React from 'react';
import type { CatalogItem } from '@flightctl/types/alpha';

import { useFetch } from '../../hooks/useFetch';
import { type CatalogItemId, catalogItemCacheKey } from '../../utils/catalog';

export type CatalogItemsLookupResult = {
  getItem: (catalog: string, item: string) => CatalogItem | undefined;
  isLoading: boolean;
  error?: unknown;
};

const getNeededCatalogItemIdsKey = (ids: CatalogItemId[]): string => {
  const byKey = new Map<string, CatalogItemId>();
  ids.forEach((id) => {
    if (id.catalog && id.item) {
      byKey.set(catalogItemCacheKey(id), id);
    }
  });
  return JSON.stringify(
    [...byKey.values()].sort((a, b) => a.catalog.localeCompare(b.catalog) || a.item.localeCompare(b.item)),
  );
};

export const useCatalogItemFromParams = (params: { catalogId: string; itemId: string }) => {
  const { catalogId, itemId } = params;
  const { getItem, isLoading, error } = useCatalogItemsLookup([{ catalog: catalogId, item: itemId }]);
  const item = getItem(catalogId, itemId);
  return { item, isLoading, error };
};

/**
 * Fetches and caches CatalogItems by catalog/item id.
 * Dedupes, fetches only missing ids, and soft-fails individual requests (exposes aggregate error).
 */
export const useCatalogItemsLookup = (ids: CatalogItemId[]): CatalogItemsLookupResult => {
  const { get: fetchGet } = useFetch();
  const [catalogItemsByKey, setCatalogItemsByKey] = React.useState<Map<string, CatalogItem>>(() => new Map());
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<unknown>();
  const catalogItemsCacheRef = React.useRef<Map<string, CatalogItem>>(new Map());

  const neededCatalogItemIdsKey = getNeededCatalogItemIdsKey(ids);

  React.useEffect(() => {
    let cancelled = false;
    const neededIds: CatalogItemId[] = JSON.parse(neededCatalogItemIdsKey) as CatalogItemId[];
    const neededKeys = new Set(neededIds.map(catalogItemCacheKey));
    const cache = catalogItemsCacheRef.current;

    for (const key of [...cache.keys()]) {
      if (!neededKeys.has(key)) {
        cache.delete(key);
      }
    }

    const missingIds = neededIds.filter((id) => !cache.has(catalogItemCacheKey(id)));

    const publishCache = (nextError?: unknown) => {
      setCatalogItemsByKey(new Map(cache));
      setError(nextError);
      setIsLoading(false);
    };

    if (neededIds.length === 0) {
      publishCache(undefined);
      return;
    }

    if (missingIds.length === 0) {
      publishCache(undefined);
      return;
    }

    setIsLoading(true);

    (async () => {
      const results = await Promise.allSettled(
        missingIds.map((id) =>
          fetchGet<CatalogItem>(`catalogs/${id.catalog}/items/${id.item}`).then((value) => ({
            key: catalogItemCacheKey(id),
            value,
          })),
        ),
      );
      if (cancelled) {
        return;
      }

      let firstError: unknown;
      results.forEach((r, idx) => {
        if (r.status === 'rejected') {
          // eslint-disable-next-line no-console
          console.warn(`Failed to fetch catalog item ${missingIds[idx].catalog}/${missingIds[idx].item}`);
          if (firstError === undefined) {
            firstError = r.reason;
          }
        } else {
          cache.set(r.value.key, r.value.value);
        }
      });
      publishCache(firstError);
    })();

    return () => {
      cancelled = true;
    };
  }, [neededCatalogItemIdsKey, fetchGet]);

  const getItem = React.useCallback(
    (catalog: string, item: string) => catalogItemsByKey.get(catalogItemCacheKey({ catalog, item })),
    [catalogItemsByKey],
  );

  return { getItem, isLoading, error };
};
