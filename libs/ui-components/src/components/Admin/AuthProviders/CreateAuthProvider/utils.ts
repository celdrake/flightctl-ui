import * as Yup from 'yup';
import { TFunction } from 'i18next';
import { AuthProvider, OAuth2ProviderSpec, OIDCProviderSpec, PatchRequest } from '@flightctl/types';
import { AuthProviderFormValues } from './types';
import { isOidcAuthProviderSpec, ProviderType } from '../../../../types/extraTypes';
import { validKubernetesDnsSubdomain } from '../../../form/validations';
import { appendJSONPatch } from '../../../../utils/patch';

const githubConfig = {
  clientId: '',
  clientSecret: '',
  authorizationUrl: 'https://github.com/login/oauth/authorize',
  tokenUrl: 'https://github.com/login/oauth/access_token',
  userInfoUrl: 'https://api.github.com/user',
  scopes: 'read:user user:email',
  usernameClaim: 'login',
  issuer: '',
};

const googleConfig = {
  issuer: 'https://accounts.google.com',
  clientId: '',
  clientSecret: '',
  scopes: 'openid email profile',
  usernameClaim: 'email',
  authorizationUrl: '',
  tokenUrl: '',
  userInfoUrl: '',
};

const mockType = ProviderType.OAuth2;

export const getInitValues = (authProvider?: AuthProvider): AuthProviderFormValues => {
  if (authProvider) {
    const isOIDC = isOidcAuthProviderSpec(authProvider.spec);
    const formValues: AuthProviderFormValues = {
      type: isOIDC ? ProviderType.OIDC : ProviderType.OAuth2,
      name: authProvider.metadata.name || '',
      clientId: authProvider.spec.clientId,
      enabled: authProvider.spec.enabled || false,
      usernameClaim: authProvider.spec.usernameClaim || '',
      roleClaim: authProvider.spec.roleClaim || '',
      scopes: authProvider.spec.scopes?.join(' ') || '',
      issuer: authProvider.spec.issuer || '',
      clientSecret: authProvider.spec.clientSecret || '',
    };
    if (!isOIDC) {
      const oauth2Spec = authProvider.spec as OAuth2ProviderSpec;
      formValues.authorizationUrl = oauth2Spec.authorizationUrl;
      formValues.tokenUrl = oauth2Spec.tokenUrl;
      formValues.userInfoUrl = oauth2Spec.userinfoUrl;
    } else {
      // TODO REMOVE
      formValues.authorizationUrl = googleConfig.authorizationUrl;
      formValues.tokenUrl = googleConfig.tokenUrl;
      formValues.userInfoUrl = googleConfig.userInfoUrl;
    }

    return formValues;
  }

  const config = mockType === ProviderType.OAuth2 ? githubConfig : googleConfig;

  return {
    name: 'test-provider',
    type: mockType,
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    enabled: true,
    issuer: config.issuer,
    authorizationUrl: config.authorizationUrl || '',
    tokenUrl: config.tokenUrl || '',
    userInfoUrl: config.userInfoUrl || '',
    usernameClaim: config.usernameClaim,
    roleClaim: '',
    scopes: config.scopes,
  };
};

export const getAuthProviderSchema = (t: TFunction, isEdit: boolean) =>
  Yup.object<AuthProviderFormValues>({
    name: validKubernetesDnsSubdomain(t, { isRequired: !isEdit }),
    type: Yup.string().oneOf([ProviderType.OIDC, ProviderType.OAuth2]).required(),
    clientId: Yup.string().required(t('Client ID is required')),
    clientSecret: Yup.string().when('type', {
      is: ProviderType.OAuth2,
      then: (schema) => schema.required(t('Client secret is required for OAuth2 providers')),
      otherwise: (schema) => schema,
    }),
    enabled: Yup.boolean().required(),
    issuer: Yup.string().when('type', {
      is: ProviderType.OIDC,
      then: (schema) => schema.url(t('Must be a valid URL')).required(t('Issuer URL is required for OIDC providers')),
      otherwise: (schema) => schema.url(t('Must be a valid URL')),
    }),
    authorizationUrl: Yup.string().when('type', {
      is: ProviderType.OAuth2,
      then: (schema) => schema.url(t('Must be a valid URL')).required(t('Authorization URL is required for OAuth2')),
      otherwise: (schema) => schema,
    }),
    tokenUrl: Yup.string().when('type', {
      is: ProviderType.OAuth2,
      then: (schema) => schema.url(t('Must be a valid URL')).required(t('Token URL is required for OAuth2')),
      otherwise: (schema) => schema,
    }),
    userInfoUrl: Yup.string().when('type', {
      is: ProviderType.OAuth2,
      then: (schema) => schema.url(t('Must be a valid URL')).required(t('User info URL is required for OAuth2')),
      otherwise: (schema) => schema,
    }),
    usernameClaim: Yup.string(),
    roleClaim: Yup.string(),
    scopes: Yup.string().required(t('Scopes are required')),
  });

// CELIA-WIP IMPROVE
export const getAuthProvider = (values: AuthProviderFormValues): AuthProvider => {
  const baseProvider = {
    apiVersion: 'v1alpha1',
    kind: 'AuthProvider',
    metadata: {
      name: values.name,
    },
  };

  // Split scopes string into array
  const scopesArray = values.scopes ? values.scopes.split(/\s+/).filter(Boolean) : [];

  if (values.type === ProviderType.OIDC) {
    const spec: OIDCProviderSpec = {
      providerType: ProviderType.OIDC,
      clientId: values.clientId,
      clientSecret: values.clientSecret,
      enabled: values.enabled,
      issuer: values.issuer || '',
      scopes: scopesArray,
      organizationAssignment: {
        type: 'static',
        organizationName: 'default',
      },
    };

    if (values.usernameClaim) {
      spec.usernameClaim = values.usernameClaim;
    }
    if (values.roleClaim) {
      spec.roleClaim = values.roleClaim;
    }

    return {
      ...baseProvider,
      spec,
    };
  } else {
    const spec: OAuth2ProviderSpec = {
      providerType: ProviderType.OAuth2,
      clientId: values.clientId,
      clientSecret: values.clientSecret,
      enabled: values.enabled,
      issuer: values.issuer || '',
      authorizationUrl: values.authorizationUrl || '',
      tokenUrl: values.tokenUrl || '',
      userinfoUrl: values.userInfoUrl || '',
      scopes: scopesArray,
      organizationAssignment: {
        type: 'static',
        organizationName: 'default',
      },
    };

    if (values.usernameClaim) {
      spec.usernameClaim = values.usernameClaim;
    }
    if (values.roleClaim) {
      spec.roleClaim = values.roleClaim;
    }

    return {
      ...baseProvider,
      spec,
    };
  }
};

export const getAuthProviderPatches = (values: AuthProviderFormValues, authProvider: AuthProvider): PatchRequest => {
  const patches: PatchRequest = [];

  // Convert form type to API providerType
  const newProviderType = values.type;
  const currentProviderType = authProvider.spec.providerType;

  // Split scopes string into array
  const scopesArray = values.scopes ? values.scopes.split(/\s+/).filter(Boolean) : [];
  const originalScopesArray = authProvider.spec.scopes || [];

  // Check if type changed - if so, replace entire spec
  if (newProviderType !== currentProviderType) {
    const newProvider = getAuthProvider(values);
    patches.push({
      op: 'replace',
      path: '/spec',
      value: newProvider.spec,
    });
    return patches;
  }

  // Common fields that apply to both OIDC and OAuth2
  appendJSONPatch({
    patches,
    newValue: values.clientId,
    originalValue: authProvider.spec.clientId,
    path: '/spec/clientId',
  });

  appendJSONPatch({
    patches,
    newValue: values.enabled,
    originalValue: authProvider.spec.enabled,
    path: '/spec/enabled',
  });

  appendJSONPatch({
    patches,
    newValue: values.usernameClaim || undefined,
    originalValue: authProvider.spec.usernameClaim,
    path: '/spec/usernameClaim',
  });

  appendJSONPatch({
    patches,
    newValue: values.roleClaim || undefined,
    originalValue: authProvider.spec.roleClaim,
    path: '/spec/roleClaim',
  });

  // Update scopes if they changed
  if (JSON.stringify(scopesArray) !== JSON.stringify(originalScopesArray)) {
    appendJSONPatch({
      patches,
      newValue: scopesArray,
      originalValue: originalScopesArray,
      path: '/spec/scopes',
    });
  }

  // Type-specific fields
  if (values.type === ProviderType.OIDC) {
    appendJSONPatch({
      patches,
      newValue: values.issuer,
      originalValue: authProvider.spec.issuer,
      path: '/spec/issuer',
    });

    appendJSONPatch({
      patches,
      newValue: values.clientSecret,
      originalValue: (authProvider.spec as OIDCProviderSpec).clientSecret,
      path: '/spec/clientSecret',
    });
  } else if (values.type === ProviderType.OAuth2) {
    appendJSONPatch({
      patches,
      newValue: values.clientSecret,
      originalValue: (authProvider.spec as OAuth2ProviderSpec).clientSecret,
      path: '/spec/clientSecret',
    });

    appendJSONPatch({
      patches,
      newValue: values.authorizationUrl,
      originalValue: (authProvider.spec as OAuth2ProviderSpec).authorizationUrl,
      path: '/spec/authorizationUrl',
    });

    appendJSONPatch({
      patches,
      newValue: values.tokenUrl,
      originalValue: (authProvider.spec as OAuth2ProviderSpec).tokenUrl,
      path: '/spec/tokenUrl',
    });

    appendJSONPatch({
      patches,
      newValue: values.userInfoUrl,
      originalValue: (authProvider.spec as OAuth2ProviderSpec).userinfoUrl,
      path: '/spec/userinfoUrl',
    });

    appendJSONPatch({
      patches,
      newValue: values.issuer,
      originalValue: authProvider.spec.issuer,
      path: '/spec/issuer',
    });
  }

  return patches;
};
