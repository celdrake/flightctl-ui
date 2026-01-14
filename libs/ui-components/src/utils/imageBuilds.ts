import { TFunction } from 'react-i18next';
import {
  ExportFormatType,
  ImageBuild,
  ImageBuildConditionReason,
  ImageBuildConditionType,
  ImageBuildDestination,
  ImageBuildSource,
} from '@flightctl/types/imagebuilder';
import { Repository } from '@flightctl/types';
import { isOciRepoSpec } from '../components/Repository/CreateRepository/utils';

// CELIA-WIP: DO we need to show the repository URL?
export const getImageBuildSourceImage = (imageBuild: ImageBuild | undefined) => {
  if (!imageBuild) {
    return '-';
  }
  const { source } = imageBuild.spec;
  return `${source.imageName}:${source.imageTag}`;
};

export const getImageBuildDestinationImage = (imageBuild: ImageBuild | undefined) => {
  if (!imageBuild) {
    return '-';
  }
  const { destination } = imageBuild.spec;
  return `${destination.imageName}:${destination.tag}`;
};

export const getExportFormatDescription = (t: TFunction, format: ExportFormatType) => {
  switch (format) {
    case ExportFormatType.ExportFormatTypeVMDK:
      return t('For VMware vSphere and enterprise hypervisors');
    case ExportFormatType.ExportFormatTypeQCOW2:
      return t('For OpenStack and KVM-based cloud environments');
    case ExportFormatType.ExportFormatTypeISO:
      return t('Bootable image for physical hardware installation');
  }
};

export const getExportFormatLabel = (format: ExportFormatType) => `.${format.toUpperCase()}`;

export const getImageUrl = (url: string): string => {
  if (!url || /^https?:\/\//i.test(url)) {
    return url;
  }
  return `https://${url}`;
};

export const getRegistryUrl = (registries: Repository[], registryName: string): string | null => {
  const repo = registries.find((r) => r.metadata.name === registryName);
  if (!repo || !isOciRepoSpec(repo.spec)) {
    return null;
  }
  return repo.spec.registry;
};

export const getImageReference = (
  imageTarget: ImageBuildSource | ImageBuildDestination,
  repositories: Repository[],
) => {
  if (!imageTarget) {
    return null;
  }

  const registryUrl = getRegistryUrl(repositories, imageTarget.repository);
  if (!registryUrl) {
    return null;
  }
  // CELIA-WIP: Asked for the API to unify these two fields, but it's not yet implemented.
  let tag: string;
  if ('imageTag' in imageTarget) {
    tag = imageTarget.imageTag;
  } else {
    tag = imageTarget.tag;
  }
  if (!(tag && imageTarget.imageName)) {
    return null;
  }
  return `${registryUrl}/${imageTarget.imageName}:${tag}`;
};

export const isImageBuildFailed = (imageBuild: ImageBuild): boolean => {
  const readyCondition = imageBuild.status?.conditions?.find(
    (c) => c.type === ImageBuildConditionType.ImageBuildConditionTypeReady,
  );
  return readyCondition?.reason === ImageBuildConditionReason.ImageBuildConditionReasonFailed;
};
