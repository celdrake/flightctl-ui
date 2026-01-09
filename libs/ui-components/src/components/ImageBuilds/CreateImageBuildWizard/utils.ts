import { TFunction } from 'i18next';
import * as Yup from 'yup';

import {
  BindingType,
  ImageBuildBinding,
  ImageBuildDestination,
  ImageBuildSource,
  ImagePipelineRequest,
  ResourceKind,
} from '@flightctl/types/imagebuilder';
import { API_VERSION } from '../../../constants';
import { validKubernetesDnsSubdomain } from '../../form/validations';
import { ImageBuildFormValues } from './types';

export const getValidationSchema = (t: TFunction) => {
  return Yup.object<ImageBuildFormValues>({
    name: validKubernetesDnsSubdomain(t, { isRequired: true }),
    source: Yup.object<ImageBuildSource>({
      repository: Yup.string().required(t('Souorce registry is required')),
      imageName: Yup.string().required(t('Image name is required')),
      imageTag: Yup.string().required(t('Image tag is required')),
    }).required(t('Source is required')),
    destination: Yup.object<ImageBuildDestination>().required(t('Destination is required')),
    binding: Yup.object<ImageBuildBinding>().required(t('Binding is required')),
  });
};

export const getInitialValues = (): ImageBuildFormValues => {
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
    },
    exportFormats: [],
  };
};

const generateBuildName = () => `image-build-${Date.now()}`;

export const getImagePipelineResource = (values: ImageBuildFormValues): ImagePipelineRequest => {
  const name = generateBuildName();
  return {
    imageBuild: {
      apiVersion: API_VERSION,
      kind: ResourceKind.IMAGE_BUILD,
      metadata: {
        name,
      },
      spec: {
        source: values.source,
        destination: values.destination,
        binding: values.binding,
      },
    },
    imageExports: [],
  };
};
