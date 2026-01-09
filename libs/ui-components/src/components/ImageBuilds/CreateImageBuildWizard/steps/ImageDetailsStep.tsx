import * as React from 'react';
import { Grid } from '@patternfly/react-core';
import { FormikErrors } from 'formik';
import { ImageBuildFormValues } from '../types';
import { useTranslation } from '../../../../hooks/useTranslation';

export const imageDetailsStepId = 'image-details';

export const isImageDetailsStepValid = (errors: FormikErrors<ImageBuildFormValues>) => {
  return !errors.name && !errors.sourceRepository && !errors.sourceImageName && !errors.sourceImageTag;
};

const ImageDetailsStep = () => {
  const { t } = useTranslation();

  return (
    <Grid lg={5} span={8}>
      <div>{t('TBD - Image details step')}</div>
    </Grid>
  );
};

export default ImageDetailsStep;
