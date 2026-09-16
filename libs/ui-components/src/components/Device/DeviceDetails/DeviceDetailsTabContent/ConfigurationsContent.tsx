import * as React from 'react';
import {
  Alert,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Divider,
  Icon,
  Spinner,
  Stack,
  StackItem,
} from '@patternfly/react-core';

import type { Device, Fleet } from '@flightctl/types';
import { useTranslation } from '../../../../hooks/useTranslation';
import { useDeviceOwnerFleet } from '../../../../hooks/useDeviceOwnerFleet';
import { hasPackageModeCapability } from '../../../../utils/capabilities';
import RepositorySourceDescriptionList from '../../../Repository/RepositoryDetails/RepositorySourceList';
import ConfigurationSourcesHeader from '../../../Repository/RepositoryDetails/ConfigurationSourcesHeader';
import DeviceOs from '../DeviceOs';
import SidebarDescriptionList from '../SidebarDescriptionList';
import WithTooltip from '../../../common/WithTooltip';
import WarningTriangleIcon from '@patternfly/react-icons/dist/js/icons/warning-triangle-icon';

const DeviceOsImageWarning = ({ content }: { content: string }) => (
  <WithTooltip showTooltip content={content}>
    <Icon status="warning">
      <WarningTriangleIcon />
    </Icon>
  </WithTooltip>
);

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
    // There is no conflict since the device can fully satisfy its fleet spec
    return null;
  }

  let content: React.ReactNode = null;
  if (showPackageModeInfo) {
    // Only show this section when the fleet spec could be fetched and it defines an OS image
    content = (
      <DeviceOsImageWarning
        content={t(
          "This device uses package-based OS management and cannot satisfy the fleet's OS image requirement. The device will remain out of date and unable to apply any fleet updates. To resolve this, remove the device from the fleet or update it to a bootable container image.",
        )}
      />
    );
  } else if (ownerFleetError) {
    content = (
      <DeviceOsImageWarning
        content={t('The device is bound to a fleet, and its OS image status could not be determined.')}
      />
    );
  } else {
    content = <DeviceOs osSpec={osSpec} renderedOsImage={device.status?.os?.image} />;
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

const DeltaGenerationInfo = ({ fleetName }: { fleetName: string }) => {
  const { t } = useTranslation();

  return (
    <Stack hasGutter>
      <StackItem>
        <Divider />
      </StackItem>
      <StackItem>
        <Alert isInline variant="info" title={t('Delta generation is fleet-level only')}>
          {t(
            'This device is managed by fleet {{ fleetName }}. Delta generation is configured on the fleet and can be viewed in fleet configurations.',
            { fleetName },
          )}
        </Alert>
      </StackItem>
    </Stack>
  );
};

type ConfigurationsContentProps = {
  device: Required<Device>;
};

const ConfigurationsContent = ({ device }: ConfigurationsContentProps) => {
  const configs = device.spec?.config || [];
  const [hasOwnerFleet, ownerFleet, ownerFleetLoading, ownerFleetError] = useDeviceOwnerFleet(device.metadata.owner);

  if (hasOwnerFleet && ownerFleetLoading) {
    return <Spinner />;
  }

  const osImageSection = (
    <DeviceOsImageSection device={device} ownerFleet={ownerFleet} ownerFleetError={ownerFleetError} />
  );

  const fleetName = ownerFleet?.metadata.name;
  return (
    <Stack hasGutter>
      {osImageSection && <StackItem>{osImageSection}</StackItem>}
      <StackItem>
        <ConfigurationSourcesHeader count={configs.length} className="pf-v6-u-mb-sm" />
      </StackItem>
      {configs.length > 0 && (
        <StackItem>
          <RepositorySourceDescriptionList configs={configs} dependencyStatus={device.status.dependencySync} />
        </StackItem>
      )}
      {!ownerFleetError && fleetName && (
        <StackItem>
          <DeltaGenerationInfo fleetName={fleetName} />
        </StackItem>
      )}
    </Stack>
  );
};

export default ConfigurationsContent;
