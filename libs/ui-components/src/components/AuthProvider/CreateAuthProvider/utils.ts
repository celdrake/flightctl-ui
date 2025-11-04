import * as Yup from 'yup';
import { TFunction } from 'i18next';
import {
  AuthOrganizationAssignment,
  AuthProvider,
  AuthProviderSpec,
  OAuth2ProviderSpec,
  PatchRequest,
} from '@flightctl/types';
import { appendJSONPatch } from '../../../utils/patch';
import {
  AuthProviderFormValues,
  MASKED_SECRET_VALUE,
  OrgAssignmentType,
  ProviderType,
  isOAuth2Provider,
  isOrgAssignmentDynamic,
  isOrgAssignmentPerUser,
} from './types';
import { validDnsSubdomainPart, validDotNotationPath, validKubernetesDnsSubdomain } from '../../form/validations';

export const getInitValues = (authProvider?: AuthProvider): AuthProviderFormValues => {
  if (!authProvider) {
    return {
      exists: false,
      enabled: true,
      name: '',
      providerType: ProviderType.OIDC,
      issuer: '',
      clientId: '',
      clientSecret: '',
      scopes: [],
      usernameClaim: '',
      roleClaim: '',
      orgAssignmentType: OrgAssignmentType.Static,
      orgName: '',
      claimPath: '',
      orgNamePrefix: '',
      orgNameSuffix: '',
    };
  }

  let orgAssignmentType: OrgAssignmentType;
  let orgName = '';
  let claimPath = '';
  let orgNamePrefix = '';
  let orgNameSuffix = '';

  const orgAssignment = authProvider.spec.organizationAssignment;
  if (isOrgAssignmentDynamic(orgAssignment)) {
    orgAssignmentType = OrgAssignmentType.Dynamic;
    claimPath = orgAssignment.claimPath;
    orgNamePrefix = orgAssignment.organizationNamePrefix || '';
    orgNameSuffix = orgAssignment.organizationNameSuffix || '';
  } else if (isOrgAssignmentPerUser(orgAssignment)) {
    orgAssignmentType = OrgAssignmentType.PerUser;
    orgNamePrefix = orgAssignment.organizationNamePrefix || '';
    orgNameSuffix = orgAssignment.organizationNameSuffix || '';
  } else {
    orgAssignmentType = OrgAssignmentType.Static;
    orgName = orgAssignment.organizationName;
  }

  const spec = authProvider.spec;
  const isOAuth2 = isOAuth2Provider(spec);
  return {
    exists: true,
    name: authProvider.metadata.name as string,
    providerType: spec.providerType as ProviderType,
    issuer: spec.issuer,
    clientId: spec.clientId,
    clientSecret: spec.clientSecret,
    enabled: spec.enabled ?? true,
    authorizationUrl: isOAuth2 ? spec.authorizationUrl : undefined,
    tokenUrl: isOAuth2 ? spec.tokenUrl : undefined,
    userinfoUrl: isOAuth2 ? spec.userinfoUrl : undefined,
    scopes: spec.scopes || [],
    usernameClaim: spec.usernameClaim,
    roleClaim: spec.roleClaim,
    orgAssignmentType,
    orgName,
    claimPath,
    orgNamePrefix,
    orgNameSuffix,
  };
};

const getOrgAssignment = (values: AuthProviderFormValues): AuthOrganizationAssignment => {
  if (values.orgAssignmentType === OrgAssignmentType.Static) {
    return {
      type: OrgAssignmentType.Static,
      organizationName: values.orgName || '',
    };
  }

  let orgAssignment: AuthOrganizationAssignment;
  if (values.orgAssignmentType === OrgAssignmentType.PerUser) {
    orgAssignment = {
      type: OrgAssignmentType.PerUser,
    };
  } else {
    orgAssignment = {
      type: OrgAssignmentType.Dynamic,
      claimPath: values.claimPath || '',
    };
  }

  // Only set the optional fields when they are non-null
  if (values.orgNamePrefix) {
    orgAssignment.organizationNamePrefix = values.orgNamePrefix;
  }
  if (values.orgNameSuffix) {
    orgAssignment.organizationNameSuffix = values.orgNameSuffix;
  }
  return orgAssignment;
};

export const getAuthProvider = (values: AuthProviderFormValues): AuthProvider => {
  const baseSpec = {
    providerType: values.providerType,
    clientId: values.clientId,
    clientSecret: values.clientSecret,
    enabled: values.enabled,
    issuer: values.issuer,
    scopes: values.scopes,
    usernameClaim: values.usernameClaim,
    roleClaim: values.roleClaim,
    organizationAssignment: getOrgAssignment(values),
  };

  let spec: AuthProviderSpec;
  if (values.providerType === ProviderType.OAuth2) {
    spec = {
      ...baseSpec,
      providerType: ProviderType.OAuth2,
      authorizationUrl: values.authorizationUrl || '',
      tokenUrl: values.tokenUrl || '',
      userinfoUrl: values.userinfoUrl || '',
    };
  } else {
    spec = {
      ...baseSpec,
      providerType: ProviderType.OIDC,
    };
  }

  return {
    apiVersion: 'v1alpha1',
    kind: 'AuthProvider',
    metadata: {
      name: values.name,
    },
    spec,
  };
};

const patchAuthProviderFields = (
  patches: PatchRequest,
  spec: AuthProviderSpec,
  newSpec: AuthProviderSpec,
  options: { skipSecrets?: boolean } = {},
) => {
  const { skipSecrets = false } = options;

  appendJSONPatch({
    patches,
    originalValue: spec.issuer,
    newValue: newSpec.issuer,
    path: '/spec/issuer',
  });

  appendJSONPatch({
    patches,
    originalValue: spec.clientId,
    newValue: newSpec.clientId,
    path: '/spec/clientId',
  });

  if (!skipSecrets) {
    appendJSONPatch({
      patches,
      originalValue: spec.clientSecret,
      newValue: newSpec.clientSecret,
      path: '/spec/clientSecret',
    });
  }

  appendJSONPatch({
    patches,
    originalValue: spec.enabled ?? true,
    newValue: newSpec.enabled ?? true,
    path: '/spec/enabled',
  });

  if (JSON.stringify(spec.scopes) !== JSON.stringify(newSpec.scopes)) {
    appendJSONPatch({
      patches,
      originalValue: spec.scopes,
      newValue: newSpec.scopes,
      path: '/spec/scopes',
    });
  }

  // Replace the entire organizationAssignment object if it changed
  // The new spec only has the fields that related to the chosen org assignment type
  if (JSON.stringify(spec.organizationAssignment) !== JSON.stringify(newSpec.organizationAssignment)) {
    appendJSONPatch({
      patches,
      originalValue: spec.organizationAssignment,
      newValue: newSpec.organizationAssignment,
      path: '/spec/organizationAssignment',
    });
  }

  appendJSONPatch({
    patches,
    originalValue: spec.usernameClaim,
    newValue: newSpec.usernameClaim,
    path: '/spec/usernameClaim',
  });

  appendJSONPatch({
    patches,
    originalValue: spec.roleClaim,
    newValue: newSpec.roleClaim,
    path: '/spec/roleClaim',
  });
};

const patchProviderTypeSpecificFields = (patches: PatchRequest, spec: AuthProviderSpec, newSpec: AuthProviderSpec) => {
  const oauth2Fields: Array<keyof OAuth2ProviderSpec> = ['authorizationUrl', 'tokenUrl', 'userinfoUrl'];

  const wasOAuth2Before = isOAuth2Provider(spec);
  const isNowOAuth2 = isOAuth2Provider(newSpec);

  if (isNowOAuth2) {
    oauth2Fields.forEach((field) => {
      appendJSONPatch({
        patches,
        originalValue: wasOAuth2Before ? spec[field] : undefined,
        newValue: newSpec[field],
        path: `/spec/${field}`,
      });
    });
  } else if (wasOAuth2Before) {
    // Changing from Oauth2 to OIDC, we need to remove the Oauth2 specific fields
    oauth2Fields.forEach((field) => {
      patches.push({ op: 'remove', path: `/spec/${field}` });
    });
  }
};

export const getAuthProviderPatches = (values: AuthProviderFormValues, authProvider: AuthProvider): PatchRequest => {
  const patches: PatchRequest = [];
  const prevSpec = authProvider.spec;

  const newAuthProvider = getAuthProvider(values);
  const newSpec = newAuthProvider.spec;

  const providerTypeChanged = prevSpec.providerType !== newSpec.providerType;
  const secretWasChanged = values.clientSecret !== MASKED_SECRET_VALUE;

  // If provider type changed AND user provided a new secret, we can do a full replace
  if (providerTypeChanged && secretWasChanged) {
    patches.push({
      op: 'replace',
      path: '/spec',
      value: newSpec,
    });
    return patches;
  }

  // In every other case, we need to patch the fields individually
  if (providerTypeChanged) {
    patches.push({
      op: 'replace',
      path: '/spec/providerType',
      value: newSpec.providerType,
    });
  }

  // Patch all common fields
  patchAuthProviderFields(patches, prevSpec, newSpec, { skipSecrets: !secretWasChanged });

  // Handle provider-specific fields (OAuth2 vs OIDC)
  patchProviderTypeSpecificFields(patches, prevSpec, newSpec);

  return patches;
};

export const authProviderSchema = (t: TFunction) => (values: AuthProviderFormValues) => {
  const baseSchema = {
    name: validKubernetesDnsSubdomain(t, { isRequired: true }),
    providerType: Yup.string().oneOf(Object.values(ProviderType)).required(t('Provider type is required')),
    clientId: Yup.string().required(t('Client ID is required')),
    clientSecret: Yup.string().required(t('Client secret is required')),
    enabled: Yup.boolean(),
    scopes: Yup.array().of(Yup.string()).min(1, t('At least one scope is required')),
    usernameClaim: validDotNotationPath(t),
    roleClaim: validDotNotationPath(t),
    orgAssignmentType: Yup.string()
      .oneOf(Object.values(OrgAssignmentType))
      .required(t('Organization assignment type is required')),
  };

  let schema: Record<string, Yup.Schema> = { ...baseSchema };

  // CELIA-WIP: Check if issuer is required based on provider type
  // Issuer validation is provider-type specific
  if (values.providerType === ProviderType.OIDC) {
    // OIDC: issuer is required
    schema = {
      ...schema,
      issuer: Yup.string().required(t('Issuer is required')).url(t('Must be a valid URL')),
    };
  } else if (values.providerType === ProviderType.OAuth2) {
    // OAuth2: issuer is optional but must be a valid URL if provided
    schema = {
      ...schema,
      issuer: Yup.string().url(t('Must be a valid URL')),
      authorizationUrl: Yup.string().required(t('Authorization URL is required')).url(t('Must be a valid URL')),
      tokenUrl: Yup.string().required(t('Token URL is required')).url(t('Must be a valid URL')),
      userinfoUrl: Yup.string().required(t('Userinfo URL is required')).url(t('Must be a valid URL')),
    };
  }

  if (values.orgAssignmentType === OrgAssignmentType.Static) {
    schema = {
      ...schema,
      orgName: Yup.string().required(t('Static organization assignment requires an organization name')),
    };
  } else if (values.orgAssignmentType === OrgAssignmentType.Dynamic) {
    schema = {
      ...schema,
      claimPath: validDotNotationPath(t).required(t('Claim path is required')),
      orgNamePrefix: validDnsSubdomainPart(t),
      orgNameSuffix: validDnsSubdomainPart(t),
    };
  } else if (values.orgAssignmentType === OrgAssignmentType.PerUser) {
    schema = {
      ...schema,
      orgNamePrefix: validDnsSubdomainPart(t),
      orgNameSuffix: validDnsSubdomainPart(t),
    };
  }

  return Yup.object().shape(schema);
};
