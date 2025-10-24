import {
  AppType,
  ApplicationEnvVars,
  ApplicationVolumeProviderSpec,
  ArtifactApplicationProviderSpec,
  ConditionType,
  Device,
  EnrollmentRequest,
  FileContent,
  Fleet,
  ImageApplicationProviderSpec,
  ListMeta,
  ObjectMeta,
  RelativePath,
  ResourceSync,
} from '@flightctl/types';

export interface FlightCtlLabel {
  key: string;
  value?: string;
  isDefault?: boolean;
}

export interface ApiQuery {
  endpoint: string;
  timeout?: number;
}

export type FleetConditionType = ConditionType.FleetValid | 'Invalid' | 'SyncPending';

export enum DeviceAnnotation {
  TemplateVersion = 'fleet-controller/templateVersion',
  RenderedVersion = 'device-controller/renderedVersion',
}

export const isEnrollmentRequest = (resource: Device | EnrollmentRequest): resource is EnrollmentRequest =>
  resource.kind === 'EnrollmentRequest';

export type AnnotationType = DeviceAnnotation; // Add more types when they are added to the API

export const isFleet = (resource: ResourceSync | Fleet): resource is Fleet => resource.kind === 'Fleet';

// ApplicationProviderSpec's definition for inline files adds a Record<string, any>. We use the fixed types to get full Typescript checks for the field
export type InlineApplicationFileFixed = FileContent & RelativePath;

// "FixedApplicationProviderSpec" will need to be manually adjusted whenever the API definition changes
export type ApplicationProviderSpecFixed = ApplicationEnvVars &
  ApplicationVolumeProviderSpec & {
    name?: string;
    appType?: AppType;
  } & (ImageApplicationProviderSpec | ArtifactApplicationProviderSpec | { inline: InlineApplicationFileFixed[] });

type CliArtifact = {
  os: string;
  arch: string;
  filename: string;
  sha256: string;
};

export type CliArtifactsResponse = {
  baseUrl: string;
  artifacts: CliArtifact[];
};

// AlertManager alert structure
export type AlertManagerAlert = {
  fingerprint: string;
  labels: Record<string, string>;
  annotations: Record<string, string>;
  startsAt: string;
  endsAt: string;
  updatedAt: string;
  status: {
    state: string;
    inhibitedBy: string[];
    mutedBy: string[];
    silencedBy: string[];
  };
  receivers: Array<{ name: string }>;
};

/**
 * OIDCProvider represents an OIDC/OAuth2 authentication provider configuration
 */
export type OIDCProvider = {
  /**
   * APIVersion defines the versioned schema of this representation of an object.
   */
  apiVersion: string;
  /**
   * Kind is a string value representing the REST resource this object represents.
   */
  kind: string;
  metadata: ObjectMeta;
  spec: OIDCProviderSpec;
  status?: OIDCProviderStatus;
};

/**
 * Custom settings for OAuth2 providers (non-OIDC compliant)
 */
export type OAuth2CustomSettings = {
  /**
   * Authorization endpoint URL
   */
  authorizationEndpoint: string;
  /**
   * Token endpoint URL
   */
  tokenEndpoint: string;
  /**
   * UserInfo endpoint URL
   */
  userInfoEndpoint: string;
  /**
   * End session/logout endpoint URL (optional)
   */
  endSessionEndpoint?: string;
};

/**
 * OIDCProviderSpec defines the desired state of an OIDC Provider
 */
export type OIDCProviderSpec = {
  /**
   * Type of the provider: "OIDC" for full OIDC compliant, "OAuth2" for OAuth2 only
   */
  type: 'OIDC' | 'OAuth2';
  /**
   * ClientId for the OIDC/OAuth2 application
   */
  clientId: string;
  /**
   * Whether this provider is enabled
   */
  enabled: boolean;
  /**
   * Issuer URL for OIDC discovery (for OIDC type providers)
   */
  issuer?: string;
  /**
   * Custom settings for OAuth2 providers (required when type is "OAuth2")
   */
  customSettings?: OAuth2CustomSettings;
  /**
   * Organization assignment configuration
   */
  organizationAssignment?: OIDCOrganizationAssignment;
  /**
   * Claim path for extracting roles from the token
   */
  roleClaim?: string;
  /**
   * Claim path for extracting username from the token
   */
  usernameClaim?: string;
};

/**
 * OIDCProviderStatus defines the observed state of an OIDC Provider
 */
export type OIDCProviderStatus = {
  conditions?: Array<{
    type: string;
    status: string;
    lastTransitionTime?: string;
    reason?: string;
    message?: string;
  }>;
};

/**
 * Organization assignment types
 */
export type OIDCOrganizationAssignment =
  | OIDCStaticOrganizationAssignment
  | OIDCDynamicOrganizationAssignment
  | OIDCPerUserOrganizationAssignment;

/**
 * Static organization assignment - assigns all users to a specific organization
 */
export type OIDCStaticOrganizationAssignment = {
  type: 'Static';
  organizationName: string;
};

/**
 * Dynamic organization assignment - extracts organization from a claim
 */
export type OIDCDynamicOrganizationAssignment = {
  type: 'Dynamic';
  claimPath: string;
  organizationNamePrefix?: string;
  organizationNameSuffix?: string;
};

/**
 * Per-user organization assignment - creates organization per user
 */
export type OIDCPerUserOrganizationAssignment = {
  type: 'PerUser';
  organizationNamePrefix?: string;
  organizationNameSuffix?: string;
};

/**
 * List of OIDC Providers
 */
export type OIDCProviderList = {
  apiVersion: string;
  kind: string;
  metadata: ListMeta;
  items: OIDCProvider[];
};
