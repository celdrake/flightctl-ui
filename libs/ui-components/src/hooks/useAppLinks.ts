import { useAppContext } from './useAppContext';

// Links to other flightctl upstream resources
export const DEMO_REPOSITORY_URL = 'https://github.com/flightctl/flightctl-demos';

export const RHEM_VERSION = '1.1';

const upstreamLinks = {
  createApp:
    'https://github.com/flightctl/flightctl/blob/main/docs/user/using/managing-devices.md#creating-applications',
  useTemplateVars:
    'https://github.com/flightctl/flightctl/blob/main/docs/user/using/managing-fleets.md#defining-device-templates',
  addNewDevice:
    'https://github.com/flightctl/flightctl/blob/main/docs/user/building/building-images.md#choosing-an-enrollment-method',
  createAcmRepo:
    'https://github.com/flightctl/flightctl/blob/main/docs/user/using/registering-microshift-devices-acm.md#auto-registering-devices-with-microshift-into-acm',
  provisionDevice:
    'https://github.com/flightctl/flightctl/blob/main/docs/user/using/provisioning-devices.md#provisioning-physical-devices',
};

const downstreamLinks = {
  createApp: `https://docs.redhat.com/en/documentation/red_hat_edge_manager/${RHEM_VERSION}/html/managing_applications_on_an_edge_device/rhem-manage-apps#build-app-packages`,
  useTemplateVars: `https://docs.redhat.com/en/documentation/red_hat_edge_manager/${RHEM_VERSION}/html/managing_device_fleets/device-fleets#device-templates`,
  addNewDevice: `https://docs.redhat.com/en/documentation/red_hat_edge_manager/${RHEM_VERSION}/html/operating_system_images_for_the_red_hat_edge_manager/edge-mgr-images#build-images-consider`,
  createAcmRepo: `https://docs.redhat.com/en/documentation/red_hat_edge_manager/${RHEM_VERSION}/html/managing_devices/manage-devices-intro#manage-git-repository`,
  provisionDevice: `https://docs.redhat.com/en/documentation/red_hat_edge_manager/${RHEM_VERSION}/html/provisioning_devices/provision-devices-intro`,
};

type AppLink = 'createApp' | 'useTemplateVars' | 'addNewDevice' | 'createAcmRepo' | 'provisionDevice';

export const useAppLinks = (link: AppLink) => {
  const { settings } = useAppContext();

  return settings.isRHEM ? downstreamLinks[link] : upstreamLinks[link];
};
