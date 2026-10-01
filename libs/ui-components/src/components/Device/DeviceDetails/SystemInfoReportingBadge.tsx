import * as React from 'react';
import { Flex, FlexItem, Label } from '@patternfly/react-core';

import type { SystemInfoReportingSummary } from '../../../hooks/useDeviceSpecSystemInfo';
import { useTranslation } from '../../../hooks/useTranslation';
import LabelWithHelperText from '../../common/WithHelperText';

const SystemInfoReportingBadge = ({ reporting }: { reporting: SystemInfoReportingSummary }) => {
  const { t } = useTranslation();

  if (!reporting.hasReporting) {
    return null;
  }

  const hasErrors = reporting.hasErrors;
  const label = hasErrors ? t('Reporting issue') : t('Reporting current');
  const content = hasErrors
    ? t('One or more values failed to report.')
    : t('Periodic collection is active and the reported values are current.');

  return (
    <Flex spaceItems={{ default: 'spaceItemsXs' }} alignItems={{ default: 'alignItemsCenter' }}>
      <FlexItem>
        <Label status={hasErrors ? 'warning' : 'success'}>{label}</Label>
      </FlexItem>
      <FlexItem>
        <LabelWithHelperText hideLabel label={label} content={content} />
      </FlexItem>
    </Flex>
  );
};

export default SystemInfoReportingBadge;
