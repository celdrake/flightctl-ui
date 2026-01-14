import * as React from 'react';
import { Gallery } from '@patternfly/react-core';

import { ExportFormatType, ImageBuild, ImageExport } from '@flightctl/types/imagebuilder';
import { useFetch } from '../../../hooks/useFetch';
import { getErrorMessage } from '../../../utils/error';
import { getImageExportResource } from '../CreateImageBuildWizard/utils';
import { ImageExportCardsGallery, ViewImageBuildExportCard } from '../ImageExportCards';

type ImageBuildExportsContentProps = {
  imageBuild: ImageBuild;
  imageExports: Record<ExportFormatType, ImageExport>;
  refetch: VoidFunction;
};

const allFormats = [
  ExportFormatType.ExportFormatTypeVMDK,
  ExportFormatType.ExportFormatTypeQCOW2,
  ExportFormatType.ExportFormatTypeISO,
];

const ImageBuildExportsContent = ({ imageExports, imageBuild, refetch }: ImageBuildExportsContentProps) => {
  const { post } = useFetch();
  const [, setError] = React.useState<string | null>(null);
  const [isCreating, setIsCreating] = React.useState<Record<ExportFormatType, boolean>>({
    [ExportFormatType.ExportFormatTypeVMDK]: false,
    [ExportFormatType.ExportFormatTypeQCOW2]: false,
    [ExportFormatType.ExportFormatTypeISO]: false,
  });

  const handleExportImage = async (format: ExportFormatType) => {
    setIsCreating((prev) => ({ ...prev, [format]: true }));
    try {
      const imageExport = getImageExportResource(
        imageBuild.metadata.name as string,
        imageBuild.spec.destination,
        format,
      );
      await post<ImageExport>('imageexports', imageExport);
      refetch();
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setIsCreating((prev) => ({ ...prev, [format]: false }));
    }
  };

  const handleRetry = async (format: ExportFormatType) => {
    await handleExportImage(format);
  };

  return (
    <ImageExportCardsGallery>
      {allFormats.map((format) => {
        return (
          <ViewImageBuildExportCard
            key={format}
            format={format}
            imageExport={imageExports[format]}
            isCreating={isCreating[format]}
            onExportImage={handleExportImage}
            onRetry={handleRetry}
          />
        );
      })}
    </ImageExportCardsGallery>
  );
};

export default ImageBuildExportsContent;
