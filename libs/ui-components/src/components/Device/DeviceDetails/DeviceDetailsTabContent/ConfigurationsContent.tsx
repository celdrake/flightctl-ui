import * as React from 'react';
import { Alert, CardBody, CardTitle, Divider, Spinner, Stack, StackItem, Title } from '@patternfly/react-core';

import type { Device, Fleet, ImageOrCatalogItemRefSpec } from '@flightctl/types';
import { useTranslation } from '../../../../hooks/useTranslation';
import { useDeviceOwnerFleet } from '../../../../hooks/useDeviceOwnerFleet';
import { hasPackageModeCapability } from '../../../../utils/capabilities';
import RepositorySourceList from '../../../Repository/RepositoryDetails/RepositorySourceList';
import DetailsPageCard from '../../../DetailsPage/DetailsPageCard';
import DeviceOs from '../DeviceOs';

const DevicePackageModeOsImage = () => {
  const { t } = useTranslation();
  return (
    <Stack hasGutter>
      <StackItem className="pf-v6-u-text-color-subtle">{t('System image')}</StackItem>
      <StackItem>
        <Alert
          isInline
          isPlain
          variant="warning"
          title={t(
            "This device uses package-based OS management and cannot satisfy the fleet's OS image requirement. The device will remain out of date and unable to apply any fleet updates. To resolve this, remove the device from the fleet or update it to a bootable container image.",
          )}
        />
      </StackItem>
    </Stack>
  );
};

const DeviceRunningOsImage = ({
  ownerFleetError,
  osSpec,
  statusOsImage,
}: {
  ownerFleetError: boolean;
  statusOsImage: string | undefined;
  osSpec: ImageOrCatalogItemRefSpec | undefined;
}) => {
  const { t } = useTranslation();

  return (
    <Stack hasGutter>
      {ownerFleetError ? (
        <StackItem>
          <Alert isInline variant="warning" title={t('OS image status not fully determined')}>
            {t('The device is bound to a fleet, but its OS image status could not be determined.')}
          </Alert>
        </StackItem>
      ) : null}

      <StackItem className="pf-v6-u-text-color-subtle">{t('System image (running)')}</StackItem>
      <StackItem>
        <DeviceOs osSpec={osSpec} renderedOsImage={statusOsImage} />
      </StackItem>
    </Stack>
  );
};

const DeviceOsImageSection = ({
  device,
  ownerFleet,
  ownerFleetError,
}: {
  device: Required<Device>;
  ownerFleet?: Fleet;
  ownerFleetError: unknown;
}) => {
  const osSpec = ownerFleet?.spec?.template?.spec?.os || device.spec?.os;
  const hasImageInSpec = osSpec?.image || osSpec?.catalogItemRef;
  const isPackageMode = hasPackageModeCapability(device);

  const showPackageModeInfo = isPackageMode && !ownerFleetError;
  if (showPackageModeInfo && !hasImageInSpec) {
    return null;
  }

  let content: React.ReactNode = null;
  if (showPackageModeInfo) {
    content = <DevicePackageModeOsImage />;
  } else {
    content = (
      <DeviceRunningOsImage
        ownerFleetError={!!ownerFleetError}
        osSpec={osSpec}
        statusOsImage={device.status?.os?.image}
      />
    );
  }
  return (
    <>
      {content}
      <Divider />
    </>
  );
};

type ConfigurationsContentProps = {
  device: Required<Device>;
  embedded?: boolean;
};

const ConfigurationsContent = ({ device, embedded = false }: ConfigurationsContentProps) => {
  const { t } = useTranslation();

  const configs = device.spec?.config || [];
  const [hasOwnerFleet, ownerFleet, ownerFleetLoading, ownerFleetError] = useDeviceOwnerFleet(device.metadata.owner);

  if (hasOwnerFleet && ownerFleetLoading) {
    return <Spinner />;
  }

  const body = (
    <Stack hasGutter>
      <DeviceOsImageSection device={device} ownerFleet={ownerFleet} ownerFleetError={ownerFleetError} />
      <StackItem className="pf-v6-u-font-weight-bold">{t('Sources ({{size}})', { size: configs.length })}</StackItem>
      <StackItem>
        <RepositorySourceList configs={configs} dependencyStatus={device.status.dependencySync} />
      </StackItem>
    </Stack>
  );

  if (embedded) {
    return (
      <Stack hasGutter>
        <StackItem>
          <Title headingLevel="h3" size="md">
            {t('Configurations')}
          </Title>
        </StackItem>
        <StackItem>{body}</StackItem>
      </Stack>
    );
  }

  return (
    <DetailsPageCard>
      <CardTitle>{t('Configurations')}</CardTitle>
      <CardBody>{body}</CardBody>
    </DetailsPageCard>
  );
};

export default ConfigurationsContent;
