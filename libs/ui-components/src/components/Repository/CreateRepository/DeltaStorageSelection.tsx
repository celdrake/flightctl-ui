import * as React from 'react';
import { Button, ButtonVariant, ModalBody, ModalFooter, ModalHeader } from '@patternfly/react-core';
import { useFormikContext } from 'formik';

import { OciRepoSpec } from '@flightctl/types';
import { useTranslation } from '../../../hooks/useTranslation';
import { useAppLinks } from '../../../hooks/useAppLinks';
import FlightCtlModal from '../../common/FlightCtlModal';
import LearnMoreLink from '../../common/LearnMoreLink';
import { FormGroupWithHelperText } from '../../common/WithHelperText';
import SwitchField from '../../form/SwitchField';
import type { RepositoryFormValues } from './types';

type DeltaStorageSelectionProps = {
  isDisabled?: boolean;
  isEdit?: boolean;
  isAccessModeDisabled?: boolean;
};

const DeltaStorageSelection = ({ isDisabled, isEdit, isAccessModeDisabled }: DeltaStorageSelectionProps) => {
  const { t } = useTranslation();
  const { values, setFieldValue, setFieldTouched, initialValues } = useFormikContext<RepositoryFormValues>();
  const [showConfirmUnsetDeltaStorage, setShowConfirmUnsetDeltaStorage] = React.useState(false);
  const ociConfig = values.ociConfig as NonNullable<RepositoryFormValues['ociConfig']>;
  const deltaTargetDocLink = useAppLinks('deltaTargetRepo');

  const wasDeltaStorageTarget = Boolean(initialValues.ociConfig?.deltaStorageTarget);
  const isReadWrite = ociConfig.accessMode === OciRepoSpec.accessMode.READ_WRITE;

  React.useEffect(() => {
    if (ociConfig.deltaStorageTarget && !isReadWrite && !isDisabled && !isAccessModeDisabled) {
      void setFieldValue('ociConfig.accessMode', OciRepoSpec.accessMode.READ_WRITE);
    }
  }, [ociConfig.deltaStorageTarget, isReadWrite, isDisabled, isAccessModeDisabled, setFieldValue]);

  const applyDeltaStorageTarget = (checked: boolean) => {
    if (checked && !isReadWrite && !isDisabled && !isAccessModeDisabled) {
      void setFieldValue('ociConfig.accessMode', OciRepoSpec.accessMode.READ_WRITE);
    }
    void setFieldValue('ociConfig.deltaStorageTarget', checked);
    if (checked) {
      void setFieldTouched('ociConfig.accessMode', true, false);
    }
  };

  const onDeltaStorageTargetChange = (checked: boolean) => {
    if (isEdit && wasDeltaStorageTarget && !checked && ociConfig.deltaStorageTarget) {
      setShowConfirmUnsetDeltaStorage(true);
    } else {
      applyDeltaStorageTarget(checked);
    }
  };

  const confirmUnsetDeltaStorage = () => {
    applyDeltaStorageTarget(false);
    setShowConfirmUnsetDeltaStorage(false);
  };

  return (
    <>
      <FormGroupWithHelperText
        label={t('Delta storage')}
        content={
          <>
            <p>
              {t(
                'Mark this registry as the write target for server-generated delta artifacts. Only one registry per organization can have this role.',
              )}
            </p>
            {deltaTargetDocLink ? <LearnMoreLink link={deltaTargetDocLink} text={t('View documentation')} /> : null}
          </>
        }
      >
        <SwitchField
          name="ociConfig.deltaStorageTarget"
          label={t('Store generated deltas in this registry')}
          helperText={t(
            'Write target for server-generated deltas in your organization. Requires read and write access.',
          )}
          isDisabled={isDisabled}
          noDefaultOnChange
          onChangeCustom={onDeltaStorageTargetChange}
        />
      </FormGroupWithHelperText>
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
