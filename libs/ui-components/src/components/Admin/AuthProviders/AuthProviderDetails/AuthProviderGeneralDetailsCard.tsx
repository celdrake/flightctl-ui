import * as React from 'react';
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Switch,
} from '@patternfly/react-core';
import { AuthProvider } from '@flightctl/types';
import { useTranslation } from '../../../../hooks/useTranslation';
import { isOAuth2AuthProviderSpec } from '../../../../types/extraTypes';

type AuthProviderGeneralDetailsCardProps = {
  providerDetails: AuthProvider;
};

const AuthProviderGeneralDetailsCard = ({ providerDetails }: AuthProviderGeneralDetailsCardProps) => {
  const { t } = useTranslation();
  const spec = providerDetails.spec;
  const isOauth2 = isOAuth2AuthProviderSpec(spec);

  return (
    <DescriptionList columnModifier={{ lg: '2Col' }}>
      <DescriptionListGroup>
        <DescriptionListTerm>{t('Name')}</DescriptionListTerm>
        <DescriptionListDescription>{providerDetails.metadata.name}</DescriptionListDescription>
      </DescriptionListGroup>

      <DescriptionListGroup>
        <DescriptionListTerm>{t('Enabled')}</DescriptionListTerm>
        <DescriptionListDescription>
          <Switch name="enabled" isChecked={spec.enabled} />
        </DescriptionListDescription>
      </DescriptionListGroup>

      <DescriptionListGroup>
        <DescriptionListTerm>{t('Provider type')}</DescriptionListTerm>
        <DescriptionListDescription>{spec.providerType}</DescriptionListDescription>
      </DescriptionListGroup>

      <DescriptionListGroup>
        <DescriptionListTerm>{t('Client ID')}</DescriptionListTerm>
        <DescriptionListDescription>{spec.clientId}</DescriptionListDescription>
      </DescriptionListGroup>

      <DescriptionListGroup>
        <DescriptionListTerm>{t('Scopes')}</DescriptionListTerm>
        <DescriptionListDescription>{spec.scopes || '-'}</DescriptionListDescription>
      </DescriptionListGroup>

      <DescriptionListGroup>
        <DescriptionListTerm>{t('Issuer URL')}</DescriptionListTerm>
        <DescriptionListDescription>{spec.issuer || '-'}</DescriptionListDescription>
      </DescriptionListGroup>

      {isOauth2 && (
        <DescriptionListGroup>
          <DescriptionListTerm>{t('Authorization URL')}</DescriptionListTerm>
          <DescriptionListDescription>{spec.authorizationUrl || '-'}</DescriptionListDescription>
        </DescriptionListGroup>
      )}

      {isOauth2 && (
        <DescriptionListGroup>
          <DescriptionListTerm>{t('Token URL')}</DescriptionListTerm>
          <DescriptionListDescription>{spec.tokenUrl || '-'}</DescriptionListDescription>
        </DescriptionListGroup>
      )}

      {isOauth2 && (
        <DescriptionListGroup>
          <DescriptionListTerm>{t('User info URL')}</DescriptionListTerm>
          <DescriptionListDescription>{spec.userinfoUrl || '-'}</DescriptionListDescription>
        </DescriptionListGroup>
      )}

      {spec.usernameClaim && (
        <DescriptionListGroup>
          <DescriptionListTerm>{t('Username claim')}</DescriptionListTerm>
          <DescriptionListDescription>{spec.usernameClaim}</DescriptionListDescription>
        </DescriptionListGroup>
      )}

      {spec.roleClaim && (
        <DescriptionListGroup>
          <DescriptionListTerm>{t('Role claim')}</DescriptionListTerm>
          <DescriptionListDescription>{spec.roleClaim}</DescriptionListDescription>
        </DescriptionListGroup>
      )}
    </DescriptionList>
  );
};

export default AuthProviderGeneralDetailsCard;
