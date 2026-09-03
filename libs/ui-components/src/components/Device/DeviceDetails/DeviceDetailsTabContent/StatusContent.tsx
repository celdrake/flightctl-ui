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
import LabelWithHelperText from '../../../common/WithHelperText';
import ApplicationSummaryStatus from '../../../Status/ApplicationSummaryStatus';
import DeviceStatus from '../../../Status/DeviceStatus';
import SystemUpdateStatus from '../../../Status/SystemUpdateStatus';
import IntegrityStatus from '../../../Status/IntegrityStatus';

type StatusContentProps = {
  device: Required<Device>;
  embedded?: boolean;
};

const StatusContent = ({ device, embedded = false }: StatusContentProps) => {
  const { t } = useTranslation();

  const descriptionList = (
    <DescriptionList columnModifier={{ default: '3Col' }}>
      <DescriptionListGroup>
        <DescriptionListTerm>
          <LabelWithHelperText
            label={t('Application status')}
            content={t('Indicates the overall status of application workloads on the device.')}
          />
        </DescriptionListTerm>
        <DescriptionListDescription>
          <ApplicationSummaryStatus statusSummary={device.status.applicationsSummary} />
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>
          <LabelWithHelperText
            label={t('Device status')}
            content={t('Indicates the overall status of the device hardware and operating system.')}
          />{' '}
        </DescriptionListTerm>
        <DescriptionListDescription>
          <DeviceStatus deviceStatus={device.status} />
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>
          <LabelWithHelperText
            label={t('Update status')}
            content={t(
              'Indicates whether a system is running the latest target configuration or is updating towards it.',
            )}
          />
        </DescriptionListTerm>
        <DescriptionListDescription>
          <SystemUpdateStatus deviceStatus={device.status} />
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>
          <LabelWithHelperText
            label={t('Integrity status')}
            content={t('Indicates whether the device has been verified as secure and authentic.')}
          />
        </DescriptionListTerm>
        <DescriptionListDescription>
          <IntegrityStatus integrityStatus={device.status.integrity} />
        </DescriptionListDescription>
      </DescriptionListGroup>
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
