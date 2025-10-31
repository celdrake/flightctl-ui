import * as React from 'react';
import { TFunction } from 'react-i18next';
import { Button, Card, CardBody, CardTitle, Stack, StackItem, Title } from '@patternfly/react-core';

import { AuthProviderInfo } from '@flightctl/types';
import fcLogo from '@fctl-assets/bgimages/flight-control-logo.svg';
import rhemLogo from '@fctl-assets/bgimages/RHEM-logo.svg';

import { useTranslation } from '../../hooks/useTranslation';
import { useAppContext } from '../../hooks/useAppContext';

type ProviderSelectorProps = {
  providers: AuthProviderInfo[];
  onProviderSelect: (provider: AuthProviderInfo) => void;
};

const getProviderDisplayName = (provider: AuthProviderInfo, t: TFunction) => {
  if (provider.displayName) {
    return provider.displayName;
  }
  if (provider.type === AuthProviderInfo.type.K8S) {
    return t('Kubernetes');
  }
  if (provider.type === AuthProviderInfo.type.AAP) {
    return t('Ansible Automation Platform');
  }
  return provider.name;
};

const ProviderSelector = ({ providers, onProviderSelect }: ProviderSelectorProps) => {
  const { t } = useTranslation();
  const { settings } = useAppContext();

  const duplicateProviderNames = React.useMemo(() => {
    // Record of provider names and display names that are duplicates
    const result: Record<string, boolean> = {};

    providers.forEach((provider) => {
      const displayName = provider.displayName || (provider.name as string);
      if (result[displayName] === undefined) {
        result[displayName] = false;
      } else {
        result[displayName] = true;
      }
    });

    return result;
  }, [providers]);

  return (
    <>
      <Card isLarge>
        <CardBody>
          <Stack hasGutter>
            <StackItem>
              <img
                src={settings.isRHEM ? (rhemLogo as string) : (fcLogo as string)}
                alt={settings.isRHEM ? 'Red Hat Edge Manager' : 'Flight Control'}
              />
            </StackItem>

            <StackItem>
              <CardTitle>
                <Title headingLevel="h2" size="lg">
                  {t('Choose login method')}
                </Title>
              </CardTitle>
            </StackItem>

            <StackItem>
              <Stack hasGutter>
                {providers.map((provider) => {
                  const providerName = provider.name as string;
                  const displayName = provider.displayName || providerName;

                  const isDuplicateName = duplicateProviderNames[displayName];

                  return (
                    <StackItem key={`${providerName}-${provider.issuer}-${provider.clientId}`}>
                      <Button
                        variant={provider.isDefault ? 'primary' : 'secondary'}
                        isBlock
                        size="lg"
                        onClick={() => onProviderSelect(provider)}
                      >
                        {t('Log in with {{ providerName }}', { providerName: getProviderDisplayName(provider, t) })}
                      </Button>
                      {isDuplicateName && (
                        <small>
                          {provider.issuer || provider.authUrl || ''} {provider.clientId && `(${provider.clientId})`}
                        </small>
                      )}
                    </StackItem>
                  );
                })}
              </Stack>
            </StackItem>
          </Stack>
        </CardBody>
      </Card>
    </>
  );
};

export default ProviderSelector;
