/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * OpenID Connect configuration
 */
export type OpenIDConfiguration = {
  /**
   * OIDC issuer.
   */
  issuer?: string;
  /**
   * Authorization endpoint.
   */
  authorization_endpoint?: string;
  /**
   * Token endpoint.
   */
  token_endpoint?: string;
  /**
   * UserInfo endpoint.
   */
  userinfo_endpoint?: string;
  /**
   * JWKS endpoint.
   */
  jwks_uri?: string;
  /**
   * Supported response types.
   */
  response_types_supported?: Array<string>;
  /**
   * Supported grant types.
   */
  grant_types_supported?: Array<string>;
  /**
   * Supported scopes.
   */
  scopes_supported?: Array<string>;
  /**
   * Supported claims.
   */
  claims_supported?: Array<string>;
  /**
   * Supported signing algorithms.
   */
  id_token_signing_alg_values_supported?: Array<string>;
  /**
   * Supported authentication methods.
   */
  token_endpoint_auth_methods_supported?: Array<string>;
};

