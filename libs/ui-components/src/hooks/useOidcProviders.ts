import * as React from 'react';
import { OIDCProvider, OIDCProviderList } from '../types/extraTypes';
import { getErrorMessage } from '../utils/error';

type UseOidcProvidersResult = {
  providers: OIDCProvider[];
  enabledProviders: OIDCProvider[];
  isLoading: boolean;
  error: string | undefined;
  refetch: () => void;
};

type ProxyFetchFunction = (endpoint: string, requestInit: RequestInit) => Promise<Response>;

/**
 * Hook to fetch and manage OIDC providers
 * @param proxyFetch - Function to make proxy API calls
 * @returns Object containing providers list, loading state, error, and refetch function
 */
export const useOidcProviders = (proxyFetch: ProxyFetchFunction): UseOidcProvidersResult => {
  const [providers, setProviders] = React.useState<OIDCProvider[]>([]);
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
        const response = await proxyFetch('oidcproviders', {
          method: 'GET',
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch OIDC providers: ${response.status} ${response.statusText}`);
        }

        const data = (await response.json()) as OIDCProviderList;
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
