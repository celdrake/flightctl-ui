/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AuthProviderInfo } from './AuthProviderInfo';
export type AuthConfig = {
  /**
   * List of all available authentication providers.
   */
  providers?: Array<AuthProviderInfo>;
  /**
   * Name of the default authentication provider.
   */
  defaultProvider?: string;
  /**
   * Whether organizations are enabled for authentication.
   */
  organizationsEnabled?: boolean;
};

