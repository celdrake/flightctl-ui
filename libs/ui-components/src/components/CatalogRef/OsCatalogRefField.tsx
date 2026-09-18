import * as React from 'react';
import { Button, Flex, FlexItem } from '@patternfly/react-core';
import { useFormikContext } from 'formik';
import CatalogIcon from '@patternfly/react-icons/dist/js/icons/catalog-icon';

import { useTranslation } from '../../hooks/useTranslation';
import TextField from '../form/TextField';
import { type DeviceSpecConfigFormValues } from '../../types/deviceSpec';
import CatalogRefCardFromRef from './CatalogRefCardFromRef';

type OsCatalogRefFieldProps = {
  isReadOnly?: boolean;
  isOsPackageMode?: boolean;
  showUpdateStatus: boolean;
};

// CELIA-WIP: Implement missing functionality for catalog selection slice.

const OsCatalogRefField = ({ isReadOnly, isOsPackageMode, showUpdateStatus }: OsCatalogRefFieldProps) => {
  const { t } = useTranslation();
  const { values } = useFormikContext<DeviceSpecConfigFormValues>();

  const catalogRef = values.osSpec?.catalogItemRef;
  if (catalogRef) {
    return <CatalogRefCardFromRef catalogItemRef={catalogRef} showUpdateStatus={showUpdateStatus} />;
  }

  const canUpdateOs = !isReadOnly && !isOsPackageMode;

  return (
    <Flex
      alignItems={{ default: 'alignItemsFlexStart' }}
      gap={{ default: 'gapSm' }}
      flexWrap={{ default: 'wrap' }}
      style={{ border: '2px solid lime' }}
    >
      <FlexItem flex={{ default: 'flex_1' }}>
        <TextField
          aria-label={t('System image')}
          name="osSpec.image"
          isDisabled={!canUpdateOs}
          helperText={t(
            'Must be a reference to a bootable container image (such as "quay.io/<my-org>/my-rhel-with-fc-agent:<version>"). If you do not want to manage your OS from Edge management, leave this field empty.',
          )}
        />
      </FlexItem>
      {canUpdateOs && (
        <FlexItem>
          <Button variant="secondary" icon={<CatalogIcon />} isDisabled>
            {t('Add from software catalog')}
          </Button>
        </FlexItem>
      )}
    </Flex>
  );
};

export default OsCatalogRefField;
