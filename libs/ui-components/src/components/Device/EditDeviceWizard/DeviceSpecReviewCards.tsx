import * as React from 'react';
import {
  Alert,
  Card,
  CardBody,
  CardTitle,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Divider,
  Label,
  Spinner,
  Stack,
  StackItem,
} from '@patternfly/react-core';
import { useFormikContext } from 'formik';

import {
  type AppForm,
  type DeviceSpecConfigFormValues,
  type EditDeviceFormValues,
  type FleetFormValues,
  UpdateMode,
  isCatalogAppForm,
} from '../../../types/deviceSpec';
import { useTranslation } from '../../../hooks/useTranslation';
import LabelsView from '../../common/LabelsView';
import { toAPILabel } from '../../../utils/labels';
import { getErrorMessage } from '../../../utils/error';
import { getAppTypeLabel } from '../../../utils/apps';
import { RepositorySourcePlainList } from '../../Repository/RepositoryDetails/RepositorySourceList';
import CatalogRefReviewDetails from '../../CatalogRef/CatalogRefReviewDetails';
import { getApiConfig } from './deviceSpecUtils';
import { useSystemImage } from './useSystemImage';
import ReviewTrackedSystemdServices from './steps/ReviewTrackedSystemdServices';
import { ReviewUpdateDisruptionBudget, ReviewUpdateRolloutPolicy } from './steps/ReviewUpdatePolicy';

// CELIA-WIP: Visual parity without ported CSS — review card title weight and spacing may differ from design.
type DeviceSpecReviewCardsProps = {
  variant: 'fleet' | 'device';
  showUpdateStatus?: boolean;
  error?: unknown;
};

const ReviewCard = ({ title, children }: React.PropsWithChildren<{ title: string }>) => (
  <StackItem>
    <Card>
      <CardTitle>{title}</CardTitle>
      <CardBody>{children}</CardBody>
    </Card>
  </StackItem>
);

const ManualApplicationReviewDetails = ({ app }: { app: AppForm }) => {
  const { t } = useTranslation();
  const name = app.name || t('Unnamed application');
  const imageRef = 'imageSpec' in app && app.imageSpec?.image ? app.imageSpec.image : undefined;

  return (
    <DescriptionList isHorizontal isCompact>
      <DescriptionListGroup>
        <DescriptionListTerm>{t('Name')}</DescriptionListTerm>
        <DescriptionListDescription>{name}</DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>{t('Type')}</DescriptionListTerm>
        <DescriptionListDescription>
          <Label isCompact variant="filled" color="purple">
            {getAppTypeLabel(app.appType, t)}
          </Label>
        </DescriptionListDescription>
      </DescriptionListGroup>
      {imageRef && (
        <DescriptionListGroup>
          <DescriptionListTerm>{t('Image reference')}</DescriptionListTerm>
          <DescriptionListDescription>{imageRef}</DescriptionListDescription>
        </DescriptionListGroup>
      )}
    </DescriptionList>
  );
};

const SystemImageReviewCard = ({
  values,
  showUpdateStatus,
}: {
  values: DeviceSpecConfigFormValues;
  showUpdateStatus?: boolean;
}) => {
  const { t } = useTranslation();
  const imageResult = useSystemImage(values.osSpec);
  const catalogItemRef = values.osSpec?.catalogItemRef;

  if (!values.osSpec?.image && !catalogItemRef) {
    return null;
  }

  let content: React.ReactNode;
  if (catalogItemRef) {
    content = <CatalogRefReviewDetails catalogItemRef={catalogItemRef} showUpdateStatus={showUpdateStatus} />;
  } else if (imageResult.isLoading) {
    content = <Spinner size="sm" />;
  } else {
    content = (
      <DescriptionList isHorizontal isCompact>
        <DescriptionListGroup>
          <DescriptionListTerm>{t('Image reference')}</DescriptionListTerm>
          <DescriptionListDescription>{imageResult.imageUri || values.osSpec?.image}</DescriptionListDescription>
        </DescriptionListGroup>
      </DescriptionList>
    );
  }

  return <ReviewCard title={t('System image')}>{content}</ReviewCard>;
};

const ApplicationWorkloadsReviewCard = ({
  apps,
  showUpdateStatus,
}: {
  apps: AppForm[];
  showUpdateStatus?: boolean;
}) => {
  const { t } = useTranslation();

  if (apps.length === 0) {
    return null;
  }

  return (
    <ReviewCard title={t('Application workloads')}>
      <Stack hasGutter>
        {apps.map((app, index) => {
          const catalogItemRef =
            'imageSpec' in app && app.imageSpec?.catalogItemRef ? app.imageSpec.catalogItemRef : undefined;

          return (
            <StackItem key={`review-app-${index}`}>
              {index > 0 && <Divider />}
              {isCatalogAppForm(app) && catalogItemRef ? (
                <CatalogRefReviewDetails
                  catalogItemRef={catalogItemRef}
                  name={app.name}
                  showUpdateStatus={showUpdateStatus}
                  isTemplateManaged
                />
              ) : (
                <ManualApplicationReviewDetails app={app} />
              )}
            </StackItem>
          );
        })}
      </Stack>
    </ReviewCard>
  );
};

const DeviceSpecReviewCards = ({ variant, showUpdateStatus, error }: DeviceSpecReviewCardsProps) => {
  const { t } = useTranslation();
  const isFleet = variant === 'fleet';
  const { values } = useFormikContext<FleetFormValues | EditDeviceFormValues>();
  const fleetValues = isFleet ? (values as FleetFormValues) : undefined;
  const deviceValues = !isFleet ? (values as EditDeviceFormValues) : undefined;

  return (
    <Stack hasGutter>
      <ReviewCard title={t('General information')}>
        <DescriptionList isHorizontal isCompact>
          {isFleet && fleetValues ? (
            <>
              <DescriptionListGroup>
                <DescriptionListTerm>{t('Fleet name')}</DescriptionListTerm>
                <DescriptionListDescription>{fleetValues.name}</DescriptionListDescription>
              </DescriptionListGroup>
              {fleetValues.fleetLabels.length > 0 && (
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Fleet labels')}</DescriptionListTerm>
                  <DescriptionListDescription>
                    <LabelsView prefix="fleet" labels={toAPILabel(fleetValues.fleetLabels)} />
                  </DescriptionListDescription>
                </DescriptionListGroup>
              )}
              {fleetValues.labels.length > 0 && (
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Device selector')}</DescriptionListTerm>
                  <DescriptionListDescription>
                    <LabelsView prefix="device" labels={toAPILabel(fleetValues.labels)} />
                  </DescriptionListDescription>
                </DescriptionListGroup>
              )}
            </>
          ) : deviceValues ? (
            <>
              <DescriptionListGroup>
                <DescriptionListTerm>{t('Device alias')}</DescriptionListTerm>
                <DescriptionListDescription>{deviceValues.deviceAlias || t('Untitled')}</DescriptionListDescription>
              </DescriptionListGroup>
              {deviceValues.labels.length > 0 && (
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Device labels')}</DescriptionListTerm>
                  <DescriptionListDescription>
                    <LabelsView prefix="device" labels={toAPILabel(deviceValues.labels)} />
                  </DescriptionListDescription>
                </DescriptionListGroup>
              )}
              {deviceValues.fleetMatch && (
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Device fleet')}</DescriptionListTerm>
                  <DescriptionListDescription>{deviceValues.fleetMatch}</DescriptionListDescription>
                </DescriptionListGroup>
              )}
            </>
          ) : null}
        </DescriptionList>
      </ReviewCard>

      <SystemImageReviewCard values={values} showUpdateStatus={showUpdateStatus} />

      {values.configTemplates.length > 0 && (
        <ReviewCard title={t('Configurations')}>
          <RepositorySourcePlainList configs={values.configTemplates.map(getApiConfig)} />
        </ReviewCard>
      )}

      <ApplicationWorkloadsReviewCard apps={values.applications} showUpdateStatus={showUpdateStatus} />

      {values.systemdUnits.length > 0 && (
        <ReviewCard title={t('Tracked systemd services')}>
          <ReviewTrackedSystemdServices systemdUnits={values.systemdUnits} />
        </ReviewCard>
      )}

      {isFleet &&
        fleetValues &&
        fleetValues.updateMode === UpdateMode.Customized &&
        (fleetValues.rolloutPolicy?.isCustomized || fleetValues.disruptionBudget?.isCustomized) && (
          <ReviewCard title={t('Update policy')}>
            <DescriptionList isHorizontal isCompact>
              {fleetValues.rolloutPolicy?.isCustomized && (
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Rollout policy')}</DescriptionListTerm>
                  <DescriptionListDescription>
                    <ReviewUpdateRolloutPolicy rolloutPolicy={fleetValues.rolloutPolicy} />
                  </DescriptionListDescription>
                </DescriptionListGroup>
              )}
              {fleetValues.disruptionBudget?.isCustomized && (
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Disruption budget')}</DescriptionListTerm>
                  <DescriptionListDescription>
                    <ReviewUpdateDisruptionBudget disruptionBudget={fleetValues.disruptionBudget} />
                  </DescriptionListDescription>
                </DescriptionListGroup>
              )}
            </DescriptionList>
          </ReviewCard>
        )}

      {!!error && (
        <StackItem>
          <Alert isInline variant="danger" title={t('An error occurred')}>
            {getErrorMessage(error)}
          </Alert>
        </StackItem>
      )}
    </Stack>
  );
};

export default DeviceSpecReviewCards;
