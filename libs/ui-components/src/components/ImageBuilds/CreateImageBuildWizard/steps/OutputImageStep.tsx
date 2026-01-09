import * as React from 'react';
import { Alert, Card, CardBody, CardTitle, FormGroup, FormSection, Gallery, Grid } from '@patternfly/react-core';
import { FormikErrors, useFormikContext } from 'formik';

import { RepoSpecType, Repository } from '@flightctl/types';
import { ExportFormatType } from '@flightctl/types/imagebuilder';
import { ImageBuildFormValues } from '../types';
import { useTranslation } from '../../../../hooks/useTranslation';
import FlightCtlForm from '../../../form/FlightCtlForm';
import TextField from '../../../form/TextField';
import RepositorySelect from '../../../form/RepositorySelect';
import { usePermissionsContext } from '../../../common/PermissionsContext';
import { RESOURCE, VERB } from '../../../../types/rbac';
import ImageBuildExportFormatCard from '../../ImageBuildExportFormatCard';

export const outputImageStepId = 'output-image';

export const isOutputImageStepValid = (errors: FormikErrors<ImageBuildFormValues>) => {
  const { destination } = errors;
  if (!destination) {
    return true;
  }
  return !destination.repository && !destination.imageName && !destination.tag;
};

type OutputImageStepProps = {
  repositories: Repository[];
  repoRefetch: VoidFunction;
};

const OutputImageStep = ({ repositories, repoRefetch }: OutputImageStepProps) => {
  const { t } = useTranslation();
  const { values, setFieldValue } = useFormikContext<ImageBuildFormValues>();
  const { checkPermissions } = usePermissionsContext();
  const [canCreateRepo] = checkPermissions([{ kind: RESOURCE.REPOSITORY, verb: VERB.CREATE }]);

  const handleFormatToggle = (format: ExportFormatType, isChecked: boolean) => {
    const currentFormats = values.exportFormats;
    if (isChecked) {
      setFieldValue('exportFormats', [...currentFormats, format]);
    } else {
      setFieldValue(
        'exportFormats',
        currentFormats.filter((f) => f !== format),
      );
    }
  };

  const getRepositoryUrl = (repoName: string): string | null => {
    const repo = repositories.find((r) => r.metadata.name === repoName);
    if (!repo) {
      return null;
    }
    // CELIA-WIP use the registry URL
    return 'quay.io';
  };

  const repoUrl = values.destination.repository ? getRepositoryUrl(values.destination.repository) : null;
  const imageReference =
    repoUrl && values.destination.imageName && values.destination.tag
      ? `${repoUrl}/${values.destination.imageName}:${values.destination.tag}`
      : null;

  return (
    <FlightCtlForm>
      <Grid lg={5} span={8}>
        <FormSection>
          <Alert isInline variant="info" title={t('Image output configuration')}>
            {t('TBD - Image output configuration details')}
          </Alert>
          <RepositorySelect
            name="destination.repository"
            repositories={repositories}
            repoType={RepoSpecType.HTTP}
            selectedRepoName={values.destination.repository}
            canCreateRepo={canCreateRepo}
            repoRefetch={repoRefetch}
            isRequired
          />
          <FormGroup label={t('Image name')} fieldId="image-name" isRequired>
            <TextField
              name="destination.imageName"
              aria-label={t('Image name')}
              helperText={t('The image name that will be pushed the registry. For example: flightctl/rhel-bootc')}
            />
          </FormGroup>
          <FormGroup label={t('Image tag')} fieldId="image-tag" isRequired>
            <TextField
              name="destination.tag"
              aria-label={t('Image tag')}
              helperText={t('Specify the veresion (e.g, latest or 9.6)')}
            />
          </FormGroup>
          {imageReference && (
            <FormSection>
              <Card>
                <CardTitle>{t('Destination image reference')}</CardTitle>
                <CardBody>{imageReference}</CardBody>
              </Card>
            </FormSection>
          )}
          <FormGroup label={t('Export formats')} fieldId="export-formats">
            <Gallery hasGutter>
              <ImageBuildExportFormatCard
                format={ExportFormatType.ExportFormatTypeVMDK}
                isChecked={values.exportFormats.includes(ExportFormatType.ExportFormatTypeVMDK)}
                onToggle={handleFormatToggle}
              />
              <ImageBuildExportFormatCard
                format={ExportFormatType.ExportFormatTypeQCOW2}
                isChecked={values.exportFormats.includes(ExportFormatType.ExportFormatTypeQCOW2)}
                onToggle={handleFormatToggle}
              />
              <ImageBuildExportFormatCard
                format={ExportFormatType.ExportFormatTypeISO}
                isChecked={values.exportFormats.includes(ExportFormatType.ExportFormatTypeISO)}
                onToggle={handleFormatToggle}
              />
            </Gallery>
          </FormGroup>
        </FormSection>
      </Grid>
    </FlightCtlForm>
  );
};

export default OutputImageStep;
