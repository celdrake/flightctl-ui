import * as React from 'react';
import {
  CardBody,
  CardTitle,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Title,
} from '@patternfly/react-core';

import { type Device } from '@flightctl/types';
import { useTranslation } from '../../../../hooks/useTranslation';
import DetailsPageCard from '../../../DetailsPage/DetailsPageCard';
import DeviceResourceStatus, { MonitorType } from '../../../Status/DeviceResourceStatus';

type SystemResourcesContentProps = {
  device: Required<Device>;
  embedded?: boolean;
};

const SystemResourcesContent = ({ device, embedded = false }: SystemResourcesContentProps) => {
  const { t } = useTranslation();

  const descriptionList = (
    <DescriptionList columnModifier={{ default: '3Col' }}>
      <DescriptionListGroup>
        <DescriptionListTerm>{t('CPU pressure')}</DescriptionListTerm>
        <DescriptionListDescription>
          <DeviceResourceStatus device={device} monitorType={MonitorType.cpu} />
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>{t('Disk pressure')}</DescriptionListTerm>
        <DescriptionListDescription>
          <DeviceResourceStatus device={device} monitorType={MonitorType.disk} />
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>{t('Memory pressure')}</DescriptionListTerm>
        <DescriptionListDescription>
          <DeviceResourceStatus device={device} monitorType={MonitorType.memory} />
        </DescriptionListDescription>
      </DescriptionListGroup>
    </DescriptionList>
  );

  if (embedded) {
    return (
      <>
        <Title headingLevel="h3" size="md">
          {t('Resource status')}
        </Title>
        {descriptionList}
      </>
    );
  }

  return (
    <DetailsPageCard>
      <CardTitle>{t('Resource status')}</CardTitle>
      <CardBody>{descriptionList}</CardBody>
    </DetailsPageCard>
  );
};

export default SystemResourcesContent;
