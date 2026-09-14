import * as React from 'react';
import {
  Alert,
  Button,
  ButtonVariant,
  Content,
  Flex,
  FlexItem,
  FormGroup,
  Icon,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Split,
  SplitItem,
  Stack,
  StackItem,
} from '@patternfly/react-core';
import FlightCtlModal from '../../common/FlightCtlModal';
import { useFormikContext } from 'formik';
import { Trans } from 'react-i18next';

import { useTranslation } from '../../../hooks/useTranslation';
import CheckboxField from '../../form/CheckboxField';
import RadioField from '../../form/RadioField';
import TextField from '../../form/TextField';
import type { OciPlacementMode, RepositoryFormValues } from './types';
import { PUSH_PREVIEW_APP, getDeltaPushPathPreview } from './utils';
import { InfoCircleIcon } from '@patternfly/react-icons/dist/js/icons';

type DeltaStorageCheckboxProps = {
  isDisabled?: boolean;
  isEdit?: boolean;
};

const DeltaStoragePathPreview = ({ ociConfig }: { ociConfig: NonNullable<RepositoryFormValues['ociConfig']> }) => {
  const { t } = useTranslation();
  const pushPreviewPath = getDeltaPushPathPreview(ociConfig);
  if (!pushPreviewPath) {
    return (
      <Content component="small">
        {t('Enter the placement mode details above to preview where deltas will be pushed.')}
      </Content>
    );
  }

  const exampleImage = PUSH_PREVIEW_APP;
  return (
    <Flex gap={{ default: 'gapSm' }}>
      <FlexItem>
        <Icon status="info">
          <InfoCircleIcon />
        </Icon>
      </FlexItem>
      <FlexItem>
        <Content>
          <Trans t={t} values={{ image: exampleImage, path: pushPreviewPath }}>
            Deltas for image <strong>{exampleImage}</strong> would be pushed to <strong>{pushPreviewPath}</strong>
          </Trans>
        </Content>
      </FlexItem>
    </Flex>
  );
};

const DeltaStorageCheckbox = ({ isDisabled, isEdit }: DeltaStorageCheckboxProps) => {
  const { t } = useTranslation();
  const { values, setFieldValue, initialValues } = useFormikContext<RepositoryFormValues>();
  const ociConfig = values.ociConfig as NonNullable<RepositoryFormValues['ociConfig']>;
  const wasDeltaStorageTarget = Boolean(initialValues.ociConfig?.deltaStorageTarget);
  const [showConfirmUnsetDeltaStorage, setShowConfirmUnsetDeltaStorage] = React.useState(false);

  const onDeltaStorageTargetChange = (checked: boolean) => {
    if (isEdit && wasDeltaStorageTarget && !checked && ociConfig.deltaStorageTarget) {
      setShowConfirmUnsetDeltaStorage(true);
      return;
    }
    void setFieldValue('ociConfig.deltaStorageTarget', checked);
  };

  const confirmUnsetDeltaStorage = () => {
    void setFieldValue('ociConfig.deltaStorageTarget', false);
    setShowConfirmUnsetDeltaStorage(false);
  };

  const onPlacementModeChange = (value: unknown) => {
    const mode = value as OciPlacementMode;
    if (mode !== 'repository') {
      void setFieldValue('ociConfig.repository', '');
    }
    if (mode !== 'namespace') {
      void setFieldValue('ociConfig.namespace', '');
    }
  };

  return (
    <>
      <CheckboxField
        name="ociConfig.deltaStorageTarget"
        label={t('Store generated deltas in this registry')}
        isDisabled={isDisabled}
        noDefaultOnChange
        onChangeCustom={onDeltaStorageTargetChange}
        body={
          <Stack hasGutter>
            <StackItem>
              <Alert isInline variant="info" title={t('Organization delta storage target')}>
                {t(
                  'When enabled, this repository is the write target for server-generated deltas in your organization. Only one repository can have this role. Fleets with delta generation enabled use it when present.',
                )}
              </Alert>
            </StackItem>
            <StackItem>
              <FormGroup label={t('Push placement')}>
                <Split hasGutter>
                  <SplitItem>
                    <RadioField
                      id="oci-placement-registry"
                      name="ociConfig.placementMode"
                      label={t('Registry only')}
                      checkedValue="registry"
                      onChangeCustom={onPlacementModeChange}
                    />
                  </SplitItem>
                  <SplitItem>
                    <RadioField
                      id="oci-placement-repository"
                      name="ociConfig.placementMode"
                      label={t('Repository path')}
                      checkedValue="repository"
                      onChangeCustom={onPlacementModeChange}
                    />
                  </SplitItem>
                  <SplitItem>
                    <RadioField
                      id="oci-placement-namespace"
                      name="ociConfig.placementMode"
                      label={t('Namespace')}
                      checkedValue="namespace"
                      onChangeCustom={onPlacementModeChange}
                    />
                  </SplitItem>
                </Split>
              </FormGroup>
            </StackItem>
            {ociConfig.placementMode === 'repository' && (
              <StackItem>
                <FormGroup label={t('Repository path')} isRequired>
                  <TextField
                    name="ociConfig.repository"
                    aria-label={t('Repository path')}
                    helperText={t('e.g. my-org/diffs')}
                  />
                </FormGroup>
              </StackItem>
            )}
            {ociConfig.placementMode === 'namespace' && (
              <StackItem>
                <FormGroup label={t('Namespace')} isRequired>
                  <TextField name="ociConfig.namespace" aria-label={t('Namespace')} helperText={t('e.g. my-org')} />
                </FormGroup>
              </StackItem>
            )}
            {ociConfig.registry && (
              <StackItem>
                <DeltaStoragePathPreview ociConfig={ociConfig} />
              </StackItem>
            )}
          </Stack>
        }
      />
      {showConfirmUnsetDeltaStorage && (
        <FlightCtlModal variant="small" isOpen>
          <ModalHeader title={t('Disable delta storage target?')} titleIconVariant="warning" />
          <ModalBody>
            {t(
              'Removing this registry as the organization delta storage target could disable delta updates for fleets with delta generation enabled.',
            )}{' '}
            {t('Are you sure you want to disable delta storage for this registry?')}
          </ModalBody>
          <ModalFooter>
            <Button key="disable" variant={ButtonVariant.primary} onClick={confirmUnsetDeltaStorage}>
              {t('Disable')}
            </Button>
            <Button key="cancel" variant="link" onClick={() => setShowConfirmUnsetDeltaStorage(false)}>
              {t('Cancel')}
            </Button>
          </ModalFooter>
        </FlightCtlModal>
      )}
    </>
  );
};

export default DeltaStorageCheckbox;
