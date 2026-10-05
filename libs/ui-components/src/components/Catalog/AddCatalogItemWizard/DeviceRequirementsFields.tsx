import * as React from 'react';
import { Content, ContentVariants, FormGroup, FormSection } from '@patternfly/react-core';
import { DeviceFeatureBoolean } from '@flightctl/types/alpha';
import { OsModeType } from '@flightctl/types';

import { useTranslation } from '../../../hooks/useTranslation';
import FormSelect from '../../form/FormSelect';

const DeviceRequirementsFields = ({ namePrefix, isDisabled }: { namePrefix: string; isDisabled?: boolean }) => {
  const { t } = useTranslation();
  const unspecified = t('Not specified');
  const booleanItems = {
    '': unspecified,
    [DeviceFeatureBoolean.DeviceFeatureBooleanTrue]: t('Required'),
    [DeviceFeatureBoolean.DeviceFeatureBooleanFalse]: t('Must not be present'),
  };
  const osModeItems = {
    '': unspecified,
    [OsModeType.OsModeImage]: t('Image'),
    [OsModeType.OsModePackage]: t('Package'),
  };

  return (
    <FormSection title={t('Device requirements')}>
      <Content component={ContentVariants.small}>
        {t(
          'Choose which device features this version requires or must not have. Leave unspecified if the feature does not matter.',
        )}
      </Content>
      <FormGroup label={t('GPU acceleration')}>
        <FormSelect
          name={`${namePrefix}.deviceFeatures.gpuPresent`}
          items={booleanItems}
          placeholderText={unspecified}
          isDisabled={isDisabled}
        />
      </FormGroup>
      <FormGroup label={t('KVM virtualization')}>
        <FormSelect
          name={`${namePrefix}.deviceFeatures.kvmEnabled`}
          items={booleanItems}
          placeholderText={unspecified}
          isDisabled={isDisabled}
        />
      </FormGroup>
      <FormGroup label={t('OS mode')}>
        <FormSelect
          name={`${namePrefix}.deviceFeatures.osMode`}
          items={osModeItems}
          placeholderText={unspecified}
          isDisabled={isDisabled}
        />
      </FormGroup>
    </FormSection>
  );
};

export default DeviceRequirementsFields;
