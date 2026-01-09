import { TFunction } from 'i18next';
import * as Yup from 'yup';
import { API_VERSION } from '../../../constants';
import { validKubernetesDnsSubdomain } from '../../form/validations';
import { ImageBuildFormValues } from './types';
import { ImagePipelineRequest } from '@flightctl/types/imagebuilder';

export const getValidationSchema = (t: TFunction) => {
  return Yup.object<ImageBuildFormValues>({
    name: validKubernetesDnsSubdomain(t, { isRequired: true }),
    sourceRepository: Yup.string().required(t('Source repository is required')),
    sourceImageName: Yup.string().required(t('Source image name is required')),
    sourceImageTag: Yup.string().required(t('Source image tag is required')),
    destinationRepository: Yup.string().required(t('Destination repository is required')),
    destinationImageName: Yup.string().required(t('Destination image name is required')),
    destinationTag: Yup.string().required(t('Destination tag is required')),
    bindingType: Yup.string().oneOf(['early', 'late']).required(),
    certName: Yup.string().when('bindingType', {
      is: 'early',
      then: (schema) => schema.required(t('Certificate name is required for early binding')),
      otherwise: (schema) => schema.notRequired(),
    }),
  });
};

export const getInitialValues = (): ImageBuildFormValues => {
  return {
    name: '',
    sourceRepository: '',
    sourceImageName: '',
    sourceImageTag: '',
    destinationRepository: '',
    destinationImageName: '',
    destinationTag: '',
    bindingType: 'late',
    certName: undefined,
  };
};

export const getImagePipelineResource = (values: ImageBuildFormValues): ImagePipelineRequest => {
  return {
    imageBuild: {
      apiVersion: API_VERSION,
      kind: 'ImageBuild',
      metadata: {
        name: values.name,
      },
      spec: {
        source: {
          repository: values.sourceRepository,
          imageName: values.sourceImageName,
          imageTag: values.sourceImageTag,
        },
        destination: {
          repository: values.destinationRepository,
          imageName: values.destinationImageName,
          tag: values.destinationTag,
        },
        binding:
          values.bindingType === 'early' && values.certName
            ? {
                type: 'early' as const,
                certName: values.certName,
              }
            : {
                type: 'late' as const,
              },
      },
    },
    imageExports: [],
  };
};
