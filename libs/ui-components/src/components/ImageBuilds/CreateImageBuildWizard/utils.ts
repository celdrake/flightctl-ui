import { TFunction } from 'i18next';
import * as Yup from 'yup';

import {
  BindingType,
  ImageBuild,
  ImageBuildBinding,
  ImageBuildDestination,
  ImageBuildSource,
  ResourceKind,
  ImageExport,
  ImageExportSpec,
  ImageBuildRefSource,
  ImageExportDestination,
  ExportFormatType,
  EarlyBinding,
} from '@flightctl/types/imagebuilder';
import { API_VERSION } from '../../../constants';
import { ImageBuildFormValues } from './types';

export const getValidationSchema = (t: TFunction) => {
  return Yup.object<ImageBuildFormValues>({
    source: Yup.object<ImageBuildSource>({
      repository: Yup.string().required(t('Souorce registry is required')),
      imageName: Yup.string().required(t('Image name is required')),
      imageTag: Yup.string().required(t('Image tag is required')),
    }).required(t('Source is required')),
    destination: Yup.object<ImageBuildDestination>().required(t('Destination is required')),
    binding: Yup.object<ImageBuildBinding>().required(t('Binding is required')),
  });
};

export const getInitialValues = (imageBuild?: ImageBuild): ImageBuildFormValues => {
  if (imageBuild) {
    let binding: ImageBuildFormValues['binding'];
    if (imageBuild.spec.binding.type === BindingType.BindingTypeEarly) {
      binding = { type: BindingType.BindingTypeEarly, certName: imageBuild.spec.binding.certName || '' };
    } else {
      binding = { type: BindingType.BindingTypeLate, certName: '' };
    }

    return {
      source: imageBuild.spec.source,
      destination: imageBuild.spec.destination,
      binding,
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
    binding: {
      type: BindingType.BindingTypeLate,
      certName: '',
    },
    exportFormats: [],
  };
};

const generateBuildName = () => `image-build-${Date.now()}`;

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
      binding:
        values.binding.type === BindingType.BindingTypeEarly
          ? {
              type: BindingType.BindingTypeEarly,
              certName: values.binding.certName,
            }
          : {
              type: BindingType.BindingTypeLate,
            },
    },
  };
};

const generateExportName = (imageBuildName: string, format: ExportFormatType) =>
  `${imageBuildName}-export-${format}-${Date.now()}`;

export const getImageExportResources = (values: ImageBuildFormValues, imageBuildName: string): ImageExport[] => {
  if (!values.exportFormats || values.exportFormats.length === 0) {
    return [];
  }

  return values.exportFormats.map((format) => {
    const exportName = generateExportName(imageBuildName, format);
    const source: ImageBuildRefSource = {
      type: 'imageBuild',
      imageBuildRef: imageBuildName,
    };
    const destination: ImageExportDestination = {
      repository: values.destination.repository,
      imageName: values.destination.imageName,
      tag: values.destination.tag,
    };
    const spec: ImageExportSpec = {
      source,
      destination,
      format,
    };

    return {
      apiVersion: API_VERSION,
      kind: ResourceKind.IMAGE_EXPORT,
      metadata: {
        name: exportName,
      },
      spec,
    };
  });
};
