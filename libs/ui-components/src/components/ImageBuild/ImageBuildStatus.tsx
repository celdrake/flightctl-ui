import * as React from 'react';

import { ImageBuild } from '@flightctl/types/imagebuilder';
import { useTranslation } from '../../hooks/useTranslation';
import { StatusDisplayContent } from '../Status/StatusDisplay';
import { StatusLevel } from '../../utils/status/common';

const ImageBuildStatus = ({ imageBuild }: { imageBuild: ImageBuild }) => {
  const { t } = useTranslation();

  let level: StatusLevel;
  let label: string;
  let message: string | undefined;

  if (imageBuild.status?.imageReference) {
    // Build completed successfully
    level = 'success';
    label = t('Built');
    message = imageBuild.status.imageReference;
  } else if (imageBuild.status?.conditions && imageBuild.status.conditions.length > 0) {
    // Check conditions for status
    const latestCondition = imageBuild.status.conditions[imageBuild.status.conditions.length - 1];
    const conditionType = latestCondition.type;
    const conditionStatus = latestCondition.status;

    if (conditionStatus === 'True') {
      if (conditionType === 'Ready' || conditionType === 'Complete') {
        level = 'success';
        label = t('Ready');
      } else {
        level = 'info';
        label = conditionType;
      }
    } else if (conditionStatus === 'False') {
      level = 'danger';
      label = t('Failed');
      message = latestCondition.message;
    } else {
      level = 'info';
      label = t('In progress');
    }
  } else {
    // No status information available
    level = 'unknown';
    label = t('Unknown');
  }

  return <StatusDisplayContent label={label} level={level} message={message} />;
};

export default ImageBuildStatus;
