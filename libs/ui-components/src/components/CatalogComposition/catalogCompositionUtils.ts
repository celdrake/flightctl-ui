import { load } from 'js-yaml';
import type { ApplicationProviderSpec, CatalogItemRefSpec } from '@flightctl/types';
import type { CatalogItem, CatalogItemVersion } from '@flightctl/types/alpha';
import { CatalogItemCategory } from '@flightctl/types/alpha';

// CELIA-WIP name of this file
import type { ApplicationEntry, CatalogAppForm } from '../../types/deviceSpec';
import { type VolumeCatalogSelection, buildCatalogApplicationSpec, buildCatalogItemRef } from '../../utils/catalog';
import { toValidApplicationName } from '../form/validations';
import { getInitialAppConfig } from '../Catalog/InstallWizard/utils';
import type { DynamicFormConfigFormik } from '../Catalog/InstallWizard/types';

export type CatalogSelectionConfirm = {
  catalogItem: CatalogItem;
  version: CatalogItemVersion;
  channel: string;
  catalogItemRef: CatalogItemRefSpec;
};

export type CatalogAdvancedConfigValues = {
  configureVia: 'editor' | 'form';
  editorContent: string;
  volumeSelection: VolumeCatalogSelection[];
  formValues: Record<string, unknown> | undefined;
};

export const getCatalogVersionConfigSchema = (
  catalogItem: CatalogItem,
  version: string,
): Record<string, unknown> | undefined => {
  const versionEntry = catalogItem.spec.versions.find((entry) => entry.version === version);
  const schema = versionEntry?.configSchema ?? catalogItem.spec.defaults?.configSchema;
  return schema as Record<string, unknown> | undefined;
};

const schemaHasRequiredFields = (schema: Record<string, unknown> | undefined): boolean => {
  if (!schema || typeof schema !== 'object') {
    return false;
  }
  const required = schema.required;
  if (Array.isArray(required) && required.length > 0) {
    return true;
  }
  const properties = schema.properties;
  if (properties && typeof properties === 'object') {
    return Object.values(properties as Record<string, Record<string, unknown>>).some((property) =>
      schemaHasRequiredFields(property),
    );
  }
  return false;
};

/**
 * True when the selected version defines required configuration fields that are
 * not already satisfied by the existing app (e.g. on first install, or when
 * editing an incomplete config). If `existingApp` already validates against the
 * schema, advanced config is optional so the user can leave it unchecked.
 */
export const catalogItemRequiresAdvancedConfig = (
  catalogItem: CatalogItem,
  version: string,
  existingApp?: ApplicationProviderSpec,
): boolean => {
  if (!schemaHasRequiredFields(getCatalogVersionConfigSchema(catalogItem, version))) {
    return false;
  }
  if (!existingApp) {
    return true;
  }
  return !getInitialAppConfig(catalogItem, version, existingApp).dynamicFormValid;
};

export const isApplicationCatalogItem = (catalogItem: CatalogItem): boolean =>
  catalogItem.spec.category === CatalogItemCategory.CatalogItemCategoryApplication;

export const getCatalogItemDefaultAppName = (catalogItem: CatalogItem): string =>
  toValidApplicationName(catalogItem.spec.displayName || catalogItem.metadata.name || '');

/** Returns a DNS-safe application name unique within existingNames (e.g. nginx-demo-2). */
export const getUniqueApplicationName = (baseName: string, existingNames: string[]): string => {
  const base = toValidApplicationName(baseName);
  const normalizedExisting = new Set(existingNames.map((name) => name.toLowerCase()).filter(Boolean));
  if (!normalizedExisting.has(base.toLowerCase())) {
    return base;
  }
  let suffix = 2;
  while (normalizedExisting.has(`${base}-${suffix}`.toLowerCase())) {
    suffix += 1;
  }
  return `${base}-${suffix}`;
};

export const buildSelectionConfirm = ({
  catalogItem,
  version,
  channel,
}: {
  catalogItem: CatalogItem;
  version: CatalogItemVersion;
  channel: string;
}): CatalogSelectionConfirm => ({
  catalogItem,
  version,
  channel,
  catalogItemRef: buildCatalogItemRef({ catalogItem, catalogItemVersion: version, channel }),
});

export const getDefaultChannel = (catalogItem: CatalogItem): string => {
  const channels = new Set<string>();
  catalogItem.spec.versions.forEach((version) => {
    version.channels.forEach((channel) => channels.add(channel));
  });
  return [...channels][0] || 'stable';
};

export const getChannelVersions = (catalogItem: CatalogItem, channel: string): CatalogItemVersion[] =>
  catalogItem.spec.versions.filter((version) => version.channels.includes(channel));

const toCatalogAppForm = (apiApp: ApplicationProviderSpec, catalogItemRef: CatalogItemRefSpec): CatalogAppForm => ({
  catalogItemRef,
  name: apiApp.name,
  apiApp,
});

export const createCatalogAppEntry = (selection: CatalogSelectionConfirm, appName: string): ApplicationEntry => {
  const apiApp = buildCatalogApplicationSpec({
    appName,
    catalogItem: selection.catalogItem,
    catalogItemVersion: selection.version,
    channel: selection.channel,
    formValues: undefined,
  });
  return { type: 'catalog', app: toCatalogAppForm(apiApp, selection.catalogItemRef) };
};

export const createCatalogAppEntryWithConfig = ({
  selection,
  appName,
  advancedConfig,
}: {
  selection: CatalogSelectionConfirm;
  appName: string;
  advancedConfig: CatalogAdvancedConfigValues;
}): ApplicationEntry => {
  const formValues =
    advancedConfig.configureVia === 'editor'
      ? (load(advancedConfig.editorContent) as Record<string, unknown>)
      : advancedConfig.formValues;

  const apiApp = buildCatalogApplicationSpec({
    appName,
    catalogItem: selection.catalogItem,
    catalogItemVersion: selection.version,
    channel: selection.channel,
    formValues,
    volumeSelection: advancedConfig.configureVia === 'form' ? advancedConfig.volumeSelection : [],
  });

  return { type: 'catalog', app: toCatalogAppForm(apiApp, selection.catalogItemRef) };
};

export const renameCatalogAppForm = (app: CatalogAppForm, name: string): CatalogAppForm => {
  return {
    ...app,
    name,
    apiApp: { ...app.apiApp, name },
  };
};

export const updateCatalogAppFormConfig = ({
  appForm,
  catalogItem,
  appName,
  advancedConfig,
}: {
  appForm: CatalogAppForm;
  catalogItem: CatalogItem;
  appName: string;
  advancedConfig: CatalogAdvancedConfigValues;
}): CatalogAppForm => {
  const versionEntry = catalogItem.spec.versions.find((entry) => entry.version === appForm.catalogItemRef.version);
  if (!versionEntry) {
    return renameCatalogAppForm(appForm, appName);
  }
  const channel = appForm.catalogItemRef.channel || getDefaultChannel(catalogItem);
  const formValues =
    advancedConfig.configureVia === 'editor'
      ? (load(advancedConfig.editorContent) as Record<string, unknown>)
      : advancedConfig.formValues;

  const apiApp = buildCatalogApplicationSpec({
    appName,
    catalogItem,
    catalogItemVersion: versionEntry,
    channel,
    formValues,
    volumeSelection: advancedConfig.configureVia === 'form' ? advancedConfig.volumeSelection : [],
  });

  // Version stays locked to the existing pin.
  return toCatalogAppForm(apiApp, appForm.catalogItemRef);
};

export const getAdvancedConfigInitialValues = (
  catalogItem: CatalogItem,
  app: CatalogAppForm,
): DynamicFormConfigFormik => getInitialAppConfig(catalogItem, app.catalogItemRef.version, app.apiApp);
