import * as React from 'react';
import { Grid } from '@patternfly/react-core';
import { FormikErrors } from 'formik';

import { Repository } from '@flightctl/types';
import { ImageBuildFormValues } from '../types';
import { useTranslation } from '../../../../hooks/useTranslation';

export const outputImageStepId = 'output-image';

export const isOutputImageStepValid = (errors: FormikErrors<ImageBuildFormValues>) => {
  const { destination } = errors;
  return !errors.name && (!destination || (!destination.repository && !destination.imageName && !destination.tag));
};

type ImageOutputStepProps = {
  repositories: Repository[];
  hasLoaded: boolean;
};

const ImageOutputStep = ({ repositories, hasLoaded }: ImageOutputStepProps) => {
  const { t } = useTranslation();

  return (
    <Grid lg={5} span={8}>
      <div>{t('TBD - Image output step')}</div>
    </Grid>
  );
};

export default ImageOutputStep;
