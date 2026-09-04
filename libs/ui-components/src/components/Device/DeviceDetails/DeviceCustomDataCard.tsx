import * as React from 'react';
import { CardBody } from '@patternfly/react-core';
import TagIcon from '@patternfly/react-icons/dist/js/icons/tag-icon';

import { type Device } from '@flightctl/types';
import { useTranslation } from '../../../hooks/useTranslation';
import { useDeviceSpecSystemInfo } from '../../../hooks/useDeviceSpecSystemInfo';
import DetailsPageCard, { DetailsPageCardTitle } from '../../DetailsPage/DetailsPageCard';
import SidebarSpecFieldList from './SidebarSpecFieldList';

import './DeviceDetailsTab.css';

const DeviceCustomDataCard = ({ device }: { device: Required<Device> }) => {
  const { t } = useTranslation();
  const devSystemInfo = useDeviceSpecSystemInfo(device.status, t);

  if (devSystemInfo.customInfo.length === 0) {
    return null;
  }

  const customDataFields = devSystemInfo.customInfo.map((entry) => ({
    key: entry.title,
    term: entry.title,
    description: entry.value,
  }));

  return (
    <DetailsPageCard>
      <DetailsPageCardTitle icon={<TagIcon />}>{t('Custom data')}</DetailsPageCardTitle>
      <CardBody>
        <SidebarSpecFieldList fields={customDataFields} />
      </CardBody>
    </DetailsPageCard>
  );
};

export default DeviceCustomDataCard;
