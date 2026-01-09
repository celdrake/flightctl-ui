import * as React from 'react';
import { Grid } from '@patternfly/react-core';
import { FormikErrors } from 'formik';

import { BindingType, EarlyBinding } from '@flightctl/types/imagebuilder';
import { ImageBuildFormValues } from '../types';
import { useTranslation } from '../../../../hooks/useTranslation';

export const registrationStepId = 'registration';

export const isRegistrationStepValid = (errors: FormikErrors<ImageBuildFormValues>) => {
  const { binding } = errors;
  if (!binding) {
    return true;
  }
  if (binding.type === BindingType.BindingTypeEarly) {
    const earlyBinding = binding as EarlyBinding;
    return !earlyBinding.certName;
  }
  return true;
};

const RegistrationStep = () => {
  const { t } = useTranslation();

  return (
    <Grid lg={5} span={8}>
      <div>{t('TBD - Registration step')}</div>
    </Grid>
  );
};

export default RegistrationStep;
