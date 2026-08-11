import { type TFunction } from 'i18next';

import { DeviceUpdatedStatusType as UpdatedStatus } from '@flightctl/types';
import { identityT } from '../i18n';
import { type StatusItem } from './common';

export const getSystemUpdateStatusItems = (t: TFunction): StatusItem<UpdatedStatus>[] => [
  {
    id: UpdatedStatus.DeviceUpdatedStatusOutOfDate,
    label: t('Out-of-date'),
    level: 'warning',
  },
  {
    id: UpdatedStatus.DeviceUpdatedStatusUpdating,
    label: t('Updating'),
    level: 'info',
  },
  {
    id: UpdatedStatus.DeviceUpdatedStatusUnknown,
    label: t('Unknown'),
    level: 'unknown',
  },
  {
    id: UpdatedStatus.DeviceUpdatedStatusUpToDate,
    label: t('Up-to-date'),
    level: 'success',
  },
];
export const systemUpdateStatusOrder = getSystemUpdateStatusItems(identityT).map((item) => item.id);
