import * as React from 'react';
import { Alert, Button, Stack } from '@patternfly/react-core';
import { Modal, ModalBody, ModalFooter, ModalHeader, ModalVariant } from '@patternfly/react-core/next';
import { Trans } from 'react-i18next';

import { useFetch } from '../../../hooks/useFetch';
import { getErrorMessage } from '../../../utils/error';
import { useTranslation } from '../../../hooks/useTranslation';

type DeleteAuthProviderModalProps = {
  authProviderId: string;
  onClose: VoidFunction;
  onDeleteSuccess: VoidFunction;
};

const DeleteAuthProviderModal = ({ authProviderId, onClose, onDeleteSuccess }: DeleteAuthProviderModalProps) => {
  const { t } = useTranslation();
  const { remove } = useFetch();
  const [error, setError] = React.useState<string>();
  const [isLoading, setIsLoading] = React.useState(false);

  const handleDelete = async () => {
    setError(undefined);
    setIsLoading(true);
    try {
      await remove(`authproviders/${authProviderId}`);
      onDeleteSuccess();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal variant={ModalVariant.small} isOpen onClose={onClose}>
      <ModalHeader title={t('Delete authentication provider?')} titleIconVariant="warning" />
      <ModalBody>
        <Stack hasGutter>
          {error && (
            <Alert isInline variant="danger" title={t('An error occurred')}>
              {error}
            </Alert>
          )}
          <div>
            <Trans t={t}>
              Are you sure you want to delete <strong>{authProviderId}</strong>?
            </Trans>
          </div>
        </Stack>
      </ModalBody>
      <ModalFooter>
        <Button key="delete" variant="danger" onClick={handleDelete} isLoading={isLoading} isDisabled={isLoading}>
          {t('Delete')}
        </Button>
        <Button key="cancel" variant="link" onClick={onClose} isDisabled={isLoading}>
          {t('Cancel')}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default DeleteAuthProviderModal;
