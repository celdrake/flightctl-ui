import * as React from 'react';
import { Alert } from '@patternfly/react-core';

import type { Device, DeviceList } from '@flightctl/types';
import { DeviceFeatureBoolean, type DeviceFeatures } from '@flightctl/types/alpha';

import { useFetch } from '../../hooks/useFetch';
import { useTranslation } from '../../hooks/useTranslation';
import { getApiListCount } from '../../utils/api';
import { deviceFeaturesToFilters } from '../../utils/catalogDeviceFeatures';
import { commonQueries } from '../../utils/query';
import { deviceMeetsFeatureRequirements } from '../../utils/capabilities';

// For individual devices, the device's compatibility with a catalogItem can be:
// - The device meets all the feature requirements --> compatible
// - The device does not meet some of the feature requirements --> incompatible
// - The device has not reported all required features --> unknown
export const DeviceCatalogItemCompatibilityAlert = ({
  device,
  featureRequirements,
}: {
  device: Device;
  featureRequirements?: DeviceFeatures;
}) => {
  const { t } = useTranslation();
  const featureFilters = deviceFeaturesToFilters(featureRequirements);
  if (!featureFilters?.length || !device.status) {
    return null;
  }

  const compatibility = deviceMeetsFeatureRequirements(device.status, featureFilters);
  if (compatibility === DeviceFeatureBoolean.DeviceFeatureBooleanTrue) {
    return null;
  }

  if (compatibility === DeviceFeatureBoolean.DeviceFeatureBooleanFalse) {
    return (
      <Alert isInline variant="danger" title={t('Review compatibility before deploying')}>
        {t(
          'This device may not meet the requirements for this catalog item. You can continue, but the device may not be able to run the catalog item.',
        )}
      </Alert>
    );
  }

  return (
    <Alert isInline variant="info" title={t('Compatibility could not be determined')}>
      {t(
        'This device has not reported all required features. You can continue, but compatibility with this catalog item is unknown.',
      )}
    </Alert>
  );
};

// For fleets, the fleet's device compatibility with a catalogItem can be:
// - Devices that meet all the feature requirements --> compatible
// - Rest of the devices (for at least one feature, they have incompatible/unknown support for it) --> incompatible/unknown
// It's not possible to obtain a more precise count, given all the possible combinations for incompatible/unknown features.
export const FleetCatalogItemCompatibilityAlert = ({
  fleetName,
  totalDevices,
  featureRequirements,
  context = 'installWizard',
}: {
  fleetName: string;
  totalDevices: number;
  featureRequirements?: DeviceFeatures;
  context?: 'installWizard' | 'fleetDetails';
}) => {
  const { t } = useTranslation();
  const { get } = useFetch();

  const featureFilters = React.useMemo(() => deviceFeaturesToFilters(featureRequirements), [featureRequirements]);

  const [fullyCompatibleCount, setFullyCompatibleCount] = React.useState<number | undefined>();

  React.useEffect(() => {
    if (!fleetName || !featureFilters?.length || totalDevices <= 0) {
      setFullyCompatibleCount(undefined);
      return;
    }

    let cancelled = false;
    const loadCompatibleCount = async () => {
      try {
        const deviceList = await get<DeviceList>(
          commonQueries.getFullyCompatibleDeviceCount(fleetName, featureFilters),
        );
        if (!cancelled) {
          setFullyCompatibleCount(getApiListCount(deviceList) || 0);
        }
      } catch {
        if (!cancelled) {
          // Fail open: do not block deploy when the compatibility check cannot be loaded.
          setFullyCompatibleCount(undefined);
        }
      }
    };

    void loadCompatibleCount();
    return () => {
      cancelled = true;
    };
  }, [fleetName, featureFilters, totalDevices, get]);

  // Keep showing the last result while a refresh is in flight to avoid flicker.
  if (!featureFilters?.length || totalDevices <= 0 || fullyCompatibleCount === undefined) {
    return null;
  }

  const needsAttentionCount = Math.max(0, totalDevices - fullyCompatibleCount);
  if (needsAttentionCount === 0) {
    return null;
  }

  const countParams = { numOfDevices: needsAttentionCount, totalDevices, count: totalDevices };
  const title =
    context === 'fleetDetails' ? t('Catalog deployments need attention') : t('Review compatibility before deploying');
  const body =
    context === 'fleetDetails'
      ? t(
          '{{numOfDevices}} of {{totalDevices}} devices may not meet the requirements for catalog items deployed to this fleet. Some devices may not be able to run those catalog items.',
          countParams,
        )
      : t(
          '{{numOfDevices}} of {{totalDevices}} devices may not meet the requirements for this catalog item. You can continue, but some devices may not be able to run the catalog item.',
          countParams,
        );

  return (
    <Alert isInline variant="warning" title={title}>
      {body}
    </Alert>
  );
};
