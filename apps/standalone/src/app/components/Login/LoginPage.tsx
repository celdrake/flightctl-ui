import * as React from 'react';
import { Alert, Bullseye, Card, CardBody, PageSection, Spinner } from '@patternfly/react-core';

import { AuthConfig, AuthProviderInfo } from '@flightctl/types';
import ProviderSelector from '@flightctl/ui-components/src/components/Login/ProviderSelector';
import TokenLoginForm from '@flightctl/ui-components/src/components/Login/TokenLoginForm';
import { useFetch } from '@flightctl/ui-components/src/hooks/useFetch';
import { isK8sTokenProvider } from '@flightctl/ui-components/src/utils/k8sProvider';

// CELIA-WIP: move to ui-components and use proxyFetch to talk to loginApi
import { loginAPI } from '../../utils/apiCalls';

const LoginPage = () => {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string>();
  const [providers, setProviders] = React.useState<AuthProviderInfo[]>([]);
  const [tokenLoginProvider, setTokenLoginProvider] = React.useState<AuthProviderInfo | null>(null);
  const { get } = useFetch();

  React.useEffect(() => {
    const loadAuthConfig = async () => {
      try {
        const config = await get<AuthConfig>('auth/config');
        if (!config) {
          setError('Authentication is not configured');
          setLoading(false);
          return;
        }

        if (!config.providers) {
          // CELIA-WIP: remove when the API returns the list of providers again
          const mockedK8sProvider: AuthProviderInfo = {
            name: 'k8s',
            type: AuthProviderInfo.type.K8S,
            displayName: 'Kubernetes Token',
            isDefault: true,
            isStatic: true,
          };

          config.providers = [mockedK8sProvider];
        }

        // CELIA-WIP: we don't have a "enabled" flag, are only enabled ones being returned?
        const enabledProviders = config.providers?.filter((provider) => provider.isDefault);
        if (enabledProviders && enabledProviders.length > 0) {
          setProviders(enabledProviders);
          if (enabledProviders.length === 1 && isK8sTokenProvider(enabledProviders[0])) {
            setTokenLoginProvider(enabledProviders[0]);
          }
        }
      } catch (err) {
        setError('Failed to load authentication configuration');
      } finally {
        setLoading(false);
      }
    };

    void loadAuthConfig();
  }, [get]);

  const handleProviderSelect = async (provider: AuthProviderInfo) => {
    // CELIA-WIP: Dertermine how to distinguish from OpenShift OAuth flow with k8s type
    if (provider.type === 'k8s') {
      // Show token login form for K8s providers
      setTokenLoginProvider(provider);
    } else {
      // Redirect to OAuth flow for other providers
      try {
        const response = await fetch(loginAPI);
        const { url } = (await response.json()) as { url: string };
        window.location.href = url;
      } catch (err) {
        setError('Failed to initiate login');
      }
    }
  };

  const handleBack = () => {
    setTokenLoginProvider(null);
  };

  if (loading) {
    return (
      <Bullseye>
        <Spinner size="xl" />
      </Bullseye>
    );
  }

  if (error) {
    return (
      <Bullseye>
        <Alert variant="danger" title="Error" isInline>
          {error}
        </Alert>
      </Bullseye>
    );
  }

  // CELIA-WIP: If only one provider and not k8s, redirect to login for that provider
  return (
    <PageSection isFilled>
      <Bullseye>
        <Card style={{ maxWidth: '600px', width: '100%' }}>
          <CardBody>
            {tokenLoginProvider ? (
              <TokenLoginForm provider={tokenLoginProvider} onBack={providers.length === 1 ? undefined : handleBack} />
            ) : (
              <ProviderSelector providers={providers} onProviderSelect={handleProviderSelect} />
            )}
          </CardBody>
        </Card>
      </Bullseye>
    </PageSection>
  );
};

export default LoginPage;
