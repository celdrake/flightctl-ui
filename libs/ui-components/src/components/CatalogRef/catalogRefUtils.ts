import type { CatalogItem } from '@flightctl/types/alpha';

// CELIA-WIP: Deploy-flow vs inheritance label heuristic — confirm against backend semantics.
export const catalogItemHasConfigSchema = (catalogItem: CatalogItem): boolean => {
  if (catalogItem.spec.defaults?.configSchema) {
    return true;
  }
  return catalogItem.spec.versions.some((version) => Boolean(version.configSchema));
};
