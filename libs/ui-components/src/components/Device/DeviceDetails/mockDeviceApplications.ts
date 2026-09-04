import {
  AppType,
  ApplicationDesiredState,
  type ApplicationProviderSpec,
  ApplicationStatusType,
  type DeviceApplicationStatus,
  SystemdActiveStateType,
  SystemdEnableStateType,
  SystemdLoadStateType,
  type SystemdUnitStatus,
} from '@flightctl/types';

import { type DeviceAppLifecycleOverrides } from '../../../utils/applicationLifecycle';

/** Temporary mock data for device overview layout testing — remove when done. */
export const USE_MOCK_DEVICE_APPLICATIONS = true;
export const USE_MOCK_DEVICE_SYSTEMD_UNITS = USE_MOCK_DEVICE_APPLICATIONS;

const UBUNTU_DEV_VM_YAML = `apiVersion: kubevirt.io/v1
kind: VirtualMachine
metadata:
  name: ubuntu-dev
spec:
  running: true
  template:
    spec:
      domain:
        cpu:
          cores: 2
        memory:
          guest: 4Gi
        devices:
          disks:
            - name: containerdisk
              disk:
                bus: virtio
      volumes:
        - name: containerdisk
          containerDisk:
            image: quay.io/kubevirt/cirros-container-disk-demo
`;

const FEDORA_TEST_VM_YAML = `apiVersion: kubevirt.io/v1
kind: VirtualMachine
metadata:
  name: fedora-test
spec:
  running: false
  template:
    spec:
      domain:
        cpu:
          cores: 1
        memory:
          guest: 2Gi
        devices:
          disks:
            - name: containerdisk
              disk:
                bus: virtio
      volumes:
        - name: containerdisk
          containerDisk:
            image: quay.io/containerdisks/fedora:39
`;

export const MOCK_DEVICE_APPLICATIONS_STATUS: DeviceApplicationStatus[] = [
  {
    name: 'web-frontend',
    ready: '1/1',
    restarts: 0,
    status: ApplicationStatusType.ApplicationStatusRunning,
    embedded: false,
    appType: AppType.AppTypeContainer,
    runAs: 'appuser',
  },
  {
    name: 'data-pipeline',
    ready: '0/2',
    restarts: 42,
    status: ApplicationStatusType.ApplicationStatusError,
    embedded: false,
    appType: AppType.AppTypeCompose,
  },
  {
    name: 'edge-agent',
    ready: '0/1',
    restarts: 1,
    status: ApplicationStatusType.ApplicationStatusStarting,
    embedded: true,
    appType: AppType.AppTypeQuadlet,
    runAs: 'edge',
  },
  {
    name: 'monitoring-stack',
    ready: '0/3',
    restarts: 0,
    status: ApplicationStatusType.ApplicationStatusPreparing,
    embedded: false,
    appType: AppType.AppTypeHelm,
  },
  {
    name: 'batch-job',
    ready: '1/1',
    restarts: 0,
    status: ApplicationStatusType.ApplicationStatusCompleted,
    embedded: false,
    appType: AppType.AppTypeContainer,
  },
  {
    name: 'legacy-service',
    ready: '0/1',
    restarts: 0,
    status: ApplicationStatusType.ApplicationStatusStopped,
    embedded: false,
    appType: AppType.AppTypeCompose,
  },
  {
    name: 'deprecated-api',
    ready: '1/1',
    restarts: 3,
    status: ApplicationStatusType.ApplicationStatusStopping,
    embedded: false,
    appType: AppType.AppTypeQuadlet,
  },
  {
    name: 'mystery-svc',
    ready: '0/1',
    restarts: 0,
    status: ApplicationStatusType.ApplicationStatusUnknown,
    embedded: false,
    appType: AppType.AppTypeContainer,
  },
  {
    name: 'ubuntu-dev',
    ready: '1/1',
    restarts: 0,
    status: ApplicationStatusType.ApplicationStatusRunning,
    embedded: false,
    appType: AppType.AppTypeVm,
  },
  {
    name: 'win11-lab',
    ready: '0/1',
    restarts: 7,
    status: ApplicationStatusType.ApplicationStatusError,
    embedded: false,
    appType: AppType.AppTypeVm,
  },
  {
    name: 'fedora-test',
    ready: '0/1',
    restarts: 0,
    status: ApplicationStatusType.ApplicationStatusUnknown,
    embedded: false,
    appType: AppType.AppTypeVm,
  },
];

export const MOCK_DEVICE_APPLICATIONS_SPECS: ApplicationProviderSpec[] = [
  {
    name: 'web-frontend',
    appType: AppType.AppTypeContainer,
    image: 'registry.example.com/frontend:2.4.1',
    ports: ['80:8080'],
  },
  {
    name: 'data-pipeline',
    appType: AppType.AppTypeCompose,
    image: 'registry.example.com/data-pipeline:latest',
  },
  {
    name: 'edge-agent',
    appType: AppType.AppTypeQuadlet,
    image: 'registry.example.com/edge-agent:1.0.0',
  },
  {
    name: 'monitoring-stack',
    appType: AppType.AppTypeHelm,
    image: 'oci://registry.example.com/charts/kube-prometheus-stack:55.0.0',
    namespace: 'monitoring',
  },
  {
    name: 'batch-job',
    appType: AppType.AppTypeContainer,
    image: 'registry.example.com/nightly-batch:2026-03-04',
  },
  {
    name: 'legacy-service',
    appType: AppType.AppTypeCompose,
    image: 'registry.example.com/legacy:0.9.8',
  },
  {
    name: 'deprecated-api',
    appType: AppType.AppTypeQuadlet,
    image: 'registry.example.com/deprecated-api:3.1.0',
  },
  {
    name: 'mystery-svc',
    appType: AppType.AppTypeContainer,
    image: 'registry.example.com/mystery:latest',
  },
  {
    name: 'ubuntu-dev',
    appType: AppType.AppTypeVm,
    inline: [{ path: 'vm.yaml', content: UBUNTU_DEV_VM_YAML }],
    publishPorts: ['2222:22/tcp', '8080:80'],
  },
  {
    name: 'win11-lab',
    appType: AppType.AppTypeVm,
    image: 'oci://registry.example.com/vms/win11-lab:24H2',
    publishPorts: ['3389:3389/tcp'],
  },
  {
    name: 'fedora-test',
    appType: AppType.AppTypeVm,
    inline: [{ path: 'vm.yaml', content: FEDORA_TEST_VM_YAML }],
  },
];

/** Running app with a stop requested — shows the "Reconciling" status badge. */
export const MOCK_DEVICE_APP_LIFECYCLE_OVERRIDES: DeviceAppLifecycleOverrides = {
  'web-frontend': ApplicationDesiredState.ApplicationDesiredStateStopped,
};

export const MOCK_DEVICE_SYSTEMD_UNITS: SystemdUnitStatus[] = [
  {
    unit: 'sshd.service',
    description: 'OpenSSH server daemon',
    enableState: SystemdEnableStateType.SystemdEnableStateEnabled,
    loadState: SystemdLoadStateType.SystemdLoadStateLoaded,
    activeState: SystemdActiveStateType.SystemdActiveStateActive,
    subState: 'running',
  },
  {
    unit: 'kubelet.service',
    description: 'Kubernetes kubelet',
    enableState: SystemdEnableStateType.SystemdEnableStateEnabled,
    loadState: SystemdLoadStateType.SystemdLoadStateLoaded,
    activeState: SystemdActiveStateType.SystemdActiveStateDeactivating,
    subState: 'stop',
  },
  {
    unit: 'backup.timer',
    description: 'Daily backup timer',
    enableState: SystemdEnableStateType.SystemdEnableStateEnabled,
    loadState: SystemdLoadStateType.SystemdLoadStateLoaded,
    activeState: SystemdActiveStateType.SystemdActiveStateActive,
    subState: 'waiting',
  },
  {
    unit: 'dbus.socket',
    description: 'D-Bus System Message Bus Socket',
    enableState: SystemdEnableStateType.SystemdEnableStateStatic,
    loadState: SystemdLoadStateType.SystemdLoadStateLoaded,
    activeState: SystemdActiveStateType.SystemdActiveStateActive,
    subState: 'listening',
  },
  {
    unit: 'multi-user.target',
    description: 'Multi-User System',
    enableState: SystemdEnableStateType.SystemdEnableStateStatic,
    loadState: SystemdLoadStateType.SystemdLoadStateLoaded,
    activeState: SystemdActiveStateType.SystemdActiveStateActive,
    subState: 'active',
  },
  {
    unit: 'home.mount',
    description: '/home mount point',
    enableState: SystemdEnableStateType.SystemdEnableStateEnabled,
    loadState: SystemdLoadStateType.SystemdLoadStateLoaded,
    activeState: SystemdActiveStateType.SystemdActiveStateActive,
    subState: 'mounted',
  },
  {
    unit: 'flightctl-agent.path',
    description: 'Flight Control agent activation path',
    enableState: SystemdEnableStateType.SystemdEnableStateEnabled,
    loadState: SystemdLoadStateType.SystemdLoadStateLoaded,
    activeState: SystemdActiveStateType.SystemdActiveStateActive,
    subState: 'running',
  },

  {
    unit: 'shadow.service',
    description: 'Shadowed service (masked)',
    enableState: SystemdEnableStateType.SystemdEnableStateMasked,
    loadState: SystemdLoadStateType.SystemdLoadStateMasked,
    activeState: SystemdActiveStateType.SystemdActiveStateInactive,
    subState: 'masked',
  },
  {
    unit: 'unknown-agent.service',
    description: 'Legacy agent with unknown state',
    enableState: SystemdEnableStateType.SystemdEnableStateUnknown,
    loadState: SystemdLoadStateType.SystemdLoadStateUnknown,
    activeState: SystemdActiveStateType.SystemdActiveStateUnknown,
    subState: 'unknown',
  },
];
