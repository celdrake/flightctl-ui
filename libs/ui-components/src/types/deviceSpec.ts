import {
  AppType,
  ApplicationProviderSpec,
  ComposeApplication,
  ConfigProviderSpec,
  ContainerApplication,
  DisruptionBudget,
  GitConfigProviderSpec,
  HelmApplication,
  HttpConfigProviderSpec,
  ImagePullPolicy,
  InlineConfigProviderSpec,
  KubernetesSecretProviderSpec,
  QuadletApplication,
} from '@flightctl/types';
import { FlightCtlLabel } from './extraTypes';
import { UpdateScheduleMode } from '../utils/time';

export const RUN_AS_DEFAULT_USER = 'flightctl';
export const RUN_AS_ROOT_USER = 'root';

export enum ConfigType {
  GIT = 'git',
  HTTP = 'http',
  K8S_SECRET = 'secret',
  INLINE = 'inline',
}

export type ConfigTemplate = {
  type: ConfigType;
  name: string;
};

export type GitConfigTemplate = ConfigTemplate & {
  type: ConfigType.GIT;
  repository: string;
  targetRevision: string;
  path: string;
};

/** Used when adding a Compose/Quadlet app to choose image vs inline source. */
export enum AppSpecType {
  OCI_IMAGE = 'image',
  INLINE = 'inline',
}

/** Inline file shape for config templates (not applications). */
type InlineContent = {
  content?: string;
  path: string;
  base64?: boolean;
};

/** Form-friendly port entry; API uses ApplicationPort (string "host:container"). */
export type PortMapping = {
  hostPort: string;
  containerPort: string;
};

export const isGitConfigTemplate = (configTemplate: ConfigTemplate): configTemplate is GitConfigTemplate =>
  configTemplate.type === ConfigType.GIT;

export const isGitProviderSpec = (providerSpec: ConfigProviderSpec): providerSpec is GitConfigProviderSpec =>
  'gitRef' in providerSpec;

export type ConfigSourceProvider =
  | GitConfigProviderSpec
  | KubernetesSecretProviderSpec
  | InlineConfigProviderSpec
  | HttpConfigProviderSpec;

export type RepoConfig = GitConfigProviderSpec | HttpConfigProviderSpec;

export const isRepoConfig = (config: ConfigSourceProvider): config is RepoConfig =>
  isGitProviderSpec(config) || isHttpProviderSpec(config);

// Type guards for ApplicationProviderSpec (API types used directly in form)
export const isContainerApplication = (app: ApplicationProviderSpec): app is ContainerApplication =>
  app.appType === AppType.AppTypeContainer;
export const isHelmApplication = (app: ApplicationProviderSpec): app is HelmApplication =>
  app.appType === AppType.AppTypeHelm;
export const isQuadletApplication = (app: ApplicationProviderSpec): app is QuadletApplication =>
  app.appType === AppType.AppTypeQuadlet;
export const isComposeApplication = (app: ApplicationProviderSpec): app is ComposeApplication =>
  app.appType === AppType.AppTypeCompose;

export const hasImageSource = (app: ApplicationProviderSpec): boolean => 'image' in app;
export const hasInlineSource = (app: ApplicationProviderSpec): boolean => 'inline' in app;

export type ApplicationVolumeForm = {
  name: string;
  imageRef?: string;
  imagePullPolicy?: ImagePullPolicy;
  mountPath?: string;
};

// --- AppForm: API types + UI-friendly replacements for problematic fields ---

/** Form-friendly env vars (API uses Record<string, string>). */
export type VariablesForm = { name: string; value: string }[];

/** Form-friendly inline file (API uses ApplicationContent with path, content, contentEncoding). */
export type InlineFileForm = { path: string; content?: string; base64?: boolean };

/** Container app form: replace envVars, ports, volumes with UI-friendly shapes. */
export type SingleContainerAppForm = Omit<ContainerApplication, 'envVars' | 'ports' | 'volumes'> & {
  specType: AppSpecType.OCI_IMAGE;
  variables: VariablesForm;
  ports: PortMapping[];
  volumes: ApplicationVolumeForm[];
};

/** Helm app form: replace values (Record) with valuesYaml string for the form. */
export type HelmImageAppForm = Omit<HelmApplication, 'values'> & {
  specType: AppSpecType.OCI_IMAGE;
  valuesYaml?: string;
  valuesFiles: string[];
};

/** Quadlet app form: specType chooses image vs inline; the other variant's fields are ignored. */
export type QuadletAppForm = Omit<QuadletApplication, 'envVars' | 'volumes' | 'image' | 'inline'> & {
  specType: AppSpecType;
  variables: VariablesForm;
  volumes: ApplicationVolumeForm[];
  /** Used when specType === OCI_IMAGE; ignored otherwise. */
  image: string;
  /** Used when specType === INLINE; ignored otherwise. */
  files: InlineFileForm[];
};

/** Compose app form: specType chooses image vs inline; the other variant's fields are ignored. */
export type ComposeAppForm = Omit<ComposeApplication, 'envVars' | 'volumes' | 'image' | 'inline'> & {
  specType: AppSpecType;
  variables: VariablesForm;
  volumes: ApplicationVolumeForm[];
  /** Used when specType === OCI_IMAGE; ignored otherwise. */
  image: string;
  /** Used when specType === INLINE; ignored otherwise. */
  files: InlineFileForm[];
};

export type AppForm = SingleContainerAppForm | HelmImageAppForm | QuadletAppForm | ComposeAppForm;

export const isSingleContainerAppForm = (app: AppForm): app is SingleContainerAppForm =>
  app.appType === AppType.AppTypeContainer;
export const isHelmImageAppForm = (app: AppForm): app is HelmImageAppForm => app.appType === AppType.AppTypeHelm;
export const isQuadletAppForm = (app: AppForm): app is QuadletAppForm => app.appType === AppType.AppTypeQuadlet;
export const isComposeAppForm = (app: AppForm): app is ComposeAppForm => app.appType === AppType.AppTypeCompose;
/** Narrow to Quadlet image variant (specType OCI_IMAGE); use when reading/writing image. */
export const isQuadletImageAppForm = (app: AppForm): app is QuadletAppForm =>
  app.appType === AppType.AppTypeQuadlet && app.specType === AppSpecType.OCI_IMAGE;
/** Narrow to Quadlet inline variant (specType INLINE); use when reading/writing files. */
export const isQuadletInlineAppForm = (app: AppForm): app is QuadletAppForm =>
  app.appType === AppType.AppTypeQuadlet && app.specType === AppSpecType.INLINE;
/** Narrow to Compose image variant (specType OCI_IMAGE). */
export const isComposeImageAppForm = (app: AppForm): app is ComposeAppForm =>
  app.appType === AppType.AppTypeCompose && app.specType === AppSpecType.OCI_IMAGE;
/** Narrow to Compose inline variant (specType INLINE). */
export const isComposeInlineAppForm = (app: AppForm): app is ComposeAppForm =>
  app.appType === AppType.AppTypeCompose && app.specType === AppSpecType.INLINE;

const hasTemplateVariables = (str: string) => /{{.+?}}/.test(str);

export const getAppIdentifier = (app: AppForm | ApplicationProviderSpec): string => {
  if (app.name) return app.name;
  if ('image' in app && app.image) return app.image;
  return '';
};

const removeSlashes = (url: string | undefined) => (url || '').replace(/^\/+|\/+$/g, '');
const getFinalRepoUrl = (baseUrl: string, relativePath: string) => {
  if (relativePath && !hasTemplateVariables(relativePath)) {
    return `${baseUrl}/${relativePath}`;
  }
  return baseUrl;
};

export const getConfigFullRepoUrl = (config: RepoConfig, repositoryUrl: string) => {
  const baseUrl = removeSlashes(repositoryUrl).replace(/\.git\/?$/, '');
  if (isHttpProviderSpec(config)) {
    return getFinalRepoUrl(baseUrl, removeSlashes(config.httpRef.suffix));
  }
  if (isGitProviderSpec(config) && /github|gitlab/.test(repositoryUrl)) {
    const configPath = removeSlashes(config.gitRef.path);
    const pathSegments = configPath.split('/');
    const lastSegment = pathSegments[pathSegments.length - 1];

    // Extension-less files cannot be identified as such. GitHub and Gitlab both redirect to the correct URL to show the file contents
    const fileOrDir = lastSegment.includes('.') ? 'blob' : 'tree';
    return getFinalRepoUrl(baseUrl, `${fileOrDir}/${config.gitRef.targetRevision}/${configPath}`);
  }

  // We return just the base repository URL as a fallback
  return baseUrl;
};

export const getRepoName = (config: RepoConfig) =>
  isGitProviderSpec(config) ? config.gitRef.repository : config.httpRef.repository;

export type KubeSecretTemplate = ConfigTemplate & {
  type: ConfigType.K8S_SECRET;
  secretName: string;
  secretNs: string;
  mountPath: string;
};

export const isKubeSecretTemplate = (configTemplate: ConfigTemplate): configTemplate is KubeSecretTemplate =>
  configTemplate.type === ConfigType.K8S_SECRET;

export const isKubeProviderSpec = (providerSpec: ConfigProviderSpec): providerSpec is KubernetesSecretProviderSpec =>
  'secretRef' in providerSpec;

export type InlineConfigTemplate = ConfigTemplate & {
  type: ConfigType.INLINE;
  files: Array<InlineContent & { permissions?: string; user?: string; group?: string }>;
};

export const isInlineConfigTemplate = (configTemplate: ConfigTemplate): configTemplate is InlineConfigTemplate =>
  configTemplate.type === ConfigType.INLINE;

export const isInlineProviderSpec = (providerSpec: ConfigProviderSpec): providerSpec is InlineConfigProviderSpec =>
  'inline' in providerSpec;

export type HttpConfigTemplate = ConfigTemplate & {
  type: ConfigType.HTTP;
  repository: string;
  validationSuffix: string;
  suffix: string;
  filePath: string;
};

export const isHttpConfigTemplate = (configTemplate: ConfigTemplate): configTemplate is HttpConfigTemplate =>
  configTemplate.type === ConfigType.HTTP;

export const isHttpProviderSpec = (providerSpec: ConfigProviderSpec): providerSpec is HttpConfigProviderSpec =>
  'httpRef' in providerSpec;

export type SpecConfigTemplate = GitConfigTemplate | HttpConfigTemplate | KubeSecretTemplate | InlineConfigTemplate;
export type SystemdUnitFormValue = {
  pattern: string;
  exists: boolean;
};

export type DeviceSpecConfigFormValues = {
  osImage?: string;
  configTemplates: SpecConfigTemplate[];
  applications: AppForm[];
  systemdUnits: SystemdUnitFormValue[];
  updatePolicy: UpdatePolicyForm;
  registerMicroShift: boolean;
  useBasicUpdateConfig: boolean;
};

export type EditDeviceFormValues = DeviceSpecConfigFormValues & {
  deviceAlias: string;
  labels: FlightCtlLabel[];
  fleetMatch: string;
};

export type FleetFormValues = DeviceSpecConfigFormValues & {
  name: string;
  fleetLabels: FlightCtlLabel[];
  labels: FlightCtlLabel[];
  rolloutPolicy: RolloutPolicyForm;
  disruptionBudget: DisruptionBudgetForm;
  updatePolicy: UpdatePolicyForm;
};

export enum BatchLimitType {
  BatchLimitPercent = 'percent',
  BatchLimitAbsoluteNumber = 'value',
}

export type BatchForm = {
  selector: FlightCtlLabel[];
  limit?: number;
  limitType: BatchLimitType;
  successThreshold?: number;
};

export type RolloutPolicyForm = {
  isAdvanced: boolean;
  updateTimeout: number;
  batches: BatchForm[];
};

export type DisruptionBudgetForm = DisruptionBudget & {
  isAdvanced: boolean;
};

export type UpdatePolicyForm = {
  isAdvanced: boolean;
  downloadAndInstallDiffer: boolean;
  downloadStartsAt?: string;
  downloadEndsAt?: string;
  downloadStartGraceDuration?: string;
  downloadScheduleMode: UpdateScheduleMode;
  downloadWeekDays: boolean[];
  downloadTimeZone: string;
  installStartsAt?: string;
  installEndsAt?: string;
  installStartGraceDuration?: string;
  installScheduleMode: UpdateScheduleMode;
  installWeekDays: boolean[];
  installTimeZone: string;
};
