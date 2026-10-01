import * as React from 'react';
import {
  CardBody,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from '@patternfly/react-core';
import IdBadgeIcon from '@patternfly/react-icons/dist/js/icons/id-badge-icon';

import type { Device } from '@flightctl/types';
import { getOperatorLabelsFromDevice, useDeviceLabelProvenance } from '../../../hooks/useDeviceLabelProvenance';
import { useTranslation } from '../../../hooks/useTranslation';
import ResourceLink from '../../common/ResourceLink';
import LabelWithHelperText from '../../common/WithHelperText';
import DetailsPageCard, { DetailsPageCardTitle } from '../../DetailsPage/DetailsPageCard';
import EditLabelsForm, { ViewLabels } from '../../modals/EditLabelsModal/EditLabelsForm';
import DeviceFleet from './DeviceFleet';
import ManagedLabelsDisplay from './DynamicLabels/ManagedLabelsDisplay';
import SidebarDescriptionList from './SidebarDescriptionList';
import { useSystemInfoDemoOptions } from './SystemInfoDemoOptions';

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
  const { showDeviceReportedInfo } = useSystemInfoDemoOptions();
  // TEMP: mock provenance until GET .../labelsyncprovenance exists
  const { items: provenanceItems } = useDeviceLabelProvenance(device);

  const labelsDevice = React.useMemo((): Required<Device> => {
    if (!showDeviceReportedInfo) {
      return device;
    }
    return {
      ...device,
      metadata: {
        ...device.metadata,
        labels: getOperatorLabelsFromDevice(device),
      },
    };
  }, [device, showDeviceReportedInfo]);

  const managedLabels = React.useMemo(() => {
    if (!showDeviceReportedInfo) {
      return {};
    }
    const allLabels = device.metadata.labels || {};
    const managed: Record<string, string> = {};
    provenanceItems.forEach(({ key }) => {
      if (allLabels[key] !== undefined) {
        managed[key] = allLabels[key];
      }
    });
    return managed;
  }, [device, provenanceItems, showDeviceReportedInfo]);

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
                <EditLabelsForm device={labelsDevice} onDeviceUpdate={refetch} />
              ) : (
                <ViewLabels device={labelsDevice} />
              )}
            </DescriptionListDescription>
          </DescriptionListGroup>
          {showDeviceReportedInfo && (
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
                <ManagedLabelsDisplay device={device} labels={managedLabels} showHeading={false} />
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
