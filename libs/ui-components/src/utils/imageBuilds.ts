import { TFunction } from 'react-i18next';
import { ExportFormatType, ImageBuild } from '@flightctl/types/imagebuilder';

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

export const getExportFormatTitle = (t: TFunction, format: ExportFormatType) => {
  switch (format) {
    case ExportFormatType.ExportFormatTypeVMDK:
      return t('Virtualization');
    case ExportFormatType.ExportFormatTypeQCOW2:
      return t('Openstack/KVM');
    case ExportFormatType.ExportFormatTypeISO:
      return t('Metal installer');
    default:
      return t('Unknown format ({format})', { format });
  }
};

export const getExportFormatLabel = (t: TFunction, format: ExportFormatType) => {
  switch (format) {
    case ExportFormatType.ExportFormatTypeVMDK:
      return t('Virtualization (VMDK)');
    case ExportFormatType.ExportFormatTypeQCOW2:
      return t('Openstack/KVM (QCOW2)');
    case ExportFormatType.ExportFormatTypeISO:
      return t('Bare metal installer (ISO)');
    default:
      return t('Unknown format ({format})', { format });
  }
};
