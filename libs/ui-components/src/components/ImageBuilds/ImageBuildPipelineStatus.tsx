import * as React from 'react';
import { ProgressStep, ProgressStepper, Stack, StackItem } from '@patternfly/react-core';
import MinusIcon from '@patternfly/react-icons/dist/js/icons/minus-icon';

import { ImagePromotion } from '@flightctl/types/imagebuilder';
import { ImageBuildWithExports } from '../../types/extraTypes';
import { useTranslation } from '../../hooks/useTranslation';
import WithTooltip from '../common/WithTooltip';
import {
  getImageBuildPipelineStatus,
  ImageBuildPipelineStatus as PipelineStatus,
  PipelineStepState,
  PipelineStepStatus,
} from '../../utils/imageBuildPipeline';
import { StatusDisplayContent } from '../Status/StatusDisplay';
import { StatusLevel } from '../../utils/status/common';

type ImageBuildPipelineStatusProps = {
  imageBuild: ImageBuildWithExports;
  latestPromotion?: ImagePromotion;
};

const summaryLevelMap: Record<PipelineStatus['summaryLevel'], StatusLevel> = {
  info: 'info',
  success: 'success',
  danger: 'danger',
  warning: 'warning',
  unknown: 'unknown',
};

const toProgressStepVariant = (
  state: PipelineStepState,
): 'default' | 'success' | 'info' | 'pending' | 'warning' | 'danger' => {
  switch (state) {
    case 'success':
      return 'success';
    case 'failed':
      return 'danger';
    case 'warning':
      return 'warning';
    case 'inProgress':
      return 'info';
    case 'pending':
      return 'pending';
    case 'skipped':
    default:
      return 'default';
  }
};

const getStepAriaLabel = (step: PipelineStepStatus, t: ReturnType<typeof useTranslation>['t']) => {
  if (step.state === 'skipped' && step.id === 'export') {
    return t('Skipped export');
  }
  if (step.state === 'skipped' && step.id === 'pushToCatalog') {
    return t('Skipped push to catalog');
  }
  return step.title;
};

const PipelineStepItem = ({ step, imageBuildName }: { step: PipelineStepStatus; imageBuildName: string }) => {
  const { t } = useTranslation();
  const stepId = `${imageBuildName}-pipeline-step-${step.id}`;
  // PatternFly only renders icons for success/info/warning/danger variants.
  // Current steps use variant="info" + isCurrent for the blue active icon.
  const variant = step.isCurrent ? 'info' : toProgressStepVariant(step.state);
  const skipped = step.state === 'skipped';
  const stepAriaLabel = getStepAriaLabel(step, t);
  const skippedTooltip = step.message || stepAriaLabel;

  let extraProps = {};
  if (skipped && !step.isCurrent) {
    extraProps = {
      icon: (
        <WithTooltip showTooltip content={skippedTooltip}>
          <MinusIcon />
        </WithTooltip>
      ),
    };
  }

  return (
    <ProgressStep
      id={stepId}
      titleId={`${stepId}-title`}
      variant={variant}
      isCurrent={step.isCurrent}
      aria-label={stepAriaLabel}
      {...extraProps}
    >
      <span style={{ display: 'none' }}>{step.title}</span>
    </ProgressStep>
  );
};

const ImageBuildPipelineStatusDisplay = ({ imageBuild, latestPromotion }: ImageBuildPipelineStatusProps) => {
  const { t } = useTranslation();
  const pipeline = React.useMemo(
    () => getImageBuildPipelineStatus(imageBuild, latestPromotion, t),
    [imageBuild, latestPromotion, t],
  );

  const imageBuildName = imageBuild.metadata.name || 'image-build';

  return (
    <Stack className="fctl-image-build-pipeline" hasGutter>
      <StackItem className="fctl-image-build-pipeline__stepper">
        <ProgressStepper isCompact aria-label={t('Image build pipeline status')}>
          {pipeline.steps.map((step) => (
            <PipelineStepItem key={step.id} step={step} imageBuildName={imageBuildName} />
          ))}
        </ProgressStepper>
      </StackItem>
      <StackItem className="fctl-image-build-pipeline__summary">
        <StatusDisplayContent label={pipeline.summaryLabel} level={summaryLevelMap[pipeline.summaryLevel]} />
      </StackItem>
    </Stack>
  );
};

export default ImageBuildPipelineStatusDisplay;
