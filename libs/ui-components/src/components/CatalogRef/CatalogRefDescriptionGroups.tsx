import * as React from 'react';
import { DescriptionListDescription, DescriptionListGroup, DescriptionListTerm } from '@patternfly/react-core';
import type { CatalogItemRefSpec } from '@flightctl/types';
import type { CatalogItem } from '@flightctl/types/alpha';

import { useTranslation } from '../../hooks/useTranslation';
import { formatCatalogItemRef } from '../../utils/catalog';
import { getCatalogRefArtifactLabel } from './catalogRefArtifactLabel';

type CatalogRefDescriptionGroupsProps = {
  catalogItemRef: CatalogItemRefSpec;
  channel: string;
  imageUri?: string;
  item?: CatalogItem;
};

const CatalogRefDescriptionGroups = ({ catalogItemRef, channel, imageUri, item }: CatalogRefDescriptionGroupsProps) => {
  const { t } = useTranslation();
  const pinnedVersion = catalogItemRef.version;

  return (
    <>
      {channel && (
        <DescriptionListGroup>
          <DescriptionListTerm>{t('Channel')}</DescriptionListTerm>
          <DescriptionListDescription>{channel}</DescriptionListDescription>
        </DescriptionListGroup>
      )}
      <DescriptionListGroup>
        <DescriptionListTerm>{t('Version')}</DescriptionListTerm>
        <DescriptionListDescription>{pinnedVersion}</DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>{t('Catalog reference')}</DescriptionListTerm>
        <DescriptionListDescription>{formatCatalogItemRef(catalogItemRef)}</DescriptionListDescription>
      </DescriptionListGroup>
      {imageUri && (
        <DescriptionListGroup>
          <DescriptionListTerm>{getCatalogRefArtifactLabel(item?.spec.type, t)}</DescriptionListTerm>
          <DescriptionListDescription>{imageUri}</DescriptionListDescription>
        </DescriptionListGroup>
      )}
    </>
  );
};

export default CatalogRefDescriptionGroups;
