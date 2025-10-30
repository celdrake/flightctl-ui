/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * OAuth2 token request
 */
export type TokenRequest = {
  /**
   * OAuth2 grant type.
   */
  grant_type: TokenRequest.grant_type;
  /**
   * Username for password grant.
   */
  username?: string;
  /**
   * Password for password grant.
   */
  password?: string;
  /**
   * Refresh token for refresh_token grant.
   */
  refresh_token?: string;
  /**
   * Authorization code for authorization_code grant.
   */
  code?: string;
  /**
   * OAuth2 client ID.
   */
  client_id?: string;
  /**
   * OAuth2 client secret.
   */
  client_secret?: string;
  /**
   * OAuth2 scope.
   */
  scope?: string;
};
export namespace TokenRequest {
  /**
   * OAuth2 grant type.
   */
  export enum grant_type {
    REFRESH_TOKEN = 'refresh_token',
    AUTHORIZATION_CODE = 'authorization_code',
  }
}

