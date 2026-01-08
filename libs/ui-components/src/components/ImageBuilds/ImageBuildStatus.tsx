import * as React from 'react';

import { ConditionStatus } from '@flightctl/types';
import { ImageBuildConditionType, ImageBuildStatus } from '@flightctl/types/imagebuilder';
import { useTranslation } from '../../hooks/useTranslation';
import { StatusDisplayContent } from '../Status/StatusDisplay';
import { StatusLevel } from '../../utils/status/common';
import { getCondition } from '../../utils/api';

const ImageBuildStatus = ({ buildStatus }: { buildStatus?: ImageBuildStatus }) => {
  const { t } = useTranslation();

  let level: StatusLevel;
  let label: string;
  let message: string | undefined;

  if (!buildStatus) {
    return <StatusDisplayContent label={t('Unknown')} level="unknown" message={t('No status information available')} />;
  }

  if (buildStatus.imageReference) {
    level = 'success';
    label = t('Built');
    message = buildStatus.imageReference;
  } else {
    // Check conditions for status
    const conditions = buildStatus.conditions || [];

    const readyCondition = getCondition(conditions, ImageBuildConditionType.ImageBuildConditionTypeReady);
    if (readyCondition === undefined) {
      level = 'unknown';
      label = t('Unknown');
    } else if (readyCondition.status === ConditionStatus.ConditionStatusTrue) {
      level = 'success';
      label = t('Ready');
      message = readyCondition.message;
    } else {
      level = 'info';
      label = t('In progress');
      message = readyCondition.message;
    }
  }

  return <StatusDisplayContent label={label} level={level} message={message} />;
};

export default ImageBuildStatus;
