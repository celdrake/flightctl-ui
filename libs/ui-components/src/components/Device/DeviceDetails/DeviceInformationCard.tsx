import * as React from 'react';
import { CardBody } from '@patternfly/react-core';
import IdBadgeIcon from '@patternfly/react-icons/dist/js/icons/id-badge-icon';

import { type Device } from '@flightctl/types';
import { useTranslation } from '../../../hooks/useTranslation';
import EditLabelsForm, { ViewLabels } from '../../modals/EditLabelsModal/EditLabelsForm';
import ResourceLink from '../../common/ResourceLink';
import DetailsPageCard, { DetailsPageCardTitle } from '../../DetailsPage/DetailsPageCard';
import DeviceFleet from './DeviceFleet';
import SidebarSpecFieldList, { type SidebarSpecField } from './SidebarSpecFieldList';

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

  // CELIA-WIP: EDM-3863 design uses "Device ID" for metadata.name (not "Name").
  // CELIA-WIP: EDM-3863 design uses label term "Fleet" (we use "Fleet" below; was "Fleet name").
  // CELIA-WIP: EDM-3863 labels — blue compact chips, "Add label" link on its own row below chips,
  // full-width key=value (no textMaxWidth). We did not change Label/LabelsField components here.

  const identityFields: SidebarSpecField[] = [
    {
      key: 'name',
      term: t('Name'),
      description: <ResourceLink id={device.metadata.name || '-'} />,
    },
    {
      key: 'fleet',
      term: t('Fleet'),
      description: <DeviceFleet device={device} />,
    },
    {
      key: 'labels',
      term: t('Labels'),
      description: canEdit ? (
        <EditLabelsForm device={device} onDeviceUpdate={refetch} />
      ) : (
        <ViewLabels device={device} />
      ),
    },
  ];

  return (
    <DetailsPageCard>
      <DetailsPageCardTitle icon={<IdBadgeIcon />}>{t('Device information')}</DetailsPageCardTitle>
      <CardBody>
        {children ? (
          <>
            <SidebarSpecFieldList fields={[identityFields[0]]} />
            <div className="pf-v6-u-my-md">{children}</div>
            <SidebarSpecFieldList fields={identityFields.slice(1)} />
          </>
        ) : (
          <SidebarSpecFieldList fields={identityFields} />
        )}
      </CardBody>
    </DetailsPageCard>
  );
};

export default DeviceInformationCard;
