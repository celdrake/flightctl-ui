import yaml from 'js-yaml';
import {
  AppType,
  ApplicationProviderSpec,
  ApplicationVolume,
  ComposeApplication,
  ConfigProviderSpec,
  ContainerApplication,
  DeviceSpec,
  EncodingType,
  FileSpec,
  GitConfigProviderSpec,
  HelmApplication,
  HttpConfigProviderSpec,
  ImageMountVolumeProviderSpec,
  ImagePullPolicy,
  InlineConfigProviderSpec,
  KubernetesSecretProviderSpec,
  PatchRequest,
  QuadletApplication,
} from '@flightctl/types';
import {
  AppForm,
  AppSpecType,
  ApplicationVolumeForm,
  ComposeAppForm,
  ConfigSourceProvider,
  ConfigType,
  GitConfigTemplate,
  HelmImageAppForm,
  HttpConfigTemplate,
  InlineConfigTemplate,
  InlineFileForm,
  KubeSecretTemplate,
  PortMapping,
  QuadletAppForm,
  RUN_AS_DEFAULT_USER,
  SingleContainerAppForm,
  SpecConfigTemplate,
  SystemdUnitFormValue,
  hasImageSource,
  isComposeApplication,
  isComposeImageAppForm,
  isContainerApplication,
  isGitConfigTemplate,
  isGitProviderSpec,
  isHelmApplication,
  isHelmImageAppForm,
  isHttpConfigTemplate,
  isHttpProviderSpec,
  isInlineProviderSpec,
  isKubeProviderSpec,
  isKubeSecretTemplate,
  isQuadletApplication,
  isQuadletImageAppForm,
  isQuadletInlineAppForm,
  isSingleContainerAppForm,
} from '../../../types/deviceSpec';

const DEFAULT_INLINE_FILE_MODE = 420; // In Octal: 0644
const DEFAULT_INLINE_FILE_USER = 'root';
const DEFAULT_INLINE_FILE_GROUP = 'root';

export const ACM_REPO_NAME = 'acm-registration';
const ACM_CRD_YAML_PATH = '/var/local/acm-import/crd.yaml';
const ACM_IMPORT_YAML_PATH = '/var/local/acm-import/import.yaml';
const ACM_REPO_SUFFIX = `/agent-registration/manifests/`;

const MICROSHIFT_REGISTRATION_HOOK_NAME = 'apply-acm-manifests';
const MICROSHIFT_REGISTRATION_HOOK_FILE = '/etc/flightctl/hooks.d/afterupdating/50-acm-registration.yaml';
const MICROSHIFT_REGISTRATION_HOOK = `- run: /usr/bin/bash -c "until [ -f $KUBECONFIG ]; do sleep 1; done"
  timeout: 5m
  envVars:
    KUBECONFIG: /var/lib/microshift/resources/kubeadmin/kubeconfig
- run: kubectl wait --for=condition=Ready pods --all --all-namespaces --timeout=300s
  timeout: 5m
  envVars:
    KUBECONFIG: /var/lib/microshift/resources/kubeadmin/kubeconfig
- if:
  - path: /var/local/acm-import/crd.yaml
    op: [created]
  run: kubectl apply -f /var/local/acm-import/crd.yaml
  envVars:
    KUBECONFIG: /var/lib/microshift/resources/kubeadmin/kubeconfig
- if:
  - path: /var/local/acm-import/import.yaml
    op: [created]
  run: kubectl apply -f /var/local/acm-import/import.yaml
  envVars:
    KUBECONFIG: /var/lib/microshift/resources/kubeadmin/kubeconfig
`;

export const getConfigType = (config: ConfigSourceProvider): ConfigType | undefined => {
  if (isGitProviderSpec(config)) {
    return ConfigType.GIT;
  } else if (isInlineProviderSpec(config)) {
    return ConfigType.INLINE;
  } else if (isHttpProviderSpec(config)) {
    return ConfigType.HTTP;
  } else if (isKubeProviderSpec(config)) {
    return ConfigType.K8S_SECRET;
  }
  // Fallback in case a new configType is added to the Backend which the UI doesn't support yet
  return undefined;
};

const isSameGitConf = (a: GitConfigProviderSpec, b: GitConfigProviderSpec) => {
  const aRef = a.gitRef;
  const bRef = b.gitRef;
  return (
    a.name === b.name &&
    aRef.path === bRef.path &&
    aRef.repository === bRef.repository &&
    aRef.targetRevision === bRef.targetRevision
  );
};

const isSameHttpConf = (a: HttpConfigProviderSpec, b: HttpConfigProviderSpec) => {
  const aRef = a.httpRef;
  const bRef = b.httpRef;
  return (
    a.name === b.name &&
    aRef.filePath === bRef.filePath &&
    aRef.repository === bRef.repository &&
    (aRef.suffix || '') === (bRef.suffix || '')
  );
};

const isSameSecretConf = (a: KubernetesSecretProviderSpec, b: KubernetesSecretProviderSpec) => {
  const aRef = a.secretRef;
  const bRef = b.secretRef;
  return (
    a.name === b.name &&
    aRef.name === bRef.name &&
    aRef.namespace === bRef.namespace &&
    aRef.mountPath === bRef.mountPath
  );
};

const isSameInlineConfigValue = <T extends string | number>(a: T | undefined, b: T | undefined, defaultValue: T) => {
  const aValue = a === undefined ? defaultValue : a;
  const bValue = b === undefined ? defaultValue : b;
  return aValue === bValue;
};

const isSameInlineConf = (a: InlineConfigProviderSpec, b: InlineConfigProviderSpec) => {
  return (
    a.name === b.name &&
    a.inline.length === b.inline.length &&
    a.inline.every((aInline, index) => {
      const bInline = b.inline[index];
      return (
        aInline.path === bInline.path &&
        isSameInlineConfigValue<string>(aInline.user, bInline.user, DEFAULT_INLINE_FILE_USER) &&
        isSameInlineConfigValue<string>(aInline.group, bInline.group, DEFAULT_INLINE_FILE_GROUP) &&
        isSameInlineConfigValue<number>(aInline.mode, bInline.mode, DEFAULT_INLINE_FILE_MODE) &&
        isSameInlineConfigValue<string>(aInline.contentEncoding, bInline.contentEncoding, EncodingType.EncodingPlain) &&
        aInline.content === bInline.content
      );
    })
  );
};

export const getDeviceSpecConfigPatches = (
  currentConfigs: ConfigSourceProvider[],
  newConfigs: ConfigSourceProvider[],
  configPath: string,
) => {
  const allPatches: PatchRequest = [];

  if (currentConfigs.length === 0 && newConfigs.length > 0) {
    allPatches.push({
      path: configPath,
      op: 'add',
      value: newConfigs,
    });
  } else if (currentConfigs.length > 0 && newConfigs.length === 0) {
    allPatches.push({
      path: configPath,
      op: 'remove',
    });
  } else if (currentConfigs.length !== newConfigs.length) {
    allPatches.push({
      path: configPath,
      op: 'replace',
      value: newConfigs,
    });
  } else {
    const hasConfigChanges = newConfigs.some((newConfig) => {
      // Attempts to find a new config which has been changed from "currentConfigs"
      const isUnchanged = currentConfigs.some((conf) => {
        const currentType = getConfigType(conf);
        const newType = getConfigType(newConfig);
        if (currentType !== newType) {
          return false;
        }
        switch (newType) {
          case ConfigType.GIT:
            return isSameGitConf(newConfig as GitConfigProviderSpec, conf as GitConfigProviderSpec);
          case ConfigType.HTTP:
            return isSameHttpConf(newConfig as HttpConfigProviderSpec, conf as HttpConfigProviderSpec);
          case ConfigType.K8S_SECRET:
            return isSameSecretConf(newConfig as KubernetesSecretProviderSpec, conf as KubernetesSecretProviderSpec);
          case ConfigType.INLINE:
            return isSameInlineConf(newConfig as InlineConfigProviderSpec, conf as InlineConfigProviderSpec);
        }
        return false;
      });

      return !isUnchanged;
    });

    if (hasConfigChanges) {
      allPatches.push({
        path: configPath,
        op: 'replace',
        value: newConfigs,
      });
    }
  }

  return allPatches;
};

/** API inline file shape (ApplicationContent). */
type InlineFileApi = { path?: string; content?: string; contentEncoding?: string };

const areInlineFilesEqual = (a: InlineFileApi[], b: InlineFileApi[]): boolean => {
  if (a.length !== b.length) return false;
  return a.every((file, index) => {
    const other = b[index];
    const aBase64 = file.contentEncoding === EncodingType.EncodingBase64;
    const bBase64 = other.contentEncoding === EncodingType.EncodingBase64;
    return (
      aBase64 === bBase64 && (file.path ?? '') === (other.path ?? '') && (file.content ?? '') === (other.content ?? '')
    );
  });
};

const areVolumesEqual = (a: ApplicationVolume[], b: ApplicationVolume[]): boolean => {
  if (a.length !== b.length) return false;
  return a.every((currentVol, index) => {
    const updatedVol = b[index];
    const currentFull = currentVol as ApplicationVolume & ImageMountVolumeProviderSpec;
    const updatedFull = updatedVol as ApplicationVolume & ImageMountVolumeProviderSpec;
    if (currentFull.name !== updatedFull.name) return false;
    const currentImageRef = currentFull.image?.reference || '';
    const updatedImageRef = updatedFull.image?.reference || '';
    if (currentImageRef !== updatedImageRef) return false;
    if (currentImageRef || updatedImageRef) {
      const currentPull = currentFull.image?.pullPolicy || ImagePullPolicy.PullIfNotPresent;
      const updatedPull = updatedFull.image?.pullPolicy || ImagePullPolicy.PullIfNotPresent;
      if (currentPull !== updatedPull) return false;
    }
    const currentMount = currentFull.mount?.path || '';
    const updatedMount = updatedFull.mount?.path || '';
    return currentMount === updatedMount;
  });
};

const arePortsEqual = (a: string[], b: string[]): boolean => {
  if (a.length !== b.length) return false;
  return a.every((port, index) => port === b[index]);
};

const areResourceLimitsEqual = (
  currentLimits: { cpu?: string; memory?: string } | undefined,
  updatedLimits: { cpu?: string; memory?: string } | undefined,
): boolean => {
  const currentCpu = currentLimits?.cpu || '';
  const updatedCpu = updatedLimits?.cpu || '';
  const currentMemory = currentLimits?.memory || '';
  const updatedMemory = updatedLimits?.memory || '';

  return currentCpu === updatedCpu && currentMemory === updatedMemory;
};

const areEnvVariablesEqual = (
  a: Record<string, string> | undefined,
  b: Record<string, string> | undefined,
): boolean => {
  const aKeys = Object.keys(a ?? {});
  const bKeys = Object.keys(b ?? {});
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every((key) => (a ?? {})[key] === (b ?? {})[key]);
};

// --- Property-level change detection (have*Changed = true when values differ) ---

const haveInlineFilesChanged = (current: InlineFileApi[], updated: InlineFileApi[]): boolean =>
  !areInlineFilesEqual(current, updated);

const haveEnvVarsChanged = (
  current: Record<string, string> | undefined,
  updated: Record<string, string> | undefined,
): boolean => !areEnvVariablesEqual(current, updated);

const haveVolumesChanged = (
  current: ApplicationVolume[] | undefined,
  updated: ApplicationVolume[] | undefined,
): boolean => !areVolumesEqual(current ?? [], updated ?? []);

const haveImageChanged = (current: string, updated: string): boolean => current !== updated;

const haveRunAsChanged = (current: string | undefined, updated: string | undefined): boolean =>
  (current ?? RUN_AS_DEFAULT_USER) !== (updated ?? RUN_AS_DEFAULT_USER);

const haveNameChanged = (current: string | undefined, updated: string | undefined): boolean => current !== updated;

const havePortsChanged = (current: string[] | undefined, updated: string[] | undefined): boolean =>
  !arePortsEqual(current ?? [], updated ?? []);

const haveResourceLimitsChanged = (
  current: { cpu?: string; memory?: string } | undefined,
  updated: { cpu?: string; memory?: string } | undefined,
): boolean => !areResourceLimitsEqual(current, updated);

const haveNamespaceChanged = (current: string | undefined, updated: string | undefined): boolean => current !== updated;

const haveValuesFilesChanged = (current: string[], updated: string[]): boolean => {
  const a = current.filter((f) => f.trim() !== '');
  const b = updated.filter((f) => f.trim() !== '');
  if (a.length !== b.length) return true;
  return a.some((file, i) => file !== b[i]);
};

const haveHelmValuesChanged = (
  current: Record<string, unknown> | undefined,
  updated: Record<string, unknown> | undefined,
): boolean => JSON.stringify(current ?? {}) !== JSON.stringify(updated ?? {});

// --- App-type change detection (API vs API) ---

const hasContainerAppChanged = (current: ContainerApplication, updated: ContainerApplication): boolean =>
  haveNameChanged(current.name, updated.name) ||
  haveImageChanged(current.image, updated.image) ||
  havePortsChanged(current.ports, updated.ports) ||
  haveResourceLimitsChanged(current.resources?.limits, updated.resources?.limits) ||
  haveEnvVarsChanged(current.envVars, updated.envVars) ||
  haveRunAsChanged(current.runAs, updated.runAs) ||
  haveVolumesChanged(current.volumes, updated.volumes);

const hasHelmAppChanged = (current: HelmApplication, updated: HelmApplication): boolean =>
  haveImageChanged(current.image, updated.image) ||
  haveNamespaceChanged(current.namespace, updated.namespace) ||
  haveValuesFilesChanged(current.valuesFiles ?? [], updated.valuesFiles ?? []) ||
  haveHelmValuesChanged(current.values, updated.values);

const hasComposeAppChanged = (current: ComposeApplication, updated: ComposeApplication): boolean => {
  const currentEnv = (current as { envVars?: Record<string, string> }).envVars;
  const updatedEnv = (updated as { envVars?: Record<string, string> }).envVars;
  const currentVol = (current as { volumes?: ApplicationVolume[] }).volumes;
  const updatedVol = (updated as { volumes?: ApplicationVolume[] }).volumes;
  if (hasImageSource(current)) {
    if (!hasImageSource(updated)) return true;
    const curImg = (current as ComposeApplication & { image: string }).image;
    const updImg = (updated as ComposeApplication & { image: string }).image;
    return (
      haveImageChanged(curImg, updImg) ||
      haveEnvVarsChanged(currentEnv, updatedEnv) ||
      haveVolumesChanged(currentVol, updatedVol)
    );
  }
  if (hasImageSource(updated)) return true;
  return (
    haveInlineFilesChanged(
      (current as { inline: InlineFileApi[] }).inline,
      (updated as { inline: InlineFileApi[] }).inline,
    ) ||
    haveEnvVarsChanged(currentEnv, updatedEnv) ||
    haveVolumesChanged(currentVol, updatedVol)
  );
};

const hasQuadletAppChanged = (current: QuadletApplication, updated: QuadletApplication): boolean => {
  const currentEnv = (current as { envVars?: Record<string, string> }).envVars;
  const updatedEnv = (updated as { envVars?: Record<string, string> }).envVars;
  const currentVol = (current as { volumes?: ApplicationVolume[] }).volumes;
  const updatedVol = (updated as { volumes?: ApplicationVolume[] }).volumes;
  const currentRunAs = (current as { runAs?: string }).runAs;
  const updatedRunAs = (updated as { runAs?: string }).runAs;
  if (hasImageSource(current)) {
    if (!hasImageSource(updated)) return true;
    const curImg = (current as QuadletApplication & { image: string }).image;
    const updImg = (updated as QuadletApplication & { image: string }).image;
    return (
      haveImageChanged(curImg, updImg) ||
      haveRunAsChanged(currentRunAs, updatedRunAs) ||
      haveEnvVarsChanged(currentEnv, updatedEnv) ||
      haveVolumesChanged(currentVol, updatedVol)
    );
  }
  if (hasImageSource(updated)) return true;
  return (
    haveInlineFilesChanged(
      (current as { inline: InlineFileApi[] }).inline,
      (updated as { inline: InlineFileApi[] }).inline,
    ) ||
    haveRunAsChanged(currentRunAs, updatedRunAs) ||
    haveEnvVarsChanged(currentEnv, updatedEnv) ||
    haveVolumesChanged(currentVol, updatedVol)
  );
};

const hasApplicationChanged = (current: ApplicationProviderSpec, updated: ApplicationProviderSpec): boolean => {
  if (current.appType !== updated.appType || current.name !== updated.name) return true;
  if (
    (current.appType === AppType.AppTypeQuadlet || current.appType === AppType.AppTypeCompose) &&
    hasImageSource(current) !== hasImageSource(updated)
  ) {
    return true;
  }
  switch (current.appType) {
    case AppType.AppTypeContainer:
      return hasContainerAppChanged(current as ContainerApplication, updated as ContainerApplication);
    case AppType.AppTypeHelm:
      return hasHelmAppChanged(current as HelmApplication, updated as HelmApplication);
    case AppType.AppTypeQuadlet:
      return hasQuadletAppChanged(current as QuadletApplication, updated as QuadletApplication);
    case AppType.AppTypeCompose:
      return hasComposeAppChanged(current as ComposeApplication, updated as ComposeApplication);
  }
  return false;
};

// --- AppForm ↔ API conversion ---

const variablesToEnvVars = (variables: { name: string; value: string }[]): Record<string, string> =>
  variables.reduce(
    (acc, v) => {
      if (v.name !== undefined && v.name !== '') acc[v.name] = v.value ?? '';
      return acc;
    },
    {} as Record<string, string>,
  );

const formVolumesToApi = (volumes: ApplicationVolumeForm[]): ApplicationVolume[] =>
  volumes.map((v) => {
    const vol: Partial<ApplicationVolume & ImageMountVolumeProviderSpec> = { name: v.name || '' };
    if (v.imageRef) {
      vol.image = {
        reference: v.imageRef,
        pullPolicy: v.imagePullPolicy ?? ImagePullPolicy.PullIfNotPresent,
      };
    }
    if (v.mountPath) vol.mount = { path: v.mountPath };
    return vol as ApplicationVolume;
  });

const formFilesToInline = (files: InlineFileForm[]) =>
  files.map((f) => ({
    path: f.path,
    content: f.content ?? '',
    contentEncoding: f.base64 ? EncodingType.EncodingBase64 : EncodingType.EncodingPlain,
  }));

export const toAPIApplication = (app: AppForm): ApplicationProviderSpec => {
  const variables = 'variables' in app ? app.variables ?? [] : [];
  const volumesForm = 'volumes' in app ? app.volumes ?? [] : [];
  const envVars = variablesToEnvVars(variables);
  const volumes = formVolumesToApi(volumesForm);

  if (isHelmImageAppForm(app)) {
    const data: HelmApplication = {
      name: app.name,
      image: app.image,
      appType: app.appType,
    };
    if (app.namespace) data.namespace = app.namespace;
    if (app.valuesYaml) {
      try {
        const values = yaml.load(app.valuesYaml) as Record<string, unknown>;
        if (values && Object.keys(values).length > 0) data.values = values;
      } catch {
        // leave values unset on invalid YAML
      }
    }
    const fileNames = (app.valuesFiles ?? []).filter((f) => f?.trim() !== '');
    if (fileNames.length > 0) data.valuesFiles = fileNames;
    return data;
  }

  if (isSingleContainerAppForm(app)) {
    const data: ContainerApplication = {
      image: app.image,
      appType: app.appType,
      envVars: Object.keys(envVars).length ? envVars : undefined,
      volumes: volumes.length ? volumes : undefined,
      runAs: app.runAs ?? RUN_AS_DEFAULT_USER,
    };
    if (app.name) data.name = app.name;
    if (app.ports?.length) data.ports = app.ports.map((p) => `${p.hostPort}:${p.containerPort}`);
    if (app.resources?.limits && Object.keys(app.resources.limits).length > 0)
      data.resources = { limits: app.resources.limits };
    return data;
  }

  if (isQuadletImageAppForm(app) || isComposeImageAppForm(app)) {
    const data: ApplicationProviderSpec = {
      image: app.image ?? '',
      appType: app.appType,
      envVars: Object.keys(envVars).length ? envVars : undefined,
      volumes: volumes.length ? volumes : undefined,
    };
    if (app.name) data.name = app.name;
    if (isQuadletImageAppForm(app) && app.runAs) (data as QuadletApplication).runAs = app.runAs;
    return data;
  }

  const inlineApp = app as QuadletAppForm | ComposeAppForm;
  const inlineData: ApplicationProviderSpec = {
    name: inlineApp.name,
    appType: inlineApp.appType,
    inline: formFilesToInline(inlineApp.files ?? []),
    envVars: Object.keys(envVars).length ? envVars : undefined,
    volumes: volumes.length ? volumes : undefined,
  };
  if (isQuadletInlineAppForm(app) && inlineApp.runAs) (inlineData as QuadletApplication).runAs = inlineApp.runAs;
  return inlineData;
};

const envVarsToVariables = (envVars: Record<string, string> | undefined): { name: string; value: string }[] =>
  Object.entries(envVars ?? {}).map(([name, value]) => ({ name, value }));

const apiVolumesToForm = (volumes?: ApplicationVolume[]): ApplicationVolumeForm[] => {
  if (!volumes) return [];
  return volumes.map((vol) => {
    const full = vol as ApplicationVolume & ImageMountVolumeProviderSpec;
    const form: ApplicationVolumeForm = {
      name: full.name,
      imageRef: full.image?.reference ?? '',
      mountPath: full.mount?.path ?? '',
    };
    if (full.image) form.imagePullPolicy = full.image.pullPolicy ?? ImagePullPolicy.PullIfNotPresent;
    return form;
  });
};

const apiToAppForm = (app: ApplicationProviderSpec): AppForm => {
  const variables = envVarsToVariables((app as { envVars?: Record<string, string> }).envVars);
  const volumes = apiVolumesToForm((app as { volumes?: ApplicationVolume[] }).volumes);

  if (isContainerApplication(app)) {
    const ports: PortMapping[] =
      app.ports?.map((p) => {
        const [host, container] = String(p).split(':');
        return { hostPort: host ?? '', containerPort: container ?? '' };
      }) ?? [];
    return {
      ...app,
      specType: AppSpecType.OCI_IMAGE,
      variables,
      ports,
      volumes,
    } as SingleContainerAppForm;
  }

  if (isHelmApplication(app)) {
    return {
      ...app,
      specType: AppSpecType.OCI_IMAGE,
      valuesYaml: app.values && Object.keys(app.values).length > 0 ? yaml.dump(app.values) : undefined,
      valuesFiles: app.valuesFiles ?? [''],
    } as HelmImageAppForm;
  }

  if (isQuadletApplication(app)) {
    const base: Omit<QuadletAppForm, 'image' | 'files'> = {
      appType: app.appType,
      name: app.name,
      specType: hasImageSource(app) ? AppSpecType.OCI_IMAGE : AppSpecType.INLINE,
      variables,
      volumes,
      runAs: (app as { runAs?: string }).runAs,
    };
    if (hasImageSource(app)) {
      return { ...base, image: (app as { image: string }).image } as QuadletAppForm;
    }
    const inline = (app as { inline: { path?: string; content?: string; contentEncoding?: string }[] }).inline ?? [];
    return {
      ...base,
      files: inline.map((f) => ({
        path: f.path ?? '',
        content: f.content,
        base64: f.contentEncoding === EncodingType.EncodingBase64,
      })),
    } as QuadletAppForm;
  }

  if (isComposeApplication(app)) {
    const a = app as ComposeApplication;
    const base: Omit<ComposeAppForm, 'image' | 'files'> = {
      appType: a.appType,
      name: a.name,
      specType: hasImageSource(a) ? AppSpecType.OCI_IMAGE : AppSpecType.INLINE,
      variables,
      volumes,
    };
    if (hasImageSource(a)) {
      return { ...base, image: (a as { image: string }).image } as ComposeAppForm;
    }
    const inline = (a as { inline: { path?: string; content?: string; contentEncoding?: string }[] }).inline ?? [];
    return {
      ...base,
      files: inline.map((f) => ({
        path: f.path ?? '',
        content: f.content,
        base64: f.contentEncoding === EncodingType.EncodingBase64,
      })),
    } as ComposeAppForm;
  }

  throw new Error('Unknown application type');
};

export const getApplicationPatches = (
  basePath: string,
  currentApps: ApplicationProviderSpec[],
  updatedApps: AppForm[],
): PatchRequest => {
  const patches: PatchRequest = [];
  const currentLen = currentApps.length;
  const newLen = updatedApps.length;

  if (currentLen === 0 && newLen > 0) {
    patches.push({ path: `${basePath}/applications`, op: 'add', value: updatedApps.map(toAPIApplication) });
  } else if (currentLen > 0 && newLen === 0) {
    patches.push({ path: `${basePath}/applications`, op: 'remove' });
  } else if (currentLen !== newLen) {
    patches.push({ path: `${basePath}/applications`, op: 'replace', value: updatedApps.map(toAPIApplication) });
  } else {
    currentApps.forEach((currentApp, index) => {
      const updatedApp = updatedApps[index];
      const updatedApi = toAPIApplication(updatedApp);
      if (hasApplicationChanged(currentApp, updatedApi)) {
        patches.push({
          path: `${basePath}/applications/${index}`,
          op: 'replace',
          value: updatedApi,
        });
      }
    });
  }
  return patches;
};

export const getApiConfig = (ct: SpecConfigTemplate): ConfigSourceProvider => {
  if (isGitConfigTemplate(ct)) {
    return {
      name: ct.name,
      gitRef: {
        path: ct.path,
        repository: ct.repository,
        targetRevision: ct.targetRevision,
      },
    };
  }
  if (isKubeSecretTemplate(ct)) {
    return {
      name: ct.name,
      secretRef: {
        mountPath: ct.mountPath,
        name: ct.secretName,
        namespace: ct.secretNs,
      },
    };
  }
  if (isHttpConfigTemplate(ct)) {
    return {
      name: ct.name,
      httpRef: {
        repository: ct.repository,
        suffix: ct.suffix,
        filePath: ct.filePath,
      },
    };
  }
  return {
    name: ct.name,
    inline: ct.files.map((file) => {
      const baseProps: FileSpec = {
        path: file.path,
        content: file.content,
        mode: file.permissions ? parseInt(file.permissions, 8) : undefined,
        contentEncoding: file.base64 ? EncodingType.EncodingBase64 : undefined,
      };
      // user / group fields cannot be sent as empty in PATCH operations
      if (file.user) {
        baseProps.user = file.user;
      }
      if (file.group) {
        baseProps.group = file.group;
      }
      return baseProps;
    }),
  };
};

/** Creates a minimal AppForm for the "Add application" flow. */
export const createInitialAppForm = (
  appType: AppType,
  specType: AppSpecType = AppSpecType.OCI_IMAGE,
  name: string = '',
): AppForm => {
  const base = { appType, name: name || undefined };
  const emptyVars: { name: string; value: string }[] = [];
  const emptyVolumes: ApplicationVolumeForm[] = [];
  const emptyFiles: InlineFileForm[] = [];

  switch (appType) {
    case AppType.AppTypeContainer:
      return {
        ...base,
        specType: AppSpecType.OCI_IMAGE,
        image: '',
        variables: emptyVars,
        ports: [],
        volumes: emptyVolumes,
        runAs: RUN_AS_DEFAULT_USER,
      } as SingleContainerAppForm;
    case AppType.AppTypeHelm:
      return {
        ...base,
        specType: AppSpecType.OCI_IMAGE,
        image: '',
        valuesFiles: [''],
      } as HelmImageAppForm;
    case AppType.AppTypeQuadlet:
      return (
        specType === AppSpecType.OCI_IMAGE
          ? {
              ...base,
              specType: AppSpecType.OCI_IMAGE,
              image: '',
              variables: emptyVars,
              volumes: emptyVolumes,
              runAs: RUN_AS_DEFAULT_USER,
            }
          : {
              ...base,
              specType: AppSpecType.INLINE,
              variables: emptyVars,
              volumes: emptyVolumes,
              files: emptyFiles,
              runAs: RUN_AS_DEFAULT_USER,
            }
      ) as QuadletAppForm;
    case AppType.AppTypeCompose:
      return (
        specType === AppSpecType.OCI_IMAGE
          ? { ...base, specType: AppSpecType.OCI_IMAGE, image: '', variables: emptyVars, volumes: emptyVolumes }
          : { ...base, specType: AppSpecType.INLINE, variables: emptyVars, volumes: emptyVolumes, files: emptyFiles }
      ) as ComposeAppForm;
  }
};

export const getApplicationValues = (deviceSpec?: DeviceSpec): AppForm[] =>
  (deviceSpec?.applications ?? []).map(apiToAppForm);

export const getSystemdUnitsValues = (deviceSpec?: DeviceSpec): SystemdUnitFormValue[] => {
  return (
    deviceSpec?.systemd?.matchPatterns?.map((pattern) => ({
      pattern,
      exists: true,
    })) || []
  );
};

export const getConfigTemplatesValues = (deviceSpec?: DeviceSpec, registerMicroShift?: boolean) => {
  const deviceConfig = registerMicroShift
    ? deviceSpec?.config?.filter((c) => !isConfigACMCrd(c) && !isConfigACMImport(c) && !isMicroshiftRegistrationHook(c))
    : deviceSpec?.config;
  return (
    deviceConfig?.map<SpecConfigTemplate>((c) => {
      if (isGitProviderSpec(c)) {
        return {
          type: ConfigType.GIT,
          name: c.name,
          path: c.gitRef.path,
          repository: c.gitRef.repository,
          targetRevision: c.gitRef.targetRevision,
        } as GitConfigTemplate;
      }
      if (isKubeProviderSpec(c)) {
        return {
          type: ConfigType.K8S_SECRET,
          name: c.name,
          mountPath: c.secretRef.mountPath,
          secretName: c.secretRef.name,
          secretNs: c.secretRef.namespace,
        } as KubeSecretTemplate;
      }
      if (isHttpProviderSpec(c)) {
        return {
          type: ConfigType.HTTP,
          name: c.name,
          repository: c.httpRef.repository,
          suffix: c.httpRef.suffix,
          filePath: c.httpRef.filePath,
        } as HttpConfigTemplate;
      }

      return {
        type: ConfigType.INLINE,
        name: c.name,
        files: c.inline.map((inline) => {
          return {
            user: inline.user,
            group: inline.group,
            path: inline.path,
            permissions: inline.mode !== undefined ? formatFileMode(inline.mode) : undefined,
            content: inline.content,
            base64: inline.contentEncoding === EncodingType.EncodingBase64,
          } as InlineConfigTemplate['files'][0];
        }),
      } as InlineConfigTemplate;
    }) || []
  );
};

export const formatFileMode = (mode: string | number): string => {
  const modeStr = typeof mode === 'number' ? mode.toString(8) : mode;
  const prefixSize = 4 - modeStr.length;
  return prefixSize > 0 ? `${'0'.repeat(prefixSize)}${modeStr}` : modeStr;
};

export const ACMCrdConfig: HttpConfigProviderSpec = {
  name: 'acm-crd',
  httpRef: {
    filePath: ACM_CRD_YAML_PATH,
    repository: ACM_REPO_NAME,
    suffix: '/agent-registration/crds/v1',
  },
};

export const ACMImportConfig: HttpConfigProviderSpec = {
  name: 'acm-registration',
  httpRef: {
    filePath: ACM_IMPORT_YAML_PATH,
    repository: ACM_REPO_NAME,
    suffix: `${ACM_REPO_SUFFIX}{{ .metadata.name }}`,
  },
};

const isConfigACMCrd = (c: ConfigProviderSpec) => {
  if (!isHttpProviderSpec(c)) {
    return false;
  }
  return (
    c.name === ACMCrdConfig.name &&
    c.httpRef.filePath === ACMCrdConfig.httpRef.filePath &&
    c.httpRef.repository === ACMCrdConfig.httpRef.repository &&
    c.httpRef.suffix === ACMCrdConfig.httpRef.suffix
  );
};

const isConfigACMImport = (c: ConfigProviderSpec) => {
  if (!isHttpProviderSpec(c)) {
    return false;
  }
  return (
    c.name === ACMImportConfig.name &&
    c.httpRef.filePath === ACMImportConfig.httpRef.filePath &&
    c.httpRef.repository === ACMImportConfig.httpRef.repository &&
    c.httpRef.suffix?.startsWith(ACM_REPO_SUFFIX)
  );
};

const isMicroshiftRegistrationHook = (c: ConfigProviderSpec) => {
  if (!isInlineProviderSpec(c)) {
    return false;
  }
  return (
    c.name === MICROSHIFT_REGISTRATION_HOOK_NAME &&
    c.inline.length === 1 &&
    c.inline[0].path === MICROSHIFT_REGISTRATION_HOOK_FILE &&
    c.inline[0].content === MICROSHIFT_REGISTRATION_HOOK
  );
};

export const MicroshiftRegistrationHook: InlineConfigProviderSpec = {
  name: MICROSHIFT_REGISTRATION_HOOK_NAME,
  inline: [
    {
      path: MICROSHIFT_REGISTRATION_HOOK_FILE,
      content: MICROSHIFT_REGISTRATION_HOOK,
    },
  ],
};

export const hasMicroshiftRegistrationConfig = (deviceSpec?: DeviceSpec): boolean => {
  if (!deviceSpec) {
    return false;
  }
  const hasCrdsSpec = deviceSpec.config?.some(isConfigACMCrd);
  const hasImportSpec = deviceSpec.config?.some(isConfigACMImport);
  const hasRegistrationHook = deviceSpec.config?.some(isMicroshiftRegistrationHook);

  return !!hasCrdsSpec && !!hasImportSpec && !!hasRegistrationHook;
};
