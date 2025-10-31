import * as React from 'react';
import {
  Alert,
  Button,
  FormGroup,
  FormSelect,
  FormSelectOption,
  Icon,
  Label,
  List,
  ListItem,
  Popover,
  Spinner,
  Stack,
  StackItem,
  Text,
  TextContent,
  Title,
  TitleSizes,
} from '@patternfly/react-core';
import { Modal, ModalBody, ModalFooter, ModalHeader } from '@patternfly/react-core/next';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import { CheckCircleIcon } from '@patternfly/react-icons/dist/js/icons/check-circle-icon';
import { ExclamationTriangleIcon } from '@patternfly/react-icons/dist/js/icons/exclamation-triangle-icon';
import { ExclamationCircleIcon } from '@patternfly/react-icons/dist/js/icons/exclamation-circle-icon';
import { InfoCircleIcon } from '@patternfly/react-icons/dist/js/icons/info-circle-icon';
import { OutlinedQuestionCircleIcon } from '@patternfly/react-icons/dist/js/icons/outlined-question-circle-icon';
import { AuthProvider, AuthProviderList } from '@flightctl/types';

import { useTranslation } from '../../../hooks/useTranslation';
import { useAppContext } from '../../../hooks/useAppContext';
import { getErrorMessage } from '../../../utils/error';

type ValidationLevel = 'error' | 'warning' | 'info';

type ValidationNote = {
  level: ValidationLevel;
  text: string;
};

type FieldValidation = {
  valid: boolean;
  value: string;
  notes?: ValidationNote[];
};

type OidcDiscoveryValidation = {
  reachable: boolean;
  discoveryUrl: FieldValidation;
  authorizationEndpoint: FieldValidation;
  tokenEndpoint: FieldValidation;
  userInfoEndpoint: FieldValidation;
  endSessionEndpoint: FieldValidation;
};

type OAuth2SettingsValidation = {
  valid: boolean;
  authorizationEndpoint: FieldValidation;
  tokenEndpoint: FieldValidation;
  userInfoEndpoint: FieldValidation;
  endSessionEndpoint: FieldValidation;
  scopes: FieldValidation;
};

type OrgAssignmentValidation = {
  valid: boolean;
  notes?: ValidationNote[];
};

type ValidationSummary = {
  totalFields: number;
  validFields: number;
  errorFields: number;
  warningFields: number;
  providerName?: string;
  nextSteps: string[];
};

type ProviderValidationResult = {
  valid: boolean;
  type: FieldValidation;
  clientId: FieldValidation;
  enabled: FieldValidation;
  issuer?: FieldValidation;
  oidcDiscovery?: OidcDiscoveryValidation;
  oauth2Settings?: OAuth2SettingsValidation;
  usernameClaim: FieldValidation;
  organizationAssignment?: OrgAssignmentValidation;
  summary: ValidationSummary;
};

type TestProviderConnectionModalProps = {
  onClose: VoidFunction;
};

const ValidationIcon = ({ level }: { level: ValidationLevel }) => {
  if (level === 'error') {
    return (
      <Icon status="danger">
        <ExclamationCircleIcon />
      </Icon>
    );
  }
  return <Icon status={level}>{level === 'warning' ? <ExclamationTriangleIcon /> : <InfoCircleIcon />}</Icon>;
};

const EndpointStatusCell = ({
  field,
  successLabel,
  failureLabel,
  optionalLabel,
  isOptional = false,
}: {
  field: FieldValidation | undefined;
  successLabel: string;
  failureLabel: string;
  optionalLabel?: string;
  isOptional?: boolean;
}) => {
  if (!field) {
    return null;
  }

  const hasNotes = field.notes && field.notes.length > 0;
  const showOptional = isOptional && !field.value;

  const statusLabel = showOptional ? (
    <Label color="blue" icon={<InfoCircleIcon />}>
      {optionalLabel}
    </Label>
  ) : field.valid ? (
    <Label color="green" icon={<CheckCircleIcon />}>
      {successLabel}
    </Label>
  ) : (
    <Label color="red" icon={<ExclamationCircleIcon />}>
      {failureLabel}
    </Label>
  );

  if (!hasNotes) {
    return statusLabel;
  }

  return (
    <Stack>
      <StackItem>{statusLabel}</StackItem>
      <StackItem>
        <Popover
          headerContent={<div>Details</div>}
          bodyContent={
            <List isPlain>
              {field.notes!.map((note, idx) => (
                <ListItem key={idx} icon={<ValidationIcon level={note.level} />}>
                  {note.text}
                </ListItem>
              ))}
            </List>
          }
        >
          <Button variant="plain" aria-label="More info">
            <OutlinedQuestionCircleIcon />
          </Button>
        </Popover>
      </StackItem>
    </Stack>
  );
};

const TestProviderConnectionModal = ({ onClose }: TestProviderConnectionModalProps) => {
  const { t } = useTranslation();
  const { fetch } = useAppContext();
  const proxyFetch = fetch.proxyFetch;

  const [providers, setProviders] = React.useState<AuthProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = React.useState<string>('');
  const [isTesting, setIsTesting] = React.useState(false);
  const [validationResult, setValidationResult] = React.useState<ProviderValidationResult | null>(null);
  const [error, setError] = React.useState<string>();
  const [isLoadingProviders, setIsLoadingProviders] = React.useState(true);

  // Fetch providers on mount
  React.useEffect(() => {
    const fetchProviders = async () => {
      try {
        const response = await proxyFetch('authproviders', { method: 'GET' });
        if (!response.ok) {
          throw new Error(`Failed to fetch providers: ${response.statusText}`);
        }
        const data = (await response.json()) as AuthProviderList;

        if (data.items.length > 0) {
          setProviders(data.items);
          setSelectedProvider(data.items[0].metadata.name as string);
        }
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setIsLoadingProviders(false);
      }
    };
    void fetchProviders();
  }, [proxyFetch]);

  const handleTest = async () => {
    if (!selectedProvider) return;

    setIsTesting(true);
    setError(undefined);
    setValidationResult(null);

    try {
      const response = await proxyFetch(`authproviders/${selectedProvider}/test`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`Test failed: ${response.status} ${response.statusText}`);
      }

      const result = (await response.json()) as ProviderValidationResult;
      setValidationResult(result);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} variant="medium">
      <ModalHeader title={t('Test Provider Connection')} />
      <ModalBody>
        <Stack hasGutter>
          {isLoadingProviders ? (
            <StackItem>
              <Spinner size="md" /> {t('Loading providers...')}
            </StackItem>
          ) : (
            <>
              <StackItem>
                <FormGroup label={t('Provider')} isRequired fieldId="provider-select">
                  <FormSelect
                    id="provider-select"
                    value={selectedProvider}
                    onChange={(_event, value) => {
                      setSelectedProvider(value);
                      setValidationResult(null);
                      setError(undefined);
                    }}
                    isDisabled={providers.length === 0 || isTesting}
                  >
                    {providers.length === 0 ? (
                      <FormSelectOption label={t('No providers available')} value="" />
                    ) : (
                      providers.map((provider) => (
                        <FormSelectOption
                          key={provider.metadata.name}
                          label={`${provider.metadata.name} (${provider.spec.providerType})`}
                          value={provider.metadata.name}
                        />
                      ))
                    )}
                  </FormSelect>
                </FormGroup>
              </StackItem>

              {error && (
                <StackItem>
                  <Alert isInline variant="danger" title={t('An error occurred')}>
                    {error}
                  </Alert>
                </StackItem>
              )}

              {validationResult && (
                <StackItem>
                  <Stack hasGutter>
                    {validationResult.oidcDiscovery && (
                      <>
                        <StackItem>
                          <Title headingLevel="h4" size={TitleSizes.md}>
                            {t('Provider discovery results')}:
                          </Title>
                        </StackItem>
                        <StackItem>
                          <TextContent>
                            <Text>
                              {t(
                                'The following information could be retrieved from the automatic discovery feature of the OIDC provider.',
                              )}
                            </Text>
                          </TextContent>
                        </StackItem>
                        <StackItem>
                          <Table variant="compact" borders={true}>
                            <Thead>
                              <Tr>
                                <Th>{t('Endpoint')}</Th>
                                <Th>{t('URL')}</Th>
                                <Th>{t('Status')}</Th>
                              </Tr>
                            </Thead>
                            <Tbody>
                              <Tr>
                                <Td>{t('Issuer URL')}</Td>
                                <Td>{validationResult.issuer?.value || '-'}</Td>
                                <Td>
                                  <EndpointStatusCell
                                    field={validationResult.issuer}
                                    successLabel={t('Success')}
                                    failureLabel={t('Failure')}
                                    isOptional={true}
                                  />
                                </Td>
                              </Tr>

                              <Tr>
                                <Td>{t('Authorization')}</Td>
                                <Td>{validationResult.oidcDiscovery.authorizationEndpoint.value || '-'}</Td>
                                <Td>
                                  <EndpointStatusCell
                                    field={validationResult.oidcDiscovery.authorizationEndpoint}
                                    successLabel={t('Success')}
                                    failureLabel={t('Failure')}
                                  />
                                </Td>
                              </Tr>
                              <Tr>
                                <Td>{t('Token')}</Td>
                                <Td>{validationResult.oidcDiscovery.tokenEndpoint.value || '-'}</Td>
                                <Td>
                                  <EndpointStatusCell
                                    field={validationResult.oidcDiscovery.tokenEndpoint}
                                    successLabel={t('Success')}
                                    failureLabel={t('Failure')}
                                  />
                                </Td>
                              </Tr>
                              <Tr>
                                <Td>{t('UserInfo')}</Td>
                                <Td>{validationResult.oidcDiscovery.userInfoEndpoint.value || '-'}</Td>
                                <Td>
                                  <EndpointStatusCell
                                    field={validationResult.oidcDiscovery.userInfoEndpoint}
                                    successLabel={t('Success')}
                                    failureLabel={t('Failure')}
                                  />
                                </Td>
                              </Tr>
                              {validationResult.oidcDiscovery.endSessionEndpoint && (
                                <Tr>
                                  <Td>{t('End Session')}</Td>
                                  <Td>
                                    {validationResult.oidcDiscovery.endSessionEndpoint.value || t('Not available')}
                                  </Td>
                                  <Td>
                                    <EndpointStatusCell
                                      field={validationResult.oidcDiscovery.endSessionEndpoint}
                                      successLabel={t('Success')}
                                      failureLabel={t('Failure')}
                                      optionalLabel={t('(Optional)')}
                                      isOptional={true}
                                    />
                                  </Td>
                                </Tr>
                              )}
                            </Tbody>
                          </Table>
                        </StackItem>
                      </>
                    )}

                    {/* OAuth2 Settings */}
                    {validationResult.oauth2Settings && (
                      <>
                        <StackItem>
                          <Title headingLevel="h4" size={TitleSizes.md}>
                            {t('OAuth2 endpoint validation results')}:
                          </Title>
                        </StackItem>
                        <StackItem>
                          <TextContent>
                            <Text>
                              {t(
                                'OAuth2 providers require manual endpoint configuration. Each endpoint is validated for reachability and compatibility.',
                              )}
                            </Text>
                          </TextContent>
                        </StackItem>
                        <StackItem>
                          <Table variant="compact" borders={true}>
                            <Thead>
                              <Tr>
                                <Th>{t('Setting')}</Th>
                                <Th>{t('Value')}</Th>
                                <Th>{t('Status')}</Th>
                              </Tr>
                            </Thead>
                            <Tbody>
                              <Tr>
                                <Td>{t('Authorization endpoint')}</Td>
                                <Td>{validationResult.oauth2Settings.authorizationEndpoint.value || '-'}</Td>
                                <Td>
                                  <EndpointStatusCell
                                    field={validationResult.oauth2Settings.authorizationEndpoint}
                                    successLabel={t('Success')}
                                    failureLabel={t('Failure')}
                                  />
                                </Td>
                              </Tr>
                              <Tr>
                                <Td>{t('Token endpoint')}</Td>
                                <Td>{validationResult.oauth2Settings.tokenEndpoint.value || '-'}</Td>
                                <Td>
                                  <EndpointStatusCell
                                    field={validationResult.oauth2Settings.tokenEndpoint}
                                    successLabel={t('Success')}
                                    failureLabel={t('Failure')}
                                  />
                                </Td>
                              </Tr>
                              <Tr>
                                <Td>{t('User info endpoint')}</Td>
                                <Td>{validationResult.oauth2Settings.userInfoEndpoint.value || '-'}</Td>
                                <Td>
                                  <EndpointStatusCell
                                    field={validationResult.oauth2Settings.userInfoEndpoint}
                                    successLabel={t('Success')}
                                    failureLabel={t('Failure')}
                                  />
                                </Td>
                              </Tr>
                              {validationResult.oauth2Settings.endSessionEndpoint && (
                                <Tr>
                                  <Td>{t('End session endpoint')}</Td>
                                  <Td>{validationResult.oauth2Settings.endSessionEndpoint.value || '-'}</Td>
                                  <Td>
                                    <EndpointStatusCell
                                      field={validationResult.oauth2Settings.endSessionEndpoint}
                                      successLabel={t('Success')}
                                      failureLabel={t('Failure')}
                                      optionalLabel={t('Optional')}
                                      isOptional={true}
                                    />
                                  </Td>
                                </Tr>
                              )}
                              <Tr>
                                <Td>{t('Scopes')}</Td>
                                <Td>{validationResult.oauth2Settings.scopes.value || '-'}</Td>
                                <Td>
                                  <EndpointStatusCell
                                    field={validationResult.oauth2Settings.scopes}
                                    successLabel={t('Setting defined')}
                                    failureLabel={t('Setting missing')}
                                  />
                                </Td>
                              </Tr>
                            </Tbody>
                          </Table>
                        </StackItem>
                      </>
                    )}

                    {/* Organization Assignment */}
                    {validationResult.organizationAssignment && (
                      <StackItem>
                        <Title headingLevel="h4" size={TitleSizes.md}>
                          {t('Organization Assignment')}
                        </Title>
                        <Stack hasGutter>
                          <StackItem>
                            {validationResult.organizationAssignment.valid ? (
                              <Label color="green" icon={<CheckCircleIcon />}>
                                Valid
                              </Label>
                            ) : (
                              <Label color="red" icon={<ExclamationCircleIcon />}>
                                Invalid
                              </Label>
                            )}
                          </StackItem>
                          {validationResult.organizationAssignment.notes &&
                            validationResult.organizationAssignment.notes.length > 0 && (
                              <StackItem>
                                <List isPlain>
                                  {validationResult.organizationAssignment.notes.map((note, idx) => (
                                    <ListItem key={idx} icon={<ValidationIcon level={note.level} />}>
                                      {note.text}
                                    </ListItem>
                                  ))}
                                </List>
                              </StackItem>
                            )}
                        </Stack>
                      </StackItem>
                    )}
                  </Stack>
                </StackItem>
              )}
            </>
          )}
        </Stack>
      </ModalBody>
      <ModalFooter>
        <Button
          key="test"
          variant="primary"
          isDisabled={isTesting || !selectedProvider || providers.length === 0 || isLoadingProviders}
          isLoading={isTesting}
          onClick={handleTest}
        >
          {t('Test Connection')}
        </Button>
        <Button key="cancel" variant="link" onClick={onClose} isDisabled={isTesting}>
          {t('Close')}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default TestProviderConnectionModal;
