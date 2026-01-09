import * as React from 'react';
import { Grid } from '@patternfly/react-core';
import { FormikErrors } from 'formik';
import { ImageBuildFormValues } from '../types';
import { useTranslation } from '../../../../hooks/useTranslation';

export const imageOutputStepId = 'image-output';

export const isImageOutputStepValid = (errors: FormikErrors<ImageBuildFormValues>) => {
  return !errors.destinationRepository && !errors.destinationImageName && !errors.destinationTag;
};

const ImageOutputStep = () => {
  const { t } = useTranslation();

  return (
    <Grid lg={5} span={8}>
      <div>{t('TBD - Image output step')}</div>
    </Grid>
  );
};

export default ImageOutputStep;
