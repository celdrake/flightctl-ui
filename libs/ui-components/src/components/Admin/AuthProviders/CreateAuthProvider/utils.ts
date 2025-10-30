import * as Yup from 'yup';
import { TFunction } from 'i18next';
import { PatchRequest } from '@flightctl/types';
import { AuthenticationProvider, OAuth2ProviderSpec, OIDCProviderSpec } from '../../../../types/extraTypes';
import { AuthProviderFormValues } from './types';
import { validKubernetesDnsSubdomain } from '../../../form/validations';
import { appendJSONPatch } from '../../../../utils/patch';

export const getInitValues = (authProvider?: AuthenticationProvider): AuthProviderFormValues => {
  if (authProvider) {
    const isOAuth2 = authProvider.spec.type === 'OAuth2';
    return {
      name: authProvider.metadata.name || '',
      type: authProvider.spec.type,
      clientId: authProvider.spec.clientId,
      clientSecret: isOAuth2 ? (authProvider.spec as OAuth2ProviderSpec).clientSecret : '',
      enabled: authProvider.spec.enabled,
      issuer: authProvider.spec.issuer || '',
      authorizationUrl: isOAuth2 ? (authProvider.spec as OAuth2ProviderSpec).authorizationUrl : '',
      tokenUrl: isOAuth2 ? (authProvider.spec as OAuth2ProviderSpec).tokenUrl : '',
      userInfoUrl: isOAuth2 ? (authProvider.spec as OAuth2ProviderSpec).userInfoUrl : '',
      usernameClaim: authProvider.spec.usernameClaim || '',
      roleClaim: authProvider.spec.roleClaim || '',
    };
  }

  return {
    name: '',
    type: 'OIDC',
    clientId: '',
    clientSecret: '',
    enabled: true,
    issuer: '',
    authorizationUrl: '',
    tokenUrl: '',
    userInfoUrl: '',
    usernameClaim: '',
    roleClaim: '',
  };
};

export const getAuthProviderSchema = (t: TFunction, isEdit: boolean) =>
  Yup.object<AuthProviderFormValues>({
    name: validKubernetesDnsSubdomain(t, { isRequired: !isEdit }),
    type: Yup.string().oneOf(['OIDC', 'OAuth2']).required(),
    clientId: Yup.string().required(t('Client ID is required')),
    clientSecret: Yup.string().when('type', {
      is: 'OAuth2',
      then: (schema) => schema.required(t('Client secret is required for OAuth2 providers')),
      otherwise: (schema) => schema,
    }),
    enabled: Yup.boolean().required(),
    issuer: Yup.string().when('type', {
      is: 'OIDC',
      then: (schema) => schema.url(t('Must be a valid URL')).required(t('Issuer URL is required for OIDC providers')),
      otherwise: (schema) => schema.url(t('Must be a valid URL')),
    }),
    authorizationUrl: Yup.string().when('type', {
      is: 'OAuth2',
      then: (schema) => schema.url(t('Must be a valid URL')).required(t('Authorization URL is required for OAuth2')),
      otherwise: (schema) => schema,
    }),
    tokenUrl: Yup.string().when('type', {
      is: 'OAuth2',
      then: (schema) => schema.url(t('Must be a valid URL')).required(t('Token URL is required for OAuth2')),
      otherwise: (schema) => schema,
    }),
    userInfoUrl: Yup.string().when('type', {
      is: 'OAuth2',
      then: (schema) => schema.url(t('Must be a valid URL')).required(t('User info URL is required for OAuth2')),
      otherwise: (schema) => schema,
    }),
    usernameClaim: Yup.string(),
    roleClaim: Yup.string(),
  });

export const getAuthProvider = (values: AuthProviderFormValues): AuthenticationProvider => {
  const baseProvider = {
    apiVersion: 'v1alpha1',
    kind: 'AuthProvider',
    metadata: {
      name: values.name,
    },
  };

  if (values.type === 'OIDC') {
    const spec: OIDCProviderSpec = {
      type: 'OIDC',
      clientId: values.clientId,
      enabled: values.enabled,
      issuer: values.issuer,
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
      type: 'OAuth2',
      clientId: values.clientId,
      clientSecret: values.clientSecret,
      enabled: values.enabled,
      authorizationUrl: values.authorizationUrl,
      tokenUrl: values.tokenUrl,
      userInfoUrl: values.userInfoUrl,
    };

    if (values.issuer) {
      spec.issuer = values.issuer;
    }
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

export const getAuthProviderPatches = (
  values: AuthProviderFormValues,
  authProvider: AuthenticationProvider,
): PatchRequest => {
  const patches: PatchRequest = [];

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

  // Type-specific fields
  if (values.type === 'OIDC') {
    appendJSONPatch({
      patches,
      newValue: values.issuer,
      originalValue: authProvider.spec.issuer,
      path: '/spec/issuer',
    });

    // If switching from OAuth2 to OIDC, remove OAuth2-specific fields
    if (authProvider.spec.type === 'OAuth2') {
      const oauth2Spec = authProvider.spec as OAuth2ProviderSpec;
      if (oauth2Spec.clientSecret) {
        patches.push({ op: 'remove', path: '/spec/clientSecret' });
      }
      if (oauth2Spec.authorizationUrl) {
        patches.push({ op: 'remove', path: '/spec/authorizationUrl' });
      }
      if (oauth2Spec.tokenUrl) {
        patches.push({ op: 'remove', path: '/spec/tokenUrl' });
      }
      if (oauth2Spec.userInfoUrl) {
        patches.push({ op: 'remove', path: '/spec/userInfoUrl' });
      }
    }
  } else if (values.type === 'OAuth2') {
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
      originalValue: (authProvider.spec as OAuth2ProviderSpec).userInfoUrl,
      path: '/spec/userInfoUrl',
    });

    appendJSONPatch({
      patches,
      newValue: values.issuer || undefined,
      originalValue: authProvider.spec.issuer,
      path: '/spec/issuer',
    });
  }

  // Type change - this requires a replace of the entire spec
  if (values.type !== authProvider.spec.type) {
    const newProvider = getAuthProvider(values);
    patches.push({
      op: 'replace',
      path: '/spec',
      value: newProvider.spec,
    });
  }

  return patches;
};
