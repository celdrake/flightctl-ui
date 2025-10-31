/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Auth config.
 */
export type AuthProviderInfo = {
  /**
   * Unique identifier for the provider.
   */
  name?: string;
  /**
   * Human-readable display name.
   */
  displayName?: string;
  /**
   * Type of authentication provider.
   */
  type?: AuthProviderInfo.type;
  /**
   * OIDC issuer URL (for OIDC providers).
   */
  issuer?: string;
  /**
   * Default client ID for OIDC/OAuth2 providers.
   */
  clientId?: string;
  /**
   * Authentication URL for the provider.
   */
  authUrl?: string;
  /**
   * Token endpoint URL (for OAuth2 providers).
   */
  tokenUrl?: string;
  /**
   * Userinfo endpoint URL (for OAuth2 providers).
   */
  userinfoUrl?: string;
  /**
   * OAuth2 scopes (for OAuth2 providers).
   */
  scopes?: Array<string>;
  /**
   * JSON path to the username claim (for OIDC/OAuth2 providers) as an array of path segments.
   */
  usernameClaim?: Array<string>;
  /**
   * Whether this is the default provider.
   */
  isDefault?: boolean;
  /**
   * Whether this is a static provider (from config) or dynamic (from database).
   */
  isStatic?: boolean;
};
export namespace AuthProviderInfo {
  /**
   * Type of authentication provider.
   */
  export enum type {
    OIDC = 'oidc',
    K8S = 'k8s',
    AAP = 'aap',
    OAUTH2 = 'oauth2',
  }
}

