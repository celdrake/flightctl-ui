import { TFunction } from 'i18next';

import {
  ImageBuildConditionReason,
  ImageExport,
  ImageExportConditionReason,
  ImagePromotion,
  ImagePromotionConditionReason,
} from '@flightctl/types/imagebuilder';
import { ImageBuildWithExports } from '../types/extraTypes';
import { getImageBuildStatusReason, getImageExportStatusReason, getImagePromotionReadyCondition } from './imageBuilds';

export type ImageBuildPrimaryActionType = 'pushToCatalog' | 'seeFailureMessage' | 'retryExport' | 'none';

export type ImageBuildPrimaryAction = {
  type: ImageBuildPrimaryActionType;
  label: string;
};

type PrimaryActionArgs = {
  imageBuild: ImageBuildWithExports;
  latestPromotion?: ImagePromotion;
  canPromote: boolean;
  t: TFunction;
};

const canPushImageBuildToCatalog = (
  imageBuild: ImageBuildWithExports,
  latestPromotion: ImagePromotion | undefined,
  canPromote: boolean,
): boolean => {
  if (!canPromote) {
    return false;
  }

  if (getImageBuildStatusReason(imageBuild) !== ImageBuildConditionReason.ImageBuildConditionReasonCompleted) {
    return false;
  }

  if (!latestPromotion) {
    return true;
  }

  const promotionReason = getImagePromotionReadyCondition(latestPromotion)?.reason;
  if (promotionReason === ImagePromotionConditionReason.ImagePromotionConditionReasonCompleted) {
    return false;
  }

  if (
    promotionReason === ImagePromotionConditionReason.ImagePromotionConditionReasonWaitingForArtifacts ||
    promotionReason === ImagePromotionConditionReason.ImagePromotionConditionReasonPublishing
  ) {
    return false;
  }

  return true;
};

/**
 * Resolves the primary action shown in the image builds table Actions column.
 */
export const getImageBuildPrimaryAction = ({
  imageBuild,
  latestPromotion,
  canPromote,
  t,
}: PrimaryActionArgs): ImageBuildPrimaryAction => {
  const buildReason = getImageBuildStatusReason(imageBuild);

  if (buildReason === ImageBuildConditionReason.ImageBuildConditionReasonFailed) {
    return {
      type: 'seeFailureMessage',
      label: t('See failure message'),
    };
  }

  const imageExports = imageBuild.imageExports.filter((imageExport): imageExport is ImageExport => !!imageExport);
  const hasExportFailure = imageExports.some(
    (imageExport) =>
      getImageExportStatusReason(imageExport) === ImageExportConditionReason.ImageExportConditionReasonFailed,
  );

  if (hasExportFailure) {
    return {
      type: 'retryExport',
      label: t('Retry export'),
    };
  }

  if (canPushImageBuildToCatalog(imageBuild, latestPromotion, canPromote)) {
    return {
      type: 'pushToCatalog',
      label: t('Push to catalog'),
    };
  }

  return {
    type: 'none',
    label: '',
  };
};
