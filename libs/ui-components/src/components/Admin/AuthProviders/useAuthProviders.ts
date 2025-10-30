import * as React from 'react';
import { useDebounce } from 'use-debounce';

import { useAppContext } from '../../../hooks/useAppContext';
import { useFetchPeriodically } from '../../../hooks/useFetchPeriodically';
import { PaginationDetails, useTablePagination } from '../../../hooks/useTablePagination';
import { PAGE_SIZE } from '../../../constants';
import { AuthenticationProvider, AuthenticationProviderList } from '../../../types/extraTypes';

export enum AuthProviderSearchParams {
  Name = 'name',
}

type AuthProvidersEndpointArgs = {
  name?: string;
  nextContinue?: string;
};

export const useAuthProviderBackendFilters = () => {
  const {
    router: { useSearchParams },
  } = useAppContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const paramsRef = React.useRef(searchParams);
  const name = searchParams.get(AuthProviderSearchParams.Name) || undefined;

  const setName = React.useCallback(
    (nameVal: string) => {
      const newParams = new URLSearchParams({
        [AuthProviderSearchParams.Name]: nameVal,
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

const getAuthProvidersEndpoint = ({ name, nextContinue }: { name?: string; nextContinue?: string }) => {
  const params = new URLSearchParams({
    limit: `${PAGE_SIZE}`,
  });
  if (name) {
    params.set('fieldSelector', `metadata.name contains ${name}`);
  }
  if (nextContinue) {
    params.set('continue', nextContinue);
  }
  return `authproviders?${params.toString()}`;
};

const useAuthProvidersEndpoint = (args: AuthProvidersEndpointArgs): [string, boolean] => {
  const endpoint = getAuthProvidersEndpoint(args);
  const [authProvidersEndpointDebounced] = useDebounce(endpoint, 1000);
  return [authProvidersEndpointDebounced, endpoint !== authProvidersEndpointDebounced];
};

export type AuthProviderLoad = {
  authProviders: AuthenticationProvider[];
  isLoading: boolean;
  error: unknown;
  isUpdating: boolean;
  refetch: VoidFunction;
  pagination: PaginationDetails<AuthenticationProviderList>;
};

export const useAuthProviders = (args: AuthProvidersEndpointArgs): AuthProviderLoad => {
  const pagination = useTablePagination<AuthenticationProviderList>();
  const [authProvidersEndpoint, authProvidersDebouncing] = useAuthProvidersEndpoint({
    ...args,
    nextContinue: pagination.nextContinue,
  });
  const [authProvidersList, isLoading, error, refetch, updating] = useFetchPeriodically<AuthenticationProviderList>(
    {
      endpoint: authProvidersEndpoint,
    },
    pagination.onPageFetched,
  );
  return {
    authProviders: authProvidersList?.items || [],
    isLoading,
    error,
    isUpdating: updating || authProvidersDebouncing,
    refetch,
    pagination,
  };
};
