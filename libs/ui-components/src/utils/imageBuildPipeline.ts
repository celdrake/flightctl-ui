import { TFunction } from 'i18next';

import {
  ImageBuild,
  ImageBuildConditionReason,
  ImageExport,
  ImageExportConditionReason,
  ImagePromotion,
  ImagePromotionConditionReason,
} from '@flightctl/types/imagebuilder';
import { ImageBuildWithExports } from '../types/extraTypes';
import {
  getImageBuildReadyCondition,
  getImageBuildStatusReason,
  getImageExportReadyCondition,
  getImageExportStatusReason,
  getImagePromotionReadyCondition,
  isImageBuildCancelable,
  isImageBuildCanceled,
  isImageBuildFailed,
  isImageExportActiveReason,
} from './imageBuilds';

export type PipelineStepId = 'build' | 'export' | 'pushToCatalog';

export type PipelineStepState = 'pending' | 'inProgress' | 'success' | 'failed' | 'warning' | 'skipped';

export type PipelineStepStatus = {
  id: PipelineStepId;
  title: string;
  state: PipelineStepState;
  message?: string;
  isCurrent: boolean;
};

export type ImageBuildPipelineStatus = {
  steps: PipelineStepStatus[];
  summaryLabel: string;
  summaryLevel: 'info' | 'success' | 'danger' | 'warning' | 'unknown';
};

const getBuildStepMessage = (imageBuild: ImageBuild): string | undefined => {
  return getImageBuildReadyCondition(imageBuild)?.message || undefined;
};

const getExportStepMessage = (imageExports: ImageExport[]): string | undefined => {
  const messages = imageExports
    .map((imageExport) => getImageExportReadyCondition(imageExport)?.message)
    .filter((message): message is string => !!message);

  if (messages.length === 0) {
    return undefined;
  }
  if (messages.length === 1) {
    return messages[0];
  }
  return messages.join('\n');
};

const buildPushToCatalogStep = (
  t: TFunction,
  {
    state = 'skipped',
    message,
    isCurrent = false,
  }: { state?: PipelineStepState; message?: string; isCurrent?: boolean },
): PipelineStepStatus => {
  return {
    id: 'pushToCatalog',
    title: t('Push to catalog'),
    state,
    message,
    isCurrent,
  };
};

const buildBuildStep = (
  t: TFunction,
  {
    state = 'success',
    message,
    isCurrent = false,
  }: { state?: PipelineStepState; message?: string; isCurrent?: boolean },
): PipelineStepStatus => {
  return {
    id: 'build',
    title: t('Build'),
    state,
    message,
    isCurrent,
  };
};

const buildExportStep = (
  t: TFunction,
  {
    state = 'skipped',
    message,
    isCurrent = false,
  }: { state?: PipelineStepState; message?: string; isCurrent?: boolean },
): PipelineStepStatus => {
  return {
    id: 'export',
    title: t('Export'),
    state,
    message,
    isCurrent,
  };
};

const getBuildStep = (imageBuild: ImageBuild, t: TFunction): PipelineStepStatus => {
  const buildReason = getImageBuildStatusReason(imageBuild);
  const message = getBuildStepMessage(imageBuild);

  switch (buildReason) {
    case ImageBuildConditionReason.ImageBuildConditionReasonCompleted:
      return buildBuildStep(t, {
        message,
      });
    case ImageBuildConditionReason.ImageBuildConditionReasonFailed:
      return buildBuildStep(t, {
        state: 'failed',
        message,
      });
    case ImageBuildConditionReason.ImageBuildConditionReasonCanceled:
    case ImageBuildConditionReason.ImageBuildConditionReasonCanceling:
      return buildBuildStep(t, {
        state: 'warning',
        message,
      });
    default:
      return buildBuildStep(t, {
        state: 'inProgress',
        message,
        isCurrent: true,
      });
  }
};

const getExportStep = (imageBuild: ImageBuildWithExports, t: TFunction): PipelineStepStatus => {
  const buildReason = getImageBuildStatusReason(imageBuild);
  const buildFailed = isImageBuildFailed(buildReason);
  const buildCanceled = isImageBuildCanceled(buildReason);

  if (buildFailed || buildCanceled) {
    return buildExportStep(t, {
      state: 'skipped',
      message: t('Export did not run because the build was canceled or failed.'),
    });
  }

  const imageExports = imageBuild.imageExports.filter((imageExport): imageExport is ImageExport => !!imageExport);
  if (imageExports.length === 0) {
    return buildExportStep(t, {
      state: 'skipped',
      message: t('This build does not have any exports.'),
    });
  }

  const buildComplete = buildReason === ImageBuildConditionReason.ImageBuildConditionReasonCompleted;
  if (!buildComplete) {
    return buildExportStep(t, {
      state: 'pending',
      message: t('Export is pending while the build is in progress.'),
    });
  }

  const exportReasons = imageExports.map(getImageExportStatusReason);
  const message = getExportStepMessage(imageExports);
  const hasFailed = exportReasons.some((r) => r === ImageExportConditionReason.ImageExportConditionReasonFailed);
  const hasActive = exportReasons.some(isImageExportActiveReason);
  const allComplete = exportReasons.every((r) => r === ImageExportConditionReason.ImageExportConditionReasonCompleted);
  const hasPartialFailure =
    hasFailed && exportReasons.some((r) => r === ImageExportConditionReason.ImageExportConditionReasonCompleted);
  if (hasPartialFailure) {
    return buildExportStep(t, {
      state: 'warning',
      message,
      isCurrent: hasActive,
    });
  }

  if (hasFailed) {
    return buildExportStep(t, {
      state: 'failed',
      message,
    });
  }

  if (hasActive) {
    return buildExportStep(t, {
      state: 'inProgress',
      message,
      isCurrent: true,
    });
  }

  if (allComplete) {
    return buildExportStep(t, {
      state: 'success',
      message,
    });
  }

  return buildExportStep(t, {
    state: 'pending',
    message,
  });
};

const getPushToCatalogStep = (
  imageBuild: ImageBuildWithExports,
  latestPromotion: ImagePromotion | undefined,
  t: TFunction,
): PipelineStepStatus => {
  const buildFailed =
    getImageBuildStatusReason(imageBuild) === ImageBuildConditionReason.ImageBuildConditionReasonFailed;
  if (buildFailed) {
    return buildPushToCatalogStep(t, {
      message: t('Push to catalog is unavailable because the build failed.'),
    });
  }

  const buildReason = getImageBuildStatusReason(imageBuild);
  const buildComplete = buildReason === ImageBuildConditionReason.ImageBuildConditionReasonCompleted;

  if (!latestPromotion) {
    return buildPushToCatalogStep(t, {
      message: buildComplete ? t('This build was not pushed to the catalog.') : undefined,
      isCurrent: buildComplete,
    });
  }

  const promotionCondition = getImagePromotionReadyCondition(latestPromotion);
  const message = promotionCondition?.message ?? undefined;

  switch (promotionCondition?.reason) {
    case ImagePromotionConditionReason.ImagePromotionConditionReasonCompleted:
      return buildPushToCatalogStep(t, {
        state: 'success',
        message,
      });
    case ImagePromotionConditionReason.ImagePromotionConditionReasonFailed:
    case ImagePromotionConditionReason.ImagePromotionConditionReasonBuildFailed:
    case ImagePromotionConditionReason.ImagePromotionConditionReasonAmendmentFailed:
      return buildPushToCatalogStep(t, {
        state: 'failed',
        message,
      });
    case ImagePromotionConditionReason.ImagePromotionConditionReasonBuildCanceled:
      return buildPushToCatalogStep(t, {
        state: 'warning',
        message,
      });
    case ImagePromotionConditionReason.ImagePromotionConditionReasonWaitingForArtifacts:
    case ImagePromotionConditionReason.ImagePromotionConditionReasonPublishing:
      return buildPushToCatalogStep(t, {
        state: 'inProgress',
        isCurrent: buildComplete,
        message,
      });
    default:
      return buildPushToCatalogStep(t, {
        state: 'pending',
        isCurrent: buildComplete,
        message,
      });
  }
};

const getSummary = (
  steps: PipelineStepStatus[],
  t: TFunction,
): Pick<ImageBuildPipelineStatus, 'summaryLabel' | 'summaryLevel'> => {
  const buildStep = steps.find((step) => step.id === 'build');
  const exportStep = steps.find((step) => step.id === 'export');
  const pushStep = steps.find((step) => step.id === 'pushToCatalog');

  if (buildStep?.state === 'failed') {
    return { summaryLabel: t('Build failed'), summaryLevel: 'danger' };
  }

  if (buildStep?.state === 'inProgress' || buildStep?.state === 'pending') {
    return { summaryLabel: t('Building'), summaryLevel: 'info' };
  }

  if (exportStep?.state === 'failed') {
    return { summaryLabel: t('Export failed'), summaryLevel: 'danger' };
  }

  if (exportStep?.state === 'warning') {
    return { summaryLabel: t('Ready to push to catalog'), summaryLevel: 'warning' };
  }

  if (exportStep?.state === 'inProgress') {
    return { summaryLabel: t('Exporting'), summaryLevel: 'info' };
  }

  if (pushStep?.state === 'inProgress') {
    return { summaryLabel: t('Preparing to push to catalog'), summaryLevel: 'info' };
  }

  if (pushStep?.state === 'failed') {
    return { summaryLabel: t('Push to catalog failed'), summaryLevel: 'danger' };
  }

  if (pushStep?.state === 'success') {
    return { summaryLabel: t('Pushed to catalog'), summaryLevel: 'success' };
  }

  if (pushStep?.state === 'skipped' && buildStep?.state === 'success') {
    return { summaryLabel: t('Ready to push to catalog'), summaryLevel: 'success' };
  }

  return { summaryLabel: t('Unknown'), summaryLevel: 'unknown' };
};

export const getImageBuildPipelineStatus = (
  imageBuild: ImageBuildWithExports,
  latestPromotion: ImagePromotion | undefined,
  t: TFunction,
): ImageBuildPipelineStatus => {
  const steps = [
    getBuildStep(imageBuild, t),
    getExportStep(imageBuild, t),
    getPushToCatalogStep(imageBuild, latestPromotion, t),
  ];

  return {
    steps,
    ...getSummary(steps, t),
  };
};
