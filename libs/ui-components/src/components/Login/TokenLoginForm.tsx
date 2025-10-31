import * as React from 'react';
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  FormGroup,
  FormHelperText,
  FormSection,
  HelperText,
  HelperTextItem,
  Stack,
  StackItem,
  Text,
  TextArea,
  TextContent,
  TextVariants,
  Title,
} from '@patternfly/react-core';
import ArrowLeftIcon from '@patternfly/react-icons/dist/js/icons/arrow-left-icon';
import { AuthProviderInfo } from '@flightctl/types';

import { useTranslation } from '../../hooks/useTranslation';
import { getErrorMessage } from '../../utils/error';
import { useFetch } from '../../hooks/useFetch';
import { isValidJwtTokenFormat, nowInSeconds } from '../../utils/k8sProvider';
import FlightCtlForm from '../form/FlightCtlForm';

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
    <Card isLarge>
      {onBack && (
        <CardHeader>
          <Button
            variant="link"
            className="pf-v5-u-size-sm"
            onClick={onBack}
            isInline
            isDisabled={isSubmitting}
            icon={<ArrowLeftIcon />}
          >
            {t('Back to login options')}
          </Button>
        </CardHeader>
      )}
      <CardBody>
        <Stack hasGutter style={{ '--pf-v5-l-stack--m-gutter--Gap': '1.5rem' } as React.CSSProperties}>
          <StackItem>
            <Title headingLevel="h2" size="xl">
              {t('Enter your Kubernetes token')}
            </Title>
          </StackItem>

          <StackItem>
            <TextContent>
              <Text>{t('Enter your Kubernetes service account token to authenticate with the cluster.')}</Text>
              <Text component={TextVariants.small}>
                {t('You can find this token in your Kubernetes service account credentials.')}
              </Text>
            </TextContent>
          </StackItem>
          <StackItem>
            <FlightCtlForm>
              <FormGroup label={t('Service account token')} isRequired>
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
                {validationError && (
                  <FormHelperText>
                    <HelperText>
                      <HelperTextItem variant="error">{validationError}</HelperTextItem>
                    </HelperText>
                  </FormHelperText>
                )}
              </FormGroup>

              <Alert variant="warning" title={t('Keep your token secure')} isInline>
                {t(
                  'Never share your service account token. It provides full access to your Kubernetes cluster resources.',
                )}
              </Alert>

              {submitError && (
                <FormSection>
                  <Alert variant="danger" title={t('Authentication failed')} isInline>
                    {submitError}
                  </Alert>
                </FormSection>
              )}
            </FlightCtlForm>
          </StackItem>
        </Stack>
      </CardBody>
      <CardFooter>
        <Button
          variant="primary"
          isDisabled={!token || !!validationError || isSubmitting}
          isLoading={isSubmitting}
          onClick={handleSubmit}
        >
          {isSubmitting ? t('Authenticating...') : t('Login')}
        </Button>
        {onBack && (
          <Button variant="link" onClick={onBack} isDisabled={isSubmitting}>
            {t('Cancel')}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default TokenLoginForm;
