import * as React from 'react';
import {
  Alert,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Divider,
  Spinner,
  Stack,
  StackItem,
  Title,
} from '@patternfly/react-core';

import type { Device, Fleet, ImageOrCatalogItemRefSpec } from '@flightctl/types';
import { useTranslation } from '../../../../hooks/useTranslation';
import { useDeviceOwnerFleet } from '../../../../hooks/useDeviceOwnerFleet';
import { hasPackageModeCapability } from '../../../../utils/capabilities';
import RepositorySourceList from '../../../Repository/RepositoryDetails/RepositorySourceList';
import ConfigurationSourcesHeader from '../../../Repository/RepositoryDetails/ConfigurationSourcesHeader';
import DeviceOs from '../DeviceOs';
import SidebarDescriptionList from '../SidebarDescriptionList';

const DevicePackageModeOsImage = () => {
  const { t } = useTranslation();
  return (
    <Alert
      isInline
      isPlain
      variant="warning"
      title={t(
        "This device uses package-based OS management and cannot satisfy the fleet's OS image requirement. The device will remain out of date and unable to apply any fleet updates. To resolve this, remove the device from the fleet or update it to a bootable container image.",
      )}
    />
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

  if (ownerFleetError) {
    return (
      <Alert isInline variant="warning" title={t('OS image status not fully determined')}>
        {t('The device is bound to a fleet, but its OS image status could not be determined.')}
      </Alert>
    );
  }

  return <DeviceOs osSpec={osSpec} renderedOsImage={statusOsImage} />;
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
  const { t } = useTranslation();
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

  if (!content) {
    return null;
  }

  return (
    <SidebarDescriptionList>
      <DescriptionListGroup>
        <DescriptionListTerm>{t('System image (running)')}</DescriptionListTerm>
        <DescriptionListDescription>{content}</DescriptionListDescription>
      </DescriptionListGroup>
    </SidebarDescriptionList>
  );
};

type ConfigurationsContentProps = {
  device: Required<Device>;
};

export const ConfigurationsContentBody = ({ device }: ConfigurationsContentProps) => {
  const configs = device.spec?.config || [];
  const [hasOwnerFleet, ownerFleet, ownerFleetLoading, ownerFleetError] = useDeviceOwnerFleet(device.metadata.owner);

  if (hasOwnerFleet && ownerFleetLoading) {
    return <Spinner />;
  }

  // CELIA-WIP: Determine if the header should be shown even for 0 configurations
  const sourcesSection =
    configs.length > 0 ? (
      <>
        <ConfigurationSourcesHeader count={configs.length} className="pf-v6-u-mb-sm" />
        <RepositorySourceList
          configs={configs}
          dependencyStatus={device.status.dependencySync}
          layout="horizontalDescriptionList"
        />
      </>
    ) : null;

  return (
    <Stack hasGutter>
      <DeviceOsImageSection device={device} ownerFleet={ownerFleet} ownerFleetError={ownerFleetError} />
      {sourcesSection && <StackItem>{sourcesSection}</StackItem>}
    </Stack>
  );
};

const ConfigurationsContent = ({ device }: ConfigurationsContentProps) => {
  const { t } = useTranslation();

  return (
    <Stack hasGutter>
      <StackItem>
        <Title headingLevel="h3" size="md">
          {t('Configurations')}
        </Title>
      </StackItem>
      <StackItem>
        <ConfigurationsContentBody device={device} />
      </StackItem>
    </Stack>
  );
};

export default ConfigurationsContent;
