import React from 'react';
import {
  Alert,
  AlertVariant,
  ClipboardCopy,
  Stack,
  StackItem,
  Tab,
  TabTitleText,
  Tabs,
  Text,
  TextContent,
} from '@patternfly/react-core';
import { dump } from 'js-yaml';

import { EnrollmentConfig } from '@flightctl/types';
import { useTranslation } from '../../hooks/useTranslation';
import { useFetch } from '../../hooks/useFetch';

const CopyButton = ({ text }: { text: string }) => (
  <ClipboardCopy isCode isBlock variant="expansion" onCopy={() => navigator.clipboard.writeText(text)}>
    {text}
  </ClipboardCopy>
);

export interface IssuedCertificateRequest {
  csrName: string;
  csrPem: string;
  publicKeyPem: string;
  privateKeyPem: string;
}

const CertificateRequestIssuedResult = ({ issuedCert }: { issuedCert: IssuedCertificateRequest }) => {
  const { t } = useTranslation();
  const [activeTabKey, setActiveTabKey] = React.useState<string | number>(0);
  const { get } = useFetch();
  const [configYaml, setConfigYaml] = React.useState<string>();

  React.useEffect(() => {
    const loadEnrollmentConfig = async (csrName: string, privateKeyPem: string) => {
      try {
        // Take the config and add the missing private key data
        const config = await get<EnrollmentConfig>(`enrollmentconfig?csr=${csrName}`);
        config['enrollment-service'].authentication['client-key-data'] = btoa(privateKeyPem);

        // Convert JSON config to YAML format
        setConfigYaml(dump(config, { lineWidth: -1 }));
      } catch (error) {
        setConfigYaml(
          `# Error loading enrollment configuration\n# ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    };

    loadEnrollmentConfig(issuedCert.csrName, issuedCert.privateKeyPem);
  }, [issuedCert.csrName, issuedCert.privateKeyPem, get]);

  return (
    <>
      <Alert variant={AlertVariant.success} title={t('Certificate request generated successfully!')} isInline>
        {t('Certificate signing request name: {{ csrName }}', { csrName: issuedCert.csrName })}
      </Alert>

      <Tabs activeKey={activeTabKey} onSelect={(_event, tabIndex) => setActiveTabKey(tabIndex)}>
        <Tab eventKey={0} title={<TabTitleText>{t('Configuration YAML')}</TabTitleText>} className="pf-v5-u-my-md">
          <Stack hasGutter>
            <StackItem>{t('Save this config.yaml file and use it to enroll new devices')}</StackItem>
            <StackItem>
              <CopyButton text={configYaml || ''} />
            </StackItem>
          </Stack>
        </Tab>

        <Tab eventKey={1} title={<TabTitleText>{t('Public Key')}</TabTitleText>} className="pf-v5-u-my-md">
          <CopyButton text={issuedCert.publicKeyPem} />
        </Tab>

        <Tab eventKey={2} title={<TabTitleText>{t('Private Key')}</TabTitleText>} className="pf-v5-u-my-md">
          <Stack hasGutter>
            <StackItem>
              <Alert variant={AlertVariant.warning} title={t('Keep this private key secure!')} isInline>
                {t('This private key should be stored securely and never shared.')}
              </Alert>
            </StackItem>
            <StackItem>
              <CopyButton text={issuedCert.privateKeyPem} />
            </StackItem>
          </Stack>
        </Tab>

        <Tab
          eventKey={3}
          title={<TabTitleText>{t('Certificate Signing Request')}</TabTitleText>}
          className="pf-v5-u-my-md"
        >
          <Stack hasGutter>
            <StackItem>
              <TextContent>
                <Text>{t('This is the CSR that was submitted to the FlightCtl API:')}</Text>
              </TextContent>
            </StackItem>
            <StackItem>
              <CopyButton text={issuedCert.csrPem} />
            </StackItem>
          </Stack>
        </Tab>
      </Tabs>
    </>
  );
};

export default CertificateRequestIssuedResult;
