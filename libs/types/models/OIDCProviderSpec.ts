/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AuthOrganizationAssignment } from './AuthOrganizationAssignment';
/**
 * OIDCProviderSpec describes an OIDC provider configuration.
 */
export type OIDCProviderSpec = {
  /**
   * The type of authentication provider.
   */
  providerType: 'oidc';
  /**
   * The OIDC issuer URL (e.g., https://accounts.google.com).
   */
  issuer: string;
  /**
   * The OIDC client ID.
   */
  clientId: string;
  /**
   * The OIDC client secret.
   */
  clientSecret: string;
  /**
   * Whether this OIDC provider is enabled.
   */
  enabled?: boolean;
  /**
   * List of OIDC scopes to request.
   */
  scopes?: Array<string>;
  organizationAssignment: AuthOrganizationAssignment;
  /**
   * JSON path to the username claim in the JWT token (e.g., "preferred_username", "email", "sub").
   */
  usernameClaim?: string;
  /**
   * JSON path to the role/group claim in the JWT token (e.g., "groups", "roles", "realm_access.roles").
   */
  roleClaim?: string;
};

