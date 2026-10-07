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
import { useFormikContext } from 'formik';

import type { CatalogItem } from '@flightctl/types/alpha';
import { useTranslation } from '../../hooks/useTranslation';
import { getDeviceFeatureRequirementsText } from '../../utils/catalogDeviceFeatures';
import type { InstallSpecFormik } from './InstallWizard/types';

const CatalogItemRequirements = ({ catalogItem }: { catalogItem: CatalogItem }) => {
  const { t } = useTranslation();

  const {
    values: { version },
  } = useFormikContext<InstallSpecFormik>();

  const deviceFeatures = catalogItem.spec.versions.find((v) => v.version === version)?.deviceFeatures;

  const { enabledRequirements, disabledRequirements } = React.useMemo(
    () => getDeviceFeatureRequirementsText(deviceFeatures, t),
    [t, deviceFeatures],
  );

  const hasRequirements = enabledRequirements.length > 0 || disabledRequirements.length > 0;
  return (
    <Card isCompact>
      <CardTitle>{t('Device requirements')}</CardTitle>
      <CardBody>
        <Stack hasGutter>
          {!!enabledRequirements && (
            <StackItem>
              <DescriptionList isCompact>
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Requirements that must be present')}</DescriptionListTerm>
                  <DescriptionListDescription>{enabledRequirements}</DescriptionListDescription>
                </DescriptionListGroup>
              </DescriptionList>
            </StackItem>
          )}
          {!!disabledRequirements && (
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
