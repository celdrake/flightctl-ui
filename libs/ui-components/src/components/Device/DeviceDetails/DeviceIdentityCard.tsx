import * as React from 'react';
import {
  CardBody,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Spinner,
} from '@patternfly/react-core';
import IdBadgeIcon from '@patternfly/react-icons/dist/js/icons/id-badge-icon';

import type { Device } from '@flightctl/types';
import useDeviceLabelProvenance from '../../../hooks/useDeviceLabelProvenance';
import { DeviceSystemInfoResult } from '../../../hooks/useDeviceSystemInfo';
import { useTranslation } from '../../../hooks/useTranslation';
import ResourceLink from '../../common/ResourceLink';
import LabelWithHelperText from '../../common/WithHelperText';
import DetailsPageCard, { DetailsPageCardTitle } from '../../DetailsPage/DetailsPageCard';
import EditLabelsForm, { ViewLabels } from '../../modals/EditLabelsModal/EditLabelsForm';
import DeviceFleet from './DeviceFleet';
import DeviceManagedLabels from './DeviceManagedLabels';
import SidebarDescriptionList from './SidebarDescriptionList';

import './DeviceDetailsTab.css';

type DeviceIdentityCardProps = {
  device: Required<Device>;
  systemInfoResult: DeviceSystemInfoResult;
  refetch: VoidFunction;
  canEdit: boolean;
};

const DeviceLabelsSection = ({
  device,
  systemInfoResult,
  canEdit,
  refetch,
}: {
  device: Required<Device>;
  systemInfoResult: DeviceSystemInfoResult;
  canEdit: boolean;
  refetch: VoidFunction;
}) => {
  const { t } = useTranslation();
  const { labelKeys: managedLabelKeys, isLoading } = useDeviceLabelProvenance(device);

  if (isLoading) {
    return (
      <DescriptionListGroup>
        <DescriptionListTerm>{t('Labels')}</DescriptionListTerm>
        <DescriptionListDescription>
          <Spinner />
        </DescriptionListDescription>
      </DescriptionListGroup>
    );
  }

  return (
    <>
      <DescriptionListGroup>
        <DescriptionListTerm>{t('Labels')}</DescriptionListTerm>
        <DescriptionListDescription>
          {canEdit ? (
            <EditLabelsForm device={device} managedLabelKeys={managedLabelKeys} onDeviceUpdate={refetch} />
          ) : (
            <ViewLabels device={device} managedLabelKeys={managedLabelKeys} />
          )}
        </DescriptionListDescription>
      </DescriptionListGroup>

      {managedLabelKeys.length > 0 && (
        <DescriptionListGroup>
          <DescriptionListTerm>
            <LabelWithHelperText
              label={t('Device-reported information')}
              content={t(
                'Values promoted from device status by organization label sync mappings. They influence device selection and mapping, and cannot be edited on the device.',
              )}
            />
          </DescriptionListTerm>
          <DescriptionListDescription>
            <DeviceManagedLabels
              device={device}
              systemInfoResult={systemInfoResult}
              managedLabelKeys={managedLabelKeys}
            />
          </DescriptionListDescription>
        </DescriptionListGroup>
      )}
    </>
  );
};

const DeviceIdentityCard = ({
  device,
  systemInfoResult,
  refetch,
  canEdit,
  children,
}: React.PropsWithChildren<DeviceIdentityCardProps>) => {
  const { t } = useTranslation();

  return (
    <DetailsPageCard>
      <DetailsPageCardTitle title={t('Device identity')} icon={<IdBadgeIcon />} />
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
          <DeviceLabelsSection
            device={device}
            systemInfoResult={systemInfoResult}
            canEdit={canEdit}
            refetch={refetch}
          />
          {children}
        </SidebarDescriptionList>
      </CardBody>
    </DetailsPageCard>
  );
};

export default DeviceIdentityCard;
