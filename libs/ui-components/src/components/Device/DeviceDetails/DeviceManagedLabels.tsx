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
import { useTranslation } from '../../../hooks/useTranslation';
import { partitionManagedLabels } from '../../../hooks/useDeviceLabelProvenance';
import FlightCtlPageDrawer from '../../common/FlightCtlPageDrawer';
import { ManagedLabelsView } from '../../common/LabelsView';
import { DeviceSystemInfoResult } from '../../../hooks/useDeviceSystemInfo';

/** Max novel chips shown inline before directing the user to View all. */
// CELIA-WIP: limit set to 5 in rhem-paola
export const DEVICE_REPORTED_NOVEL_INLINE_LIMIT = 3;

type DeviceManagedLabelsDrawerProps = {
  device: Device;
  systemInfoResult: DeviceSystemInfoResult;
  managedLabelKeys: string[];
};

// CELIA-WIP see how to use systemInfoResult to filter out labels that are already in systemInfo/customInfo
/**
 * TEMP EDM-5268 demo: novel device-reported chips + View all drawer.
 * Keys that already appear as systemInfo/customInfo fields stay on those cards.
 */
const DeviceManagedLabels = ({ device, managedLabelKeys }: DeviceManagedLabelsDrawerProps) => {
  const { t } = useTranslation();
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  // CELIA-WIP: useLabelProvenance already provides the split
  const { primaryLabels, derivedLabels } = partitionManagedLabels(device, managedLabelKeys);
  const inlineDerived = primaryLabels.slice(0, DEVICE_REPORTED_NOVEL_INLINE_LIMIT);
  const hasMoreDerived = primaryLabels.length > DEVICE_REPORTED_NOVEL_INLINE_LIMIT;

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
        {derivedLabels.length > 0 && (
          <StackItem>
            <Button variant="link" isInline onClick={() => setDrawerOpen(true)}>
              {t('View all device-reported information ({{count}})', { count: derivedLabels.length })}
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
                  <ManagedLabelsView numLabels={derivedLabels.length} managedLabels={derivedLabels} />
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
