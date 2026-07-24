export const CATALOG_LABEL = 'catalog.flightctl.io/';

export const APP_VOLUME_CHANNEL_LABEL_KEY = 'volume.catalog.flightctl.io/channel';
export const APP_VOLUME_CATALOG_LABEL_KEY = 'volume.catalog.flightctl.io/catalog';
export const APP_VOLUME_ITEM_LABEL_KEY = 'volume.catalog.flightctl.io/item';

export const getAppVolumeName = (appName: string | undefined, volumeName: string, label: string) => {
  const appPrefix = appName ? `${appName}.` : '';
  return `${appPrefix}${volumeName}.${label}`;
};
