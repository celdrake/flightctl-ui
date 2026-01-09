import * as React from 'react';
import { Alert, Card, CardBody, CardTitle, FormGroup, FormSection, Gallery, Grid } from '@patternfly/react-core';
import { FormikErrors, useFormikContext } from 'formik';

import { OciRepoSpec, RepoSpecType, Repository } from '@flightctl/types';
import { ExportFormatType } from '@flightctl/types/imagebuilder';
import { ImageBuildFormValues } from '../types';
import { useTranslation } from '../../../../hooks/useTranslation';
import FlightCtlForm from '../../../form/FlightCtlForm';
import TextField from '../../../form/TextField';
import RepositorySelect from '../../../form/RepositorySelect';
import { usePermissionsContext } from '../../../common/PermissionsContext';
import { RESOURCE, VERB } from '../../../../types/rbac';
import ImageBuildExportFormatCard from '../../ImageBuildExportFormatCard';
import { getRegistryUrl } from '../../../../utils/imageBuilds';
import { isOciRepoSpec } from '../../../Repository/CreateRepository/utils';

export const outputImageStepId = 'output-image';

export const isOutputImageStepValid = (errors: FormikErrors<ImageBuildFormValues>) => {
  const { destination } = errors;
  if (!destination) {
    return true;
  }
  return !destination.repository && !destination.imageName && !destination.tag;
};

type OutputImageStepProps = {
  registries: Repository[];
  repoRefetch: VoidFunction;
};

const OutputImageStep = ({ registries, repoRefetch }: OutputImageStepProps) => {
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

  const outputRegistries = React.useMemo(() => {
    return registries.filter((repo) => {
      if (isOciRepoSpec(repo.spec)) {
        return repo.spec.accessMode !== OciRepoSpec.accessMode.READ;
      }
      return false;
    });
  }, [registries]);

  const imageReference = React.useMemo(() => {
    const registryUrl = getRegistryUrl(registries, values.destination.repository);
    if (!registryUrl) {
      return null;
    }
    return `${registryUrl}/${values.destination.imageName}:${values.destination.tag}`;
  }, [registries, values.destination]);

  return (
    <FlightCtlForm>
      <Grid lg={5} span={8}>
        <FormSection>
          <Alert isInline variant="info" title={t('Management-ready by default')}>
            {t(
              'The agent is automatically included in this image. This ensures your devices are ready to be managed immediately after they are deployed.',
            )}
          </Alert>
          <RepositorySelect
            name="destination.repository"
            repositories={outputRegistries}
            repoType={RepoSpecType.OCI}
            selectedRepoName={values.destination.repository}
            canCreateRepo={canCreateRepo}
            repoRefetch={repoRefetch}
            label={t('Target registry')}
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
              helperText={t('Specify the version (e.g, latest or 9.6)')}
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
