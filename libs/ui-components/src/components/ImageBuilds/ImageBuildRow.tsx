import * as React from 'react';
import { Alert, AlertActionLink, Button, Stack, StackItem, Title } from '@patternfly/react-core';
import { ActionsColumn, ExpandableRowContent, IAction, OnSelect, Tbody, Td, Tr } from '@patternfly/react-table';

import { ImageBuild, ImageBuildConditionReason, ImagePromotion } from '@flightctl/types/imagebuilder';
import { ImageBuildWithExports } from '../../types/extraTypes';
import { useTranslation } from '../../hooks/useTranslation';
import { ROUTE, useNavigate } from '../../hooks/useNavigate';
import { getImageBuildPrimaryAction } from '../../utils/imageBuildPrimaryAction';
import {
  getImageBuildImage,
  getImageBuildReadyCondition,
  getImageBuildStatusReason,
  isImageBuildCancelable,
  isImageBuildFailed,
} from '../../utils/imageBuilds';
import { getDateDisplay } from '../../utils/dates';
import ResourceLink from '../common/ResourceLink';
import ImageBuildExportsGallery from './ImageBuildDetails/ImageBuildExportsGallery';
import ImageBuildPipelineStatusDisplay from './ImageBuildPipelineStatus';

type ImageBuildRowProps = {
  imageBuild: ImageBuildWithExports;
  rowIndex: number;
  onRowSelect: (imageBuild: ImageBuild) => OnSelect;
  isRowSelected: (imageBuild: ImageBuild) => boolean;
  onDeleteClick: VoidFunction;
  canDelete: boolean;
  onCancelClick: VoidFunction;
  canCancel: boolean;
  onNewVersionClick: VoidFunction;
  canNewVersion: boolean;
  onAddToCatalog: VoidFunction;
  canAddToCatalog: boolean;
  refetch: VoidFunction;
  latestPromotion?: ImagePromotion;
};

const ImageBuildRow = ({
  imageBuild,
  rowIndex,
  onRowSelect,
  isRowSelected,
  onDeleteClick,
  canDelete,
  onCancelClick,
  canCancel,
  onNewVersionClick,
  canNewVersion,
  refetch,
  onAddToCatalog,
  canAddToCatalog,
  latestPromotion,
}: ImageBuildRowProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = React.useState(false);

  const imageBuildName = imageBuild.metadata.name || '';
  const buildCondition = getImageBuildReadyCondition(imageBuild);
  const buildReason = getImageBuildStatusReason(imageBuild);

  const actions: IAction[] = [
    {
      title: t('View details'),
      onClick: () => {
        navigate({ route: ROUTE.IMAGE_BUILD_DETAILS, postfix: imageBuildName });
      },
    },
  ];

  if (canNewVersion) {
    actions.push({
      title: t('Rebuild'),
      onClick: onNewVersionClick,
    });
  }

  if (canAddToCatalog) {
    actions.push({
      title: t('Add to catalog'),
      onClick: onAddToCatalog,
      isDisabled: isImageBuildFailed(buildReason),
    });
  }

  if (canCancel && isImageBuildCancelable(buildReason)) {
    actions.push({
      title: t('Cancel image build'),
      onClick: onCancelClick,
    });
  } else if (canDelete) {
    actions.push({
      title: t('Delete image build'),
      onClick: onDeleteClick,
    });
  }

  const sourceImage = getImageBuildImage(imageBuild.spec.source);
  const destinationImage = getImageBuildImage(imageBuild.spec.destination);

  const primaryAction = React.useMemo(
    () =>
      getImageBuildPrimaryAction({
        imageBuild,
        latestPromotion,
        canPromote: canAddToCatalog,
        t,
      }),
    [imageBuild, latestPromotion, canAddToCatalog, t],
  );

  const handlePrimaryAction = () => {
    switch (primaryAction.type) {
      case 'pushToCatalog':
        onAddToCatalog();
        break;
      case 'seeFailureMessage':
      case 'retryExport':
        setIsExpanded(true);
        break;
      default:
        break;
    }
  };

  return (
    <Tbody isExpanded={isExpanded}>
      <Tr isContentExpanded={isExpanded}>
        <Td
          select={{
            rowIndex,
            onSelect: onRowSelect(imageBuild),
            isSelected: isRowSelected(imageBuild),
          }}
        />
        <Td
          expand={{
            rowIndex,
            isExpanded,
            onToggle: () => setIsExpanded(!isExpanded),
          }}
        />
        <Td dataLabel={t('Name')}>
          <ResourceLink id={imageBuildName} routeLink={ROUTE.IMAGE_BUILD_DETAILS} />
        </Td>
        <Td dataLabel={t('Base image')}>{sourceImage}</Td>
        <Td dataLabel={t('Image output')}>{destinationImage}</Td>
        <Td dataLabel={t('Status')}>
          <ImageBuildPipelineStatusDisplay imageBuild={imageBuild} latestPromotion={latestPromotion} />
        </Td>
        <Td dataLabel={t('Actions')}>
          {primaryAction.type !== 'none' && (
            <Button variant="link" isInline onClick={handlePrimaryAction}>
              {primaryAction.label}
            </Button>
          )}
        </Td>
        <Td dataLabel={t('Date')}>{getDateDisplay(imageBuild.metadata.creationTimestamp)}</Td>
        <Td isActionCell>
          <ActionsColumn items={actions} />
        </Td>
      </Tr>
      <Tr isExpanded={isExpanded}>
        <Td colSpan={9}>
          <ExpandableRowContent>
            <Stack hasGutter>
              <StackItem>
                <Stack hasGutter>
                  <StackItem>
                    <Title headingLevel="h3" size="md" style={{ marginBottom: 0 }}>
                      {t('Build information')}
                    </Title>
                  </StackItem>
                  {buildReason === ImageBuildConditionReason.ImageBuildConditionReasonFailed && (
                    <Alert
                      variant="danger"
                      title={t('Build failed')}
                      actionLinks={
                        canNewVersion ? (
                          <AlertActionLink
                            onClick={() => navigate({ route: ROUTE.IMAGE_BUILD_NEW_VERSION, postfix: imageBuildName })}
                          >
                            {t('Retry build')}
                          </AlertActionLink>
                        ) : undefined
                      }
                    >
                      <details>
                        <summary>{t('View error details')}</summary>
                        {buildCondition?.message}
                      </details>
                    </Alert>
                  )}
                  <StackItem>
                    <Button
                      variant="link"
                      onClick={() => navigate({ route: ROUTE.IMAGE_BUILD_DETAILS, postfix: imageBuildName })}
                    >
                      {t('View more')}
                    </Button>
                  </StackItem>
                </Stack>
              </StackItem>
              <StackItem>
                <ImageBuildExportsGallery imageBuild={imageBuild} refetch={refetch} />
              </StackItem>
            </Stack>
          </ExpandableRowContent>
        </Td>
      </Tr>
    </Tbody>
  );
};

export default ImageBuildRow;
