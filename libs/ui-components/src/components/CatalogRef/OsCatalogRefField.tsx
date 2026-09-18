import * as React from 'react';
import { Button, Flex, FlexItem } from '@patternfly/react-core';
import { useFormikContext } from 'formik';
import CatalogIcon from '@patternfly/react-icons/dist/js/icons/catalog-icon';

import { useTranslation } from '../../hooks/useTranslation';
import ImageOrCatalogRefField from '../form/ImageOrCatalogRefField';
import { type DeviceSpecConfigFormValues } from '../../types/deviceSpec';
import CatalogRefCardFromRef from './CatalogRefCardFromRef';

type OsCatalogRefFieldProps = {
  isReadOnly?: boolean;
  isOsPackageMode?: boolean;
  showUpdateStatus: boolean;
};

const OsCatalogRefField = ({ isReadOnly, isOsPackageMode, showUpdateStatus }: OsCatalogRefFieldProps) => {
  const { t } = useTranslation();
  const { values } = useFormikContext<DeviceSpecConfigFormValues>();

  const catalogRef = values.osSpec?.catalogItemRef;

  // CELIA-WIP: Button is visual-only until catalog selection slice is implemented.
  const catalogButton = (
    <Button variant="secondary" icon={<CatalogIcon />} isDisabled>
      {t('Add from software catalog')}
    </Button>
  );

  if (catalogRef) {
    return <CatalogRefCardFromRef catalogItemRef={catalogRef} showUpdateStatus={showUpdateStatus} />;
  }

  // CELIA-WIP: Ad-hoc Flex layout around unchanged ImageOrCatalogRefField; revisit when trailingControl is added to that field.
  return (
    <Flex alignItems={{ default: 'alignItemsFlexStart' }} gap={{ default: 'gapSm' }} flexWrap={{ default: 'wrap' }}>
      <FlexItem flex={{ default: 'flex_1' }}>
        <ImageOrCatalogRefField
          aria-label={t('System image')}
          name="osSpec"
          isDisabled={isReadOnly || isOsPackageMode}
          helperText={t(
            'Must be a reference to a bootable container image (such as "quay.io/<my-org>/my-rhel-with-fc-agent:<version>"). If you do not want to manage your OS from Edge management, leave this field empty.',
          )}
        />
      </FlexItem>
      {!isReadOnly && !isOsPackageMode && <FlexItem>{catalogButton}</FlexItem>}
    </Flex>
  );
};

export default OsCatalogRefField;
