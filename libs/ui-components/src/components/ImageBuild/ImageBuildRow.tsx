import * as React from 'react';
import { ActionsColumn, IAction, OnSelect, Td, Tr } from '@patternfly/react-table';

import { ImageBuild } from '@flightctl/types/imagebuilder';
import { useTranslation } from '../../hooks/useTranslation';
import ResourceLink from '../common/ResourceLink';
import ImageBuildStatus from './ImageBuildStatus';

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

const ImageBuildRow: React.FC<ImageBuildRowProps> = ({
  imageBuild,
  rowIndex,
  onRowSelect,
  isRowSelected,
  onDeleteClick,
  canDelete,
  canEdit,
}) => {
  const { t } = useTranslation();
  const imageBuildName = imageBuild.metadata.name || '';

  const actions = useImageBuildActions(imageBuildName, canEdit);

  if (canDelete) {
    actions.push({
      title: t('Delete image build'),
      onClick: onDeleteClick,
    });
  }

  const sourceImage = imageBuild.spec.source
    ? `${imageBuild.spec.source.repository}/${imageBuild.spec.source.imageName}:${imageBuild.spec.source.imageTag}`
    : '-';

  const destinationImage = imageBuild.spec.destination
    ? `${imageBuild.spec.destination.repository}/${imageBuild.spec.destination.imageName}:${imageBuild.spec.destination.tag}`
    : '-';

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
