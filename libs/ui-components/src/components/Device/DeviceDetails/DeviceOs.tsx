import * as React from 'react';
import { Icon, Popover, PopoverPosition } from '@patternfly/react-core';
import ExclamationTriangleIcon from '@patternfly/react-icons/dist/js/icons/exclamation-triangle-icon';
import type { ImageOrCatalogItemRefSpec } from '@flightctl/types';

import { useTranslation } from '../../../hooks/useTranslation';
import { useSystemImage } from '../../Catalog/useSystemImage';

const DeviceOs = ({
  osSpec,
  renderedOsImage,
}: {
  osSpec?: ImageOrCatalogItemRefSpec;
  renderedOsImage: string | undefined;
}) => {
  const { t } = useTranslation();
  const { imageUri: desiredOsImage } = useSystemImage(osSpec);
  const hasDiff = desiredOsImage && desiredOsImage !== renderedOsImage;

  let popover: React.ReactNode;
  if (hasDiff) {
    popover = (
      <Popover
        aria-label={t('System image mismatch')}
        position={PopoverPosition.top}
        headerContent={t('System image mismatch')}
        bodyContent={t('Desired system image: {{ desiredOsImage }}', { desiredOsImage: desiredOsImage })}
        withFocusTrap={false}
      >
        <>
          {' '}
          <Icon status="warning">
            <ExclamationTriangleIcon />
          </Icon>
        </>
      </Popover>
    );
  }
  return (
    <div>
      {renderedOsImage || '-'}
      {popover}
    </div>
  );
};

export default DeviceOs;
