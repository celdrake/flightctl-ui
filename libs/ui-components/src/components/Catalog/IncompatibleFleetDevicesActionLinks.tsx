import * as React from 'react';
import { AlertActionLink } from '@patternfly/react-core';

import type { DeviceList } from '@flightctl/types';
import type { DeviceFeatures } from '@flightctl/types/alpha';

import { useAppContext } from '../../hooks/useAppContext';
import { useFetch } from '../../hooks/useFetch';
import { ROUTE } from '../../hooks/useNavigate';
import { useTranslation } from '../../hooks/useTranslation';
import { getApiListCount } from '../../utils/api';
import {
  type IncompatibleFleetDevicesLink,
  buildIncompatibleFleetDevicesQueries,
  commonQueries,
} from '../../utils/query';
import { getFeatureName } from '../../utils/status/devices';

type IncompatibleFleetDevicesActionLinksProps = {
  fleetName: string;
  featureRequirements?: DeviceFeatures;
};

/** Alert action links to devices that fail individual catalog feature requirements. */
const IncompatibleFleetDevicesActionLinks = ({
  fleetName,
  featureRequirements,
}: IncompatibleFleetDevicesActionLinksProps) => {
  const { t } = useTranslation();
  const { get } = useFetch();
  const {
    router: { appRoutes },
  } = useAppContext();

  // Data used to identify which features have at least one device that doesn't meet the requirement.
  const candidateLinks = React.useMemo(
    () => buildIncompatibleFleetDevicesQueries(fleetName, featureRequirements),
    [fleetName, featureRequirements],
  );

  const [incompatibleFeatureLinks, setIncompatibleFeatureLinks] = React.useState<
    IncompatibleFleetDevicesLink[] | undefined
  >();

  React.useEffect(() => {
    if (!fleetName || !candidateLinks.length) {
      setIncompatibleFeatureLinks([]);
      return;
    }

    let cancelled = false;
    const loadFailingFeatures = async () => {
      try {
        // Probe with the incompatible selector (label!=requiredValue)
        const incompatibleDeviceCounts = await Promise.all(
          candidateLinks.map((link) =>
            get<DeviceList>(commonQueries.getFullyCompatibleDeviceCount(fleetName, [link.incompatibleFilters])),
          ),
        );
        if (cancelled) {
          return;
        }
        // Only show a link for features that have at least one device that doesn't meet the requirement.
        setIncompatibleFeatureLinks(
          candidateLinks.filter((_, index) => (getApiListCount(incompatibleDeviceCounts[index]) || 0) > 0),
        );
      } catch {
        if (!cancelled) {
          setIncompatibleFeatureLinks([]);
        }
      }
    };

    void loadFailingFeatures();
    return () => {
      cancelled = true;
    };
  }, [fleetName, candidateLinks, get]);

  if (!incompatibleFeatureLinks?.length) {
    return null;
  }

  return incompatibleFeatureLinks.map(({ fieldId, incompatibleQuery }) => (
    <AlertActionLink key={fieldId} component="a" href={`${appRoutes[ROUTE.DEVICES]}?${incompatibleQuery}`}>
      {incompatibleFeatureLinks.length === 1
        ? t('Review devices')
        : t('Review devices for feature ({{featureName}})', { featureName: getFeatureName(t, fieldId) })}
    </AlertActionLink>
  ));
};

export default IncompatibleFleetDevicesActionLinks;
