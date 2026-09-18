import { type TFunction } from 'react-i18next';

import { AppType } from '@flightctl/types';
import { CatalogItemType } from '@flightctl/types/alpha';

export const appTypeOptions = (t: TFunction): Record<AppType, string> => ({
  [AppType.AppTypeContainer]: t('Single Container application'),
  [AppType.AppTypeQuadlet]: t('Quadlet application'),
  [AppType.AppTypeHelm]: t('Helm application'),
  [AppType.AppTypeCompose]: t('Compose application'),
  [AppType.AppTypeVm]: t('Virtual machine (KVM)'),
});

export const getAppTypeLabel = (appType: AppType, t: TFunction): string => {
  const labels: Record<AppType, string> = {
    [AppType.AppTypeContainer]: t('Single Container'),
    [AppType.AppTypeQuadlet]: t('Quadlet'),
    [AppType.AppTypeCompose]: t('Compose'),
    [AppType.AppTypeHelm]: t('Helm'),
    [AppType.AppTypeVm]: t('VM'),
  };
  return labels[appType] || t('Unknown');
};

type CatalogAppTypes = Exclude<
  CatalogItemType,
  CatalogItemType.CatalogItemTypeOS | CatalogItemType.CatalogItemTypeFirmware | CatalogItemType.CatalogItemTypeDriver
>;

export const catalogAppTypeOptions = (t: TFunction): Record<CatalogAppTypes, string> => ({
  [CatalogItemType.CatalogItemTypeContainer]: t('Container'),
  [CatalogItemType.CatalogItemTypeQuadlet]: t('Quadlet'),
  [CatalogItemType.CatalogItemTypeCompose]: t('Compose'),
  [CatalogItemType.CatalogItemTypeHelm]: t('Helm'),
  [CatalogItemType.CatalogItemTypeData]: t('Data'),
});
