import * as React from 'react';
import { ApplicationProviderSpec, CatalogItemRefSpec, DeviceSpec } from '@flightctl/types';
import { CatalogItem } from '@flightctl/types/alpha';

import { getAppCatalogItemRef } from '../../utils/catalog';
import { useFetch } from '../../hooks/useFetch';

type InstalledAppCatalogItem = {
  item: CatalogItem;
  name: string;
  channel: string;
  version: string;
};

type AppRef = {
  catalogItemRef: CatalogItemRefSpec;
  name: string;
};

type CatalogItemId = { catalog: string; item: string };

const getAppCatalogRefs = (spec: DeviceSpec | undefined): AppRef[] => {
  const fromRefs: AppRef[] = [];

  (spec?.applications || []).forEach((app: ApplicationProviderSpec) => {
    const ref = getAppCatalogItemRef(app);
    if (ref && app.name) {
      fromRefs.push({
        name: app.name,
        catalogItemRef: ref,
      });
    }
  });

  return fromRefs;
};

const getCatalogItemCacheKey = (id: CatalogItemId) => `${id.catalog}\0${id.item}`;

/** Unique catalog/item ids needed for the current app refs (channel/version ignored). */
const getNeededCatalogItemIdsKey = (refs: AppRef[]): string => {
  const byKey = new Map<string, CatalogItemId>();
  refs.forEach((a) => {
    const id = { catalog: a.catalogItemRef.catalog, item: a.catalogItemRef.item };
    byKey.set(getCatalogItemCacheKey(id), id);
  });
  return JSON.stringify(
    [...byKey.values()].sort((a, b) => a.catalog.localeCompare(b.catalog) || a.item.localeCompare(b.item)),
  );
};

/**
 * Resolves installed application catalog items from a device spec.
 * Caches by catalog/item and only fetches ids that are missing, so device-spec
 * polling and channel/version-only changes do not re-fetch.
 */
export const useInstalledAppCatalogItems = (spec: DeviceSpec | undefined): [InstalledAppCatalogItem[], boolean] => {
  const { get } = useFetch();
  const [catalogItemsByKey, setCatalogItemsByKey] = React.useState<Map<string, CatalogItem>>(() => new Map());
  const [loading, setLoading] = React.useState(true);
  const catalogItemsCacheRef = React.useRef<Map<string, CatalogItem>>(new Map());

  const appCatalogRefs = getAppCatalogRefs(spec);
  // Stable across device-spec polls; only changes when a catalog/item id is added or removed.
  const neededCatalogItemIdsKey = getNeededCatalogItemIdsKey(appCatalogRefs);

  React.useEffect(() => {
    let cancelled = false;
    const neededIds: CatalogItemId[] = JSON.parse(neededCatalogItemIdsKey) as CatalogItemId[];
    const neededKeys = new Set(neededIds.map(getCatalogItemCacheKey));
    const cache = catalogItemsCacheRef.current;

    for (const key of [...cache.keys()]) {
      if (!neededKeys.has(key)) {
        cache.delete(key);
      }
    }

    const missingIds = neededIds.filter((id) => !cache.has(getCatalogItemCacheKey(id)));

    const publishCache = () => {
      setCatalogItemsByKey(new Map(cache));
      setLoading(false);
    };

    if (missingIds.length === 0) {
      publishCache();
      return;
    }

    (async () => {
      const results = await Promise.allSettled(
        missingIds.map((id) =>
          get<CatalogItem>(`catalogs/${id.catalog}/items/${id.item}`).then((value) => ({
            key: getCatalogItemCacheKey(id),
            value,
          })),
        ),
      );
      if (cancelled) {
        return;
      }

      results.forEach((r, idx) => {
        if (r.status === 'rejected') {
          // eslint-disable-next-line no-console
          console.warn(`Failed to fetch catalog item ${missingIds[idx].catalog}/${missingIds[idx].item}`);
        } else {
          cache.set(r.value.key, r.value.value);
        }
      });
      publishCache();
    })();

    return () => {
      cancelled = true;
    };
  }, [neededCatalogItemIdsKey, get]);

  const appItems: InstalledAppCatalogItem[] = [];
  appCatalogRefs.forEach((app) => {
    const item = catalogItemsByKey.get(
      getCatalogItemCacheKey({ catalog: app.catalogItemRef.catalog, item: app.catalogItemRef.item }),
    );
    if (item) {
      appItems.push({
        item,
        name: app.name,
        channel: app.catalogItemRef.channel || '',
        version: app.catalogItemRef.version,
      });
    }
  });

  return [appItems, loading];
};
