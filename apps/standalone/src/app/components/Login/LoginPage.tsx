import * as React from 'react';
import { Alert, Bullseye, Spinner } from '@patternfly/react-core';

import { AuthConfig, AuthProviderInfo } from '@flightctl/types';
import ProviderSelector from '@flightctl/ui-components/src/components/Login/ProviderSelector';
import TokenLoginForm from '@flightctl/ui-components/src/components/Login/TokenLoginForm';
import { useFetch } from '@flightctl/ui-components/src/hooks/useFetch';
import { useTranslation } from '@flightctl/ui-components/src/hooks/useTranslation';
import { isK8sTokenProvider } from '@flightctl/ui-components/src/utils/k8sProvider';

import LoginPageLayout from './LoginPageLayout';

// CELIA-WIP: move to ui-components and use proxyFetch to talk to loginApi
import { loginAPI } from '../../utils/apiCalls';

const redirectToProviderLogin = async (provider: AuthProviderInfo) => {
  // CELIA-WIP if we have duplicate names then the name is not sufficient
  const response = await fetch(`${loginAPI}?provider=${provider.name}`);
  const { url } = (await response.json()) as { url: string };
  window.location.href = url;
};

const LoginPage = () => {
  const { t } = useTranslation();
  const { get } = useFetch();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string>();
  const [providers, setProviders] = React.useState<AuthProviderInfo[]>([]);
  const [userSelectedProvider, setUserSelectedProvider] = React.useState<AuthProviderInfo | null>(null);

  const handleProviderSelect = (provider: AuthProviderInfo) => {
    setUserSelectedProvider(provider);

    // For k8s token providers, we will show the TokenLoginForm.
    // For other providers, we will redirect to their OAuth flow.
    if (!isK8sTokenProvider(provider)) {
      try {
        redirectToProviderLogin(provider);
      } catch (err) {
        setError(
          t('Failed to initiate login with {{ providerName}} ', {
            providerName: provider.displayName || provider.name,
          }),
        );
      }
    }
  };

  React.useEffect(() => {
    const loadAuthConfig = async () => {
      try {
        const config = await get<AuthConfig>('auth/config');
        const providers = config?.providers || [];
        if (providers.length > 0) {
          setProviders(providers);
          if (providers.length === 1 && !isK8sTokenProvider(providers[0])) {
            redirectToProviderLogin(providers[0]);
          }
        } else {
          setError(t('No authentication providers found. Please contact your administrator.'));
        }
      } catch (err) {
        setError(t('Failed to load the authentication providers'));
      } finally {
        setLoading(false);
      }
    };

    void loadAuthConfig();
  }, [get, t]);

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

  let content: React.ReactNode = null;

  const selectedProvider = userSelectedProvider || (providers.length === 1 ? providers[0] : null);
  if (selectedProvider) {
    if (isK8sTokenProvider(selectedProvider)) {
      content = (
        <TokenLoginForm
          provider={selectedProvider}
          onBack={
            userSelectedProvider
              ? () => {
                  setUserSelectedProvider(null);
                }
              : undefined
          }
        />
      );
    } else {
      content = (
        <>
          {t('Redirecting to login for {{ provider }}...', {
            provider: selectedProvider.displayName || selectedProvider.name,
          })}
          <Spinner size="lg" />
        </>
      );
    }
  } else {
    content = <ProviderSelector providers={providers} onProviderSelect={handleProviderSelect} />;
  }

  return <LoginPageLayout>{content}</LoginPageLayout>;
};

export default LoginPage;
