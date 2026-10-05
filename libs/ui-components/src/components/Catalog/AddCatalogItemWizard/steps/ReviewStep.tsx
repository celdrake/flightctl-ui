import * as React from 'react';
import {
  Alert,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Flex,
  FlexItem,
  List,
  ListItem,
  Stack,
  StackItem,
  Title,
} from '@patternfly/react-core';
import { useFormikContext } from 'formik';

import { DeviceFeatureBoolean, type DeviceFeatures } from '@flightctl/types/alpha';
import { OsModeType } from '@flightctl/types';
import type { AddCatalogItemFormValues } from '../types';
import { useTranslation } from '../../../../hooks/useTranslation';
import { getErrorMessage } from '../../../../utils/error';
import { appTypeIds } from '../../useCatalogItems';
import { getArtifactLabel } from '../../../../utils/catalogTypes';
import { DeviceFeatureBooleanFormValue, deviceFeaturesFromApi } from '../../../../utils/catalogDeviceFeatures';

export const reviewStepId = 'review';

const addEnabledOrDisabledFeature = (
  enabledFeatures: string[],
  disabledFeatures: string[],
  feature: DeviceFeatureBooleanFormValue,
  label: string,
) => {
  if (feature === DeviceFeatureBoolean.DeviceFeatureBooleanTrue) {
    enabledFeatures.push(label);
  } else if (feature === DeviceFeatureBoolean.DeviceFeatureBooleanFalse) {
    disabledFeatures.push(label);
  }
};

// CELIA-WIP IMPLEMENT FOR REAL
const CatalogItemVersionFeatures = ({ deviceFeatures }: { deviceFeatures?: DeviceFeatures | null }) => {
  const { t } = useTranslation();
  const formFeatures = deviceFeaturesFromApi(deviceFeatures);
  console.log('%c deviceFeatures', 'color: blue; font-size:18px', deviceFeatures, 'vs', formFeatures);
  if (!formFeatures) {
    return t('No device features defined');
  }

  const enabledFeatures = [];
  const disabledFeatures = [];
  addEnabledOrDisabledFeature(enabledFeatures, disabledFeatures, formFeatures.gpuPresent, t('GPU'));
  addEnabledOrDisabledFeature(enabledFeatures, disabledFeatures, formFeatures.kvmEnabled, t('KVM'));
  if (formFeatures.osMode === OsModeType.OsModeImage) {
    enabledFeatures.push(t('Image mode OS'));
  } else if (formFeatures.osMode === OsModeType.OsModePackage) {
    disabledFeatures.push(t('Package mode OS'));
  }

  console.log('%c enabledFeatures', 'color: red; font-size:18px', enabledFeatures, 'vs', disabledFeatures);
  return (
    <Flex>
      <FlexItem>{t('Device features')}</FlexItem>
      {disabledFeatures.length > 0 && (
        <FlexItem>
          <span>
            {t('Features that must be absent:')} {disabledFeatures.join(', ')}
          </span>
        </FlexItem>
      )}

      {enabledFeatures.length > 0 && (
        <FlexItem>
          <span>
            {t('Features that must be present:')} {enabledFeatures.join(', ')}
          </span>
        </FlexItem>
      )}
    </Flex>
  );
};

const ReviewStep = ({ error, isEdit, isReadOnly }: { error: unknown; isEdit?: boolean; isReadOnly?: boolean }) => {
  const { t } = useTranslation();
  const { values } = useFormikContext<AddCatalogItemFormValues>();

  let reviewTitle: string;
  if (isReadOnly) {
    reviewTitle = t('Review');
  } else if (isEdit) {
    reviewTitle = t('Review and save');
  } else {
    reviewTitle = t('Review and create');
  }

  return (
    <Stack hasGutter>
      <StackItem>
        <Title headingLevel="h2" size="lg">
          {reviewTitle}
        </Title>
      </StackItem>
      <StackItem>
        <DescriptionList isHorizontal>
          <DescriptionListGroup>
            <DescriptionListTerm>{t('Catalog')}</DescriptionListTerm>
            <DescriptionListDescription>{values.catalog}</DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>{t('Name')}</DescriptionListTerm>
            <DescriptionListDescription>{values.name}</DescriptionListDescription>
          </DescriptionListGroup>
          {values.displayName && (
            <DescriptionListGroup>
              <DescriptionListTerm>{t('Display name')}</DescriptionListTerm>
              <DescriptionListDescription>{values.displayName}</DescriptionListDescription>
            </DescriptionListGroup>
          )}
          <DescriptionListGroup>
            <DescriptionListTerm>{t('Type')}</DescriptionListTerm>
            <DescriptionListDescription>{values.type}</DescriptionListDescription>
          </DescriptionListGroup>
          {values.type && appTypeIds.includes(values.type) && values.containerUri && (
            <DescriptionListGroup>
              <DescriptionListTerm>{t('Container image')}</DescriptionListTerm>
              <DescriptionListDescription>{values.containerUri}</DescriptionListDescription>
            </DescriptionListGroup>
          )}
          {values.type && !appTypeIds.includes(values.type) && values.artifacts.length > 0 && (
            <DescriptionListGroup>
              <DescriptionListTerm>{t('Artifacts')}</DescriptionListTerm>
              <DescriptionListDescription>
                <List isPlain>
                  {values.artifacts.map((a) => {
                    return <ListItem key={a.type}>{`${getArtifactLabel(t, a)} - ${a.uri}`}</ListItem>;
                  })}
                </List>
              </DescriptionListDescription>
            </DescriptionListGroup>
          )}
          {values.shortDescription && (
            <DescriptionListGroup>
              <DescriptionListTerm>{t('Short description')}</DescriptionListTerm>
              <DescriptionListDescription>{values.shortDescription}</DescriptionListDescription>
            </DescriptionListGroup>
          )}
          {values.provider && (
            <DescriptionListGroup>
              <DescriptionListTerm>{t('Provider')}</DescriptionListTerm>
              <DescriptionListDescription>{values.provider}</DescriptionListDescription>
            </DescriptionListGroup>
          )}
          {values.homepage && (
            <DescriptionListGroup>
              <DescriptionListTerm>{t('Homepage')}</DescriptionListTerm>
              <DescriptionListDescription>{values.homepage}</DescriptionListDescription>
            </DescriptionListGroup>
          )}
          {values.supportUrl && (
            <DescriptionListGroup>
              <DescriptionListTerm>{t('Support URL')}</DescriptionListTerm>
              <DescriptionListDescription>{values.supportUrl}</DescriptionListDescription>
            </DescriptionListGroup>
          )}
          {values.documentationUrl && (
            <DescriptionListGroup>
              <DescriptionListTerm>{t('Documentation URL')}</DescriptionListTerm>
              <DescriptionListDescription>{values.documentationUrl}</DescriptionListDescription>
            </DescriptionListGroup>
          )}
          {values.deprecated && (
            <DescriptionListGroup>
              <DescriptionListTerm>{t('Deprecated')}</DescriptionListTerm>
              <DescriptionListDescription>{values.deprecationMessage}</DescriptionListDescription>
            </DescriptionListGroup>
          )}

          {values.versions.map((v) => (
            <DescriptionListGroup key={v.version}>
              <DescriptionListTerm>{t('Version {{version}}', { version: v.version })}</DescriptionListTerm>
              <DescriptionListDescription>
                <CatalogItemVersionFeatures deviceFeatures={v.deviceFeatures} />
              </DescriptionListDescription>
            </DescriptionListGroup>
          ))}
        </DescriptionList>
      </StackItem>
      {!!error && (
        <StackItem>
          <Alert
            isInline
            variant="danger"
            title={isEdit ? t('Failed to save catalog item') : t('Failed to create catalog item')}
          >
            {getErrorMessage(error)}
          </Alert>
        </StackItem>
      )}
    </Stack>
  );
};

export default ReviewStep;
