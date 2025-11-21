import React from 'react';
import { Stack, StackItem } from '@patternfly/react-core';
import { TFunction } from 'react-i18next';

import { AppType } from '@flightctl/types';
import { useTranslation } from '../../../../hooks/useTranslation';
import {
  AppForm,
  getAppIdentifier,
  isComposeImageAppForm,
  isContainerAppForm,
  isQuadletImageAppForm,
} from '../../../../types/deviceSpec';

const getAppFormatLabel = (appType: AppType, t: TFunction) => {
  if (appType === AppType.AppTypeContainer) {
    return t('Single Container');
  }
  if (appType === AppType.AppTypeQuadlet) {
    return t('Quadlet');
  }
  return t('Compose');
};

const ReviewApplications = ({ apps }: { apps: AppForm[] }) => {
  const { t } = useTranslation();
  if (apps.length === 0) {
    return '-';
  }

  return (
    <Stack hasGutter>
      {apps.map((app, index) => {
        const isContainer = isContainerAppForm(app);
        const isImageApp = isQuadletImageAppForm(app) || isComposeImageAppForm(app);
        const formatType = getAppFormatLabel(app.appType, t);
        // Container apps don't show specType, just the app type
        const type = isContainer ? formatType : `${isImageApp ? t('Image based') : t('Inline')} - ${formatType}`;
        let name: string = '';
        if (isContainer) {
          name = app.name || (app.image ? `${t('Unnamed')} (${app.image})` : '');
        } else if (!isImageApp || app.name) {
          name = app.name as string;
        } else if (isImageApp && 'image' in app && app.image) {
          name = `${t('Unnamed')} (${app.image})`;
        }
        return (
          <StackItem key={`${getAppIdentifier(app)}_${index}`}>
            {name} ({type})
          </StackItem>
        );
      })}
    </Stack>
  );
};

export default ReviewApplications;
