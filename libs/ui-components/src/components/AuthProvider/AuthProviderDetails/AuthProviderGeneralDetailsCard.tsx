import * as React from 'react';
import { DescriptionListDescription, DescriptionListGroup, DescriptionListTerm, Switch } from '@patternfly/react-core';
import { AuthProvider } from '@flightctl/types';

import { useTranslation } from '../../../hooks/useTranslation';
import FlightControlDescriptionList from '../../common/FlightCtlDescriptionList';
import {
  DEFAULT_ROLE_CLAIM,
  DEFAULT_USERNAME_CLAIM,
  OrgAssignmentType,
  isOAuth2Provider,
} from '../CreateAuthProvider/types';

const AuthProviderGeneralDetailsCard = ({ authProvider }: { authProvider: AuthProvider }) => {
  const { t } = useTranslation();
  const spec = authProvider.spec;
  const isOAuth2 = isOAuth2Provider(spec);
  const orgAssignment = spec.organizationAssignment;

  return (
    <FlightControlDescriptionList columnModifier={{ lg: '2Col' }}>
      <DescriptionListGroup>
        <DescriptionListTerm>{t('Name')}</DescriptionListTerm>
        <DescriptionListDescription>{authProvider.metadata.name}</DescriptionListDescription>
      </DescriptionListGroup>

      <DescriptionListGroup>
        <DescriptionListTerm>{t('Type')}</DescriptionListTerm>
        <DescriptionListDescription>{spec.providerType}</DescriptionListDescription>
      </DescriptionListGroup>

      <DescriptionListGroup>
        <DescriptionListTerm>{t('Enabled')}</DescriptionListTerm>
        <DescriptionListDescription>
          <Switch isChecked={spec.enabled ?? true} />
        </DescriptionListDescription>
      </DescriptionListGroup>

      <DescriptionListGroup>
        <DescriptionListTerm>{t('Issuer URL')}</DescriptionListTerm>
        <DescriptionListDescription>{spec.issuer || '-'}</DescriptionListDescription>
      </DescriptionListGroup>

      {isOAuth2 && (
        <>
          <DescriptionListGroup>
            <DescriptionListTerm>{t('Authorization URL')}</DescriptionListTerm>
            <DescriptionListDescription>{spec.authorizationUrl}</DescriptionListDescription>
          </DescriptionListGroup>

          <DescriptionListGroup>
            <DescriptionListTerm>{t('Token URL')}</DescriptionListTerm>
            <DescriptionListDescription>{spec.tokenUrl}</DescriptionListDescription>
          </DescriptionListGroup>

          <DescriptionListGroup>
            <DescriptionListTerm>{t('Userinfo URL')}</DescriptionListTerm>
            <DescriptionListDescription>{spec.userinfoUrl}</DescriptionListDescription>
          </DescriptionListGroup>
        </>
      )}

      <DescriptionListGroup>
        <DescriptionListTerm>{t('Client ID')}</DescriptionListTerm>
        <DescriptionListDescription>{spec.clientId}</DescriptionListDescription>
      </DescriptionListGroup>

      <DescriptionListGroup>
        <DescriptionListTerm>{t('Scopes')}</DescriptionListTerm>
        <DescriptionListDescription>{spec.scopes?.join(', ') || 'N/A'}</DescriptionListDescription>
      </DescriptionListGroup>

      <DescriptionListGroup>
        <DescriptionListTerm>{t('Username claim')}</DescriptionListTerm>
        <DescriptionListDescription>
          {spec.usernameClaim || `${DEFAULT_USERNAME_CLAIM} - ${t('Default')}`}
        </DescriptionListDescription>
      </DescriptionListGroup>

      {spec.roleClaim && (
        <DescriptionListGroup>
          <DescriptionListTerm>{t('Role claim')}</DescriptionListTerm>
          <DescriptionListDescription>
            {spec.roleClaim || `${DEFAULT_ROLE_CLAIM} - ${t('Default')}`}
          </DescriptionListDescription>
        </DescriptionListGroup>
      )}

      <DescriptionListGroup>
        <DescriptionListTerm>{t('Organization assignment')}</DescriptionListTerm>
        <DescriptionListDescription>
          {orgAssignment.type === OrgAssignmentType.Static && (
            <>
              <strong>{t('Static')}</strong>: {orgAssignment.organizationName}
            </>
          )}
          {orgAssignment.type === OrgAssignmentType.Dynamic && (
            <>
              <strong>{t('Dynamic')}</strong>: {orgAssignment.claimPath}
              {(orgAssignment.organizationNamePrefix || orgAssignment.organizationNameSuffix) && (
                <div style={{ marginTop: '0.5rem' }}>
                  {t('Prefix')}: {orgAssignment.organizationNamePrefix || 'N/A'}
                  <br />
                  {t('Suffix')}: {orgAssignment.organizationNameSuffix || 'N/A'}
                </div>
              )}
            </>
          )}
          {orgAssignment.type === OrgAssignmentType.PerUser && (
            <>
              <strong>{t('Per user')}</strong>
              {(orgAssignment.organizationNamePrefix || orgAssignment.organizationNameSuffix) && (
                <div style={{ marginTop: '0.5rem' }}>
                  {t('Prefix')}: {orgAssignment.organizationNamePrefix || 'N/A'}
                  <br />
                  {t('Suffix')}: {orgAssignment.organizationNameSuffix || 'N/A'}
                </div>
              )}
            </>
          )}
        </DescriptionListDescription>
      </DescriptionListGroup>
    </FlightControlDescriptionList>
  );
};

export default AuthProviderGeneralDetailsCard;
