import { AuthProvider } from '@flightctl/types';
import { ProviderType } from '../../../../types/extraTypes';

export type AuthProviderFormValues = {
  name: string;
  type: ProviderType;
  clientId: string;
  clientSecret: string;
  enabled: boolean;
  issuer?: string; // mandatory for OIDC, optional for OAuth2
  usernameClaim?: string;
  roleClaim?: string;
  scopes?: string;
  // OAuth2 specific
  authorizationUrl?: string;
  tokenUrl?: string;
  userInfoUrl?: string;
};

export type CreateAuthProviderFormProps = {
  onClose: VoidFunction;
  onSuccess: (provider: AuthProvider) => void;
  authProvider?: AuthProvider;
};
