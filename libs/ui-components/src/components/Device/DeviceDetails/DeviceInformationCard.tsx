import * as React from 'react';
import {
  CardBody,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from '@patternfly/react-core';
import IdBadgeIcon from '@patternfly/react-icons/dist/js/icons/id-badge-icon';

import { type Device } from '@flightctl/types';
import { useTranslation } from '../../../hooks/useTranslation';
import EditLabelsForm, { ViewLabels } from '../../modals/EditLabelsModal/EditLabelsForm';
import ResourceLink from '../../common/ResourceLink';
import DetailsPageCard, { DetailsPageCardTitle } from '../../DetailsPage/DetailsPageCard';
import DeviceFleet from './DeviceFleet';
import SidebarDescriptionList from './SidebarDescriptionList';

import './DeviceDetailsTab.css';

type DeviceInformationCardProps = {
  device: Required<Device>;
  refetch: VoidFunction;
  canEdit: boolean;
};

const DeviceInformationCard = ({
  device,
  refetch,
  canEdit,
  children,
}: React.PropsWithChildren<DeviceInformationCardProps>) => {
  const { t } = useTranslation();

  // CELIA-WIP: EDM-3863 Open question --> Blue or Grey labels. COnsider elsewhere where we use labels

  // CELIA-WIP review the Microshift cluster position
  return (
    <DetailsPageCard>
      <DetailsPageCardTitle icon={<IdBadgeIcon />}>{t('Device information')}</DetailsPageCardTitle>
      <CardBody>
        <SidebarDescriptionList>
          <DescriptionListGroup>
            <DescriptionListTerm>{t('Name')}</DescriptionListTerm>
            <DescriptionListDescription>
              <ResourceLink id={device.metadata.name || '-'} />
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>{t('Fleet')}</DescriptionListTerm>
            <DescriptionListDescription>
              <DeviceFleet device={device} />
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>{t('Labels')}</DescriptionListTerm>
            <DescriptionListDescription>
              {canEdit ? <EditLabelsForm device={device} onDeviceUpdate={refetch} /> : <ViewLabels device={device} />}
            </DescriptionListDescription>
          </DescriptionListGroup>
        </SidebarDescriptionList>
        {children}
      </CardBody>
    </DetailsPageCard>
  );
};

export default DeviceInformationCard;
