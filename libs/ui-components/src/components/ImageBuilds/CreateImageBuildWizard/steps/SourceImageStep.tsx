import * as React from 'react';
import { Button, Card, CardBody, CardTitle, FormGroup, FormSection, Grid, Radio } from '@patternfly/react-core';
import { FormikErrors, useFormikContext } from 'formik';

import { Repository } from '@flightctl/types';
import { ImageBuildFormValues } from '../types';
import { useTranslation } from '../../../../hooks/useTranslation';
import FormSelect from '../../../form/FormSelect';
import FlightCtlForm from '../../../form/FlightCtlForm';
import TextField from '../../../form/TextField';
import { usePermissionsContext } from '../../../common/PermissionsContext';
import { RESOURCE, VERB } from '../../../../types/rbac';
import CreateRepositoryModal from '../../../modals/CreateRepositoryModal/CreateRepositoryModal';
import { RepoSpecType } from '@flightctl/types';

export const sourceImageStepId = 'source-image';

export const isSourceImageStepValid = (errors: FormikErrors<ImageBuildFormValues>) => {
  const { source } = errors;
  return !errors.name && !source?.repository && !source?.imageName && !source?.imageTag;
};

type SourceImageStepProps = {
  repositories: Repository[];
  hasLoaded: boolean;
};

const SourceImageStep = ({ repositories, hasLoaded }: SourceImageStepProps) => {
  const { t } = useTranslation();
  const { values, setFieldValue } = useFormikContext<ImageBuildFormValues>();
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [useExistingRepo, setUseExistingRepo] = React.useState(true);
  const { checkPermissions } = usePermissionsContext();
  const [canCreateRepo] = checkPermissions([{ kind: RESOURCE.REPOSITORY, verb: VERB.CREATE }]);

  const noRepositoriesExist = hasLoaded && repositories.length === 0;

  React.useEffect(() => {
    if (useExistingRepo && noRepositoriesExist && canCreateRepo) {
      setUseExistingRepo(false);
    }
  }, [useExistingRepo, noRepositoriesExist, canCreateRepo]);

  const handleCreateRepository = (repository: Repository) => {
    void setFieldValue('source.repository', repository.metadata.name || '');
    setShowCreateModal(false);
    setUseExistingRepo(true);
  };

  const getRepositoryUrl = (repoName: string): string | null => {
    const repo = repositories.find((r) => r.metadata.name === repoName);
    if (!repo) {
      return null;
    }
    // For HTTP repositories (placeholder for OCI), use spec.url directly
    if (repo.spec.type === RepoSpecType.HTTP) {
      const httpSpec = repo.spec as { url?: string };
      return httpSpec.url || null;
    }
    // Future: handle OCI repositories
    // if (repo.spec.type === RepoSpecType.OCI) {
    //   const ociSpec = repo.spec as { registry?: string };
    //   return ociSpec.registry || null;
    // }
    return null;
  };

  const repoUrl = values.source.repository ? getRepositoryUrl(values.source.repository) : null;
  const imageReference =
    repoUrl && values.source.imageName && values.source.imageTag
      ? `${repoUrl}/${values.source.imageName}:${values.source.imageTag}`
      : null;

  return (
    <>
      <FlightCtlForm>
        <Grid lg={5} span={8}>
          {canCreateRepo && (
            <FormSection>
              <FormGroup isInline>
                <Radio
                  isChecked={useExistingRepo}
                  onChange={() => {
                    setUseExistingRepo(true);
                    void setFieldValue('source.repository', '');
                  }}
                  id="existing-repo"
                  name="repo"
                  label={t('Use an existing HTTP repository')}
                  isDisabled={noRepositoriesExist}
                />
                <Radio
                  isChecked={!useExistingRepo}
                  onChange={() => {
                    setUseExistingRepo(false);
                    void setFieldValue('source.repository', '');
                    void setFieldValue('source.imageName', '');
                    void setFieldValue('source.imageTag', '');
                    setShowCreateModal(true);
                  }}
                  id="new-repo"
                  name="repo"
                  label={t('Create a new HTTP repository')}
                />
              </FormGroup>
            </FormSection>
          )}
          <FormSection>
            {useExistingRepo ? (
              <>
                <FormGroup label={t('Repository')} fieldId="repository" isRequired>
                  <FormSelect
                    name="source.repository"
                    items={repositories.reduce(
                      (acc, curr) => {
                        acc[curr.metadata.name || ''] = curr.metadata.name || '';
                        return acc;
                      },
                      {} as Record<string, string>,
                    )}
                    placeholderText={t('Select a repository')}
                  />
                </FormGroup>
                <FormGroup label={t('Image name')} fieldId="image-name" isRequired>
                  <TextField
                    name="source.imageName"
                    aria-label={t('Image name')}
                    helperText={t('The name of the source image')}
                  />
                </FormGroup>
                <FormGroup label={t('Image tag')} fieldId="image-tag" isRequired>
                  <TextField
                    name="source.imageTag"
                    aria-label={t('Image tag')}
                    helperText={t('The tag of the source image')}
                  />
                </FormGroup>
              </>
            ) : (
              <>
                {!values.source.repository && (
                  <FormGroup>
                    <Button variant="secondary" onClick={() => setShowCreateModal(true)} isDisabled={!canCreateRepo}>
                      {t('Create HTTP repository')}
                    </Button>
                  </FormGroup>
                )}
                {values.source.repository && (
                  <>
                    <FormGroup label={t('Repository')} fieldId="repository">
                      <TextField name="source.repository" aria-label={t('Repository')} readOnly />
                    </FormGroup>
                    <FormGroup label={t('Image name')} fieldId="image-name" isRequired>
                      <TextField
                        name="source.imageName"
                        aria-label={t('Image name')}
                        helperText={t('The name of the source image')}
                      />
                    </FormGroup>
                    <FormGroup label={t('Image tag')} fieldId="image-tag" isRequired>
                      <TextField
                        name="source.imageTag"
                        aria-label={t('Image tag')}
                        helperText={t('The tag of the source image')}
                      />
                    </FormGroup>
                  </>
                )}
              </>
            )}
          </FormSection>
          {imageReference && (
            <FormSection>
              <Card>
                <CardTitle>{t('Source image reference')}</CardTitle>
                <CardBody>{imageReference}</CardBody>
              </Card>
            </FormSection>
          )}
        </Grid>
      </FlightCtlForm>
      {showCreateModal && (
        <CreateRepositoryModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateRepository}
          options={{
            allowedRepoTypes: [RepoSpecType.HTTP],
            showRepoTypes: false,
          }}
        />
      )}
    </>
  );
};

export default SourceImageStep;
