import * as React from 'react';
import { useTranslation } from '../../../hooks/useTranslation';
import { Button, WizardFooterWrapper, useWizardContext } from '@patternfly/react-core';
import { useFormikContext } from 'formik';
import { ImageBuildFormValues } from './types';
import { useNavigate } from '../../../hooks/useNavigate';
import { reviewStepId } from './steps/ReviewStep';
import { imageDetailsStepId, isImageDetailsStepValid } from './steps/ImageDetailsStep';
import { imageOutputStepId, isImageOutputStepValid } from './steps/ImageOutputStep';
import { isRegistrationStepValid, registrationStepId } from './steps/RegistrationStep';

const CreateImageBuildWizardFooter = () => {
  const { t } = useTranslation();
  const { goToNextStep, goToPrevStep, activeStep } = useWizardContext();
  const { submitForm, isSubmitting, errors } = useFormikContext<ImageBuildFormValues>();
  const navigate = useNavigate();
  const buttonRef = React.useRef<HTMLButtonElement>();

  const isReviewStep = activeStep.id === reviewStepId;
  let isStepValid = true;
  if (activeStep.id === imageDetailsStepId) {
    isStepValid = isImageDetailsStepValid(errors);
  } else if (activeStep.id === imageOutputStepId) {
    isStepValid = isImageOutputStepValid(errors);
  } else if (activeStep.id === registrationStepId) {
    isStepValid = isRegistrationStepValid(errors);
  }

  // CELIA-WIP: Remove this once the validation is implemented
  if (!isStepValid) {
    isStepValid = true;
  }

  const onMoveNext = () => {
    goToNextStep();
    // Blur the button, otherwise it keeps the focus from the previous click
    buttonRef.current?.blur();
  };

  let primaryBtn: React.ReactNode;

  if (isReviewStep) {
    primaryBtn = (
      <Button variant="primary" onClick={submitForm} isDisabled={isSubmitting} isLoading={isSubmitting}>
        {t('Build image')}
      </Button>
    );
  } else {
    primaryBtn = (
      <Button variant="primary" onClick={onMoveNext} isDisabled={!isStepValid} ref={buttonRef}>
        {t('Next')}
      </Button>
    );
  }

  return (
    <WizardFooterWrapper>
      {primaryBtn}
      {activeStep.id !== imageDetailsStepId && (
        <Button variant="secondary" onClick={goToPrevStep} isDisabled={isSubmitting}>
          {t('Back')}
        </Button>
      )}
      <Button variant="link" onClick={() => navigate(-1)} isDisabled={isSubmitting}>
        {t('Cancel')}
      </Button>
    </WizardFooterWrapper>
  );
};

export default CreateImageBuildWizardFooter;
