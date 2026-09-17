import * as React from 'react';
import {
  Alert,
  Content,
  Divider,
  Flex,
  FlexItem,
  FormGroup,
  Split,
  SplitItem,
  Stack,
  StackItem,
} from '@patternfly/react-core';
import { useFormikContext } from 'formik';
import { Trans } from 'react-i18next';

import { OciRepoSpec } from '@flightctl/types';

import { useExistingDeltaStorageTarget } from '../../../hooks/useExistingDeltaStorageTarget';
import { useTranslation } from '../../../hooks/useTranslation';
import ErrorHelperText from '../../form/FieldHelperText';
import RadioField from '../../form/RadioField';
import TextField from '../../form/TextField';
import WithTooltip from '../../common/WithTooltip';
import DeltaStorageSelection from './DeltaStorageSelection';
import OciBaseImagesSection from './OciBaseImagesSection';
import OciPushPlacementSection from './OciPushPlacementSection';
import { type RepositoryFormValues } from './types';

type OciConfig = RepositoryFormValues['ociConfig'];

const DeltaStorageSection = ({
  currentRepoName,
  isEdit,
  isAccessModeDisabled,
}: {
  currentRepoName?: string;
  isEdit?: boolean;
  isAccessModeDisabled: boolean;
}) => {
  const { t } = useTranslation();
  const { values, setFieldValue } = useFormikContext<RepositoryFormValues>();
  const { existingDeltaTargetName, isLoading } = useExistingDeltaStorageTarget(currentRepoName);

  const ociConfig = values.ociConfig as NonNullable<OciConfig>;
  const deltaStorageTarget = ociConfig.deltaStorageTarget;
  const isDeltaStorageBlocked = Boolean(existingDeltaTargetName);

  React.useEffect(() => {
    if (isDeltaStorageBlocked && deltaStorageTarget) {
      void setFieldValue('ociConfig.deltaStorageTarget', false);
    }
  }, [isDeltaStorageBlocked, deltaStorageTarget, setFieldValue]);

  return (
    <Stack hasGutter>
      <StackItem>
        <DeltaStorageSelection
          isDisabled={isDeltaStorageBlocked || isLoading}
          isEdit={isEdit}
          isAccessModeDisabled={isAccessModeDisabled}
        />
      </StackItem>
      {existingDeltaTargetName && (
        <StackItem>
          <Alert isInline variant="info" title={t('This organization already has a repository for delta storage')}>
            <Trans t={t} values={{ name: existingDeltaTargetName }}>
              The repository <strong>{'{{name}}'}</strong> is currently configured as the delta storage repository for
              this organization.
            </Trans>
          </Alert>
        </StackItem>
      )}
    </Stack>
  );
};

type OciRegistryFormProps = {
  isAccessModeDisabled: boolean;
  accessModeDisabledReason?: string;
  currentRepoName?: string;
  isEdit?: boolean;
};

const OciRegistryForm = ({
  isAccessModeDisabled,
  accessModeDisabledReason,
  currentRepoName,
  isEdit,
}: OciRegistryFormProps) => {
  const { t } = useTranslation();
  const { values, errors } = useFormikContext<RepositoryFormValues>();

  const ociConfig = values.ociConfig as NonNullable<OciConfig>;
  const isReadWrite = ociConfig.accessMode === OciRepoSpec.accessMode.READ_WRITE;
  const accessModeError = (errors.ociConfig as unknown as OciConfig)?.accessMode;

  return (
    <Stack hasGutter style={{ '--pf-v6-l-stack--m-gutter--Gap': '2rem' } as React.CSSProperties}>
      <StackItem>
        <FormGroup label={t('Registry hostname')} isRequired fieldId="oci-registry-hostname">
          <TextField
            name="ociConfig.registry"
            aria-label={t('Registry hostname')}
            helperText={t('For example: quay.io, registry.redhat.io, myregistry.com:5000')}
          />
        </FormGroup>
      </StackItem>
      <StackItem>
        <FormGroup label={t('Scheme')} role="radiogroup" fieldId="oci-registry-scheme">
          <Split hasGutter>
            <SplitItem>
              <RadioField
                id="oci-scheme-https"
                name="ociConfig.scheme"
                label={t('HTTPS')}
                checkedValue={OciRepoSpec.scheme.HTTPS}
                showGlobalError={false}
              />
            </SplitItem>
            <SplitItem>
              <RadioField
                id="oci-scheme-http"
                name="ociConfig.scheme"
                label={t('HTTP')}
                checkedValue={OciRepoSpec.scheme.HTTP}
                showGlobalError={false}
              />
            </SplitItem>
          </Split>
        </FormGroup>
      </StackItem>
      <StackItem>
        <FormGroup label={t('Access mode')} role="radiogroup" fieldId="oci-registry-access">
          <WithTooltip showTooltip={isAccessModeDisabled} content={accessModeDisabledReason}>
            <Flex>
              <FlexItem>
                <RadioField
                  id="oci-access-read"
                  name="ociConfig.accessMode"
                  label={t('Read only')}
                  description={t('Pull images from this registry.')}
                  checkedValue={OciRepoSpec.accessMode.READ}
                  isDisabled={isAccessModeDisabled}
                  showGlobalError={false}
                />
              </FlexItem>
              <FlexItem>
                <RadioField
                  id="oci-access-readwrite"
                  name="ociConfig.accessMode"
                  label={t('Read and write')}
                  description={t('Pull and push images, including generated deltas.')}
                  checkedValue={OciRepoSpec.accessMode.READ_WRITE}
                  isDisabled={isAccessModeDisabled}
                  showGlobalError={false}
                />
              </FlexItem>
            </Flex>
          </WithTooltip>
          {accessModeError && <ErrorHelperText error={accessModeError} />}
        </FormGroup>
      </StackItem>

      {isReadWrite ? (
        <>
          <StackItem>
            <Divider />
          </StackItem>
          <StackItem>
            <OciPushPlacementSection />
          </StackItem>
          <StackItem>
            <Divider />
          </StackItem>
          {values.allowDeltaStorage && (
            <StackItem>
              <DeltaStorageSection
                currentRepoName={currentRepoName}
                isEdit={isEdit}
                isAccessModeDisabled={isAccessModeDisabled}
              />
            </StackItem>
          )}
        </>
      ) : (
        <>
          <StackItem>
            <Content component="small">
              {t('Select read and write access to configure image placement and delta storage.')}
            </Content>
          </StackItem>
          <StackItem>
            <Divider />
          </StackItem>
        </>
      )}

      <StackItem>
        <OciBaseImagesSection />
      </StackItem>
    </Stack>
  );
};

export default OciRegistryForm;
