import * as React from 'react';
import {
  Alert,
  Button,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  FormGroup,
  FormSelect,
  FormSelectOption,
  Label,
  List,
  ListItem,
  Spinner,
  Stack,
  StackItem,
  Title,
  TitleSizes,
} from '@patternfly/react-core';
import { Modal, ModalBody, ModalFooter, ModalHeader } from '@patternfly/react-core/next';
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  InfoCircleIcon,
} from '@patternfly/react-icons';

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

type OIDCProvider = {
  metadata: {
    name: string;
  };
  spec: {
    enabled: boolean;
    type: string;
  };
};

type TestProviderConnectionModalProps = {
  onClose: VoidFunction;
};

const ValidationIcon: React.FC<{ level: ValidationLevel }> = ({ level }) => {
  switch (level) {
    case 'error':
      return <ExclamationCircleIcon color="var(--pf-v5-global--danger-color--100)" />;
    case 'warning':
      return <ExclamationTriangleIcon color="var(--pf-v5-global--warning-color--100)" />;
    case 'info':
      return <InfoCircleIcon color="var(--pf-v5-global--info-color--100)" />;
  }
};

const FieldValidationDisplay: React.FC<{ label: string; field: FieldValidation }> = ({ label, field }) => {
  if (!field) {
    console.log('%c empty field', 'color: red; font-size:18px', label);
    return null;
  }
  return (
    <DescriptionListGroup>
      <DescriptionListTerm>{label}</DescriptionListTerm>
      <DescriptionListDescription>
        <Stack hasGutter>
          <StackItem>
            {field.valid ? (
              <Label color="green" icon={<CheckCircleIcon />}>
                Valid
              </Label>
            ) : (
              <Label color="red" icon={<ExclamationCircleIcon />}>
                Invalid
              </Label>
            )}
            {field.value && <span style={{ marginLeft: '8px' }}>{field.value}</span>}
          </StackItem>
          {field.notes && field.notes.length > 0 && (
            <StackItem>
              <List isPlain>
                {field.notes.map((note, idx) => (
                  <ListItem key={idx} icon={<ValidationIcon level={note.level} />}>
                    {note.text}
                  </ListItem>
                ))}
              </List>
            </StackItem>
          )}
        </Stack>
      </DescriptionListDescription>
    </DescriptionListGroup>
  );
};

const TestProviderConnectionModal: React.FC<TestProviderConnectionModalProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const { fetch } = useAppContext();
  const proxyFetch = fetch.proxyFetch;

  const [providers, setProviders] = React.useState<OIDCProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = React.useState<string>('');
  const [isTesting, setIsTesting] = React.useState(false);
  const [validationResult, setValidationResult] = React.useState<ProviderValidationResult | null>(null);
  const [error, setError] = React.useState<string>();
  const [isLoadingProviders, setIsLoadingProviders] = React.useState(true);

  // Fetch providers on mount
  React.useEffect(() => {
    const fetchProviders = async () => {
      try {
        const response = await proxyFetch('oidcproviders', { method: 'GET' });
        if (!response.ok) {
          throw new Error(`Failed to fetch providers: ${response.statusText}`);
        }
        const data = (await response.json()) as { items: OIDCProvider[] };

        setProviders(data.items);
        setSelectedProvider(data.items[0].metadata.name);
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
      const response = await proxyFetch(`oidcproviders/${selectedProvider}/test`, {
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
                          label={`${provider.metadata.name} (${provider.spec.type})`}
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
                    <StackItem>
                      <Title headingLevel="h3" size="md">
                        {t('Validation Results')}
                      </Title>
                    </StackItem>

                    {/* Summary */}
                    <StackItem>
                      {validationResult.summary.errorFields === 0 ? (
                        <Alert
                          isInline
                          variant={validationResult.summary.warningFields > 0 ? 'warning' : 'success'}
                          title={
                            validationResult.summary.warningFields > 0
                              ? t('Valid with warnings')
                              : t('Configuration is valid')
                          }
                        >
                          <Stack hasGutter>
                            <StackItem>
                              {t('{{validFields}} of {{totalFields}} fields validated successfully', {
                                validFields: validationResult.summary.validFields,
                                totalFields: validationResult.summary.totalFields,
                              })}
                            </StackItem>
                            {validationResult.summary.warningFields > 0 && (
                              <StackItem>
                                {t('{{warningFields}} field(s) have warnings', {
                                  warningFields: validationResult.summary.warningFields,
                                })}
                              </StackItem>
                            )}
                            {validationResult.summary.nextSteps && validationResult.summary.nextSteps.length > 0 && (
                              <StackItem>
                                <strong>{t('Next steps:')}</strong>
                                <List isPlain>
                                  {validationResult.summary.nextSteps.map((step, idx) => (
                                    <ListItem key={idx}>{step}</ListItem>
                                  ))}
                                </List>
                              </StackItem>
                            )}
                          </Stack>
                        </Alert>
                      ) : (
                        <Alert isInline variant="danger" title={t('Configuration is invalid')}>
                          <Stack hasGutter>
                            <StackItem>
                              {t('{{errorFields}} field(s) have errors', {
                                errorFields: validationResult.summary.errorFields,
                              })}
                            </StackItem>
                            {validationResult.summary.warningFields > 0 && (
                              <StackItem>
                                {t('{{warningFields}} field(s) have warnings', {
                                  warningFields: validationResult.summary.warningFields,
                                })}
                              </StackItem>
                            )}
                            <StackItem>
                              {t('{{validFields}} of {{totalFields}} fields are valid', {
                                validFields: validationResult.summary.validFields,
                                totalFields: validationResult.summary.totalFields,
                              })}
                            </StackItem>
                            {validationResult.summary.nextSteps && validationResult.summary.nextSteps.length > 0 && (
                              <StackItem>
                                <strong>{t('Next steps:')}</strong>
                                <List isPlain>
                                  {validationResult.summary.nextSteps.map((step, idx) => (
                                    <ListItem key={idx}>{step}</ListItem>
                                  ))}
                                </List>
                              </StackItem>
                            )}
                          </Stack>
                        </Alert>
                      )}
                    </StackItem>

                    {/* Common Fields */}
                    <StackItem>
                      <Title headingLevel="h4" size={TitleSizes.md}>
                        {t('Common Fields')}
                      </Title>
                      <DescriptionList isHorizontal>
                        <FieldValidationDisplay label={t('Client ID')} field={validationResult.clientId} />
                        <FieldValidationDisplay label={t('Username Claim')} field={validationResult.usernameClaim} />
                      </DescriptionList>
                    </StackItem>

                    {/* OIDC Discovery */}
                    {validationResult.issuer && (
                      <>
                        <StackItem>
                          <Alert variant="info" isInline title={t('OIDC Provider')}>
                            {t(
                              'OIDC providers use automatic discovery. Endpoints are fetched from the issuer URL and validated.',
                            )}
                          </Alert>
                        </StackItem>
                        <StackItem>
                          <Title headingLevel="h4" size={TitleSizes.md}>
                            {t('OIDC Configuration')}
                          </Title>
                          <DescriptionList isHorizontal>
                            <FieldValidationDisplay label={t('Issuer url')} field={validationResult.issuer} />
                          </DescriptionList>
                        </StackItem>
                      </>
                    )}

                    {validationResult.oidcDiscovery && (
                      <StackItem>
                        <Title headingLevel="h4" size={TitleSizes.md}>
                          {t('Discovered Endpoints')}
                        </Title>
                        <DescriptionList isHorizontal>
                          <FieldValidationDisplay
                            label={t('Discovery url')}
                            field={validationResult.oidcDiscovery.discoveryUrl}
                          />
                          <FieldValidationDisplay
                            label={t('Authorization Endpoint')}
                            field={validationResult.oidcDiscovery.authorizationEndpoint}
                          />
                          <FieldValidationDisplay
                            label={t('Token Endpoint')}
                            field={validationResult.oidcDiscovery.tokenEndpoint}
                          />
                          <FieldValidationDisplay
                            label={t('UserInfo Endpoint')}
                            field={validationResult.oidcDiscovery.userInfoEndpoint}
                          />
                          <FieldValidationDisplay
                            label={t('End Session Endpoint')}
                            field={validationResult.oidcDiscovery.endSessionEndpoint}
                          />
                        </DescriptionList>
                      </StackItem>
                    )}

                    {/* OAuth2 Settings */}
                    {validationResult.oauth2Settings && (
                      <>
                        <StackItem>
                          <Alert variant="info" isInline title={t('OAuth2 Provider')}>
                            {t(
                              'OAuth2 providers require manual endpoint configuration. Each endpoint is validated for reachability and compatibility.',
                            )}
                          </Alert>
                        </StackItem>
                        <StackItem>
                          <Title headingLevel="h4" size={TitleSizes.md}>
                            {t('OAuth2 Settings')}
                          </Title>
                          <DescriptionList isHorizontal>
                            <FieldValidationDisplay
                              label={t('Authorization Endpoint')}
                              field={validationResult.oauth2Settings.authorizationEndpoint}
                            />
                            <FieldValidationDisplay
                              label={t('Token Endpoint')}
                              field={validationResult.oauth2Settings.tokenEndpoint}
                            />
                            <FieldValidationDisplay
                              label={t('UserInfo Endpoint')}
                              field={validationResult.oauth2Settings.userInfoEndpoint}
                            />
                            <FieldValidationDisplay
                              label={t('End Session Endpoint')}
                              field={validationResult.oauth2Settings.endSessionEndpoint}
                            />
                            <FieldValidationDisplay
                              label={t('Scopes')}
                              field={validationResult.oauth2Settings.scopes}
                            />
                          </DescriptionList>
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
