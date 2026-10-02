import * as React from 'react';
import {
  Alert,
  Button,
  Content,
  ContentVariants,
  DrawerActions,
  DrawerCloseButton,
  DrawerHead,
  DrawerPanelBody,
  Stack,
  StackItem,
} from '@patternfly/react-core';

import type { Device } from '@flightctl/types';
import { partitionManagedLabels } from '../../../hooks/useDeviceLabelProvenance';
import { useTranslation } from '../../../hooks/useTranslation';
import FlightCtlPageDrawer from '../../common/FlightCtlPageDrawer';
import { ManagedLabelsView } from '../../common/LabelsView';

// CELIA-WIP: limit set to 5 in rhem-paola
export const DERIVED_MANAGED_LABELS_LIMIT = 3;

type DeviceManagedLabelsProps = {
  device: Device;
  managedLabelKeys: string[];
};

/**
 * Derived (non–systemInfo/customInfo) chips inline; full managed label set in the drawer.
 * Primary labels already appear on System info / Custom data cards.
 */
const DeviceManagedLabels = ({ device, managedLabelKeys }: DeviceManagedLabelsProps) => {
  const { t } = useTranslation();
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const managedLabels = partitionManagedLabels(device, managedLabelKeys, device.status?.systemInfo);
  const hasMoreDerived = managedLabels.derivedCount > DERIVED_MANAGED_LABELS_LIMIT;
  const hasManagedLabels = managedLabels.totalCount > 0;

  return (
    <>
      <Stack hasGutter>
        {managedLabels.derivedCount === 0 ? (
          <StackItem>
            <Alert isInline isPlain variant="info" title={t('No additional device-reported information')}>
              {t(
                'Values that already appear in system info or custom data stay on those fields. Use View all to review the full mapped label set.',
              )}
            </Alert>
          </StackItem>
        ) : (
          <StackItem className="fctl-managed-labels-view">
            <ManagedLabelsView managedLabels={managedLabels} showOnly={DERIVED_MANAGED_LABELS_LIMIT} />

            {hasMoreDerived && (
              <Content>
                {t('+{{moreItems}} more', {
                  moreItems: managedLabels.derivedCount - DERIVED_MANAGED_LABELS_LIMIT,
                })}
              </Content>
            )}
          </StackItem>
        )}
        {hasManagedLabels && (
          <StackItem>
            <Button variant="link" isInline onClick={() => setDrawerOpen(true)}>
              {t('View all device-reported information ({{num}})', { num: managedLabels.totalCount })}
            </Button>
          </StackItem>
        )}
      </Stack>
      <FlightCtlPageDrawer
        isExpanded={drawerOpen}
        panelContent={
          <>
            <DrawerHead>
              <Content component={ContentVariants.h3}>{t('Device-reported information')}</Content>
              <DrawerActions>
                <DrawerCloseButton onClose={() => setDrawerOpen(false)} />
              </DrawerActions>
            </DrawerHead>
            <DrawerPanelBody>
              <Stack hasGutter>
                <StackItem>
                  <Alert isInline variant="info" title={t('Read-only')}>
                    {t(
                      'These values come from device status via organization mappings. Configuration is org-level only; they cannot be edited on the device.',
                    )}
                  </Alert>
                </StackItem>
                <StackItem>
                  <ManagedLabelsView managedLabels={managedLabels} />
                </StackItem>
              </Stack>
            </DrawerPanelBody>
          </>
        }
      />
    </>
  );
};

export default DeviceManagedLabels;
