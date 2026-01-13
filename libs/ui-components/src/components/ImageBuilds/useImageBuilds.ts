import * as React from 'react';
import { useDebounce } from 'use-debounce';

import { ImageBuild, ImageBuildList } from '@flightctl/types/imagebuilder';
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

export type ImageBuildsLoad = {
  imageBuilds: ImageBuild[];
  isLoading: boolean;
  error: unknown;
  isUpdating: boolean;
  refetch: VoidFunction;
  pagination: PaginationDetails<ImageBuildList>;
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
    imageBuilds: imageBuildsList?.items || [],
    isLoading,
    error,
    isUpdating: updating || imageBuildsDebouncing,
    refetch,
    pagination,
  };
};
