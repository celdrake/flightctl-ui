import { CatalogItemType } from '@flightctl/types/alpha';

export const getCatalogRefArtifactLabel = (itemType: CatalogItemType | undefined, t: (key: string) => string) => {
  switch (itemType) {
    case CatalogItemType.CatalogItemTypeOS:
      return t('Container image');
    case CatalogItemType.CatalogItemTypeHelm:
      return t('Chart reference');
    default:
      return t('Image reference');
  }
};
