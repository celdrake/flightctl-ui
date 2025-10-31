import * as React from 'react';
import {
  Alert,
  Button,
  CodeBlock,
  CodeBlockCode,
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
import { FormGroupWithHelperText } from '../common/WithHelperText';

type TokenLoginFormProps = {
  provider: AuthProviderInfo;
  onBack?: VoidFunction;
};

const TokenLoginForm = ({ provider, onBack }: TokenLoginFormProps) => {
  const { t } = useTranslation();
  const [token, setToken] = React.useState('');
  const [validationError, setValidationError] = React.useState<string>('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string>();
  const { proxyFetch } = useFetch();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    setSubmitError(undefined);

    const postToken = async () => {
      const response = await proxyFetch('login/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, provider: provider.name }),
      });
      const expiration = response as { expiresIn?: number };

      if (expiration.expiresIn) {
        const now = nowInSeconds();
        localStorage.setItem('expiration', `${now + expiration.expiresIn}`);
      }
      window.location.href = '/';
    };

    try {
      void postToken();
    } catch (err) {
      setSubmitError(getErrorMessage(err));
    } finally {
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
              {t('Login with {{ providerName }}', { providerName: provider.displayName || provider.name })}
            </Title>
          </StackItem>
          {submitError && (
            <StackItem>
              <Alert variant="danger" title={t('Authentication failed')} isInline>
                {submitError}
              </Alert>
            </StackItem>
          )}

          <StackItem>
            <FlightCtlForm>
              <FormGroupWithHelperText
                label={t('Access Token')}
                content={
                  <div>
                    <p className="pf-v5-u-mb-md">{t('Create a Kubernetes service account token using kubectl:')}</p>
                    <CodeBlock>
                      <CodeBlockCode>
                        {`# Create a service account
kubectl create serviceaccount <username> -n default

# Create a token for the service account
kubectl create token <username> -n <namespace> --duration=24h`}
                      </CodeBlockCode>
                    </CodeBlock>
                  </div>
                }
                isRequired
              >
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
              </FormGroupWithHelperText>

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
