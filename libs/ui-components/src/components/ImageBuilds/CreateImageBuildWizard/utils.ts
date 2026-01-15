import { TFunction } from 'i18next';
import * as Yup from 'yup';

import {
  BindingType,
  ExportFormatType,
  ImageBuild,
  ImageBuildDestination,
  ImageBuildSource,
  ImageExport,
  ImageExportConditionReason,
  ImageExportConditionType,
  ResourceKind,
} from '@flightctl/types/imagebuilder';
import { API_VERSION } from '../../../constants';
import { ImageBuildFormValues } from './types';

export const getValidationSchema = (t: TFunction) => {
  return Yup.object<ImageBuildFormValues>({
    source: Yup.object<ImageBuildSource>({
      repository: Yup.string().required(t('Source registry is required')),
      imageName: Yup.string().required(t('Image name is required')),
      imageTag: Yup.string().required(t('Image tag is required')),
    }).required(t('Source is required')),
    destination: Yup.object<ImageBuildDestination>({
      repository: Yup.string().required(t('Source registry is required')),
      imageName: Yup.string().required(t('Image name is required')),
      tag: Yup.string().required(t('Image tag is required')),
    }).required(t('Source is required')),
    bindingType: Yup.string<BindingType>().required(t('Binding type is required')),
  });
};

export const getInitialValues = (imageBuild?: ImageBuild): ImageBuildFormValues => {
  if (imageBuild) {
    return {
      source: imageBuild.spec.source,
      destination: imageBuild.spec.destination,
      bindingType: imageBuild.spec.binding.type as BindingType,
      // We allow the user to choose the export formats, since they're not stored in ImageBuild
      exportFormats: [],
    };
  }

  // Return default values (existing implementation)
  return {
    source: {
      repository: '',
      imageName: '',
      imageTag: '',
    },
    destination: {
      repository: '',
      imageName: '',
      tag: '',
    },
    bindingType: BindingType.BindingTypeLate,
    exportFormats: [],
  };
};

const generateBuildName = () => `imagebuild-${Date.now()}`;
const generateExportName = (imageBuildName: string, format: ExportFormatType) => {
  // Adds a random 6-digit hex suffix to the export name
  const hash = Math.floor(Math.random() * 0x1000000)
    .toString(16)
    .padStart(6, '0');
  return `${imageBuildName}-${format}-${hash}`;
};

export const getImageBuildResource = (values: ImageBuildFormValues): ImageBuild => {
  const name = generateBuildName();
  return {
    apiVersion: API_VERSION,
    kind: ResourceKind.IMAGE_BUILD,
    metadata: {
      name,
    },
    spec: {
      source: values.source,
      destination: values.destination,
      binding: {
        type: values.bindingType,
      },
    },
  };
};

export const getImageExportResource = (
  imageBuildName: string,
  destination: ImageBuildDestination,
  format: ExportFormatType,
): ImageExport => {
  const exportName = generateExportName(imageBuildName, format);

  return {
    apiVersion: API_VERSION,
    kind: ResourceKind.IMAGE_EXPORT,
    metadata: {
      name: exportName,
    },
    spec: {
      source: {
        type: 'imageBuild',
        imageBuildRef: imageBuildName,
      },
      destination,
      format,
    },
  };
};

export const getImageExportResources = (values: ImageBuildFormValues, imageBuildName: string): ImageExport[] => {
  if (!values.exportFormats || values.exportFormats.length === 0) {
    return [];
  }

  return values.exportFormats.map((format) => getImageExportResource(imageBuildName, values.destination, format));
};

export const isImageExportFailed = (imageExport: ImageExport): boolean => {
  const readyCondition = imageExport.status?.conditions?.find(
    (c) => c.type === ImageExportConditionType.ImageExportConditionTypeReady,
  );
  return readyCondition?.reason === ImageExportConditionReason.ImageExportConditionReasonFailed;
};
