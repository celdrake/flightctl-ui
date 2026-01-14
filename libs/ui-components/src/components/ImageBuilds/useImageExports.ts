import * as React from 'react';

import { ExportFormatType, ImageExport, ImageExportList } from '@flightctl/types/imagebuilder';
import { useFetchPeriodically } from '../../hooks/useFetchPeriodically';

export type UseImageExportsResult = {
  imageExports: Record<ExportFormatType, ImageExport>;
  isLoading: boolean;
  error: unknown;
  isUpdating: boolean;
  refetch: VoidFunction;
};

const getImageExportsEndpoint = (/*_imageBuildId: string*/) => {
  const params = new URLSearchParams();
  // Filter image exports by the image build reference
  // The field selector filters by spec.source.imageBuildRef when source type is imageBuild
  //params.set('fieldSelector', `spec.source.imageBuildRef=${imageBuildId}`);
  return `imageexports?${params.toString()}`;
};

/**
 * Hook to fetch image exports for a given image build.
 * Uses field selector to filter image exports by the image build reference.
 *
 * @param imageBuildId - The ID/name of the image build to fetch exports for
 * @returns Object containing image exports list, loading state, error, updating state, and refetch function
 */
export const useImageExports = (imageBuildId?: string): UseImageExportsResult => {
  const endpoint = React.useMemo(() => (imageBuildId ? getImageExportsEndpoint() : ''), [imageBuildId]);

  const [imageExportsList, isLoading, error, refetch, isUpdating] = useFetchPeriodically<ImageExportList>({
    endpoint,
  });

  // CELIA-WIP: Filter image exports by the image build reference done via the API
  // Group by format and keep only the last (most recent) export for each format
  const imageExportsByFormat = React.useMemo(() => {
    const filtered =
      imageExportsList?.items.filter(
        (item) => item.spec.source.type === 'imageBuild' && item.spec.source.imageBuildRef === imageBuildId,
      ) || [];

    // Group by format and keep the most recent one (by creation timestamp)
    const formatMap: Partial<Record<ExportFormatType, ImageExport>> = {};

    filtered.forEach((ie) => {
      const format = ie.spec.format;
      const existing = formatMap[format];

      if (!existing) {
        formatMap[format] = ie;
      } else {
        // Compare creation timestamps to keep the most recent
        const existingTimestamp = existing.metadata.creationTimestamp;
        const currentTimestamp = ie.metadata.creationTimestamp;

        if (existingTimestamp && currentTimestamp) {
          const existingTime = new Date(existingTimestamp).getTime();
          const currentTime = new Date(currentTimestamp).getTime();
          if (currentTime > existingTime) {
            formatMap[format] = ie;
          }
        } else if (currentTimestamp && !existingTimestamp) {
          // If current has timestamp but existing doesn't, prefer current
          formatMap[format] = ie;
        }
        // If both are missing or existing has timestamp but current doesn't, keep existing
      }
    });

    return formatMap as Record<ExportFormatType, ImageExport>;
  }, [imageExportsList, imageBuildId]);

  return {
    imageExports: imageExportsByFormat,
    isLoading,
    error,
    isUpdating,
    refetch,
  };
};
