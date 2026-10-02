import * as React from 'react';
import {
  CardBody,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from '@patternfly/react-core';
import IdBadgeIcon from '@patternfly/react-icons/dist/js/icons/id-badge-icon';

import type { Device } from '@flightctl/types';
import useDeviceLabelProvenance from '../../../hooks/useDeviceLabelProvenance';
import { useTranslation } from '../../../hooks/useTranslation';
import ResourceLink from '../../common/ResourceLink';
import LabelWithHelperText from '../../common/WithHelperText';
import DetailsPageCard, { DetailsPageCardTitle } from '../../DetailsPage/DetailsPageCard';
import EditLabelsForm, { ViewLabels } from '../../modals/EditLabelsModal/EditLabelsForm';
import DeviceFleet from './DeviceFleet';
import DeviceManagedLabelsDrawer from './DeviceManagedLabelsDrawer';
import SidebarDescriptionList from './SidebarDescriptionList';

import './DeviceDetailsTab.css';

type DeviceIdentityCardProps = {
  device: Required<Device>;
  refetch: VoidFunction;
  canEdit: boolean;
};

const DeviceIdentityCard = ({
  device,
  refetch,
  canEdit,
  children,
}: React.PropsWithChildren<DeviceIdentityCardProps>) => {
  const { t } = useTranslation();
  const { labelKeys: managedLabelKeys, isLoading } = useDeviceLabelProvenance(device);

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
                  hideLabel
                  label={t('Device-reported information')}
                  content={t(
                    'Values promoted from device status by organization label sync mappings. They influence device selection and mapping, and cannot be edited on the device.',
                  )}
                />
              </DescriptionListTerm>
              <DescriptionListDescription>
                <DeviceManagedLabelsDrawer device={device} managedLabelKeys={managedLabelKeys} />
              </DescriptionListDescription>
            </DescriptionListGroup>
          )}
          {children}
        </SidebarDescriptionList>
      </CardBody>
    </DetailsPageCard>
  );
};

export default DeviceIdentityCard;
