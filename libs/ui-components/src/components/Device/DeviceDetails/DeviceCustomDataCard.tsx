import * as React from 'react';
import { CardBody, DescriptionList } from '@patternfly/react-core';
import { TagIcon } from '@patternfly/react-icons/dist/js/icons/tag-icon';

import type { SystemInfoEntry, SystemInfoReportingSummary } from '../../../hooks/useDeviceSystemInfo';
import { useTranslation } from '../../../hooks/useTranslation';
import DetailsPageCard, { DetailsPageCardTitle } from '../../DetailsPage/DetailsPageCard';
import SystemInfoDescriptionGroup from './SystemInfoDescriptionGroup';
import SystemInfoReportingBadge from './SystemInfoReportingBadge';

import './DeviceDetailsTab.css';

const DeviceCustomDataCard = ({
  entries,
  reporting,
}: {
  entries: SystemInfoEntry[];
  reporting: SystemInfoReportingSummary;
}) => {
  const { t } = useTranslation();

  return (
    <DetailsPageCard id="device-custom-data-card">
      <DetailsPageCardTitle
        title={t('Custom data')}
        icon={<TagIcon />}
        badge={<SystemInfoReportingBadge reporting={reporting} />}
      />
      <CardBody>
        <DescriptionList isHorizontal isCompact horizontalTermWidthModifier={{ default: '12ch' }}>
          {entries.map((entry) => (
            <SystemInfoDescriptionGroup key={entry.key} entry={entry} />
          ))}
        </DescriptionList>
      </CardBody>
    </DetailsPageCard>
  );
};

export default DeviceCustomDataCard;
