import * as React from 'react';
import { TFunction } from 'react-i18next';
import { Button, Card, CardBody, CardTitle, Stack, StackItem, Title } from '@patternfly/react-core';

import { AuthProvider } from '@flightctl/types';
import fcLogo from '@fctl-assets/bgimages/flight-control-logo.svg';
import rhemLogo from '@fctl-assets/bgimages/RHEM-logo.svg';

import { useTranslation } from '../../hooks/useTranslation';
import { useAppContext } from '../../hooks/useAppContext';
import { ProviderType } from '../AuthProvider/CreateAuthProvider/types';

type ProviderSelectorProps = {
  providers: AuthProvider[];
  defaultProviderType: ProviderType | null;
  onProviderSelect: (provider: AuthProvider) => void;
  disabled?: boolean;
};

const getProviderDisplayName = (provider: AuthProvider, t: TFunction) => {
  const spec = provider.spec;
  if ('displayName' in spec && spec.displayName) {
    return spec.displayName;
  }
  if (provider.spec.providerType === ProviderType.K8s) {
    return t('Kubernetes');
  }

  if (provider.spec.providerType === ProviderType.AAP) {
    return t('Ansible Automation Platform');
  }
  return provider.metadata.name as string;
};

const getProviderKey = (provider: AuthProvider) => {
  const spec = provider.spec;
  if ('displayName' in spec && spec.displayName) {
    return spec.displayName;
  }
  if (provider.spec.providerType === ProviderType.K8s) {
    return t('Kubernetes');
  }

  if (provider.spec.providerType === ProviderType.AAP) {
    return t('Ansible Automation Platform');
  }
  return provider.metadata.name as string;
};

const ProviderSelector = ({
  providers,
  defaultProviderType,
  onProviderSelect,
  disabled = false,
}: ProviderSelectorProps) => {
  const { t } = useTranslation();
  const { settings } = useAppContext();

  const duplicateProviderNames = React.useMemo(() => {
    // Record of provider names and display names that are duplicates
    const result: Record<string, boolean> = {};

    providers.forEach((provider) => {
      const displayName = getProviderDisplayName(provider, t) || (provider.metadata.name as string);
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
                  const displayName = getProviderDisplayName(provider, t);

                  const isDuplicateName = duplicateProviderNames[displayName];

                  return (
                    <StackItem key={getProviderKey(provider)}>
                      <Button
                        variant={defaultProviderType === provider.spec.providerType ? 'primary' : 'secondary'}
                        isBlock
                        size="lg"
                        onClick={() => onProviderSelect(provider)}
                        isDisabled={disabled}
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
