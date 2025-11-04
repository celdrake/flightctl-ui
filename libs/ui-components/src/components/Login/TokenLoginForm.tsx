import * as React from 'react';
import {
  Alert,
  Button,
  FormGroup,
  FormHelperText,
  Grid,
  GridItem,
  HelperText,
  HelperTextItem,
  Stack,
  StackItem,
  TextArea,
  Title,
} from '@patternfly/react-core';
import ArrowLeftIcon from '@patternfly/react-icons/dist/js/icons/arrow-left-icon';
import { AuthProviderInfo } from '@flightctl/types';

import { useTranslation } from '../../hooks/useTranslation';
import { getErrorMessage } from '../../utils/error';
import { useFetch } from '../../hooks/useFetch';
import { isValidJwtTokenFormat, nowInSeconds } from '../../utils/k8sProvider';
import FlightCtlForm from '../form/FlightCtlForm';
import FlightCtlActionGroup from '../form/FlightCtlActionGroup';

type TokenLoginFormProps = {
  provider: AuthProviderInfo;
  onBack?: VoidFunction;
};

const TokenLoginForm = ({ provider, onBack }: TokenLoginFormProps) => {
  const { t } = useTranslation();
  const { proxyFetch } = useFetch();
  const [token, setToken] = React.useState('');
  const [validationError, setValidationError] = React.useState<string>('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    setSubmitError(undefined);

    try {
      const response = await proxyFetch('login/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, provider: provider.name }),
      });

      if (!response.ok) {
        let errorMessage: string | undefined;
        try {
          const errorData = (await response.json()) as { error?: string };
          if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch {
          // If parsing fails, use the generic error message
        } finally {
          setSubmitError(errorMessage || t('Access token is not valid, please provide a valid token'));
          setIsSubmitting(false);
        }
        return;
      }

      const data = (await response.json()) as { expiresIn?: number };
      if (data.expiresIn) {
        const now = nowInSeconds();
        localStorage.setItem('expiration', `${now + data.expiresIn}`);
      }
      window.location.href = '/';
    } catch (err) {
      setSubmitError(getErrorMessage(err));
      setIsSubmitting(false);
    }
  };

  return (
    <Grid>
      {onBack && (
        <GridItem span={12}>
          <Button
            variant="link"
            className="pf-v5-u-size-sm"
            onClick={onBack}
            isDisabled={isSubmitting}
            icon={<ArrowLeftIcon />}
          >
            {t('Select a different authentication provider')}
          </Button>
        </GridItem>
      )}

      <GridItem span={12}>
        <Stack hasGutter>
          <StackItem>
            <Title headingLevel="h2" size="xl">
              {t('Log in with {{ providerName }}', { providerName: provider.displayName || provider.name })}
            </Title>
          </StackItem>

          <StackItem>
            <FlightCtlForm>
              <FormGroup label={t('Access token')} isRequired>
                <TextArea
                  id="accessToken"
                  value={token}
                  onChange={(_event, value) => {
                    const tokenVal = value.trim();
                    if (tokenVal && !isValidJwtTokenFormat(tokenVal)) {
                      setValidationError(
                        t('Invalid token format. Expected a JWT token with format: header.payload.signature'),
                      );
                    } else {
                      setValidationError('');
                    }
                    if (submitError) {
                      setSubmitError(undefined);
                    }
                    setToken(tokenVal);
                  }}
                  placeholder={t('Enter your Kubernetes token...')}
                  rows={10}
                  isRequired
                  isDisabled={isSubmitting}
                  autoFocus
                  validated={validationError ? 'error' : 'default'}
                />
                <FormHelperText>
                  <HelperText>
                    <HelperTextItem variant={validationError ? 'error' : 'default'}>
                      {validationError || t('Paste your Kubernetes access token here')}
                    </HelperTextItem>
                  </HelperText>
                </FormHelperText>
              </FormGroup>

              {submitError && (
                <StackItem>
                  <Alert variant="danger" title={t('Authentication failed')} isInline>
                    {submitError}
                  </Alert>
                </StackItem>
              )}
              <FlightCtlActionGroup>
                <Button
                  variant="primary"
                  isDisabled={!token || !!validationError || isSubmitting}
                  isLoading={isSubmitting}
                  onClick={handleSubmit}
                  style={{ marginRight: '8px' }}
                >
                  {isSubmitting ? t('Authenticating...') : t('Login')}
                </Button>
              </FlightCtlActionGroup>
            </FlightCtlForm>
          </StackItem>
        </Stack>
      </GridItem>
    </Grid>
  );
};

export default TokenLoginForm;
