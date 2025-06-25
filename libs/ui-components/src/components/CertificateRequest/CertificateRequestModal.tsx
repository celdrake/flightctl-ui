import * as React from 'react';
import { Alert, AlertVariant, Button, FormGroup, Spinner, TextInput } from '@patternfly/react-core';
import { Modal, ModalBody, ModalFooter, ModalHeader, ModalVariant } from '@patternfly/react-core/next';

import { useTranslation } from '../../hooks/useTranslation';
import { useFetch } from '../../hooks/useFetch';
import {
  createNewCertificateSigningRequest,
  generateCsrKeys,
  isBrowserCryptoSupported,
} from '../../utils/certificateRequests';
import CertificateRequestIssuedResult, { IssuedCertificateRequest } from './CertificateRequestIssuedResult';
import FlightCtlForm from '../form/FlightCtlForm';

interface CertificateRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const defaultExpirationDays = 60;
const maxExpirationDays = 365;

const CertificateRequestModal = ({ isOpen, onClose }: CertificateRequestModalProps) => {
  // CELIA-WIP FORMIK
  const { t } = useTranslation();
  const [csrName, setCsrName] = React.useState('');
  const [expirationDays, setExpirationDays] = React.useState(defaultExpirationDays);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string>();
  const [issuedCert, setIssuedCert] = React.useState<IssuedCertificateRequest>();
  const { post } = useFetch();

  const handleReset = () => {
    setCsrName('');
    setExpirationDays(defaultExpirationDays);
    setError(undefined);
    setIssuedCert(undefined);
    setIsSubmitting(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!csrName) {
      setError(t('Csr name is required'));
      return;
    }

    setIsSubmitting(true);
    setError(undefined);

    try {
      // Check if we can use Web Crypto API
      const useWebCrypto = isBrowserCryptoSupported();

      if (useWebCrypto) {
        // Use the complete workflow with simplified Web Crypto API
        const csrCreateResp = await createNewCertificateSigningRequest(post, csrName, expirationDays);

        setIssuedCert({
          csrName,
          privateKeyPem: csrCreateResp.privateKeyPem,
          publicKeyPem: csrCreateResp.publicKeyPem,
          csrPem: csrCreateResp.csrPem,
        });
      } else {
        // CELIA-WIP is this valid? would the API accept it?
        // Fallback: Just create the CSR without submitting
        const certRequest = await generateCsrKeys(csrName);

        setIssuedCert({
          csrName,
          privateKeyPem: certRequest.privateKeyPem,
          publicKeyPem: certRequest.publicKeyPem,
          csrPem: certRequest.csrPem,
        });

        setError(t('Browser crypto not fully supported. CSR generated but not submitted automatically.'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('An unknown error occurred'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // CELIA-WIP FORM VALIDATOIN
  // CELIA-WIP FLIGHTCT CONTROL / RHEM
  return (
    <Modal variant={ModalVariant.large} isOpen={isOpen} onClose={handleClose}>
      <ModalHeader title={t('Certificate Request')} />
      <ModalBody>
        {issuedCert ? (
          <CertificateRequestIssuedResult issuedCert={issuedCert} />
        ) : (
          <FlightCtlForm>
            <FormGroup label={t('Certificate signing request name')} fieldId="csrName" isRequired>
              <TextInput
                id="csrName"
                value={csrName}
                onChange={(_event, value) => setCsrName(value?.trim() || '')}
                isRequired
              />
            </FormGroup>

            <FormGroup label={t('Certificate expiration (days)')} fieldId="expirationDays">
              <TextInput
                id="expirationDays"
                type="number"
                value={expirationDays.toString()}
                onChange={(_event, value) => setExpirationDays(parseInt(value) || defaultExpirationDays)}
                min={1}
                max={maxExpirationDays}
              />
            </FormGroup>

            {error && (
              <Alert variant={AlertVariant.danger} title={t('Error')} isInline>
                {error}
              </Alert>
            )}

            {isSubmitting && (
              <Alert variant={AlertVariant.info} title={t('Generating certificate request...')} isInline>
                <Spinner size="sm" /> {t('This may take a few moments...')}
              </Alert>
            )}
          </FlightCtlForm>
        )}
      </ModalBody>
      <ModalFooter>
        <Button
          key="submit"
          variant="primary"
          onClick={handleSubmit}
          isLoading={isSubmitting}
          isDisabled={isSubmitting || !csrName}
        >
          {isSubmitting ? t('Generating...') : t('Generate Certificate Request')}
        </Button>
        <Button key="cancel" variant="link" onClick={handleClose} isDisabled={isSubmitting}>
          {t('Cancel')}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default CertificateRequestModal;
