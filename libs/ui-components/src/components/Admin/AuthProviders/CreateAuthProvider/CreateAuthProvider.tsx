import * as React from 'react';
import {
  Alert,
  Breadcrumb,
  BreadcrumbItem,
  Bullseye,
  PageSection,
  PageSectionVariants,
  Spinner,
  Stack,
  StackItem,
  Title,
} from '@patternfly/react-core';

import { AuthProvider } from '@flightctl/types';
import { useTranslation } from '../../../../hooks/useTranslation';
import { useFetch } from '../../../../hooks/useFetch';
import { Link, ROUTE, useNavigate } from '../../../../hooks/useNavigate';
import { useAppContext } from '../../../../hooks/useAppContext';
import { useAccessReview } from '../../../../hooks/useAccessReview';
import { RESOURCE, VERB } from '../../../../types/rbac';
import { getErrorMessage } from '../../../../utils/error';
import PageWithPermissions from '../../../common/PageWithPermissions';
import CreateAuthProviderForm from './CreateAuthProviderForm';

const CreateAuthProvider = () => {
  const { t } = useTranslation();
  const {
    router: { useParams },
  } = useAppContext();
  const { providerId } = useParams<{ providerId: string }>();

  const { get } = useFetch();
  const [error, setError] = React.useState<string>();
  const [isLoading, setIsLoading] = React.useState(!!providerId);
  const [providerDetails, setProviderDetails] = React.useState<AuthProvider>();
  const navigate = useNavigate();

  React.useEffect(() => {
    const fetchProvider = async () => {
      setIsLoading(true);
      try {
        const provider = await get<AuthProvider>(`authproviders/${providerId}`);
        setProviderDetails(provider);
      } catch (e) {
        setError(getErrorMessage(e));
      } finally {
        setIsLoading(false);
      }
    };
    if (providerId) {
      void fetchProvider();
    }
  }, [get, providerId]);

  let content: React.ReactNode;

  if (error) {
    content = (
      <Alert isInline variant="danger" title={t('An error occurred')}>
        <div>
          {t('Failed to retrieve authentication provider details')}: {error}
        </div>
      </Alert>
    );
  } else if (isLoading) {
    content = (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );
  } else {
    content = (
      <CreateAuthProviderForm
        onClose={() => {
          //CELIA-WIP DETERMINE
          navigate(-1);
        }}
        onSuccess={(provider) => {
          navigate({ route: ROUTE.AUTH_PROVIDER_DETAILS, postfix: provider.metadata.name });
        }}
        authProvider={providerDetails}
      />
    );
  }

  // CELIA-WIP BREADCRUMB

  const title = providerId ? t('Edit authentication provider') : t('Create authentication provider');

  return (
    <PageSection variant={PageSectionVariants.light}>
      <Stack hasGutter>
        <StackItem>
          <Breadcrumb>
            <BreadcrumbItem>
              <Link to={ROUTE.AUTH_PROVIDERS}>{t('Authentication providers')}</Link>
            </BreadcrumbItem>
            <BreadcrumbItem isActive>{title}</BreadcrumbItem>
          </Breadcrumb>
          <Title headingLevel="h1" size="3xl">
            {title}
          </Title>
        </StackItem>
        <StackItem>{content}</StackItem>
      </Stack>
    </PageSection>
  );
};

const CreateAuthProviderWithPermissions = () => {
  const [allowed, loading] = useAccessReview(RESOURCE.AUTH_PROVIDERS, VERB.CREATE);
  return (
    <PageWithPermissions allowed={allowed} loading={loading}>
      <CreateAuthProvider />
    </PageWithPermissions>
  );
};

export default CreateAuthProviderWithPermissions;
