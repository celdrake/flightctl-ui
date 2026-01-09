import * as React from 'react';
import {
  Breadcrumb,
  BreadcrumbItem,
  PageSection,
  PageSectionVariants,
  Title,
  Wizard,
  WizardStep,
  WizardStepType,
} from '@patternfly/react-core';
import { Formik, FormikErrors } from 'formik';
import { RESOURCE, VERB } from '../../../types/rbac';
import { useFetch } from '../../../hooks/useFetch';
import { useTranslation } from '../../../hooks/useTranslation';
import { Link, ROUTE, useNavigate } from '../../../hooks/useNavigate';
import ImageDetailsStep, { imageDetailsStepId, isImageDetailsStepValid } from './steps/ImageDetailsStep';
import ImageOutputStep, { imageOutputStepId, isImageOutputStepValid } from './steps/ImageOutputStep';
import RegistrationStep, { isRegistrationStepValid, registrationStepId } from './steps/RegistrationStep';
import ReviewStep, { reviewStepId } from './steps/ReviewStep';
import { getImagePipelineResource, getInitialValues, getValidationSchema } from './utils';
import CreateImageBuildWizardFooter from './CreateImageBuildWizardFooter';
import LeaveFormConfirmation from '../../common/LeaveFormConfirmation';
import ErrorBoundary from '../../common/ErrorBoundary';
import { usePermissionsContext } from '../../common/PermissionsContext';
import PageWithPermissions from '../../common/PageWithPermissions';
import { ImagePipelineRequest } from '@flightctl/types/imagebuilder';
import { ImageBuildFormValues } from './types';

const orderedIds = [imageDetailsStepId, imageOutputStepId, registrationStepId, reviewStepId];

const getValidStepIds = (formikErrors: FormikErrors<ImageBuildFormValues>): string[] => {
  const validStepIds: string[] = [];
  if (isImageDetailsStepValid(formikErrors)) {
    validStepIds.push(imageDetailsStepId);
  }
  if (isImageOutputStepValid(formikErrors)) {
    validStepIds.push(imageOutputStepId);
  }
  if (isRegistrationStepValid(formikErrors)) {
    validStepIds.push(registrationStepId);
  }
  // Review step is always valid. We disable it if some of the previous steps are invalid
  if (validStepIds.length === orderedIds.length - 1) {
    validStepIds.push(reviewStepId);
  }
  return validStepIds;
};

const isDisabledStep = (stepId: string | undefined, validStepIds: string[]) => {
  if (!stepId) {
    return true;
  }

  const stepIdx = orderedIds.findIndex((stepOrderId) => stepOrderId === stepId);

  return orderedIds.some((orderedId, orderedStepIdx) => {
    return orderedStepIdx < stepIdx && !validStepIds.includes(orderedId);
  });
};

const CreateImageBuildWizard = () => {
  const { t } = useTranslation();
  const { post } = useFetch();
  const [error, setError] = React.useState<unknown>();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = React.useState<WizardStepType>();

  return (
    <>
      <PageSection variant="light" type="breadcrumb">
        <Breadcrumb>
          <BreadcrumbItem>
            <Link to={ROUTE.IMAGE_BUILDS}>{t('Image builds')}</Link>
          </BreadcrumbItem>
          <BreadcrumbItem isActive>{t('Build new image')}</BreadcrumbItem>
        </Breadcrumb>
      </PageSection>
      <PageSection variant={PageSectionVariants.light}>
        <Title headingLevel="h1" size="3xl">
          {t('Build new image')}
        </Title>
      </PageSection>
      <PageSection variant={PageSectionVariants.light} type="wizard">
        <ErrorBoundary>
          <Formik<ImageBuildFormValues>
            initialValues={getInitialValues()}
            validationSchema={getValidationSchema(t)}
            validateOnMount
            onSubmit={async (values) => {
              setError(undefined);
              try {
                const imagePipelineRequest = getImagePipelineResource(values);
                await post<ImagePipelineRequest>('imagepipelines', imagePipelineRequest);
                navigate({ route: ROUTE.IMAGE_BUILD_DETAILS, postfix: values.name });
              } catch (e) {
                setError(e);
              }
            }}
          >
            {({ errors: formikErrors }) => {
              const validStepIds = getValidStepIds(formikErrors);

              // CELIA-WIP: Remove "allStepIds" once the validation is implemented
              // Temporarily allow all steps to be enabled for navigation
              const allStepIds = formikErrors ? orderedIds : validStepIds;

              return (
                <>
                  <LeaveFormConfirmation />
                  <Wizard
                    footer={<CreateImageBuildWizardFooter />}
                    onStepChange={(_, step) => {
                      if (error) {
                        setError(undefined);
                      }
                      setCurrentStep(step);
                    }}
                  >
                    <WizardStep name={t('Image details')} id={imageDetailsStepId}>
                      {(!currentStep || currentStep?.id === imageDetailsStepId) && <ImageDetailsStep />}
                    </WizardStep>
                    <WizardStep
                      name={t('Image output')}
                      id={imageOutputStepId}
                      isDisabled={isDisabledStep(imageOutputStepId, allStepIds)}
                    >
                      {currentStep?.id === imageOutputStepId && <ImageOutputStep />}
                    </WizardStep>
                    <WizardStep
                      name={t('Registration')}
                      id={registrationStepId}
                      isDisabled={isDisabledStep(registrationStepId, allStepIds)}
                    >
                      {currentStep?.id === registrationStepId && <RegistrationStep />}
                    </WizardStep>
                    <WizardStep
                      name={t('Review')}
                      id={reviewStepId}
                      isDisabled={isDisabledStep(reviewStepId, allStepIds)}
                    >
                      {currentStep?.id === reviewStepId && <ReviewStep error={error} />}
                    </WizardStep>
                  </Wizard>
                </>
              );
            }}
          </Formik>
        </ErrorBoundary>
      </PageSection>
    </>
  );
};

const createImageBuildWizardPermissions = [{ kind: RESOURCE.IMAGE_BUILD, verb: VERB.CREATE }];

const CreateImageBuildWizardWithPermissions = () => {
  const { checkPermissions, loading } = usePermissionsContext();
  const [createAllowed] = checkPermissions(createImageBuildWizardPermissions);
  return (
    <PageWithPermissions allowed={createAllowed} loading={loading}>
      <CreateImageBuildWizard />
    </PageWithPermissions>
  );
};

export default CreateImageBuildWizardWithPermissions;
