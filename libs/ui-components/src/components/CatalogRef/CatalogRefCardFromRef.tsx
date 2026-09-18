import * as React from 'react';
import { Flex, FlexItem, Label, Spinner } from '@patternfly/react-core';
import type { CatalogItemRefSpec } from '@flightctl/types';
import { CatalogItemCategory } from '@flightctl/types/alpha';

import { useTranslation } from '../../hooks/useTranslation';
import { getCatalogItemBadge, getCatalogItemIcon, getCatalogRefDisplayName, getUpdates } from '../../utils/catalog';
import { useResolvedCatalogRef } from '../Catalog/useResolvedCatalogRef';
import CatalogRefCard, { CatalogRefTitle } from './CatalogRefCard';
import CatalogRefCardDetails from './CatalogRefCardDetails';
import { catalogItemHasConfigSchema } from './catalogRefUtils';

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
  const isSystem = item?.spec.category === CatalogItemCategory.CatalogItemCategorySystem;
  // CELIA-WIP: Deploy-flow vs template label heuristic — confirm against backend semantics.
  const isDeployFlow = Boolean(item && catalogItemHasConfigSchema(item));
  const displayName = headerTitle || getCatalogRefDisplayName(catalogItemRef, item);

  const hasUpdates =
    showUpdateStatus &&
    !isDeployFlow &&
    item &&
    version &&
    channel &&
    getUpdates(item, channel, version.version).length > 0;

  const icon = item ? (
    <img src={getCatalogItemIcon(item)} alt="" style={{ width: '2rem', height: '2rem', objectFit: 'contain' }} />
  ) : isLoading ? (
    <Spinner size="md" />
  ) : null;

  const headerBadges = (
    <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
      <FlexItem>
        <Label isCompact variant="outline">
          {isDeployFlow ? t('Catalog deploy') : t('Software Catalog')}
        </Label>
      </FlexItem>
      {item ? (
        <FlexItem>
          <Label isCompact variant="filled" color={isSystem ? 'teal' : 'purple'}>
            {getCatalogItemBadge(item.spec.type, t)}
          </Label>
        </FlexItem>
      ) : (
        <FlexItem>
          <Label isCompact variant="outline" color="blue">
            {isLoading ? t('Loading') : t('Catalog item')}
          </Label>
        </FlexItem>
      )}
      {hasUpdates && (
        <FlexItem>
          <Label isCompact variant="outline" color="blue">
            {t('Update available')}
          </Label>
        </FlexItem>
      )}
    </Flex>
  );

  const subtitle = item?.spec.provider ? t('Provided by {{provider}}', { provider: item.spec.provider }) : undefined;

  return (
    <CatalogRefCard
      title={<CatalogRefTitle title={displayName} icon={icon} subtitle={subtitle} />}
      headerBadges={headerBadges}
    >
      {children ?? <CatalogRefCardDetails catalogItemRef={catalogItemRef} />}
    </CatalogRefCard>
  );
};

export default CatalogRefCardFromRef;
