import * as React from 'react';

import { ExportFormatType, ImageExport } from '@flightctl/types/imagebuilder';
import { ImageBuildWithExports } from '../../../types/extraTypes';
import { useFetch } from '../../../hooks/useFetch';
import { getErrorMessage } from '../../../utils/error';
import { getImageExportResource } from '../CreateImageBuildWizard/utils';
import { ImageExportCardsGallery, ViewImageBuildExportCard } from '../ImageExportCards';
import { useOciRegistriesContext } from '../OciRegistriesContext';

type ImageBuildExportsTabProps = {
  imageBuild: ImageBuildWithExports;
  refetch: VoidFunction;
};

const allFormats = [
  ExportFormatType.ExportFormatTypeVMDK,
  ExportFormatType.ExportFormatTypeQCOW2,
  ExportFormatType.ExportFormatTypeISO,
];

const ImageBuildExportsTab = ({ imageBuild, refetch }: ImageBuildExportsTabProps) => {
  const { post } = useFetch();
  // CELIA-WIP: SHOW ERROR
  const [, setError] = React.useState<string | null>(null);
  const { ociRegistries } = useOciRegistriesContext();
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
        const imageExport = imageBuild.imageExports.find((imageExport) => imageExport?.spec.format === format);
        return (
          <ViewImageBuildExportCard
            key={format}
            repositories={ociRegistries}
            format={format}
            imageExport={imageExport}
            isCreating={isCreating[format]}
            onExportImage={handleExportImage}
            onRetry={handleRetry}
          />
        );
      })}
    </ImageExportCardsGallery>
  );
};

export default ImageBuildExportsTab;
