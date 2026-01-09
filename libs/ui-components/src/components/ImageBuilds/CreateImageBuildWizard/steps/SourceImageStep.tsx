import * as React from 'react';
import { Grid } from '@patternfly/react-core';
import { FormikErrors } from 'formik';

import { ImageBuildFormValues } from '../types';
import { useTranslation } from '../../../../hooks/useTranslation';

export const sourceImageStepId = 'source-image';

export const isSourceImageStepValid = (errors: FormikErrors<ImageBuildFormValues>) => {
  const { source } = errors;
  return !errors.name && (!source || (!source.repository && !source.imageName && !source.imageTag));
};

const SourceImageStep = () => {
  const { t } = useTranslation();

  return (
    <Grid lg={5} span={8}>
      <div>{t('TBD - Source image step')}</div>
    </Grid>
  );
};

export default SourceImageStep;
