import { type TFunction } from 'react-i18next';

import { AppType } from '@flightctl/types';
import { type CatalogItemArtifact, CatalogItemArtifactType, CatalogItemType } from '@flightctl/types/alpha';
import type { ArtifactFormValue } from '../components/Catalog/AddCatalogItemWizard/types';

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

type CatalogAppTypes =
  | CatalogItemType.CatalogItemTypeContainer
  | CatalogItemType.CatalogItemTypeQuadlet
  | CatalogItemType.CatalogItemTypeCompose
  | CatalogItemType.CatalogItemTypeHelm
  | CatalogItemType.CatalogItemTypeData;

export const catalogAppTypeOptions = (t: TFunction): Record<CatalogAppTypes, string> => ({
  [CatalogItemType.CatalogItemTypeContainer]: t('Container'),
  [CatalogItemType.CatalogItemTypeQuadlet]: t('Quadlet'),
  [CatalogItemType.CatalogItemTypeCompose]: t('Compose'),
  [CatalogItemType.CatalogItemTypeHelm]: t('Helm'),
  [CatalogItemType.CatalogItemTypeData]: t('Data'),
});

type AllUsableCatalogTypes = CatalogAppTypes | CatalogItemType.CatalogItemTypeOS;

export const usableCatalogTypeOptions = (t: TFunction): Record<AllUsableCatalogTypes, string> => ({
  [CatalogItemType.CatalogItemTypeOS]: t('OS image'),
  [CatalogItemType.CatalogItemTypeContainer]: t('Container'),
  [CatalogItemType.CatalogItemTypeQuadlet]: t('Quadlet'),
  [CatalogItemType.CatalogItemTypeHelm]: t('Helm'),
  [CatalogItemType.CatalogItemTypeCompose]: t('Compose'),
  [CatalogItemType.CatalogItemTypeData]: t('Data'),
});

export const getArtifactLabel = (t: TFunction, artifact: ArtifactFormValue | CatalogItemArtifact) => {
  const { type, name } = artifact;
  if (type === '') {
    return name;
  }
  if (name) {
    return `${name} (${type})`;
  }
  switch (type) {
    case CatalogItemArtifactType.CatalogItemArtifactTypeQcow2:
      return t('QCOW2 (qcow2)');
    case CatalogItemArtifactType.CatalogItemArtifactTypeIso:
      return t('Bare Metal (iso)');
    case CatalogItemArtifactType.CatalogItemArtifactTypeAmi:
      return t('Amazon Web Services (ami)');
    case CatalogItemArtifactType.CatalogItemArtifactTypeAnacondaIso:
      return t('Anaconda Installer (anaconda-iso)');
    case CatalogItemArtifactType.CatalogItemArtifactTypeGce:
      return t('Google Cloud (gce)');
    case CatalogItemArtifactType.CatalogItemArtifactTypeRaw:
      return t('KVM/custom cloud import (raw)');
    case CatalogItemArtifactType.CatalogItemArtifactTypeVhd:
      return t('Microsoft Hyper-V (vhd)');
    case CatalogItemArtifactType.CatalogItemArtifactTypeVmdk:
      return t('VMware vSphere (vmdk)');
    case CatalogItemArtifactType.CatalogItemArtifactTypeContainer:
      return t('Cloud native (container)');
    case CatalogItemArtifactType.CatalogItemArtifactTypeQcow2DiskContainer:
      return t('OpenShift Virtualization (qcow2-disk-container)');
    default: {
      return t('Unknown ({{ type }})', { type });
    }
  }
};
