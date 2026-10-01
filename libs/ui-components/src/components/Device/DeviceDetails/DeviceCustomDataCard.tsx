import * as React from 'react';
import { CardBody, DescriptionList } from '@patternfly/react-core';
import { TagIcon } from '@patternfly/react-icons/dist/js/icons/tag-icon';

import type { SystemInfoEntry } from '../../../hooks/useDeviceSpecSystemInfo';
import { useTranslation } from '../../../hooks/useTranslation';
import DetailsPageCard, { DetailsPageCardTitle } from '../../DetailsPage/DetailsPageCard';
import SystemInfoDescriptionGroup from './SystemInfoDescriptionGroup';

import './DeviceDetailsTab.css';

const DeviceCustomDataCard = ({ entries }: { entries: SystemInfoEntry[] }) => {
  const { t } = useTranslation();

  return (
    <DetailsPageCard style={{ border: '2px solid lime' }}>
      <DetailsPageCardTitle title={t('Custom data')} icon={<TagIcon />} />
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
