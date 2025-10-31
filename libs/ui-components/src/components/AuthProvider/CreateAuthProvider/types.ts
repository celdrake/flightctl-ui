import {
  AuthDynamicOrganizationAssignment,
  AuthOrganizationAssignment,
  AuthPerUserOrganizationAssignment,
  AuthProviderSpec,
  AuthStaticOrganizationAssignment,
  OAuth2ProviderSpec,
  OIDCProviderSpec,
} from '@flightctl/types';

export enum OrgAssignmentType {
  Static = 'static',
  Dynamic = 'dynamic',
  PerUser = 'perUser',
}

export enum ProviderType {
  OIDC = 'oidc',
  OAuth2 = 'oauth2',
}

export const DEFAULT_USERNAME_CLAIM = 'preferred_username';
export const DEFAULT_ROLE_CLAIM = 'groups';

// The backend masks secrets with this value via HideSensitiveData()
export const MASKED_SECRET_VALUE = '*****';

export const isOidcProvider = (providerSpec: AuthProviderSpec): providerSpec is OIDCProviderSpec =>
  providerSpec.providerType === ProviderType.OIDC;

export const isOAuth2Provider = (providerSpec: AuthProviderSpec): providerSpec is OAuth2ProviderSpec =>
  providerSpec.providerType === ProviderType.OAuth2;

export const isOrgAssignmentStatic = (
  orgAssignment: AuthOrganizationAssignment,
): orgAssignment is AuthStaticOrganizationAssignment => orgAssignment.type === OrgAssignmentType.Static;

export const isOrgAssignmentDynamic = (
  orgAssignment: AuthOrganizationAssignment,
): orgAssignment is AuthDynamicOrganizationAssignment => orgAssignment.type === OrgAssignmentType.Dynamic;

export const isOrgAssignmentPerUser = (
  orgAssignment: AuthOrganizationAssignment,
): orgAssignment is AuthPerUserOrganizationAssignment => orgAssignment.type === OrgAssignmentType.PerUser;

export type AuthProviderFormValues = {
  exists: boolean;
  name: string;
  providerType: ProviderType;
  issuer: string;
  clientId: string;
  clientSecret: string;
  enabled: boolean;
  scopes: string[];
  usernameClaim?: string;
  roleClaim?: string;

  // OAuth2 specific fields
  authorizationUrl?: string;
  tokenUrl?: string;
  userinfoUrl?: string;

  orgAssignmentType: OrgAssignmentType;
  orgName?: string; // OrgAssignment: Static only
  claimPath?: string; // OrgAssignment: Dynamic only
  orgNamePrefix?: string; // OrgAssignment: Dynamic and perUser
  orgNameSuffix?: string; // OrgAssignment: Dynamic and perUser
};
