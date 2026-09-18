import * as React from 'react';
import { Alert, DescriptionList, Stack, StackItem } from '@patternfly/react-core';
import type { CatalogItemRefSpec } from '@flightctl/types';

import { useTranslation } from '../../hooks/useTranslation';
import { useResolvedCatalogRef } from '../Catalog/useResolvedCatalogRef';
import CatalogRefDescriptionGroups from './CatalogRefDescriptionGroups';

const CatalogRefCardDetails = ({ catalogItemRef }: { catalogItemRef: CatalogItemRefSpec }) => {
  const { t } = useTranslation();
  const resolved = useResolvedCatalogRef(catalogItemRef);
  const item = resolved?.item;
  const isLoading = resolved?.isLoading;
  const channel = catalogItemRef.channel || resolved?.channel || '';
  const imageUri = resolved?.imageUri;

  if (isLoading) {
    return null;
  }

  return (
    <Stack hasGutter>
      <StackItem>
        <DescriptionList isCompact columnModifier={{ default: '2Col' }} aria-label={t('Catalog item details')}>
          <CatalogRefDescriptionGroups
            catalogItemRef={catalogItemRef}
            channel={channel}
            imageUri={imageUri}
            item={item}
          />
        </DescriptionList>
      </StackItem>

      {!item && !isLoading && (
        <StackItem>
          <Alert isInline variant="warning" title={t('Catalog item could not be resolved')}>
            {t(
              'The referenced catalog item could not be loaded. Verify the item still exists in the Software Catalog.',
            )}
          </Alert>
        </StackItem>
      )}
    </Stack>
  );
};

export default CatalogRefCardDetails;
