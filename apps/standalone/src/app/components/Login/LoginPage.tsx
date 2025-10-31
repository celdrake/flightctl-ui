import * as React from 'react';
import {
  Bullseye,
  EmptyState,
  EmptyStateBody,
  EmptyStateHeader,
  EmptyStateIcon,
  Gallery,
  Icon,
  PageSection,
  Spinner,
  Stack,
  StackItem,
  Title,
} from '@patternfly/react-core';
import { ExclamationCircleIcon } from '@patternfly/react-icons/dist/js/icons/exclamation-circle-icon';
import { AuthProvider } from '@flightctl/types';
import { getErrorMessage } from '@flightctl/ui-components/src/utils/error';
import { useTranslation } from '@flightctl/ui-components/src/hooks/useTranslation';
import { useAuthProviders } from '@flightctl/ui-components/src/hooks/useAuthProviders';

import { useFetch } from '../../hooks/useFetch';
import ProviderCard from './ProviderCard';

const LoginPage = () => {
  const { t } = useTranslation();
  const { proxyFetch } = useFetch();
  const { enabledProviders, isLoading, error: authProvidersError } = useAuthProviders(proxyFetch);
  const [error, setError] = React.useState<string>();

  const handleProviderClick = async (provider: AuthProvider) => {
    try {
      const providerName = provider.metadata.name;
      const response = await proxyFetch(`login?provider=${providerName}`, {
        method: 'GET',
      });
      const { url } = (await response.json()) as { url: string };
      window.location.href = url;
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (isLoading) {
    return (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );
  }

  if (error || authProvidersError) {
    return (
      <Bullseye>
        <EmptyState variant="xl">
          <EmptyStateHeader
            titleText={
              authProvidersError
                ? t('Failed to load authentication providers')
                : t('Failed to login with the selected provider')
            }
            headingLevel="h4"
            icon={
              <Icon status="danger">
                <EmptyStateIcon icon={ExclamationCircleIcon} />
              </Icon>
            }
          />
          <EmptyStateBody>{error || authProvidersError}</EmptyStateBody>
        </EmptyState>
      </Bullseye>
    );
  }

  if (enabledProviders.length === 0) {
    return (
      <Bullseye>
        <EmptyState variant="xl">
          <EmptyStateHeader titleText={t('No authentication providers available')} headingLevel="h4" />
          <EmptyStateBody>{t('Please contact your administrator.')}</EmptyStateBody>
        </EmptyState>
      </Bullseye>
    );
  }

  const brand = 'Red Hat Edge Manager';

  return (
    <PageSection isFilled variant="light">
      <Bullseye>
        <Stack hasGutter>
          <StackItem>
            <Title headingLevel="h1" size="2xl">
              {brand}
            </Title>
          </StackItem>
          <StackItem>
            <Title headingLevel="h2" size="md">
              {t('Select authentication provider')}
            </Title>
          </StackItem>
          <StackItem>
            <Gallery hasGutter minWidths={{ default: '300px' }} maxWidths={{ default: '400px' }}>
              {enabledProviders.map((provider) => (
                <ProviderCard key={provider.metadata.name} provider={provider} onClick={handleProviderClick} />
              ))}
            </Gallery>
          </StackItem>
        </Stack>
      </Bullseye>
    </PageSection>
  );
};

export default LoginPage;
