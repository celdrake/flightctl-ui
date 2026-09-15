import { useAppContext } from './useAppContext';

// Links to other flightctl upstream resources
export const DEMO_REPOSITORY_URL = 'https://github.com/flightctl/flightctl-demos';

// CELIA-WIP: Check with Mark for RHEM 1.4
export const RHEM_VERSION = '1.3';

const baseUpstreamDocs = 'https://github.com/flightctl/flightctl/blob/main/docs';

// CELIA-WIP: NEED ACTUAL LINKS FOR DELTA GENERATION DOCUMENTATION
type AppLink =
  | 'createApp'
  | 'useTemplateVars'
  | 'addNewDevice'
  | 'createAcmRepo'
  | 'provisionDevice'
  | 'catalog'
  | 'deltaGeneration';

const upstreamLinks: Record<AppLink, string> = {
  createApp: `${baseUpstreamDocs}/user/using/managing-devices.md#creating-applications`,
  useTemplateVars: `${baseUpstreamDocs}/user/using/managing-fleets.md#defining-device-templates`,
  addNewDevice: `${baseUpstreamDocs}/user/building/building-images.md#choosing-an-enrollment-method`,
  createAcmRepo: `${baseUpstreamDocs}/user/using/registering-microshift-devices-acm.md#auto-registering-devices-with-microshift-into-acm`,
  provisionDevice: `${baseUpstreamDocs}/user/using/provisioning-devices.md#provisioning-physical-devices`,
  catalog: `${baseUpstreamDocs}/user/using/managing-catalogs.md`,
  deltaGeneration: '',
};

const baseDownstreamDocs = `https://docs.redhat.com/en/documentation/red_hat_edge_manager/${RHEM_VERSION}/html`;
const downstreamLinks: Record<AppLink, string> = {
  createApp: `${baseDownstreamDocs}/managing_applications_on_an_edge_device/build-app-packages_managing-apps-edge-device`,
  useTemplateVars: `${baseDownstreamDocs}/managing_device_fleets/device-fleets_managing-device-fleets`,
  addNewDevice: `${baseDownstreamDocs}/operating_system_images_for_the_red_hat_edge_manager/edge-mgr-images_os-images-edge-manager#build-images-consider_os-images-edge-manager`,
  createAcmRepo: `${baseDownstreamDocs}/managing_devices/manage-devices-intro_managing-devices#manage-git-repository_managing-devices`,
  provisionDevice: `${baseDownstreamDocs}/provisioning_devices/provision-devices-intro_provisioning-devices`,
  catalog: `${baseDownstreamDocs}/managing_devices/manage-devices-intro_managing-devices#software-catalog_managing-devices`,
  deltaGeneration: '',
};

export const useAppLinks = (link: AppLink) => {
  const { settings } = useAppContext();

  return settings.isRHEM ? downstreamLinks[link] : upstreamLinks[link];
};
