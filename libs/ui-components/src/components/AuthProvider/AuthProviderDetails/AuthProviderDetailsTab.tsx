import * as React from 'react';
import {
  Card,
  CardBody,
  CardTitle,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Label,
  LabelGroup,
  Stack,
  StackItem,
} from '@patternfly/react-core';
import { AuthProvider } from '@flightctl/types';

import { useTranslation } from '../../../hooks/useTranslation';
import {
  DEFAULT_ROLE_CLAIM,
  DEFAULT_USERNAME_CLAIM,
  OrgAssignmentType,
  isOAuth2Provider,
} from '../CreateAuthProvider/types';

const Scopes = ({ scopes }: { scopes: string[] | undefined }) => {
  if (!scopes || scopes.length === 0) {
    return 'N/A';
  }
  return (
    <LabelGroup>
      {scopes.map((scope, index) => (
        <Label key={`${scope}-${index}`}>{scope}</Label>
      ))}
    </LabelGroup>
  );
};

const AuthProviderDetailsTab = ({ authProvider }: { authProvider: AuthProvider }) => {
  const { t } = useTranslation();
  const spec = authProvider.spec;
  const isOAuth2 = isOAuth2Provider(spec);
  const orgAssignment = spec.organizationAssignment;
  const isEnabled = spec.enabled ?? true;

  return (
    <Stack hasGutter>
      {/* Provider Overview Card */}
      <StackItem>
        <Card>
          <CardTitle>{t('Provider overview')}</CardTitle>
          <CardBody>
            <DescriptionList columnModifier={{ default: '3Col' }}>
              <DescriptionListGroup>
                <DescriptionListTerm>{t('Name')}</DescriptionListTerm>
                <DescriptionListDescription>{authProvider.metadata.name}</DescriptionListDescription>
              </DescriptionListGroup>

              <DescriptionListGroup>
                <DescriptionListTerm>{t('Type')}</DescriptionListTerm>
                <DescriptionListDescription>
                  <Label color="blue">{spec.providerType}</Label>
                </DescriptionListDescription>
              </DescriptionListGroup>

              <DescriptionListGroup>
                <DescriptionListTerm>{t('Status')}</DescriptionListTerm>
                <DescriptionListDescription>
                  <Label color={isEnabled ? 'green' : undefined}>{isEnabled ? t('Enabled') : t('Disabled')}</Label>
                </DescriptionListDescription>
              </DescriptionListGroup>
            </DescriptionList>
          </CardBody>
        </Card>
      </StackItem>

      {/* OIDC/OAuth2 Configuration Card */}
      {(isOAuth2 || spec.issuer) && (
        <StackItem>
          <Card>
            <CardTitle>{isOAuth2 ? t('OAuth2 configuration') : t('OIDC configuration')}</CardTitle>
            <CardBody>
              <DescriptionList isHorizontal>
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
                  <DescriptionListTerm>{t('Issuer URL')}</DescriptionListTerm>
                  <DescriptionListDescription>{spec.issuer || 'N/A'}</DescriptionListDescription>
                </DescriptionListGroup>
              </DescriptionList>
            </CardBody>
          </Card>
        </StackItem>
      )}

      {/* Client Configuration Card */}
      <StackItem>
        <Card>
          <CardTitle>{t('Client configuration')}</CardTitle>
          <CardBody>
            <DescriptionList columnModifier={{ default: '2Col' }}>
              <DescriptionListGroup>
                <DescriptionListTerm>{t('Client ID')}</DescriptionListTerm>
                <DescriptionListDescription>{spec.clientId}</DescriptionListDescription>
              </DescriptionListGroup>

              <DescriptionListGroup>
                <DescriptionListTerm>{t('Scopes')}</DescriptionListTerm>
                <DescriptionListDescription>
                  <Scopes scopes={spec.scopes} />
                </DescriptionListDescription>
              </DescriptionListGroup>
            </DescriptionList>
          </CardBody>
        </Card>
      </StackItem>

      {/* Claims Mapping Card */}
      <StackItem>
        <Card>
          <CardTitle>{t('Claims mapping')}</CardTitle>
          <CardBody>
            <DescriptionList columnModifier={{ default: '2Col' }}>
              <DescriptionListGroup>
                <DescriptionListTerm>{t('Username claim')}</DescriptionListTerm>
                <DescriptionListDescription>
                  {spec.usernameClaim || `${DEFAULT_USERNAME_CLAIM} - (${t('Default')})`}
                </DescriptionListDescription>
              </DescriptionListGroup>

              <DescriptionListGroup>
                <DescriptionListTerm>{t('Role claim')}</DescriptionListTerm>
                <DescriptionListDescription>
                  {spec.roleClaim || `${DEFAULT_ROLE_CLAIM} - (${t('Default')})`}
                </DescriptionListDescription>
              </DescriptionListGroup>
            </DescriptionList>
          </CardBody>
        </Card>
      </StackItem>

      {/* Organization Assignment Card */}
      <StackItem>
        <Card>
          <CardTitle>{t('Organization assignment')}</CardTitle>
          <CardBody>
            <Stack hasGutter>
              <StackItem>
                <strong>{t('Assignment type')}</strong>
              </StackItem>
              <StackItem>
                <Label color="blue">{orgAssignment.type}</Label>
              </StackItem>
              {orgAssignment.type === OrgAssignmentType.Static && orgAssignment.organizationName && (
                <StackItem>
                  <DescriptionList>
                    <DescriptionListGroup>
                      <DescriptionListTerm>{t('Organization')}</DescriptionListTerm>
                      <DescriptionListDescription>{orgAssignment.organizationName}</DescriptionListDescription>
                    </DescriptionListGroup>
                  </DescriptionList>
                </StackItem>
              )}
              {orgAssignment.type === OrgAssignmentType.Dynamic && (
                <StackItem>
                  <DescriptionList>
                    <DescriptionListGroup>
                      <DescriptionListTerm>{t('Claim path')}</DescriptionListTerm>
                      <DescriptionListDescription>{orgAssignment.claimPath}</DescriptionListDescription>
                    </DescriptionListGroup>
                    {(orgAssignment.organizationNamePrefix || orgAssignment.organizationNameSuffix) && (
                      <>
                        <DescriptionListGroup>
                          <DescriptionListTerm>{t('Prefix')}</DescriptionListTerm>
                          <DescriptionListDescription>
                            {orgAssignment.organizationNamePrefix || 'N/A'}
                          </DescriptionListDescription>
                        </DescriptionListGroup>
                        <DescriptionListGroup>
                          <DescriptionListTerm>{t('Suffix')}</DescriptionListTerm>
                          <DescriptionListDescription>
                            {orgAssignment.organizationNameSuffix || 'N/A'}
                          </DescriptionListDescription>
                        </DescriptionListGroup>
                      </>
                    )}
                  </DescriptionList>
                </StackItem>
              )}
              {orgAssignment.type === OrgAssignmentType.PerUser &&
                (orgAssignment.organizationNamePrefix || orgAssignment.organizationNameSuffix) && (
                  <StackItem>
                    <DescriptionList>
                      <DescriptionListGroup>
                        <DescriptionListTerm>{t('Prefix')}</DescriptionListTerm>
                        <DescriptionListDescription>
                          {orgAssignment.organizationNamePrefix || 'N/A'}
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>{t('Suffix')}</DescriptionListTerm>
                        <DescriptionListDescription>
                          {orgAssignment.organizationNameSuffix || 'N/A'}
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                    </DescriptionList>
                  </StackItem>
                )}
            </Stack>
          </CardBody>
        </Card>
      </StackItem>
    </Stack>
  );
};

export default AuthProviderDetailsTab;
