import * as React from 'react';
import { Card, CardBody, CardTitle, Stack, StackItem, Title } from '@patternfly/react-core';

import { AuthProviderInfo } from '@flightctl/types';
import { useTranslation } from '../../hooks/useTranslation';

type ProviderSelectorProps = {
  providers: AuthProviderInfo[];
  onProviderSelect: (provider: AuthProviderInfo) => void;
};

const getProviderTypeLabel = (type?: string) => {
  switch (type) {
    case 'k8s':
      return 'Kubernetes';
    case 'oidc':
      return 'OIDC';
    case 'aap':
      return 'AAP';
    case 'oauth2':
      return 'OAuth2';
    default:
      return type || 'Unknown';
  }
};

const ProviderSelector = ({ providers, onProviderSelect }: ProviderSelectorProps) => {
  const { t } = useTranslation();
  if (providers.length <= 1) {
    return null;
  }

  return (
    <Stack hasGutter>
      <StackItem>
        <Title headingLevel="h2" size="xl">
          {t('Select Authentication Provider')}
        </Title>
      </StackItem>
      <StackItem>
        <Stack hasGutter>
          {providers.map((provider) => (
            <StackItem key={provider.name}>
              <Card isClickable isSelectable onClick={() => onProviderSelect(provider)} className="fctl-provider-card">
                <CardTitle>
                  <div className="fctl-provider-card-title">
                    <span>{provider.displayName || provider.name}</span>
                    {getProviderTypeLabel(provider.type)}
                  </div>
                </CardTitle>
                <CardBody>
                  {provider.type === 'k8s' && t('Authenticate using Kubernetes token')}
                  {provider.type === 'oidc' && t('Authenticate using OpenID Connect')}
                  {provider.type === 'aap' && t('Authenticate using Ansible Automation Platform')}
                  {provider.type === 'oauth2' && t('Authenticate using OAuth2')}
                </CardBody>
              </Card>
            </StackItem>
          ))}
        </Stack>
      </StackItem>
    </Stack>
  );
};

export default ProviderSelector;
