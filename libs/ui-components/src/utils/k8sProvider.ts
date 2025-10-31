import { AuthProviderInfo } from '@flightctl/types';

// Simple JWT format validation - checks if token has 3 parts separated by dots
export const isValidJwtTokenFormat = (token: string): boolean => {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  // Check that each part contains only valid base64url characters
  const base64urlPattern = /^[A-Za-z0-9_-]+$/;
  return parts.every((part) => part.length > 0 && base64urlPattern.test(part));
};

export const nowInSeconds = () => Math.round(Date.now() / 1000);

export const isK8sTokenProvider = (provider: AuthProviderInfo): boolean => {
  // CELIA-WIP: Determine how to distinguish from OpenShift OAuth flow with k8s type
  return provider.type === 'k8s';
};
