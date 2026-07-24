import * as React from 'react';
import {
  Alert,
  Breadcrumb,
  BreadcrumbItem,
  Button,
  Content,
  ContentVariants,
  EmptyState,
  PageSection,
  Spinner,
  Stack,
  StackItem,
  Title,
} from '@patternfly/react-core';
import { CatalogItemCategory } from '@flightctl/types/alpha';
import { ApplicationProviderSpec, Device, DeviceOsSpec, Fleet, PatchRequest } from '@flightctl/types';
import { load } from 'js-yaml';

import ErrorBoundary from '../../common/ErrorBoundary';
import { getErrorMessage } from '../../../utils/error';
import { buildCatalogItemRef, getAppCatalogItemRef, getAppPatches, getCurrentVersion } from '../../../utils/catalog';
import { useAppContext } from '../../../hooks/useAppContext';
import { useFetch } from '../../../hooks/useFetch';
import { Link, ROUTE, useNavigate } from '../../../hooks/useNavigate';
import { useTranslation } from '../../../hooks/useTranslation';
import { useFindCatalogItem } from '../useCatalogs';
import { useFetchPeriodically } from '../../../hooks/useFetchPeriodically';
import { UpdateSuccessPageContent } from '../InstallWizard/UpdateSuccessPage';
import { usePermissionsContext } from '../../common/PermissionsContext';
import PageWithPermissions from '../../common/PageWithPermissions';
import { RESOURCE, VERB } from '../../../types/rbac';
import { appendJSONPatch } from '../../../utils/patch';
import EditOsWizard from './EditOsWizard';
import EditAppWizard from './EditAppWizard';

type EditWizardProps = {
  specPath: string;
  currentLabels: Record<string, string> | undefined;
  currentOsSpec: DeviceOsSpec | undefined;
  currentApps: ApplicationProviderSpec[] | undefined;
  loading: boolean;
  error: unknown;
  resourceId: string;
  isDevice: boolean;
  resourceName?: string;
};

const EditWizard = ({
  specPath,
  currentLabels,
  currentOsSpec,
  currentApps,
  error,
  loading,
  resourceId,
  isDevice,
  resourceName,
}: EditWizardProps) => {
  const [isSuccess, setIsSuccess] = React.useState(false);
  const { t } = useTranslation();
  const { patch } = useFetch();
  const {
    router: { useParams },
  } = useAppContext();
  const { catalogId, itemId } = useParams() as { catalogId: string; itemId: string };

  const [catalogItem, catalogItemLoading, catalogItemErr] = useFindCatalogItem(catalogId, itemId);

  const {
    router: { useSearchParams },
  } = useAppContext();
  const [searchParams] = useSearchParams();
  const appName = searchParams.get('appName') || '';
  const version = searchParams.get('version') || '';
  const channel = searchParams.get('channel') || '';
  const navigate = useNavigate();

  let content: React.ReactNode;
  if (catalogItemErr) {
    content = (
      <Alert isInline variant="danger" title={t('Failed to load catalog item')}>
        {getErrorMessage(catalogItemErr)}
      </Alert>
    );
  } else if (error) {
    content = (
      <Alert isInline variant="danger" title={isDevice ? t('Failed to load device') : t('Failed to load fleet')}>
        {getErrorMessage(error)}
      </Alert>
    );
  } else if (catalogItemLoading || loading) {
    content = <EmptyState titleText={t('Loading')} headingLevel="h4" icon={Spinner} />;
  } else if (catalogItem?.spec.category === CatalogItemCategory.CatalogItemCategorySystem) {
    const osRef = currentOsSpec?.catalogItemRef;
    const currentVersion = getCurrentVersion(catalogItem, version, osRef);
    const currentChannel = channel || osRef?.channel || '';
    if (!currentVersion) {
      content = <Alert isInline variant="danger" title={t('Failed to find operating system')} />;
    } else {
      content = (
        <EditOsWizard
          isEdit={!version}
          catalogItem={catalogItem}
          currentChannel={currentChannel}
          currentVersion={currentVersion}
          currentLabels={currentLabels}
          version={version}
          channel={channel}
          onUpdate={async (catalogItemVersion, values) => {
            const allPatches: PatchRequest = [];
            appendJSONPatch({
              patches: allPatches,
              path: `${specPath}spec/os`,
              newValue: {
                catalogItemRef: buildCatalogItemRef({ catalogItem, catalogItemVersion, channel: values.channel }),
              },
              originalValue: currentOsSpec,
            });
            if (allPatches.length > 0) {
              await patch(`${isDevice ? 'devices' : 'fleets'}/${resourceId}`, allPatches);
            }
            setIsSuccess(true);
          }}
        />
      );
    }
  } else if (catalogItem?.spec.category === CatalogItemCategory.CatalogItemCategoryApplication) {
    const appSpec = appName ? currentApps?.find((app) => app.name === appName) : undefined;

    if (!!appName && !appSpec) {
      content = <Alert isInline variant="danger" title={t('Failed to find application')} />;
    } else {
      const appRef = appSpec ? getAppCatalogItemRef(appSpec) : undefined;
      const currentVersion = getCurrentVersion(catalogItem, version, appRef);
      const currentChannel = appRef?.channel || channel || '';

      if (!currentVersion) {
        content = <Alert isInline variant="danger" title={t('Failed to find application')} />;
      } else {
        content = (
          <EditAppWizard
            catalogItem={catalogItem}
            appSpec={appName ? appSpec : undefined}
            currentApps={currentApps}
            currentLabels={currentLabels}
            currentVersion={currentVersion}
            currentChannel={currentChannel}
            version={version}
            channel={channel}
            onUpdate={async (catalogItemVersion, values) => {
              const allPatches = getAppPatches({
                appName: values.appName,
                catalogItem,
                catalogItemVersion,
                channel: values.channel,
                currentApps,
                currentLabels,
                formValues:
                  values.configureVia === 'editor'
                    ? (load(values.editorContent) as Record<string, unknown>)
                    : values.formValues,
                selectedAssets: values.selectedAssets,
                specPath,
              });
              await patch(`${isDevice ? 'devices' : 'fleets'}/${resourceId}`, allPatches);
              setIsSuccess(true);
            }}
          />
        );
      }
    }
  }

  return (
    <>
      <PageSection hasBodyWrapper={false} type="breadcrumb">
        <Breadcrumb>
          <BreadcrumbItem>
            <Link to={isDevice ? ROUTE.DEVICES : ROUTE.FLEETS}>{isDevice ? t('Devices') : t('Fleets')}</Link>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <Link to={{ route: isDevice ? ROUTE.DEVICE_DETAILS : ROUTE.FLEET_DETAILS, postfix: resourceId }}>
              {resourceName || resourceId}
            </Link>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <Link
              to={{ route: isDevice ? ROUTE.DEVICE_DETAILS : ROUTE.FLEET_DETAILS, postfix: `${resourceId}/catalog` }}
            >
              {t('Software catalog')}
            </Link>
          </BreadcrumbItem>
          <BreadcrumbItem
            isActive
          >{`${catalogItem?.spec.displayName || itemId}${appName ? ` (${appName})` : ''}`}</BreadcrumbItem>
        </Breadcrumb>
      </PageSection>
      <PageSection hasBodyWrapper={false}>
        <Stack>
          <StackItem>
            <Title headingLevel="h1" size="3xl">
              {version
                ? t('Deploy {{ name }}', { name: catalogItem?.spec.displayName || itemId })
                : t('Edit {{name}}', { name: catalogItem?.spec.displayName || itemId })}
            </Title>
          </StackItem>
          <StackItem>
            {catalogItem?.spec.shortDescription && (
              <Content component={ContentVariants.small}>{catalogItem.spec.shortDescription}</Content>
            )}
          </StackItem>
        </Stack>
      </PageSection>
      <PageSection hasBodyWrapper={false} type="wizard">
        <ErrorBoundary>
          {isSuccess ? (
            <UpdateSuccessPageContent isDevice={isDevice}>
              <Button
                variant="link"
                onClick={() => {
                  navigate({
                    route: isDevice ? ROUTE.DEVICE_DETAILS : ROUTE.FLEET_DETAILS,
                    postfix: `${resourceId}/catalog`,
                  });
                }}
              >
                {isDevice ? t('Return to device catalog') : t('Return to fleet catalog')}
              </Button>
            </UpdateSuccessPageContent>
          ) : (
            content
          )}
        </ErrorBoundary>
      </PageSection>
    </>
  );
};

const editWizardPermissions = [{ kind: RESOURCE.CATALOG_ITEM, verb: VERB.GET }];

export const EditDeviceWizard = () => {
  const {
    router: { useParams },
  } = useAppContext();
  const { deviceId } = useParams() as { deviceId: string };
  const { checkPermissions, loading: permissionsLoading } = usePermissionsContext();
  const [canGetItem] = checkPermissions(editWizardPermissions);

  const [device, loading, error] = useFetchPeriodically<Required<Device>>({
    endpoint: `devices/${deviceId}`,
  });
  return (
    <PageWithPermissions allowed={canGetItem} loading={permissionsLoading}>
      <EditWizard
        currentApps={device?.spec.applications}
        currentLabels={device?.metadata.labels}
        currentOsSpec={device?.spec.os}
        error={error}
        loading={loading}
        specPath="/"
        resourceId={deviceId}
        resourceName={device?.metadata.labels?.alias}
        isDevice
      />
    </PageWithPermissions>
  );
};

export const EditFleetWizard = () => {
  const {
    router: { useParams },
  } = useAppContext();
  const params = useParams() as { fleetId: string };
  const { checkPermissions, loading: permissionsLoading } = usePermissionsContext();
  const [canGetItem] = checkPermissions(editWizardPermissions);

  const [fleet, loading, error] = useFetchPeriodically<Required<Fleet>>({
    endpoint: `fleets/${params.fleetId}`,
  });
  return (
    <PageWithPermissions allowed={canGetItem} loading={permissionsLoading}>
      <EditWizard
        currentApps={fleet?.spec.template.spec.applications}
        currentLabels={fleet?.metadata.labels}
        currentOsSpec={fleet?.spec.template.spec.os}
        error={error}
        loading={loading}
        specPath="/spec/template/"
        resourceId={params.fleetId}
        isDevice={false}
      />
    </PageWithPermissions>
  );
};
