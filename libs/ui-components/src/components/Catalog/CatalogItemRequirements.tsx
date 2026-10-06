import * as React from 'react';
import {
  Card,
  CardBody,
  CardTitle,
  Content,
  ContentVariants,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from '@patternfly/react-core';
import { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { useFormikContext } from 'formik';

import { DeviceFeatureBoolean, type CatalogItem } from '@flightctl/types/alpha';
import { InstallSpecFormik } from './InstallWizard/types';
import { OsModeType } from '../../../../types';

const requirementLabels = (t: TFunction) => ({
  'gpu.present': t('GPU'),
  'kvm.present': t('KVM Virtualization'),
  'os.mode': t('Operating system: image mode'),
});

const getRequirementValue = (t: TFunction, featureKey: string, value: DeviceFeatureBoolean | OsModeType) => {
  if (featureKey === 'os.mode') {
    return value === OsModeType.OsModeImage ? t('Image mode') : t('Package mode');
  }
  return value === DeviceFeatureBoolean.DeviceFeatureBooleanTrue ? t('Required') : t('Not required');
};

const CatalogItemRequirements = ({ catalogItem }: { catalogItem: CatalogItem }) => {
  const { t } = useTranslation();

  const {
    values: { version },
  } = useFormikContext<InstallSpecFormik>();

  const selectedVersion = catalogItem.spec.versions.find((v) => v.version === version);
  console.log('%c version', 'color: red; font-size:18px', version, 'vs', selectedVersion);
  const featureRequirements = Object.entries(selectedVersion?.deviceFeatures || {}).filter(
    ([_, value]) => value === DeviceFeatureBoolean.DeviceFeatureBooleanFalse || Boolean(value),
  );
  const labels = React.useMemo(() => requirementLabels, [t]);
  return (
    <Card isCompact>
      <CardTitle>{t('Device capability requirements')}</CardTitle>
      <CardBody>
        {featureRequirements.length > 0 ? (
          <DescriptionList isCompact>
            {featureRequirements.map(([featureKey, value]) => (
              <DescriptionListGroup key={featureKey}>
                <DescriptionListTerm>{labels[featureKey]}</DescriptionListTerm>
                <DescriptionListDescription>{getRequirementValue(t, featureKey, value)}</DescriptionListDescription>
              </DescriptionListGroup>
            ))}
          </DescriptionList>
        ) : (
          <Content component={ContentVariants.small}>
            {t('No device capability requirements were detected for this item.')}
          </Content>
        )}
      </CardBody>
    </Card>
  );
};

export default CatalogItemRequirements;
