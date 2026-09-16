import * as React from 'react';
import { Button, ButtonVariant, ModalBody, ModalFooter, ModalHeader, Stack, StackItem } from '@patternfly/react-core';
import FlightCtlModal from '../../common/FlightCtlModal';
import { useFormikContext } from 'formik';

import { useTranslation } from '../../../hooks/useTranslation';
import SwitchField from '../../form/SwitchField';
import type { RepositoryFormValues } from './types';

type DeltaStorageSelectionProps = {
  isDisabled?: boolean;
  isEdit?: boolean;
};

const DeltaStorageSelection = ({ isDisabled, isEdit }: DeltaStorageSelectionProps) => {
  const { t } = useTranslation();
  const { values, setFieldValue, initialValues } = useFormikContext<RepositoryFormValues>();
  const ociConfig = values.ociConfig as NonNullable<RepositoryFormValues['ociConfig']>;
  const wasDeltaStorageTarget = Boolean(initialValues.ociConfig?.deltaStorageTarget);
  const [showConfirmUnsetDeltaStorage, setShowConfirmUnsetDeltaStorage] = React.useState(false);

  const onDeltaStorageTargetChange = (checked: boolean) => {
    if (isEdit && wasDeltaStorageTarget && !checked && ociConfig.deltaStorageTarget) {
      setShowConfirmUnsetDeltaStorage(true);
    } else {
      void setFieldValue('ociConfig.deltaStorageTarget', checked);
    }
  };

  const confirmUnsetDeltaStorage = () => {
    void setFieldValue('ociConfig.deltaStorageTarget', false);
    setShowConfirmUnsetDeltaStorage(false);
  };

  return (
    <>
      <Stack hasGutter>
        <StackItem>
          <SwitchField
            name="ociConfig.deltaStorageTarget"
            label={t('Store generated deltas in this registry')}
            helperText={t(
              'When enabled, this repository is the write target for server-generated deltas in your organization. Only one repository can have this role.',
            )}
            isDisabled={isDisabled}
            noDefaultOnChange
            onChangeCustom={onDeltaStorageTargetChange}
          />
        </StackItem>
      </Stack>
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

export default DeltaStorageSelection;
