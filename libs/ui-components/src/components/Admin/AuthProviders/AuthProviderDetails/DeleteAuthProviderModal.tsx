import * as React from 'react';

import { AuthProvider } from '@flightctl/types';
import { useTranslation } from '../../../../hooks/useTranslation';
import { useFetch } from '../../../../hooks/useFetch';
import DeleteModal from '../../../modals/DeleteModal/DeleteModal';

type DeleteAuthProviderModalProps = {
  onClose: VoidFunction;
  providerId: string;
  onDeleteSuccess: VoidFunction;
};

const DeleteAuthProviderModal = ({ onClose, providerId, onDeleteSuccess }: DeleteAuthProviderModalProps) => {
  const { t } = useTranslation();
  const { remove } = useFetch();

  return (
    <DeleteModal
      onClose={onClose}
      onDelete={async () => {
        await remove<AuthProvider>(`authproviders/${providerId}`);
        onDeleteSuccess();
      }}
      resourceType={t('authentication provider')}
      resourceName={providerId}
    />
  );
};

export default DeleteAuthProviderModal;
