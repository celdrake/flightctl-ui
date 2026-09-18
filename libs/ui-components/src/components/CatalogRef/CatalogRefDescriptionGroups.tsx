import * as React from 'react';
import { DescriptionListDescription, DescriptionListGroup, DescriptionListTerm } from '@patternfly/react-core';
import type { CatalogItemRefSpec } from '@flightctl/types';
import type { CatalogItem } from '@flightctl/types/alpha';

import { useTranslation } from '../../hooks/useTranslation';
import { getCatalogRefArtifactLabel } from './catalogRefArtifactLabel';

type CatalogRefDescriptionGroupsProps = {
  catalogItemRef: CatalogItemRefSpec;
  channel: string;
  imageUri?: string;
  item?: CatalogItem;
};

const CatalogRefDescriptionGroups = ({ catalogItemRef, channel, imageUri, item }: CatalogRefDescriptionGroupsProps) => {
  const { t } = useTranslation();
  return (
    <>
      <DescriptionListGroup>
        <DescriptionListTerm>{t('Catalog item name')}</DescriptionListTerm>
        <DescriptionListDescription>{catalogItemRef.item}</DescriptionListDescription>
      </DescriptionListGroup>
      {imageUri && (
        <DescriptionListGroup>
          <DescriptionListTerm>{getCatalogRefArtifactLabel(item?.spec.type, t)}</DescriptionListTerm>
          <DescriptionListDescription>{imageUri}</DescriptionListDescription>
        </DescriptionListGroup>
      )}
      {channel && (
        <DescriptionListGroup>
          <DescriptionListTerm>{t('Channel')}</DescriptionListTerm>
          <DescriptionListDescription>{channel}</DescriptionListDescription>
        </DescriptionListGroup>
      )}
      <DescriptionListGroup>
        <DescriptionListTerm>{t('Version')}</DescriptionListTerm>
        <DescriptionListDescription>{catalogItemRef.version}</DescriptionListDescription>
      </DescriptionListGroup>
    </>
  );
};

export default CatalogRefDescriptionGroups;
