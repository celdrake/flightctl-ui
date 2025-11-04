import * as React from 'react';
import { Alert, Button, Icon, List, ListItem, Stack, StackItem } from '@patternfly/react-core';
import { Modal, ModalBody, ModalFooter, ModalHeader } from '@patternfly/react-core/next';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import { CheckCircleIcon } from '@patternfly/react-icons/dist/js/icons/check-circle-icon';
import { ExclamationCircleIcon } from '@patternfly/react-icons/dist/js/icons/exclamation-circle-icon';

import { useTranslation } from '../../../hooks/useTranslation';
import { TestConnectionResponse } from '../CreateAuthProvider/types';

type TestConnectionModalProps = {
  onClose: VoidFunction;
  results: TestConnectionResponse;
};

const getStatusIcon = (valid: boolean) => {
  if (valid) {
    return (
      <Icon status="success">
        <CheckCircleIcon />
      </Icon>
    );
  }
  return (
    <Icon status="danger">
      <ExclamationCircleIcon />
    </Icon>
  );
};

const getFieldDisplayName = (fieldName: string, t: (key: string) => string): string => {
  const fieldMap: Record<string, string> = {
    issuer: t('Issuer URL'),
    authorizationUrl: t('Authorization URL'),
    tokenUrl: t('Token URL'),
    userinfoUrl: t('Userinfo URL'),
  };
  return fieldMap[fieldName] || fieldName;
};

const NotesCell = ({ notes }: { notes?: string[] }) => {
  if (!notes || notes.length === 0) {
    return <>-</>;
  }

  return (
    <List isPlain>
      {notes.map((note, idx) => (
        <ListItem key={idx}>{note}</ListItem>
      ))}
    </List>
  );
};

const TestConnectionModal = ({ onClose, results }: TestConnectionModalProps) => {
  const { t } = useTranslation();

  const entries = Object.entries(results.results);
  const allValid = entries.every(([, validation]) => validation.valid);
  const hasInvalid = entries.some(([, validation]) => !validation.valid);

  // Check if this is an OIDC provider (has issuer field)
  const isOidcProvider = 'issuer' in results.results;
  const issuerValidation = results.results.issuer;

  return (
    <Modal isOpen onClose={onClose} variant="medium">
      <ModalHeader title={t('Test connection results')} />
      <ModalBody>
        <Stack hasGutter>
          {isOidcProvider && issuerValidation ? (
            <StackItem>
              <Alert
                isInline
                variant={issuerValidation.valid ? 'success' : 'danger'}
                title={issuerValidation.valid ? t('OIDC discovery successful') : t('OIDC discovery failed')}
              >
                {t('The OIDC discovery was successful. Find the details below for the discovered endpoints:')}
              </Alert>
            </StackItem>
          ) : (
            <StackItem>
              {allValid && (
                <Alert isInline variant="success" title={t('All validations passed')}>
                  {t('The authentication provider configuration appears to be correct.')}
                </Alert>
              )}
              {hasInvalid && (
                <Alert isInline variant="warning" title={t('Some validations failed')}>
                  {t('Some configuration issues were detected. Please review the details below.')}
                </Alert>
              )}
            </StackItem>
          )}
          <StackItem>
            <Table variant="compact">
              <Thead>
                <Tr>
                  <Th>{t('Field')}</Th>
                  <Th>{t('Value')}</Th>
                  <Th>{t('Status')}</Th>
                  <Th>{t('Details')}</Th>
                </Tr>
              </Thead>
              <Tbody>
                {entries.map(([fieldName, validation]) => (
                  <Tr key={fieldName}>
                    <Td>{getFieldDisplayName(fieldName, t)}</Td>
                    <Td style={{ wordBreak: 'break-all' }}>{validation.value || '-'}</Td>
                    <Td>{getStatusIcon(validation.valid)}</Td>
                    <Td>
                      <NotesCell notes={validation.notes} />
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </StackItem>
        </Stack>
      </ModalBody>
      <ModalFooter>
        <Button variant="primary" onClick={onClose}>
          {t('Close')}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default TestConnectionModal;
