import * as React from 'react';
import { CardBody, CardTitle, Grid, GridItem, Stack, StackItem } from '@patternfly/react-core';

import { type Device } from '@flightctl/types';
import { useTranslation } from '../../../hooks/useTranslation';
import EditLabelsForm, { ViewLabels } from '../../modals/EditLabelsModal/EditLabelsForm';
import ResourceLink from '../../common/ResourceLink';
import DetailsPageCard from '../../DetailsPage/DetailsPageCard';
import DeviceFleet from './DeviceFleet';

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

  return (
    <DetailsPageCard>
      <CardTitle>{t('Device information')}</CardTitle>
      <CardBody>
        <Grid>
          <GridItem span={12}>
            <Stack>
              <StackItem className="fctl-device-details-tab__label">{t('Name')}</StackItem>
              <StackItem>
                <ResourceLink id={device.metadata.name || '-'} />
              </StackItem>
            </Stack>
          </GridItem>
          {children && <GridItem span={12}>{children}</GridItem>}
          <GridItem span={12}>
            <Stack>
              <StackItem className="fctl-device-details-tab__label">{t('Fleet name')}</StackItem>
              <StackItem>
                <DeviceFleet device={device} />
              </StackItem>
            </Stack>
          </GridItem>
          <GridItem span={12}>
            <Stack>
              <StackItem className="fctl-device-details-tab__label">{t('Labels')}</StackItem>
              <StackItem>
                {canEdit ? (
                  <EditLabelsForm device={device} onDeviceUpdate={refetch} />
                ) : (
                  <ViewLabels device={device} />
                )}
              </StackItem>
            </Stack>
          </GridItem>
        </Grid>
      </CardBody>
    </DetailsPageCard>
  );
};

export default DeviceInformationCard;
