import * as React from 'react';
import {
  CardBody,
  CardTitle,
  DescriptionList,
  Title,
} from '@patternfly/react-core';

import { type Device } from '@flightctl/types';
import { useTranslation } from '../../../../hooks/useTranslation';
import DetailsPageCard from '../../../DetailsPage/DetailsPageCard';
import {
  DeviceStatusFieldGroup,
  useDeviceOverviewStatusFields,
} from '../deviceOverviewStatusFields';

type SystemResourcesContentProps = {
  device: Required<Device>;
  embedded?: boolean;
};

const SystemResourcesContent = ({ device, embedded = false }: SystemResourcesContentProps) => {
  const { t } = useTranslation();
  const { resourceFields } = useDeviceOverviewStatusFields(device, t);

  const descriptionList = (
    <DescriptionList isCompact className="pf-v6-u-mt-sm fctl-device-status-fields">
      {resourceFields.map((field) => (
        <DeviceStatusFieldGroup key={field.id} field={field} />
      ))}
    </DescriptionList>
  );

  if (embedded) {
    return (
      <>
        <Title headingLevel="h3" size="md" className="pf-v6-u-mt-md">
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
