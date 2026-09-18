import * as React from 'react';
import { Alert, DescriptionList, Stack, StackItem } from '@patternfly/react-core';
import type { CatalogItemRefSpec } from '@flightctl/types';

import { useTranslation } from '../../hooks/useTranslation';
import { useResolvedCatalogRef } from '../Catalog/useResolvedCatalogRef';
import CatalogRefDescriptionGroups from './CatalogRefDescriptionGroups';
import { catalogItemHasConfigSchema } from './catalogRefUtils';

type CatalogRefCardDetailsProps = {
  catalogItemRef: CatalogItemRefSpec;
};

const CatalogRefCardDetails = ({ catalogItemRef }: CatalogRefCardDetailsProps) => {
  const { t } = useTranslation();
  const resolved = useResolvedCatalogRef(catalogItemRef);
  const item = resolved?.item;
  const isLoading = resolved?.isLoading;
  const channel = catalogItemRef.channel || resolved?.channel || '';
  const imageUri = resolved?.imageUri;
  // CELIA-WIP: Deploy-flow heuristic — confirm against backend semantics.
  const isDeployFlow = Boolean(item && catalogItemHasConfigSchema(item));

  if (isLoading) {
    return null;
  }

  return (
    <Stack hasGutter>
      {isDeployFlow && (
        <StackItem>
          <Alert isInline variant="info" title={t('Configured via Software Catalog deploy')}>
            {t(
              'This item was added through the Software Catalog deploy flow with custom configuration. To change parameters or update the deployment, use the Software Catalog tab on the fleet or device page.',
            )}
          </Alert>
        </StackItem>
      )}

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
