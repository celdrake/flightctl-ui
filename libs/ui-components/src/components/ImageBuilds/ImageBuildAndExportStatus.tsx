import * as React from 'react';
import { Stack, StackItem } from '@patternfly/react-core';

import {
  ImageBuildConditionReason,
  ImageBuildConditionType,
  ImageBuildStatus,
  ImageExportStatus,
} from '@flightctl/types/imagebuilder';
import { useTranslation } from '../../hooks/useTranslation';
import { StatusDisplayContent } from '../Status/StatusDisplay';
import { StatusLevel } from '../../utils/status/common';
import LearnMoreLink from '../common/LearnMoreLink';
import { getImageUrl } from '../../utils/imageBuilds';

type ImageBuildAndExportStatusProps = {
  imageStatus?: ImageBuildStatus | ImageExportStatus;
  // For exports, we can pass an additional image reference from the spec
  // It will only be shown when the image status is complete
  imageReference?: string;
};

const ImageBuildAndExportStatus = ({ imageStatus, imageReference }: ImageBuildAndExportStatusProps) => {
  const { t } = useTranslation();

  let level: StatusLevel;
  let label: string;
  let message: React.ReactNode | undefined;

  if (!imageStatus) {
    return <StatusDisplayContent label={t('Unknown')} level="unknown" message={t('No status information available')} />;
  }

  // Check conditions for status
  const conditions = imageStatus.conditions || [];
  const readyCondition = conditions.find((c) => c.type === ImageBuildConditionType.ImageBuildConditionTypeReady);

  if (readyCondition === undefined) {
    // The build has not been processed yet, marking it as Queued
    level = 'unknown';
    label = t('Queued');
  } else if (readyCondition.reason === ImageBuildConditionReason.ImageBuildConditionReasonCompleted) {
    level = 'success';
    label = t('Complete');

    const imageRef = imageReference || (imageStatus as ImageBuildStatus).imageReference;
    if (imageRef) {
      message = (
        <Stack hasGutter>
          <StackItem>{t('Image built successfully')}</StackItem>
          <StackItem>
            <LearnMoreLink link={getImageUrl(imageRef)} text={t('Output image')} />
          </StackItem>
        </Stack>
      );
    }
  } else {
    // The build is in progress, we need to differentiate the correct phase
    const reason = readyCondition.reason;
    if (reason === ImageBuildConditionReason.ImageBuildConditionReasonBuilding) {
      level = 'info';
      label = t('Building');
    } else if (reason === ImageBuildConditionReason.ImageBuildConditionReasonPushing) {
      level = 'info';
      label = t('Pushing');
    } else if (reason === ImageBuildConditionReason.ImageBuildConditionReasonFailed) {
      level = 'danger';
      label = t('Failed');
    } else {
      // Pending or other unknown reason
      level = 'unknown';
      label = t('Unknown');
    }
    message = readyCondition.message;
  }

  return <StatusDisplayContent label={label} level={level} message={message} />;
};

export default ImageBuildAndExportStatus;
