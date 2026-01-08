import * as React from 'react';
import { ActionsColumn, IAction, OnSelect, Td, Tr } from '@patternfly/react-table';

import { ImagePipelineResponse } from '@flightctl/types/imagebuilder';
import { useTranslation } from '../../hooks/useTranslation';
import { ROUTE, useNavigate } from '../../hooks/useNavigate';
import { getImageBuildDestinationImage, getImageBuildSourceImage } from '../../utils/imageBuilds';
import { getDateDisplay } from '../../utils/dates';
import ResourceLink from '../common/ResourceLink';
import ImageBuildStatus from './ImageBuildStatus';

type ImageBuildRowProps = {
  imagePipeline: ImagePipelineResponse;
  rowIndex: number;
  onRowSelect: (imagePipeline: ImagePipelineResponse) => OnSelect;
  isRowSelected: (imagePipeline: ImagePipelineResponse) => boolean;
  onDeleteClick: () => void;
  canDelete: boolean;
};

const ImageBuildRow = ({
  imagePipeline,
  rowIndex,
  onRowSelect,
  isRowSelected,
  onDeleteClick,
  canDelete,
}: ImageBuildRowProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const imageBuild = imagePipeline.imageBuild;
  const imageBuildName = imageBuild.metadata.name || '';

  const actions: IAction[] = [
    {
      title: t('View details'),
      onClick: () => {
        navigate({ route: ROUTE.IMAGE_BUILD_DETAILS, postfix: imageBuildName });
      },
    },
  ];

  if (canDelete) {
    actions.push({
      title: t('Delete image build'),
      onClick: onDeleteClick,
    });
  }

  const sourceImage = getImageBuildSourceImage(imageBuild);
  const destinationImage = getImageBuildDestinationImage(imageBuild);
  const exportImagesCount = imagePipeline.imageExports?.length || 0;

  return (
    <Tr>
      <Td
        select={{
          rowIndex,
          onSelect: onRowSelect(imagePipeline),
          isSelected: isRowSelected(imagePipeline),
        }}
      />
      <Td dataLabel={t('Name')}>
        <ResourceLink id={imageBuildName} routeLink={ROUTE.IMAGE_BUILD_DETAILS} />
      </Td>
      <Td dataLabel={t('Base image')}>{sourceImage}</Td>
      <Td dataLabel={t('Output image')}>{destinationImage}</Td>
      <Td dataLabel={t('Status')}>
        <ImageBuildStatus buildStatus={imageBuild.status} />
      </Td>
      <Td dataLabel={t('Export images')}>{`${exportImagesCount}`}</Td>
      <Td dataLabel={t('Date')}>{getDateDisplay(imageBuild.metadata.creationTimestamp)}</Td>
      <Td isActionCell>
        <ActionsColumn items={actions} />
      </Td>
    </Tr>
  );
};

export default ImageBuildRow;
