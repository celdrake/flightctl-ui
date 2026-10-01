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
import { labelEntries, partitionManagedLabels } from '../../../hooks/useDeviceLabelProvenance';
import { useTranslation } from '../../../hooks/useTranslation';
import FlightCtlPageDrawer from '../../common/FlightCtlPageDrawer';
import LabelWithHelperText from '../../common/WithHelperText';

/** Max novel chips shown inline before directing the user to View all. */
// CELIA-WIP: limit set to 5 in rhem-paola
export const DEVICE_REPORTED_NOVEL_INLINE_LIMIT = 3;

type DeviceManagedLabelsDrawerProps = {
  device: Device;
  labels: Record<string, string>;
};

type ManagedLabelProps = {
  labelKey: string;
  value: string;
};

/** TEMP: gray read-only chip for mapping-promoted labels (EDM-5268 demo). */
const ManagedLabel = ({ labelKey, value }: ManagedLabelProps) => {
  const { t } = useTranslation();
  const text = value ? `${labelKey}=${value}` : labelKey;

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
const DeviceManagedLabelsDrawer = ({ device, labels }: DeviceManagedLabelsDrawerProps) => {
  const { t } = useTranslation();
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const { novel } = partitionManagedLabels(labels, device);
  // CELIA-WIP redo all of this
  const novelEntries = labelEntries(novel);
  const allEntries = labelEntries(labels);
  const inlineNovel = novelEntries.slice(0, DEVICE_REPORTED_NOVEL_INLINE_LIMIT);
  const hasMoreNovel = novelEntries.length > DEVICE_REPORTED_NOVEL_INLINE_LIMIT;

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
        {novelEntries.length === 0 ? (
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
              {inlineNovel.map(({ key, value }) => (
                <ManagedLabel key={key} labelKey={key} value={value} />
              ))}
            </LabelGroup>
            {hasMoreNovel && (
              <div>
                {t('+{{count}} more - open View all', {
                  count: novelEntries.length - DEVICE_REPORTED_NOVEL_INLINE_LIMIT,
                })}
              </div>
            )}
          </StackItem>
        )}
        {allEntries.length > 0 && (
          <StackItem>
            <Button variant="link" isInline onClick={() => setDrawerOpen(true)}>
              {t('View all device-reported information ({{count}})', { count: allEntries.length })}
            </Button>
          </StackItem>
        )}
      </Stack>
      <FlightCtlPageDrawer
        isExpanded={drawerOpen}
        panelContent={
          <>
            <DrawerHead>
              <span>{t('Device-reported information')}</span>
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
                  <LabelGroup numLabels={allEntries.length}>
                    {allEntries.map(({ key, value }) => (
                      <ManagedLabel key={key} labelKey={key} value={value} />
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
