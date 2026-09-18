import * as React from 'react';
import { Spinner } from '@patternfly/react-core';
import type { CatalogItemRefSpec } from '@flightctl/types';

import { useTranslation } from '../../hooks/useTranslation';
import { getCatalogRefDisplayName, getUpdates } from '../../utils/catalog';
import { useResolvedCatalogRef } from '../Catalog/useResolvedCatalogRef';
import CatalogRefCard, { CatalogRefTitle } from './CatalogRefCard';
import CatalogRefCardDetails from './CatalogRefCardDetails';
import { catalogItemHasConfigSchema } from './catalogRefUtils';
import CatalogItemIcon from '../Catalog/CatalogItemIcon';
import CatalogItemBadges from '../Catalog/CatalogItemBadges';

type CatalogRefCardFromRefProps = {
  catalogItemRef: CatalogItemRefSpec;
  headerTitle?: string;
  showUpdateStatus: boolean;
};

const CatalogRefCardFromRef = ({
  catalogItemRef,
  headerTitle,
  showUpdateStatus,
  children,
}: React.PropsWithChildren<CatalogRefCardFromRefProps>) => {
  const { t } = useTranslation();
  const resolved = useResolvedCatalogRef(catalogItemRef);
  const item = resolved?.item;
  const isLoading = resolved?.isLoading;
  const version = resolved?.version;
  const channel = catalogItemRef.channel || resolved?.channel || '';
  // CELIA-WIP: Deploy-flow vs template label heuristic — confirm against backend semantics.
  const isDeployFlow = Boolean(item && catalogItemHasConfigSchema(item));
  const displayName = headerTitle || getCatalogRefDisplayName(catalogItemRef, item);

  const hasUpdates = Boolean(
    showUpdateStatus &&
      !isDeployFlow &&
      item &&
      version &&
      channel &&
      getUpdates(item, channel, version.version).length > 0,
  );

  const icon = item ? <CatalogItemIcon catalogItem={item} size="sm" /> : isLoading ? <Spinner size="md" /> : null;

  const subtitle = item?.spec.provider ? t('Provided by {{provider}}', { provider: item.spec.provider }) : undefined;

  return (
    <CatalogRefCard
      title={<CatalogRefTitle title={displayName} icon={icon} subtitle={subtitle} />}
      headerBadges={<CatalogItemBadges itemSpec={item?.spec} hasUpdates={hasUpdates} />}
    >
      {children ?? <CatalogRefCardDetails catalogItemRef={catalogItemRef} />}
    </CatalogRefCard>
  );
};

export default CatalogRefCardFromRef;
