import {
  AppType,
  ApplicationEnvVars,
  ApplicationVolumeProviderSpec,
  ArtifactApplicationProviderSpec,
  AuthProviderSpec,
  ConditionType,
  ConfigProviderSpec,
  Device,
  EnrollmentRequest,
  FileContent,
  Fleet,
  ImageApplicationProviderSpec,
  OAuth2ProviderSpec,
  OIDCProviderSpec,
  RelativePath,
  ResourceSync,
} from '@flightctl/types';

export enum ProviderType {
  OIDC = 'oidc',
  OAuth2 = 'oauth2',
}

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

export const isOidcAuthProviderSpec = (providerSpec: AuthProviderSpec): providerSpec is OIDCProviderSpec =>
  providerSpec.providerType === ProviderType.OIDC;

export const isOAuth2AuthProviderSpec = (providerSpec: AuthProviderSpec): providerSpec is OAuth2ProviderSpec =>
  providerSpec.providerType === ProviderType.OAuth2;

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
