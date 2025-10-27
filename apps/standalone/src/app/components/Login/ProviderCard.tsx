import * as React from 'react';
import { Card, CardBody, CardTitle, Stack, StackItem, Text, TextContent } from '@patternfly/react-core';
import { AuthenticationProvider } from '@flightctl/ui-components/src/types/extraTypes';
import { useTranslation } from '@flightctl/ui-components/src/hooks/useTranslation';

type ProviderCardProps = {
  provider: AuthenticationProvider;
  onClick: (provider: AuthenticationProvider) => void;
};

const ProviderCard = ({ provider, onClick }: ProviderCardProps) => {
  const { t } = useTranslation();
  const providerName = provider.metadata.name as string;
  const providerType = provider.spec.type;
  const issuer = provider.spec.type === 'OIDC' ? provider.spec.issuer : provider.spec.authorizationUrl;

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
          {issuer && (
            <StackItem>
              <TextContent>
                <Text component="small" style={{ wordBreak: 'break-all' }}>
                  <strong>{t('Issuer')}:</strong> {issuer}
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
