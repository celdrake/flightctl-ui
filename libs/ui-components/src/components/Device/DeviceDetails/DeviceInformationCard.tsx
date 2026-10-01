import * as React from 'react';
import {
  CardBody,
  Divider,
  ExpandableSection,
  Flex,
  FlexItem,
  Label,
  Stack,
  StackItem,
  Title,
} from '@patternfly/react-core';
import { AddressCardIcon } from '@patternfly/react-icons/dist/js/icons/address-card-icon';

import { type Device } from '@flightctl/types';
import { type SystemInfoListResult } from '../../../hooks/useDeviceSystemInfo';
import { useTranslation } from '../../../hooks/useTranslation';
import DetailsPageCard, { DetailsPageCardTitle } from '../../DetailsPage/DetailsPageCard';
import ConfigurationsContent from './DeviceDetailsTabContent/ConfigurationsContent';
import { CapabilitiesFieldsList, SystemInfoFieldsList } from './SidebarDescriptionList';
import SystemInfoReportingBadge from './SystemInfoReportingBadge';

import './DeviceDetailsTab.css';

// CELIA-WIP: we must show an error when the label has a value which doesn't match that of systemInfo/customInfo

// CELIA-WIP: unify useDemoSystemInfoStatus so that it splits the systemInfoFields into visible and expandable sections with reporting status
// can be optional if the caller shows all eleemnts at the first level

// By default only show the first 4 fields, with the rest shown in an expandable section
// However, if there are less than 8 fields, show all of them without needing to expand
const EXPAND_SYSTEM_INFO_COUNT = 4;
const MIN_SYSTEM_INFO_FIELDS_FOR_EXPAND = 8;

const DeviceInformationCard = ({
  device,
  systemInfoResult,
}: {
  device: Required<Device>;
  systemInfoResult: SystemInfoListResult;
}) => {
  const { t } = useTranslation();
  const [isMoreInfoExpanded, setIsMoreInfoExpanded] = React.useState(false);

  const { visibleSystemInfoFields, expandableSystemInfoFields } = React.useMemo(() => {
    if (systemInfoResult.entries.length < MIN_SYSTEM_INFO_FIELDS_FOR_EXPAND) {
      return {
        visibleSystemInfoFields: systemInfoResult.entries,
        expandableSystemInfoFields: [],
      };
    }

    return {
      visibleSystemInfoFields: systemInfoResult.entries.slice(0, EXPAND_SYSTEM_INFO_COUNT),
      expandableSystemInfoFields: systemInfoResult.entries.slice(EXPAND_SYSTEM_INFO_COUNT),
    };
  }, [systemInfoResult.entries]);

  const expandableHasErrors = systemInfoResult.hasErrors;

  return (
    <DetailsPageCard id="device-information-card">
      <DetailsPageCardTitle
        title={t('Device information')}
        icon={<AddressCardIcon />}
        badge={<SystemInfoReportingBadge hasErrors={systemInfoResult.hasErrors} />}
      />
      <CardBody>
        <Stack hasGutter>
          {visibleSystemInfoFields.length > 0 && (
            <StackItem>
              <SystemInfoFieldsList entries={visibleSystemInfoFields} />
            </StackItem>
          )}
          {expandableSystemInfoFields.length > 0 && (
            <StackItem>
              <ExpandableSection
                toggleContent={
                  <Flex spaceItems={{ default: 'spaceItemsSm' }} alignItems={{ default: 'alignItemsCenter' }}>
                    <FlexItem>{isMoreInfoExpanded ? t('Hide full system info') : t('Show full system info')}</FlexItem>
                    {!isMoreInfoExpanded && expandableHasErrors && (
                      <FlexItem>
                        <Label isCompact status="warning">
                          {t('Stale values below')}
                        </Label>
                      </FlexItem>
                    )}
                  </Flex>
                }
                onToggle={(_event, expanded) => setIsMoreInfoExpanded(expanded)}
                isExpanded={isMoreInfoExpanded}
              >
                <SystemInfoFieldsList entries={expandableSystemInfoFields} />
              </ExpandableSection>
            </StackItem>
          )}
          <StackItem>
            <Divider />
          </StackItem>
          <StackItem>
            <Title headingLevel="h3" size="md">
              {t('Capabilities')}
            </Title>
          </StackItem>
          <StackItem>
            <CapabilitiesFieldsList deviceStatus={device.status} />
          </StackItem>
          <StackItem>
            <Divider />
          </StackItem>
          <StackItem>
            <Stack hasGutter>
              <StackItem>
                <Title headingLevel="h3" size="md">
                  {t('Configurations')}
                </Title>
              </StackItem>
              <StackItem>
                <ConfigurationsContent device={device} />
              </StackItem>
            </Stack>
          </StackItem>
        </Stack>
      </CardBody>
    </DetailsPageCard>
  );
};

export default DeviceInformationCard;
