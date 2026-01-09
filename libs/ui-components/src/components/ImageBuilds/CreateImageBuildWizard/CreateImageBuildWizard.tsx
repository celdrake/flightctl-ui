import * as React from 'react';
import {
  Alert,
  Breadcrumb,
  BreadcrumbItem,
  Bullseye,
  PageSection,
  PageSectionVariants,
  Spinner,
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
import SourceImageStep, { sourceImageStepId, isSourceImageStepValid } from './steps/SourceImageStep';
import ImageOutputStep, { outputImageStepId, isOutputImageStepValid } from './steps/OutputImageStep';
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
import { RepoSpecType, RepositoryList } from '@flightctl/types';
import { useFetchPeriodically } from '../../../hooks/useFetchPeriodically';
import { getErrorMessage } from '../../../utils/error';

const orderedIds = [sourceImageStepId, outputImageStepId, registrationStepId, reviewStepId];

const getValidStepIds = (formikErrors: FormikErrors<ImageBuildFormValues>): string[] => {
  const validStepIds: string[] = [];
  if (isSourceImageStepValid(formikErrors)) {
    validStepIds.push(sourceImageStepId);
  }
  if (isOutputImageStepValid(formikErrors)) {
    validStepIds.push(outputImageStepId);
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
  const [repoList, isLoading, repoError] = useFetchPeriodically<RepositoryList>({
    endpoint: 'repositories',
  });

  const httpRepositories = (repoList?.items || []).filter((repo) => repo.spec.type === RepoSpecType.HTTP);

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
          {isLoading ? (
            <Bullseye>
              <Spinner />
            </Bullseye>
          ) : repoError ? (
            <Alert isInline variant="danger" title={t('An error occurred')}>
              {getErrorMessage(repoError)}
            </Alert>
          ) : (
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
                      <WizardStep name={t('Image details')} id={sourceImageStepId}>
                        {(!currentStep || currentStep?.id === sourceImageStepId) && (
                          <SourceImageStep repositories={httpRepositories} hasLoaded={!!repoList} />
                        )}
                      </WizardStep>
                      <WizardStep
                        name={t('Image output')}
                        id={outputImageStepId}
                        isDisabled={isDisabledStep(outputImageStepId, allStepIds)}
                      >
                        {currentStep?.id === outputImageStepId && (
                          <ImageOutputStep repositories={httpRepositories} hasLoaded={!!repoList} />
                        )}
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
                        {currentStep?.id === reviewStepId && (
                          <ReviewStep error={error} repositories={httpRepositories} />
                        )}
                      </WizardStep>
                    </Wizard>
                  </>
                );
              }}
            </Formik>
          )}
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
