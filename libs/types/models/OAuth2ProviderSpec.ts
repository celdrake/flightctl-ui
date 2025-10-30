/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AuthOrganizationAssignment } from './AuthOrganizationAssignment';
/**
 * OAuth2ProviderSpec describes an OAuth2 provider configuration.
 */
export type OAuth2ProviderSpec = {
  /**
   * The type of authentication provider.
   */
  providerType: 'oauth2';
  /**
   * The OAuth2 issuer identifier (used for issuer identification in tokens).
   */
  issuer: string;
  /**
   * The OAuth2 authorization endpoint URL.
   */
  authorizationUrl: string;
  /**
   * The OAuth2 token endpoint URL.
   */
  tokenUrl: string;
  /**
   * The OAuth2 userinfo endpoint URL.
   */
  userinfoUrl: string;
  /**
   * The OAuth2 client ID.
   */
  clientId: string;
  /**
   * The OAuth2 client secret.
   */
  clientSecret: string;
  /**
   * Whether this OAuth2 provider is enabled.
   */
  enabled?: boolean;
  /**
   * List of OAuth2 scopes to request.
   */
  scopes?: Array<string>;
  organizationAssignment: AuthOrganizationAssignment;
  /**
   * JSON path to the username claim in the userinfo response (e.g., "preferred_username", "email", "sub").
   */
  usernameClaim?: string;
  /**
   * JSON path to the role/group claim in the userinfo response (e.g., "groups", "roles", "realm_access.roles").
   */
  roleClaim?: string;
};

