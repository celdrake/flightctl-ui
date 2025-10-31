/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * OIDC UserInfo response
 */
export type UserInfoResponse = {
  /**
   * Subject identifier.
   */
  sub?: string;
  /**
   * Preferred username.
   */
  preferred_username?: string;
  /**
   * Full name.
   */
  name?: string;
  /**
   * Email address.
   */
  email?: string;
  /**
   * Email verification status.
   */
  email_verified?: boolean;
  /**
   * User roles.
   */
  roles?: Array<string>;
  /**
   * User organizations.
   */
  organizations?: Array<string>;
  /**
   * Error code.
   */
  error?: string;
};

