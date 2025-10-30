import { AuthenticationProvider } from '../../../../types/extraTypes';

export type AuthProviderFormValues = {
  name: string;
  type: 'OIDC' | 'OAuth2';
  clientId: string;
  clientSecret: string;
  enabled: boolean;
  issuer: string;
  // OAuth2 specific
  authorizationUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  // Optional claims
  usernameClaim: string;
  roleClaim: string;
};

export type CreateAuthProviderFormProps = {
  onClose: VoidFunction;
  onSuccess: (provider: AuthenticationProvider) => void;
  authProvider?: AuthenticationProvider;
};
