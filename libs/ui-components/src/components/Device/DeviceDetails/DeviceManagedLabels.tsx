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

/** Max derived chips shown inline before directing the user to View all. */
// CELIA-WIP: limit set to 5 in rhem-paola
export const DEVICE_REPORTED_NOVEL_INLINE_LIMIT = 3;

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
  const { derivedLabels, allManagedLabels } = partitionManagedLabels(
    device,
    managedLabelKeys,
    device.status?.systemInfo,
  );
  const inlineDerived = derivedLabels.slice(0, DEVICE_REPORTED_NOVEL_INLINE_LIMIT);
  const hasMoreDerived = derivedLabels.length > DEVICE_REPORTED_NOVEL_INLINE_LIMIT;
  const hasManagedLabels = allManagedLabels.length > 0;

  return (
    <>
      <Stack hasGutter>
        {derivedLabels.length === 0 ? (
          <StackItem>
            <Alert isInline isPlain variant="info" title={t('No additional device-reported information')}>
              {t(
                'Values that already appear in system info or custom data stay on those fields. Use View all to review the full mapped label set.',
              )}
            </Alert>
          </StackItem>
        ) : (
          <StackItem className="fctl-managed-labels-view">
            <ManagedLabelsView numLabels={DEVICE_REPORTED_NOVEL_INLINE_LIMIT} managedLabels={inlineDerived} isInline />

            {hasMoreDerived && (
              <Content>
                {t('+{{moreItems}} more', {
                  moreItems: derivedLabels.length - DEVICE_REPORTED_NOVEL_INLINE_LIMIT,
                })}
              </Content>
            )}
          </StackItem>
        )}
        {hasManagedLabels && (
          <StackItem>
            <Button variant="link" isInline onClick={() => setDrawerOpen(true)}>
              {t('View all device-reported information ({{num}})', { num: allManagedLabels.length })}
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
                  <ManagedLabelsView numLabels={allManagedLabels.length} managedLabels={allManagedLabels} />
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
