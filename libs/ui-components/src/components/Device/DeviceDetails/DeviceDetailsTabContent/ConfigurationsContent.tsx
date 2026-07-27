import * as React from 'react';
import { CardBody, CardTitle, Divider, Stack, StackItem } from '@patternfly/react-core';

import { Device } from '@flightctl/types';
import { useTranslation } from '../../../../hooks/useTranslation';
import { formatImageRef } from '../../../../types/deviceSpec';
import DetailsPageCard from '../../../DetailsPage/DetailsPageCard';
import RepositorySourceList from '../../../Repository/RepositoryDetails/RepositorySourceList';
import { useResolvedCatalogRef } from '../../../Catalog/useResolvedCatalogRef';
import DeviceOs from '../DeviceOs';

const ConfigurationsContent = ({ device }: { device: Required<Device> }) => {
  const { t } = useTranslation();

  const configs = device.spec?.config || [];
  const catalogRef = useResolvedCatalogRef(device.spec?.os?.catalogItemRef);
  const desiredOsImage = catalogRef?.imageUri || formatImageRef(device.spec?.os?.image);

  return (
    <DetailsPageCard>
      <CardTitle>{t('Configurations')}</CardTitle>
      <CardBody>
        <Stack hasGutter>
          <StackItem className="pf-v6-u-text-color-subtle">{t('System image (running)')}</StackItem>
          <StackItem>
            <DeviceOs desiredOsImage={desiredOsImage} renderedOsImage={device.status?.os?.image} />
          </StackItem>
        </Stack>
      </CardBody>
      <Divider />
      <CardBody>
        <Stack hasGutter>
          <StackItem className="pf-v6-u-font-weight-bold">
            {t('Sources ({{size}})', { size: configs.length })}
          </StackItem>
          <StackItem>
            <RepositorySourceList configs={configs} dependencyStatus={device.status.dependencySync} />
          </StackItem>
        </Stack>
      </CardBody>
    </DetailsPageCard>
  );
};

export default ConfigurationsContent;
