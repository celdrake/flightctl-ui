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

type StatusContentProps = {
  device: Required<Device>;
  embedded?: boolean;
};

const StatusContent = ({ device, embedded = false }: StatusContentProps) => {
  const { t } = useTranslation();
  const { systemFields } = useDeviceOverviewStatusFields(device, t);

  const descriptionList = (
    <DescriptionList isCompact className="pf-v6-u-mt-sm fctl-device-status-fields">
      {systemFields.map((field) => (
        <DeviceStatusFieldGroup key={field.id} field={field} />
      ))}
    </DescriptionList>
  );

  if (embedded) {
    return (
      <>
        <Title headingLevel="h3" size="md">
          {t('System status')}
        </Title>
        {descriptionList}
      </>
    );
  }

  return (
    <DetailsPageCard>
      <CardTitle>{t('System status')}</CardTitle>
      <CardBody>{descriptionList}</CardBody>
    </DetailsPageCard>
  );
};

export default StatusContent;
