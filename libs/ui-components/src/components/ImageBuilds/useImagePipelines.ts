import * as React from 'react';
import { useDebounce } from 'use-debounce';

import { ImagePipelineList, ImagePipelineResponse } from '@flightctl/types/imagebuilder';
import { useAppContext } from '../../hooks/useAppContext';
import { useFetchPeriodically } from '../../hooks/useFetchPeriodically';
import { PaginationDetails, useTablePagination } from '../../hooks/useTablePagination';
import { PAGE_SIZE } from '../../constants';

export enum ImagePipelinesSearchParams {
  Name = 'name',
}

type ImagePipelinesEndpointArgs = {
  name?: string;
  nextContinue?: string;
};

export const useImagePipelinesBackendFilters = () => {
  const {
    router: { useSearchParams },
  } = useAppContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const paramsRef = React.useRef(searchParams);
  const name = searchParams.get(ImagePipelinesSearchParams.Name) || undefined;

  const setName = React.useCallback(
    (nameVal: string) => {
      const newParams = new URLSearchParams({
        [ImagePipelinesSearchParams.Name]: nameVal,
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

const getImagePipelinesEndpoint = ({ name, nextContinue }: { name?: string; nextContinue?: string }) => {
  const params = new URLSearchParams({
    limit: `${PAGE_SIZE}`,
  });
  if (name) {
    params.set('fieldSelector', `metadata.name contains ${name}`);
  }
  if (nextContinue) {
    params.set('continue', nextContinue);
  }
  return `imagepipelines?${params.toString()}`;
};

const useImagePipelinesEndpoint = (args: ImagePipelinesEndpointArgs): [string, boolean] => {
  const endpoint = getImagePipelinesEndpoint(args);
  const [pipelinesEndpointDebounced] = useDebounce(endpoint, 1000);
  return [pipelinesEndpointDebounced, endpoint !== pipelinesEndpointDebounced];
};

export type ImagePipelinesLoad = {
  imagePipelines: ImagePipelineResponse[];
  isLoading: boolean;
  error: unknown;
  isUpdating: boolean;
  refetch: VoidFunction;
  pagination: PaginationDetails<ImagePipelineList>;
};

/**
 * Image pipelines allow us to operation on an image build and its associated image exports via a single endpoint.
 * An image pipeline doesn't have an entity on its own, and it is defined by its underlying image build.
 * This means that we can query and delete an imagePipeline using its build ID, and that will also get or delete both the image build and associated image exports).
 *
 * @param args query parameters
 * @returns information about the image pipelines
 */
export const useImagePipelines = (args: ImagePipelinesEndpointArgs): ImagePipelinesLoad => {
  const pagination = useTablePagination<ImagePipelineList>();
  const [pipelinesEndpoint, pipelinesDebouncing] = useImagePipelinesEndpoint({
    ...args,
    nextContinue: pagination.nextContinue,
  });
  const [pipelinesList, isLoading, error, refetch, updating] = useFetchPeriodically<ImagePipelineList>(
    {
      endpoint: pipelinesEndpoint,
    },
    pagination.onPageFetched,
  );

  return {
    imagePipelines: pipelinesList?.items || [],
    isLoading,
    error,
    isUpdating: updating || pipelinesDebouncing,
    refetch,
    pagination,
  };
};
