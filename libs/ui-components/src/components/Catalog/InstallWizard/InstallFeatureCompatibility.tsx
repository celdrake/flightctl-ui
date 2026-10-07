import * as React from 'react';
import {
  Alert,
  Button,
  Content,
  ContentVariants,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Label,
  Popover,
  Stack,
  StackItem,
} from '@patternfly/react-core';

import type { DeviceList } from '@flightctl/types';
import { DeviceFeatureBoolean, type DeviceFeatures } from '@flightctl/types/alpha';

import { useTranslation } from '../../../hooks/useTranslation';
import { useFetch } from '../../../hooks/useFetch';
import { type DeviceFeatureFilter, getFeatureName } from '../../../utils/status/devices';
import { commonQueries } from '../../../utils/query';
import { getApiListCount } from '../../../utils/api';
import { getErrorMessage } from '../../../utils/error';
import { deviceFeaturesToFilters } from '../../../utils/catalogDeviceFeatures';

const FeatureCompatibilityContent = ({
  fleetName,
  featureRequirements,
  fleetDevicesCount,
}: {
  fleetName: string;
  featureRequirements: DeviceFeatureFilter[];
  fleetDevicesCount: number | undefined;
}) => {
  const { t } = useTranslation();
  const { get } = useFetch();
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [compatibleCount, setCompatibleCount] = React.useState<number>();
  const [error, setError] = React.useState<string>();

  const checkCompatibility = React.useCallback(async () => {
    if (!featureRequirements || !fleetName) {
      return;
    }
    setIsLoading(true);
    setError(undefined);
    try {
      const deviceList = await get<DeviceList>(commonQueries.getCompatibleDeviceCount(fleetName, featureRequirements));
      setCompatibleCount(getApiListCount(deviceList) || 0);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setIsLoading(false);
    }
  }, [featureRequirements, fleetName, get]);

  const openPopover = React.useCallback(() => {
    setIsOpen(true);
    if (compatibleCount === undefined && !isLoading) {
      void checkCompatibility();
    }
  }, [checkCompatibility, compatibleCount, isLoading]);

  const hasResolvedCounts = fleetDevicesCount !== undefined && compatibleCount !== undefined;
  const isCompatible = hasResolvedCounts && compatibleCount === fleetDevicesCount;

  return (
    <Popover
      aria-label={t('Device feature compatibility details')}
      isVisible={isOpen}
      shouldClose={() => setIsOpen(false)}
      shouldOpen={openPopover}
      withFocusTrap={false}
      bodyContent={
        <Stack hasGutter>
          <StackItem>
            <Content component={ContentVariants.small}>{t('This catalog item requires:')}</Content>
          </StackItem>
          <StackItem>
            <DescriptionList isCompact>
              {featureRequirements.map(({ fieldId, values }) => (
                <DescriptionListGroup key={fieldId}>
                  <DescriptionListTerm>{getFeatureName(t, fieldId)}</DescriptionListTerm>
                  <DescriptionListDescription>
                    {values[0] === DeviceFeatureBoolean.DeviceFeatureBooleanTrue ? t('Required') : t('Must be absent')}
                  </DescriptionListDescription>
                </DescriptionListGroup>
              ))}
            </DescriptionList>
          </StackItem>
          {hasResolvedCounts && (
            <StackItem>
              <DescriptionList isCompact>
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Devices in fleet')}</DescriptionListTerm>
                  <DescriptionListDescription>{fleetDevicesCount}</DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Meet requirements')}</DescriptionListTerm>
                  <DescriptionListDescription>{compatibleCount}</DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Need review')}</DescriptionListTerm>
                  <DescriptionListDescription>
                    {Math.max(0, fleetDevicesCount - compatibleCount)}
                  </DescriptionListDescription>
                </DescriptionListGroup>
              </DescriptionList>
            </StackItem>
          )}
          {error && (
            <StackItem>
              <Alert isInline isPlain variant="danger" title={t('Compability check failed')}>
                {error}
              </Alert>
            </StackItem>
          )}
        </Stack>
      }
    >
      <Button variant="link" isInline>
        {t('Check')}
        {hasResolvedCounts && (
          <Label isCompact status={isCompatible ? 'success' : 'warning'} className="pf-v6-u-ml-sm">
            {isCompatible ? t('Compatible') : t('Needs review')}
          </Label>
        )}
      </Button>
    </Popover>
  );
};

const FeatureCompatibility = ({
  fleetName,
  featureRequirements,
  fleetDevicesCount,
}: {
  fleetName: string;
  featureRequirements?: DeviceFeatures;
  fleetDevicesCount: number | undefined;
}) => {
  const { t } = useTranslation();
  if (fleetDevicesCount === 0) {
    return t('No devices in fleet');
  }

  // Convert the data to a format that's easier to use.
  const featureFilters = deviceFeaturesToFilters(featureRequirements);
  if (!featureFilters) {
    return t('No requirements are needed');
  }

  return (
    <FeatureCompatibilityContent
      fleetName={fleetName}
      featureRequirements={featureFilters}
      fleetDevicesCount={fleetDevicesCount}
    />
  );
};

export default FeatureCompatibility;
