import * as React from 'react';
import {
  Content,
  ContentVariants,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Stack,
  StackItem,
} from '@patternfly/react-core';

import type { DeviceFeatures } from '@flightctl/types/alpha';
import { useTranslation } from '../../hooks/useTranslation';
import { getDeviceFeatureRequirementsText } from '../../utils/catalogDeviceFeatures';

const CatalogFeatureRequirements = ({ deviceFeatures }: { deviceFeatures?: DeviceFeatures }) => {
  const { t } = useTranslation();

  const { enabledFeatures, disabledFeatures, hasRequirements } = React.useMemo(
    () => getDeviceFeatureRequirementsText(deviceFeatures, t),
    [t, deviceFeatures],
  );

  return (
    <Stack hasGutter>
      {!!enabledFeatures && (
        <StackItem>
          <DescriptionList isCompact>
            <DescriptionListGroup>
              <DescriptionListTerm>{t('Features that must be present')}</DescriptionListTerm>
              <DescriptionListDescription>{enabledFeatures}</DescriptionListDescription>
            </DescriptionListGroup>
          </DescriptionList>
        </StackItem>
      )}
      {!!disabledFeatures && (
        <StackItem>
          <DescriptionList isCompact>
            <DescriptionListGroup>
              <DescriptionListTerm>{t('Features that must not be present')}</DescriptionListTerm>
              <DescriptionListDescription>{disabledFeatures}</DescriptionListDescription>
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
  );
};

export default CatalogFeatureRequirements;
