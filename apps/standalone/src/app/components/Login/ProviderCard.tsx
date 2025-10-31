import * as React from 'react';
import { Card, CardBody, CardTitle, Stack, StackItem, Text, TextContent } from '@patternfly/react-core';
import { AuthProvider, OAuth2ProviderSpec } from '@flightctl/types';
import { useTranslation } from '@flightctl/ui-components/src/hooks/useTranslation';
import { ProviderType } from '@flightctl/ui-components/src/types/extraTypes';

type ProviderCardProps = {
  provider: AuthProvider;
  onClick: (provider: AuthProvider) => void;
};

const ProviderCard = ({ provider, onClick }: ProviderCardProps) => {
  const { t } = useTranslation();
  const providerName = provider.metadata.name as string;
  const providerType = provider.spec.providerType;
  let authUrl = provider.spec.issuer;
  if (!authUrl && provider.spec.providerType === ProviderType.OAuth2) {
    authUrl = (provider.spec as OAuth2ProviderSpec).authorizationUrl;
  }

  return (
    <Card isClickable isSelectable onClick={() => onClick(provider)}>
      <CardTitle>{providerName}</CardTitle>
      <CardBody>
        <Stack hasGutter>
          <StackItem>
            <TextContent>
              <Text component="small">
                <strong>{t('Type')}:</strong> {providerType}
              </Text>
            </TextContent>
          </StackItem>
          {authUrl && (
            <StackItem>
              <TextContent>
                <Text component="small" style={{ wordBreak: 'break-all' }}>
                  <strong>{t('Authentication URL')}:</strong> {authUrl}
                </Text>
              </TextContent>
            </StackItem>
          )}
        </Stack>
      </CardBody>
    </Card>
  );
};

export default ProviderCard;
