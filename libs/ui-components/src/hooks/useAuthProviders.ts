import * as React from 'react';
import { AuthProvider, AuthProviderList } from '@flightctl/types';
import { getErrorMessage } from '../utils/error';

type UseAuthProvidersResult = {
  providers: AuthProvider[];
  enabledProviders: AuthProvider[];
  isLoading: boolean;
  error: string | undefined;
  refetch: () => void;
};

type ProxyFetchFunction = (endpoint: string, requestInit: RequestInit) => Promise<Response>;

/**
 * Hook to fetch and manage authentication providers
 * @param proxyFetch - Function to make proxy API calls
 * @returns Object containing providers list, loading state, error, and refetch function
 */
export const useAuthProviders = (proxyFetch: ProxyFetchFunction): UseAuthProvidersResult => {
  const [providers, setProviders] = React.useState<AuthProvider[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string>();
  const [refetchTrigger, setRefetchTrigger] = React.useState(0);

  const refetch = React.useCallback(() => {
    setRefetchTrigger((prev) => prev + 1);
  }, []);

  React.useEffect(() => {
    const fetchProviders = async () => {
      setIsLoading(true);
      setError(undefined);

      try {
        const response = await proxyFetch('authproviders', {
          method: 'GET',
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch authentication providers: ${response.status} ${response.statusText}`);
        }

        const data = (await response.json()) as AuthProviderList;
        setProviders(data.items || []);
      } catch (err) {
        setError(getErrorMessage(err));
        setProviders([]);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchProviders();
  }, [proxyFetch, refetchTrigger]);

  const enabledProviders = React.useMemo(() => {
    return providers.filter((provider) => provider.spec.enabled);
  }, [providers]);

  return {
    providers,
    enabledProviders,
    isLoading,
    error,
    refetch,
  };
};
