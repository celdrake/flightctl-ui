import * as React from 'react';
import {
  Alert,
  Button,
  DrawerActions,
  DrawerCloseButton,
  DrawerHead,
  DrawerPanelBody,
  Label,
  LabelGroup,
  Stack,
  StackItem,
  Tooltip,
} from '@patternfly/react-core';

import type { Device } from '@flightctl/types';
import { useTranslation } from '../../../hooks/useTranslation';
import FlightCtlPageDrawer from '../../common/FlightCtlPageDrawer';
import LabelWithHelperText from '../../common/WithHelperText';
import { partitionManagedLabels } from '../../../hooks/useDeviceLabelProvenance';
import { FlightCtlLabel } from '../../../types/extraTypes';

/** Max novel chips shown inline before directing the user to View all. */
// CELIA-WIP: limit set to 5 in rhem-paola
export const DEVICE_REPORTED_NOVEL_INLINE_LIMIT = 3;

type DeviceManagedLabelsDrawerProps = {
  device: Device;
  managedLabelKeys: string[];
};

/** TEMP: gray read-only chip for mapping-promoted labels (EDM-5268 demo). */
const ManagedLabel = ({ label }: { label: FlightCtlLabel }) => {
  const { t } = useTranslation();
  const text = label.value ? `${label.key}=${label.value}` : label.key;

  return (
    <Tooltip
      content={t(
        'Promoted from device status by organization mappings. Used for device selection and mapping; cannot be edited on the device.',
      )}
    >
      <span tabIndex={0}>
        <Label color="grey">{text}</Label>
      </span>
    </Tooltip>
  );
};

/**
 * TEMP EDM-5268 demo: novel device-reported chips + View all drawer.
 * Keys that already appear as systemInfo/customInfo fields stay on those cards.
 */
const DeviceManagedLabelsDrawer = ({ device, managedLabelKeys }: DeviceManagedLabelsDrawerProps) => {
  const { t } = useTranslation();
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  // CELIA-WIP: useLabelProvenance already provides the split
  // CELIA-WIP: DO NOT GENERATE SYSTEMINFORESULT AGAIN FOR THIS FUNCTIONALITY
  const { primaryLabels, derivedLabels } = partitionManagedLabels(device, managedLabelKeys);
  const inlineDerived = primaryLabels.slice(0, DEVICE_REPORTED_NOVEL_INLINE_LIMIT);
  const hasMoreDerived = primaryLabels.length > DEVICE_REPORTED_NOVEL_INLINE_LIMIT;

  return (
    <>
      <Stack hasGutter>
        <StackItem>
          <LabelWithHelperText
            label={t('Device-reported information')}
            content={t(
              'Values promoted from device status by organization label sync mappings. They influence device selection and mapping, and cannot be edited on the device.',
            )}
          />
        </StackItem>
        {derivedLabels.length === 0 ? (
          <StackItem>
            <Alert isInline isPlain variant="info" title={t('No additional device-reported information')}>
              {t(
                'Values that already appear in system info or custom data stay on those fields. Use View all to review the full mapped label set.',
              )}
            </Alert>
          </StackItem>
        ) : (
          <StackItem>
            <LabelGroup numLabels={DEVICE_REPORTED_NOVEL_INLINE_LIMIT}>
              {inlineDerived.map((label) => (
                <ManagedLabel key={label.key} label={label} />
              ))}
            </LabelGroup>
            {hasMoreDerived && (
              <div>
                {t('+{{count}} more - open View all', {
                  count: derivedLabels.length - DEVICE_REPORTED_NOVEL_INLINE_LIMIT,
                })}
              </div>
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
              {t('Device-reported information')}
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
                  <LabelGroup numLabels={derivedLabels.length}>
                    {derivedLabels.map((label) => (
                      <ManagedLabel key={label.key} label={label} />
                    ))}
                  </LabelGroup>
                </StackItem>
              </Stack>
            </DrawerPanelBody>
          </>
        }
      />
    </>
  );
};

export default DeviceManagedLabelsDrawer;
