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
    source: Yup.object<ImageBuildSource>().required(t('Source is required')),
    destination: Yup.object<ImageBuildDestination>().required(t('Destination is required')),
    binding: Yup.object<ImageBuildBinding>().required(t('Binding is required')),
  });
};

export const getInitialValues = (): ImageBuildFormValues => {
  return {
    name: '',
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
  };
};

export const getImagePipelineResource = (values: ImageBuildFormValues): ImagePipelineRequest => {
  return {
    imageBuild: {
      apiVersion: API_VERSION,
      kind: ResourceKind.IMAGE_BUILD,
      metadata: {
        name: values.name,
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
