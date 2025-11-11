/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AuthProvider } from './AuthProvider';
export type AuthConfig = {
  /**
   * APIVersion defines the versioned schema of this representation of an object. Servers should convert recognized schemas to the latest internal value, and may reject unrecognized values. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#resources.
   */
  apiVersion: string;
  /**
   * List of all available authentication providers.
   */
  providers?: Array<AuthProvider>;
  /**
   * Name of the default authentication provider.
   */
  defaultProvider?: string;
  /**
   * Whether organizations are enabled for authentication.
   */
  organizationsEnabled?: boolean;
};

