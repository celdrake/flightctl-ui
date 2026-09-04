import * as React from 'react';
import { CardBody, Divider, ExpandableSection, Stack, StackItem, Title } from '@patternfly/react-core';
import AddressCardIcon from '@patternfly/react-icons/dist/js/icons/address-card-icon';

import { type Device } from '@flightctl/types';
import { useTranslation } from '../../../hooks/useTranslation';
import { useDeviceSpecSystemInfo } from '../../../hooks/useDeviceSpecSystemInfo';
import DetailsPageCard, { DetailsPageCardTitle } from '../../DetailsPage/DetailsPageCard';
import ConfigurationsContent from './DeviceDetailsTabContent/ConfigurationsContent';
import SidebarSpecFieldList, { type SidebarSpecField } from './SidebarSpecFieldList';

import './DeviceDetailsTab.css';

const MIN_SYSTEM_INFO_FIELDS_FOR_EXPAND = 8;
const PRIMARY_SYSTEM_INFO_VISIBLE_COUNT = 4;

const DeviceSpecificationsCard = ({ device }: { device: Required<Device> }) => {
  const { t } = useTranslation();
  const devSystemInfo = useDeviceSpecSystemInfo(device.status, t);
  const [showMoreSystemInfo, setShowMoreSystemInfo] = React.useState(false);

  const osModeTitle = t('OS mode');

  const { systemInfoFields, osModeField } = React.useMemo(() => {
    const osModeEntry = devSystemInfo.baseInfo.find((entry) => entry.title === osModeTitle);
    const withoutOsMode = devSystemInfo.baseInfo.filter((entry) => entry.title !== osModeTitle);

    return {
      systemInfoFields: withoutOsMode,
      osModeField: osModeEntry
        ? ({
            key: 'osMode',
            term: osModeEntry.title,
            description: osModeEntry.value,
          } satisfies SidebarSpecField)
        : undefined,
    };
  }, [devSystemInfo.baseInfo, osModeTitle]);

  const { visibleSystemInfoFields, expandableSystemInfoFields } = React.useMemo(() => {
    const toField = (entry: { title: string; value: React.ReactNode }): SidebarSpecField => ({
      key: entry.title,
      term: entry.title,
      description: entry.value,
    });

    // CELIA-WIP: EDM-3863 design primary order is Agent version → Operating system → Hostname →
    // TPM vendor info (then API/baseInfo order backfill). We keep useDeviceSpecSystemInfo order here.
    if (systemInfoFields.length < MIN_SYSTEM_INFO_FIELDS_FOR_EXPAND) {
      return {
        visibleSystemInfoFields: systemInfoFields.map(toField),
        expandableSystemInfoFields: [] as SidebarSpecField[],
      };
    }

    return {
      visibleSystemInfoFields: systemInfoFields.slice(0, PRIMARY_SYSTEM_INFO_VISIBLE_COUNT).map(toField),
      expandableSystemInfoFields: systemInfoFields.slice(PRIMARY_SYSTEM_INFO_VISIBLE_COUNT).map(toField),
    };
  }, [systemInfoFields]);

  const capabilityFields = osModeField ? [osModeField] : [];

  return (
    <DetailsPageCard>
      <DetailsPageCardTitle icon={<AddressCardIcon />}>{t('Device specifications')}</DetailsPageCardTitle>
      <CardBody>
        <Stack hasGutter>
          {visibleSystemInfoFields.length > 0 && (
            <StackItem>
              <SidebarSpecFieldList fields={visibleSystemInfoFields} />
            </StackItem>
          )}
          {expandableSystemInfoFields.length > 0 && (
            <StackItem>
              <ExpandableSection
                toggleText={showMoreSystemInfo ? t('Hide full system info') : t('Show full system info')}
                onToggle={(_event, expanded) => setShowMoreSystemInfo(expanded)}
                isExpanded={showMoreSystemInfo}
              >
                <SidebarSpecFieldList fields={expandableSystemInfoFields} className="pf-v6-u-mt-md" />
              </ExpandableSection>
            </StackItem>
          )}
          {capabilityFields.length > 0 && (
            <>
              <StackItem>
                <Divider />
              </StackItem>
              <StackItem>
                <Title headingLevel="h4" size="md" className="pf-v6-u-mb-sm">
                  {t('Capabilities')}
                </Title>
                <SidebarSpecFieldList fields={capabilityFields} />
              </StackItem>
            </>
          )}
          <StackItem>
            <Divider />
          </StackItem>
          <StackItem>
            <ConfigurationsContent device={device} embedded />
          </StackItem>
        </Stack>
      </CardBody>
    </DetailsPageCard>
  );
};

export default DeviceSpecificationsCard;
