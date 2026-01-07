import * as React from 'react';
import { ActionsColumn, IAction, OnSelect, Td, Tr } from '@patternfly/react-table';

import { ImageBuild } from '@flightctl/types/imagebuilder';
import { useTranslation } from '../../hooks/useTranslation';
import ResourceLink from '../common/ResourceLink';
import ImageBuildStatus from './ImageBuildStatus';
import { getImageBuildDestinationImage, getImageBuildSourceImage } from '../../utils/imageBuilds';

type ImageBuildRowProps = {
  imageBuild: ImageBuild;
  rowIndex: number;
  onRowSelect: (imageBuild: ImageBuild) => OnSelect;
  isRowSelected: (imageBuild: ImageBuild) => boolean;
  onDeleteClick: () => void;
  canDelete: boolean;
  canEdit: boolean;
};

const useImageBuildActions = (imageBuildName: string, canEdit: boolean) => {
  const actions: IAction[] = [];
  const { t } = useTranslation();

  actions.push({
    title: t('View image build details'),
    onClick: () => {
      // TODO: Navigate to image build details when route is available
    },
  });

  if (canEdit) {
    actions.push({
      title: t('Edit image build'),
      onClick: () => {
        // TODO: Navigate to image build edit when route is available
      },
    });
  }

  return actions;
};

const ImageBuildRow = ({
  imageBuild,
  rowIndex,
  onRowSelect,
  isRowSelected,
  onDeleteClick,
  canDelete,
  canEdit,
}: ImageBuildRowProps) => {
  const { t } = useTranslation();
  const imageBuildName = imageBuild.metadata.name || '';

  const actions = useImageBuildActions(imageBuildName, canEdit);

  if (canDelete) {
    actions.push({
      title: t('Delete image build'),
      onClick: onDeleteClick,
    });
  }

  const sourceImage = getImageBuildSourceImage(imageBuild);
  const destinationImage = getImageBuildDestinationImage(imageBuild);

  return (
    <Tr>
      <Td
        select={{
          rowIndex,
          onSelect: onRowSelect(imageBuild),
          isSelected: isRowSelected(imageBuild),
        }}
      />
      <Td dataLabel={t('Name')}>
        <ResourceLink id={imageBuildName} />
      </Td>
      <Td dataLabel={t('Source image')}>{sourceImage}</Td>
      <Td dataLabel={t('Destination image')}>{destinationImage}</Td>
      <Td dataLabel={t('Status')}>
        <ImageBuildStatus imageBuild={imageBuild} />
      </Td>
      <Td isActionCell>
        <ActionsColumn items={actions} />
      </Td>
    </Tr>
  );
};

export default ImageBuildRow;
