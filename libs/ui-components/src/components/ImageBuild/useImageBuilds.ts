import * as React from 'react';
import { useDebounce } from 'use-debounce';

import { ImageBuild, ImageBuildList, ImageExport, ImageExportList } from '@flightctl/types/imagebuilder';
import { useAppContext } from '../../hooks/useAppContext';
import { useFetchPeriodically } from '../../hooks/useFetchPeriodically';
import { PaginationDetails, useTablePagination } from '../../hooks/useTablePagination';
import { PAGE_SIZE } from '../../constants';

export enum ImageBuildSearchParams {
  Name = 'name',
}

type ImageBuildsEndpointArgs = {
  name?: string;
  nextContinue?: string;
};

export const useImageBuildBackendFilters = () => {
  const {
    router: { useSearchParams },
  } = useAppContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const paramsRef = React.useRef(searchParams);
  const name = searchParams.get(ImageBuildSearchParams.Name) || undefined;

  const setName = React.useCallback(
    (nameVal: string) => {
      const newParams = new URLSearchParams({
        [ImageBuildSearchParams.Name]: nameVal,
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
  const [imageBuildsEndpointDebounced] = useDebounce(endpoint, 1000);
  return [imageBuildsEndpointDebounced, endpoint !== imageBuildsEndpointDebounced];
};

export type ImageBuildLoad = {
  imageBuilds: ImageBuild[];
  isLoading: boolean;
  error: unknown;
  isUpdating: boolean;
  refetch: VoidFunction;
  pagination: PaginationDetails<ImageBuildList>;
};

const enrichImageBuildsWithExports = (imageBuilds: ImageBuild[], imageExports: ImageExport[]): ImageBuild[] => {
  return imageBuilds.map((imageBuild) => {
    const matchedExports = imageExports.filter((imageExport) => {
      return (
        imageExport.spec.source.type === 'imageBuild' &&
        imageExport.spec.source.imageBuildRef === imageBuild.metadata?.name
      );
    });
    return {
      ...imageBuild,
      status: { ...imageBuild.status, exportImages: matchedExports },
    };
  });
};

export const useImageBuilds = (args: ImageBuildsEndpointArgs): ImageBuildLoad => {
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

  // Fetch all image exports to match with image builds
  // TODO: Remove this temporary fix once backend provides joined query
  const [imageExportsList, isLoadingExports, errorExports, refetchExports, updatingExports] =
    useFetchPeriodically<ImageExportList>(
      {
        endpoint: 'imageexports',
      },
      undefined,
    );

  const imageBuildsWithExports = React.useMemo(
    () => enrichImageBuildsWithExports(imageBuildsList?.items || [], imageExportsList?.items || []),
    [imageBuildsList, imageExportsList],
  );

  // Combine refetch functions
  const combinedRefetch = React.useCallback(() => {
    refetch();
    refetchExports();
  }, [refetch, refetchExports]);

  return {
    imageBuilds: imageBuildsWithExports,
    isLoading: isLoading || isLoadingExports,
    error: error || errorExports,
    isUpdating: updating || imageBuildsDebouncing || updatingExports,
    refetch: combinedRefetch,
    pagination,
  };
};
