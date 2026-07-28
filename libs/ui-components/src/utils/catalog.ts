import {
  AppType,
  ApplicationProviderSpec,
  CatalogItemRefSpec,
  ContainerApplication,
  DeviceSpec,
  PatchRequest,
} from '@flightctl/types';
import {
  CatalogItem,
  CatalogItemArtifact,
  CatalogItemArtifactType,
  CatalogItemCategory,
  CatalogItemType,
  CatalogItemVersion,
} from '@flightctl/types/alpha';
import { TFunction } from 'i18next';
import semver from 'semver';

import {
  APP_VOLUME_CATALOG_LABEL_KEY,
  APP_VOLUME_CHANNEL_LABEL_KEY,
  APP_VOLUME_ITEM_LABEL_KEY,
  getAppVolumeName,
} from '../components/Catalog/const';
import { AssetSelection } from '../components/DynamicForm/DynamicForm';
import appIcon from '../../assets/application.svg';
import osIcon from '../../assets/os.svg';
import { fromAPILabel } from './labels';
import { getLabelPatches } from './patch';
import { ArtifactFormValue } from '../components/Catalog/AddCatalogItemWizard/types';

export type CatalogItemId = { catalog: string; item: string };

export type ResolvedCatalogRef = {
  item: CatalogItem;
  displayName: string;
  version: CatalogItemVersion | undefined;
  channel: string;
  imageUri?: string;
};

export const getAppCatalogItemRef = (app: ApplicationProviderSpec): CatalogItemRefSpec | undefined =>
  'catalogItemRef' in app ? app.catalogItemRef : undefined;

export const catalogItemCacheKey = (id: CatalogItemId): string => `${id.catalog}\0${id.item}`;

export const formatCatalogItemRef = (ref: CatalogItemRefSpec): string => `${ref.catalog}/${ref.item}:${ref.version}`;

export const toCatalogItemId = (ref: Pick<CatalogItemRefSpec, 'catalog' | 'item'>): CatalogItemId => ({
  catalog: ref.catalog,
  item: ref.item,
});

export const extractCatalogItemIdsFromSpec = (spec: DeviceSpec | undefined): CatalogItemId[] => {
  const byKey = new Map<string, CatalogItemId>();
  if (spec?.os?.catalogItemRef) {
    const id = toCatalogItemId(spec.os.catalogItemRef);
    byKey.set(catalogItemCacheKey(id), id);
  }
  (spec?.applications || []).forEach((app) => {
    const ref = getAppCatalogItemRef(app);
    if (ref) {
      const id = toCatalogItemId(ref);
      byKey.set(catalogItemCacheKey(id), id);
    }
  });
  return [...byKey.values()];
};

export const getCurrentVersion = (
  catalogItem: CatalogItem,
  version: string | undefined,
  catalogRef: CatalogItemRefSpec | undefined,
) => {
  const matchingVersion = version || catalogRef?.version;
  return catalogItem.spec.versions.find((v) => v.version === matchingVersion);
};

export const buildCatalogItemRef = ({
  catalogItem,
  catalogItemVersion,
  channel,
}: {
  catalogItem: CatalogItem;
  catalogItemVersion: CatalogItemVersion;
  channel: string;
}): CatalogItemRefSpec => {
  const ref: CatalogItemRefSpec = {
    catalog: catalogItem.metadata.catalog,
    item: catalogItem.metadata.name || '',
    version: catalogItemVersion.version,
  };
  if (channel) {
    ref.channel = channel;
  }
  return ref;
};

const tagRegex = /^[\w][\w.-]{0,127}$/;

export const getFullArtifactURI = (artifact: CatalogItemArtifact, version: CatalogItemVersion) => {
  const versionRef = version.references[artifact.type];
  if (!versionRef) {
    return undefined;
  }

  // tag, nor digest can contain '/'
  if (versionRef.includes('/')) {
    return versionRef;
  }

  if (tagRegex.test(versionRef)) {
    return `${artifact.uri}:${versionRef}`;
  }

  return `${artifact.uri}@${versionRef}`;
};

export const getFullContainerURI = (artifacts: CatalogItemArtifact[], version: CatalogItemVersion) => {
  const containerArtifact = artifacts.find((a) => a.type === CatalogItemArtifactType.CatalogItemArtifactTypeContainer);
  if (!containerArtifact) {
    return undefined;
  }

  return getFullArtifactURI(containerArtifact, version);
};

export const resolveCatalogRef = (item: CatalogItem, ref: CatalogItemRefSpec): ResolvedCatalogRef => {
  const version = getCurrentVersion(item, ref.version, ref);
  const displayName = item.spec.displayName || item.metadata.name || ref.item;
  const imageUri = version ? getFullContainerURI(item.spec.artifacts, version) : undefined;
  return {
    item,
    displayName,
    version,
    channel: ref.channel || '',
    imageUri,
  };
};

export const getCatalogItemBadge = (itemType: CatalogItemType | undefined, t: TFunction) => {
  switch (itemType) {
    case CatalogItemType.CatalogItemTypeCompose: {
      return t('Compose');
    }
    case CatalogItemType.CatalogItemTypeContainer: {
      return t('Container');
    }
    case CatalogItemType.CatalogItemTypeData: {
      return t('Data');
    }
    case CatalogItemType.CatalogItemTypeHelm: {
      return t('Helm');
    }
    case CatalogItemType.CatalogItemTypeQuadlet: {
      return t('Quadlet');
    }
    case CatalogItemType.CatalogItemTypeOS: {
      return t('OS image');
    }
    default: {
      return t('Unknown');
    }
  }
};

export const getRemoveOsPatches = ({ specPath }: { specPath: string }) => {
  const allPatches: PatchRequest = [];
  allPatches.push({
    path: `${specPath}spec/os`,
    op: 'remove',
  });
  return allPatches;
};

/** Clears Data-catalog volume provenance labels for an app (volume refs are still label-based). */
const removeAppVolumeLabels = (currentLabels: Record<string, string>, appName: string) => {
  const apiLabels = fromAPILabel(currentLabels);
  return apiLabels.filter(({ key }) => {
    return !(
      key.startsWith(`${appName}.`) &&
      (key.endsWith(`.${APP_VOLUME_ITEM_LABEL_KEY}`) ||
        key.endsWith(`.${APP_VOLUME_CATALOG_LABEL_KEY}`) ||
        key.endsWith(`.${APP_VOLUME_CHANNEL_LABEL_KEY}`))
    );
  });
};

export const getRemoveAppPatches = ({
  appName,
  specPath,
  currentLabels,
  currentApps,
}: {
  appName: string;
  specPath: string;
  currentLabels: Record<string, string> | undefined;
  currentApps: ApplicationProviderSpec[] | undefined;
}) => {
  const allPatches: PatchRequest = [];
  const appIndex = currentApps?.findIndex((a) => a.name === appName);

  if (currentApps?.length && appIndex !== -1) {
    allPatches.push({
      path: `${specPath}spec/applications/${appIndex}`,
      op: 'remove',
    });
  }

  if (currentLabels) {
    const newLabels = removeAppVolumeLabels(currentLabels, appName);
    const labelPatches = getLabelPatches('/metadata/labels', currentLabels || {}, newLabels);

    if (labelPatches.length) {
      allPatches.push(...labelPatches);
    }
  }

  return allPatches;
};

const getAppType = (catalogItem: CatalogItem): AppType | undefined => {
  switch (catalogItem.spec.type) {
    case CatalogItemType.CatalogItemTypeCompose:
      return AppType.AppTypeCompose;
    case CatalogItemType.CatalogItemTypeQuadlet:
      return AppType.AppTypeQuadlet;
    case CatalogItemType.CatalogItemTypeHelm:
      return AppType.AppTypeHelm;
    case CatalogItemType.CatalogItemTypeContainer:
      return AppType.AppTypeContainer;
    default:
      return undefined;
  }
};

export const getAppPatches = ({
  appName,
  currentApps,
  currentLabels,
  catalogItem,
  catalogItemVersion,
  channel,
  formValues,
  specPath,
  selectedAssets,
}: {
  appName: string;
  currentApps: ApplicationProviderSpec[] | undefined;
  currentLabels: Record<string, string> | undefined;
  catalogItem: CatalogItem;
  catalogItemVersion: CatalogItemVersion;
  channel: string;
  formValues: Record<string, unknown> | undefined;
  specPath: string;
  selectedAssets: AssetSelection[];
}) => {
  const appType = getAppType(catalogItem);
  if (!appType) {
    throw new Error('Unknown application type');
  }

  const appSpec: ApplicationProviderSpec = {
    ...formValues,
    name: appName,
    appType,
    catalogItemRef: buildCatalogItemRef({ catalogItem, catalogItemVersion, channel }),
    // Explicitly clear image to ensure only one of image or catalogItemRef is set
    image: undefined,
  };

  const existingAppIndex = currentApps?.findIndex((app) => app.name === appSpec.name);

  const allPatches: PatchRequest = [];
  if (!currentApps) {
    allPatches.push({
      path: `${specPath}spec/applications`,
      op: 'add',
      value: [appSpec],
    });
  } else if (existingAppIndex === -1) {
    allPatches.push({
      path: `${specPath}spec/applications/-`,
      op: 'add',
      value: appSpec,
    });
  } else {
    allPatches.push({
      path: `${specPath}spec/applications/${existingAppIndex}`,
      op: 'replace',
      value: appSpec,
    });
  }

  const volumes = appType === AppType.AppTypeContainer ? (appSpec as ContainerApplication).volumes : undefined;
  const volumeLabels = selectedAssets.reduce((acc, { assetChannel, assetItemName, assetCatalog, volumeIndex }) => {
    if (!volumes || volumes.length <= volumeIndex) {
      return acc;
    }
    const volumeName = volumes[volumeIndex].name;

    return {
      ...acc,
      [`${getAppVolumeName(appSpec.name, volumeName, APP_VOLUME_ITEM_LABEL_KEY)}`]: assetItemName,
      [`${getAppVolumeName(appSpec.name, volumeName, APP_VOLUME_CHANNEL_LABEL_KEY)}`]: assetChannel,
      [`${getAppVolumeName(appSpec.name, volumeName, APP_VOLUME_CATALOG_LABEL_KEY)}`]: assetCatalog,
    };
  }, {});

  // Volume catalog provenance remains label-based until backend supports volume catalogItemRef
  const newLabels = removeAppVolumeLabels(currentLabels || {}, appName);
  newLabels.push(...fromAPILabel(volumeLabels));

  const labelPatches = getLabelPatches('/metadata/labels', currentLabels || {}, newLabels);

  if (labelPatches.length) {
    allPatches.push(...labelPatches);
  }

  return allPatches;
};

export const getUpdates = (catalogItem: CatalogItem, currentChannel: string, currentVersion: string) => {
  const updateVersions = catalogItem.spec.versions.filter((version) => {
    if (!version.channels.includes(currentChannel)) return false;

    // Check if current version can upgrade to this version via:
    // 1. replaces - direct replacement (now a single string)
    if (version.replaces === currentVersion) return true;

    // 2. skips - array of specific versions that can be skipped
    if (version.skips?.includes(currentVersion)) return true;

    // 3. skipRange - semver range check
    if (version.skipRange && semver.satisfies(currentVersion, version.skipRange, { includePrerelease: true })) {
      return true;
    }

    return false;
  });

  // only versions which have container
  return updateVersions.filter((v) => !!getFullContainerURI(catalogItem.spec.artifacts, v));
};

export const getCatalogItemIcon = (catalogItem: CatalogItem): string =>
  catalogItem.spec.icon ||
  ((catalogItem.spec.category === CatalogItemCategory.CatalogItemCategorySystem ? osIcon : appIcon) as string);

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
