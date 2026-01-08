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

import { RepoSpecType, RepositoryList } from '@flightctl/types';
import { ExportFormatType, ImageBuild } from '@flightctl/types/imagebuilder';
import { RESOURCE, VERB } from '../../../types/rbac';
import { useTranslation } from '../../../hooks/useTranslation';
import { useFetchPeriodically } from '../../../hooks/useFetchPeriodically';
import { Link, ROUTE, useNavigate } from '../../../hooks/useNavigate';

import ReviewStep, { reviewStepId } from './steps/ReviewStep';
import { getErrorMessage } from '../../../utils/error';
import { getInitialValues, getValidationSchema, getImageBuildResource, getImageExportResources } from './utils';
import { isPromiseRejected } from '../../../types/typeUtils';
import { ImageBuildFormValues, ImageBuildWizardError } from './types';
import LeaveFormConfirmation from '../../common/LeaveFormConfirmation';
import ErrorBoundary from '../../common/ErrorBoundary';
import PageWithPermissions from '../../common/PageWithPermissions';
import { usePermissionsContext } from '../../common/PermissionsContext';
import SourceImageStep, { isSourceImageStepValid, sourceImageStepId } from './steps/SourceImageStep';
import ImageOutputStep, { isOutputImageStepValid, outputImageStepId } from './steps/OutputImageStep';
import RegistrationStep, { isRegistrationStepValid, registrationStepId } from './steps/RegistrationStep';
import CreateImageBuildWizardFooter from './CreateImageBuildWizardFooter';
import { useFetch } from '../../../hooks/useFetch';

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
  const navigate = useNavigate();
  const [error, setError] = React.useState<ImageBuildWizardError>();
  const [currentStep, setCurrentStep] = React.useState<WizardStepType>();
  const [repoList, isLoading, repoError, refetchRepositories] = useFetchPeriodically<RepositoryList>({
    endpoint: 'repositories',
  });

  const ociRegistries = (repoList?.items || []).filter((repo) => repo.spec.type === RepoSpecType.OCI);

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
                let buildName: string;

                try {
                  const imageBuild = getImageBuildResource(values);
                  buildName = imageBuild.metadata.name as string;
                  const createdBuild = await post<ImageBuild>('imagebuilds', imageBuild);
                  if (createdBuild.metadata.name !== buildName) {
                    throw new Error(t('ImageBuild was created but has a different name'));
                  }
                } catch (err) {
                  // Build creation failed
                  setError({ type: 'build', error: getErrorMessage(err) });
                  return;
                }

                // Create ImageExport(s) for each selected format
                // CELIA-WIP: clarify with UX designers if the formats are required
                if (values.exportFormats.length > 0) {
                  const imageExports = getImageExportResources(values, buildName);
                  const exportResults = await Promise.allSettled(
                    imageExports.map((imageExport) => post('imageexports', imageExport)),
                  );

                  // Check if any exports failed
                  const exportErrors: Array<{ format: ExportFormatType; error: unknown }> = [];
                  exportResults.forEach((result, index) => {
                    if (isPromiseRejected(result)) {
                      exportErrors.push({
                        format: values.exportFormats[index],
                        error: result.reason,
                      });
                    }
                  });

                  if (exportErrors.length > 0) {
                    // Some or all exports failed
                    setError({
                      type: 'export',
                      buildName,
                      errors: exportErrors,
                    });
                    return;
                  }
                }

                // Navigate to the ImageBuilds page on success
                navigate(ROUTE.IMAGE_BUILDS);
              }}
            >
              {({ errors: formikErrors }) => {
                const validStepIds = getValidStepIds(formikErrors);

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
                          <SourceImageStep registries={ociRegistries} repoRefetch={refetchRepositories} />
                        )}
                      </WizardStep>
                      <WizardStep
                        name={t('Image output')}
                        id={outputImageStepId}
                        isDisabled={isDisabledStep(outputImageStepId, validStepIds)}
                      >
                        {currentStep?.id === outputImageStepId && (
                          <ImageOutputStep registries={ociRegistries} repoRefetch={refetchRepositories} />
                        )}
                      </WizardStep>
                      <WizardStep
                        name={t('Registration')}
                        id={registrationStepId}
                        isDisabled={isDisabledStep(registrationStepId, validStepIds)}
                      >
                        {currentStep?.id === registrationStepId && <RegistrationStep />}
                      </WizardStep>
                      <WizardStep
                        name={t('Review')}
                        id={reviewStepId}
                        isDisabled={isDisabledStep(reviewStepId, validStepIds)}
                      >
                        {currentStep?.id === reviewStepId && <ReviewStep error={error} repositories={ociRegistries} />}
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
