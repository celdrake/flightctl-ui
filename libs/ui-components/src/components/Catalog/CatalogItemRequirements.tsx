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
  Stack,
  StackItem,
} from '@patternfly/react-core';
import type { TFunction } from 'i18next';
import { useFormikContext } from 'formik';

import { type CatalogItem, DeviceFeatureBoolean } from '@flightctl/types/alpha';
import { OsModeType } from '../../../../types';
import { useTranslation } from '../../hooks/useTranslation';
import type { InstallSpecFormik } from './InstallWizard/types';

const requirementLabels = (t: TFunction) => ({
  'gpu.present': t('GPU'),
  'kvm.enabled': t('KVM Virtualization'),
  'os.mode.image': t('Image mode OS'),
  'os.mode.package': t('Package mode OS'),
});

type RequirementValue = DeviceFeatureBoolean | OsModeType;

const ENABLED_REQUIREMENT_VALUES: RequirementValue[] = [
  DeviceFeatureBoolean.DeviceFeatureBooleanTrue,
  OsModeType.OsModeImage,
];
const DISABLED_REQUIREMENT_VALUES: RequirementValue[] = [
  DeviceFeatureBoolean.DeviceFeatureBooleanFalse,
  OsModeType.OsModePackage,
];

const getRequirementText = (
  requirements: [string, RequirementValue][],
  acceptedValues: RequirementValue[],
  labels: Record<string, string>,
) => {
  return requirements
    .filter(([, value]) => acceptedValues.some((accepted) => accepted === value))
    .map(([key, value]) => {
      if (value === OsModeType.OsModeImage || value === OsModeType.OsModePackage) {
        return labels[`os.mode.${value}`] || value;
      }
      return labels[key] || key;
    })
    .join(', ');
};

const CatalogItemRequirements = ({ catalogItem }: { catalogItem: CatalogItem }) => {
  const { t } = useTranslation();

  const {
    values: { version },
  } = useFormikContext<InstallSpecFormik>();

  const deviceFeatures = catalogItem.spec.versions.find((v) => v.version === version)?.deviceFeatures as Record<
    string,
    RequirementValue
  >;

  const { enabledRequirements, disabledRequirements } = React.useMemo(() => {
    const allRequirements = Object.entries(deviceFeatures || {});
    const labels = requirementLabels(t);
    const enabled = getRequirementText(allRequirements, ENABLED_REQUIREMENT_VALUES, labels);
    const disabled = getRequirementText(allRequirements, DISABLED_REQUIREMENT_VALUES, labels);
    return { enabledRequirements: enabled, disabledRequirements: disabled };
  }, [t, deviceFeatures]);

  const hasRequirements = enabledRequirements.length > 0 || disabledRequirements.length > 0;
  return (
    <Card isCompact>
      <CardTitle>{t('Device requirements')}</CardTitle>
      <CardBody>
        <Stack hasGutter>
          {enabledRequirements && (
            <StackItem>
              <DescriptionList isCompact>
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Requirements that must be present')}</DescriptionListTerm>
                  <DescriptionListDescription>{enabledRequirements}</DescriptionListDescription>
                </DescriptionListGroup>
              </DescriptionList>
            </StackItem>
          )}
          {disabledRequirements && (
            <StackItem>
              <DescriptionList isCompact>
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Requirements that must be absent')}</DescriptionListTerm>
                  <DescriptionListDescription>{disabledRequirements}</DescriptionListDescription>
                </DescriptionListGroup>
              </DescriptionList>
            </StackItem>
          )}
          {!hasRequirements && (
            <StackItem>
              <Content component={ContentVariants.small}>
                {t('No device requirements were detected for this version.')}
              </Content>
            </StackItem>
          )}
        </Stack>
      </CardBody>
    </Card>
  );
};

export default CatalogItemRequirements;
