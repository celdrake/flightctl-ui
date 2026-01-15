import * as React from 'react';
import { useDebounce } from 'use-debounce';

import { ExportFormatType, ImageBuild, ImageBuildList, ImageExport } from '@flightctl/types/imagebuilder';
import { ImageBuildWithExports } from '../../types/extraTypes';
import { useAppContext } from '../../hooks/useAppContext';
import { useFetchPeriodically } from '../../hooks/useFetchPeriodically';
import { PaginationDetails, useTablePagination } from '../../hooks/useTablePagination';
import { PAGE_SIZE } from '../../constants';

export enum ImageBuildsSearchParams {
  Name = 'name',
}

type ImageBuildsEndpointArgs = {
  name?: string;
  nextContinue?: string;
};

// Returns an array with one item per format (VMDK, QCOW2, ISO), where each item is either
// undefined or the latest ImageExport for that format.
export const getImageExportsByFormat = (
  imageExports?: ImageExport[],
): { imageExports: (ImageExport | undefined)[]; exportsCount: number } => {
  const formatMap: Partial<Record<ExportFormatType, ImageExport>> = {};

  imageExports?.forEach((ie) => {
    const format = ie.spec.format;
    const existing = formatMap[format];

    if (!existing) {
      formatMap[format] = ie;
    } else {
      // Compare creation timestamps to keep the most recent
      const existingTimestamp = existing.metadata.creationTimestamp || '';
      const currentTimestamp = ie.metadata.creationTimestamp;

      if (existingTimestamp && currentTimestamp) {
        const existingTime = new Date(existingTimestamp).getTime();
        const currentTime = new Date(currentTimestamp).getTime();
        if (currentTime > existingTime) {
          formatMap[format] = ie;
        }
      }
    }
  });

  return {
    imageExports: [
      formatMap[ExportFormatType.ExportFormatTypeVMDK],
      formatMap[ExportFormatType.ExportFormatTypeQCOW2],
      formatMap[ExportFormatType.ExportFormatTypeISO],
    ],
    exportsCount: imageExports?.length || 0,
  };
};

export const useImageBuildsBackendFilters = () => {
  const {
    router: { useSearchParams },
  } = useAppContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const paramsRef = React.useRef(searchParams);
  const name = searchParams.get(ImageBuildsSearchParams.Name) || undefined;

  const setName = React.useCallback(
    (nameVal: string) => {
      const newParams = new URLSearchParams({
        [ImageBuildsSearchParams.Name]: nameVal,
      });
      paramsRef.current = newParams;
      setSearchParams(newParams);
    },
    [setSearchParams],
  );

  const hasFiltersEnabled = !!name;

  return {
    name,
    setName,
    hasFiltersEnabled,
  };
};

const getImageBuildsEndpoint = ({ name, nextContinue }: { name?: string; nextContinue?: string }) => {
  const params = new URLSearchParams({
    limit: `${PAGE_SIZE}`,
    withExports: 'true',
  });
  if (name) {
    params.set('fieldSelector', `metadata.name contains ${name}`);
  }
  if (nextContinue) {
    params.set('continue', nextContinue);
  }
  return `imagebuilds?${params.toString()}`;
};

const useImageBuildsEndpoint = (args: ImageBuildsEndpointArgs): [string, boolean] => {
  const endpoint = getImageBuildsEndpoint(args);
  const [ibEndpointDebounced] = useDebounce(endpoint, 1000);
  return [ibEndpointDebounced, endpoint !== ibEndpointDebounced];
};

export type ImageBuildsLoadBase = {
  isLoading: boolean;
  error: unknown;
  isUpdating: boolean;
  refetch: VoidFunction;
};

export type ImageBuildsLoad = ImageBuildsLoadBase & {
  imageBuilds: ImageBuildWithExports[];
  pagination: PaginationDetails<ImageBuildList>;
};

export type ImageBuildLoad = ImageBuildsLoadBase & {
  imageBuild: ImageBuildWithExports;
};

const toImageBuildWithExports = (imageBuild: ImageBuild): ImageBuildWithExports => {
  const allExports = imageBuild.imageexports || [];
  const imageExportsByFormat = getImageExportsByFormat(allExports);
  const latestExports = [...imageExportsByFormat.imageExports];

  const { imageexports, ...imageBuildWithoutExports } = imageBuild;
  return {
    ...imageBuildWithoutExports,
    imageExports: latestExports,
    exportsCount: allExports.length,
  };
};

export const useImageBuilds = (args: ImageBuildsEndpointArgs): ImageBuildsLoad => {
  const pagination = useTablePagination<ImageBuildList>();
  const [imageBuildsEndpoint, imageBuildsDebouncing] = useImageBuildsEndpoint({
    ...args,
    nextContinue: pagination.nextContinue,
  });
  const [imageBuildsList, isLoading, error, refetch, updating] = useFetchPeriodically<ImageBuildList>(
    {
      endpoint: imageBuildsEndpoint,
    },
    pagination.onPageFetched,
  );

  return {
    imageBuilds: (imageBuildsList?.items || []).map(toImageBuildWithExports),
    isLoading,
    error,
    isUpdating: updating || imageBuildsDebouncing,
    refetch,
    pagination,
  };
};

export const useImageBuild = (
  imageBuildId: string,
): [ImageBuildWithExports | undefined, boolean, unknown, VoidFunction] => {
  const [imageBuild, isLoading, error, refetch] = useFetchPeriodically<ImageBuild>({
    endpoint: `imagebuilds/${imageBuildId}?withExports=true`,
  });

  return [imageBuild ? toImageBuildWithExports(imageBuild) : undefined, isLoading, error, refetch];
};
