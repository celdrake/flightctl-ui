import * as React from 'react';
import { Button, EmptyStateActions, EmptyStateBody, EmptyStateFooter, ToolbarItem } from '@patternfly/react-core';
import { Tbody } from '@patternfly/react-table';
import { MicrochipIcon } from '@patternfly/react-icons/dist/js/icons/microchip-icon';
import { Trans } from 'react-i18next';
import { TFunction } from 'i18next';

import { Device, DeviceDecommission } from '@flightctl/types';

import ListPage from '../../ListPage/ListPage';
import ListPageBody from '../../ListPage/ListPageBody';
import { useDecommissionListAction } from '../../ListPage/ListPageActions';
import AddDeviceModal from '../AddDeviceModal/AddDeviceModal';
import Table, { ApiSortTableColumn } from '../../Table/Table';
import DeviceTableToolbar from './DeviceTableToolbar';
import DeviceTableRow from './DeviceTableRow';
import { FlightCtlLabel } from '../../../types/extraTypes';
import MassDeleteDeviceModal from '../../modals/massModals/MassDeleteDeviceModal/MassDeleteDeviceModal';
import ResourceListEmptyState from '../../common/ResourceListEmptyState';
import { useTableSelect } from '../../../hooks/useTableSelect';
import { useTranslation } from '../../../hooks/useTranslation';
import { useFetch } from '../../../hooks/useFetch';
import { Link, ROUTE } from '../../../hooks/useNavigate';
import { useDevices } from './useDevices';
import { useDeviceBackendFilters } from './useDeviceBackendFilters';
import {
  getApplicationStatusHelperText,
  getDeviceStatusHelperText,
  getUpdateStatusHelperText,
} from '../../Status/utils';
import EnrollmentRequestList from './EnrollmentRequestList';
import { FilterStatusMap } from './types';

type DeviceEmptyStateProps = {
  onAddDevice: VoidFunction;
};

const DeviceEmptyState: React.FC<DeviceEmptyStateProps> = ({ onAddDevice }) => {
  const { t } = useTranslation();
  return (
    <ResourceListEmptyState icon={MicrochipIcon} titleText={t('No devices here!')}>
      <EmptyStateBody>
        <Trans t={t}>
          You can add devices and label them to match fleets, or your can{' '}
          <Link to={ROUTE.FLEET_CREATE}>start with a fleet</Link> and add devices into it.
        </Trans>
      </EmptyStateBody>
      <EmptyStateFooter>
        <EmptyStateActions>
          <Button onClick={onAddDevice}>{t('Add devices')}</Button>
        </EmptyStateActions>
      </EmptyStateFooter>
    </ResourceListEmptyState>
  );
};

const getDeviceColumns = (t: TFunction): ApiSortTableColumn[] => [
  {
    name: t('Alias'),
  },
  {
    name: t('Name'),
  },
  {
    name: t('Fleet'),
  },
  {
    name: t('Application status'),
    helperText: getApplicationStatusHelperText(t),
  },
  {
    name: t('Device status'),
    helperText: getDeviceStatusHelperText(t),
  },
  {
    name: t('Update status'),
    helperText: getUpdateStatusHelperText(t),
  },
  {
    name: t('Last seen'),
  },
];

interface DeviceTableProps {
  devices: Array<Device>;
  refetch: VoidFunction;
  ownerFleets: string[];
  activeStatuses: FilterStatusMap;
  hasFiltersEnabled: boolean;
  nameOrAlias: string | undefined;
  setNameOrAlias: (text: string) => void;
  setOwnerFleets: (ownerFleets: string[]) => void;
  setActiveStatuses: (activeStatuses: FilterStatusMap) => void;
  selectedLabels: FlightCtlLabel[];
  setSelectedLabels: (labels: FlightCtlLabel[]) => void;
  isFilterUpdating: boolean;
  deviceColumns: ApiSortTableColumn[];
  // getSortParams: (columnIndex: number) => ThProps['sort'];
}

export const DeviceTable = ({
  devices,
  refetch,
  nameOrAlias,
  setNameOrAlias,
  ownerFleets,
  setOwnerFleets,
  activeStatuses,
  setActiveStatuses,
  selectedLabels,
  setSelectedLabels,
  hasFiltersEnabled,
  isFilterUpdating,
  deviceColumns,
}: DeviceTableProps) => {
  const { t } = useTranslation();
  const { post } = useFetch();
  const [addDeviceModal, setAddDeviceModal] = React.useState(false);
  const [isMassDeleteModalOpen, setIsMassDeleteModalOpen] = React.useState(false);

  const { onRowSelect, hasSelectedRows, isAllSelected, isRowSelected, setAllSelected } = useTableSelect();

  const { action: decommissionDeviceAction, modal: decommissionDeviceModal } = useDecommissionListAction({
    resourceType: 'Device',
    onConfirm: async (deviceId, { target }) => {
      // TODO Is it a PUT??
      const result = await post<DeviceDecommission>(`devices/${deviceId}/decommission`, {
        decommissionTarget: target,
      });

      console.log('%c result', 'color: red; font-size:18px', result);

      refetch();
    },
  });

  return (
    <>
      <DeviceTableToolbar
        nameOrAlias={nameOrAlias}
        setNameOrAlias={setNameOrAlias}
        ownerFleets={ownerFleets}
        setOwnerFleets={setOwnerFleets}
        activeStatuses={activeStatuses}
        setActiveStatuses={setActiveStatuses}
        selectedLabels={selectedLabels}
        setSelectedLabels={setSelectedLabels}
        isFilterUpdating={isFilterUpdating}
      >
        <ToolbarItem>
          <Button onClick={() => setAddDeviceModal(true)}>{t('Add devices')}</Button>
        </ToolbarItem>
        <ToolbarItem>
          <Button isDisabled={!hasSelectedRows} onClick={() => setIsMassDeleteModalOpen(true)} variant="secondary">
            {t('Delete devices')}
          </Button>
        </ToolbarItem>
      </DeviceTableToolbar>
      <Table
        aria-label={t('Devices table')}
        loading={isFilterUpdating}
        columns={deviceColumns}
        emptyFilters={!hasFiltersEnabled}
        emptyData={devices.length === 0}
        isAllSelected={isAllSelected}
        onSelectAll={setAllSelected}
      >
        <Tbody>
          {devices.map((device, index) => (
            <DeviceTableRow
              key={device.metadata.name || ''}
              device={device}
              decommissionAction={decommissionDeviceAction}
              onRowSelect={onRowSelect}
              isRowSelected={isRowSelected}
              rowIndex={index}
            />
          ))}
        </Tbody>
      </Table>
      {!hasFiltersEnabled && devices.length === 0 && <DeviceEmptyState onAddDevice={() => setAddDeviceModal(true)} />}
      {decommissionDeviceModal}
      {addDeviceModal && <AddDeviceModal onClose={() => setAddDeviceModal(false)} />}
      {isMassDeleteModalOpen && (
        <MassDeleteDeviceModal
          onClose={() => setIsMassDeleteModalOpen(false)}
          resources={devices.filter(isRowSelected)}
          onDeleteSuccess={() => {
            setIsMassDeleteModalOpen(false);
            refetch();
          }}
        />
      )}
    </>
  );
};

const DevicesPage = () => {
  const { t } = useTranslation();
  const deviceColumns = React.useMemo(() => getDeviceColumns(t), [t]);

  const {
    nameOrAlias,
    setNameOrAlias,
    ownerFleets,
    activeStatuses,
    hasFiltersEnabled,
    setOwnerFleets,
    setActiveStatuses,
    selectedLabels,
    setSelectedLabels,
  } = useDeviceBackendFilters();
  const [data, loading, error, updating, refetch] = useDevices({
    nameOrAlias,
    ownerFleets,
    activeStatuses,
    labels: selectedLabels,
  });

  return (
    <>
      <EnrollmentRequestList refetchDevices={refetch} />

      <ListPage title={t('Devices')}>
        <ListPageBody error={error} loading={loading}>
          <DeviceTable
            devices={data}
            refetch={refetch}
            nameOrAlias={nameOrAlias}
            setNameOrAlias={setNameOrAlias}
            hasFiltersEnabled={hasFiltersEnabled || updating}
            ownerFleets={ownerFleets}
            activeStatuses={activeStatuses}
            setOwnerFleets={setOwnerFleets}
            setActiveStatuses={setActiveStatuses}
            selectedLabels={selectedLabels}
            setSelectedLabels={setSelectedLabels}
            isFilterUpdating={updating}
            deviceColumns={deviceColumns}
          />
        </ListPageBody>
      </ListPage>
    </>
  );
};

export default DevicesPage;
