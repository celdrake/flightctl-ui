import * as React from 'react';
import type { TFunction } from 'react-i18next';
import { Flex, FlexItem, Label } from '@patternfly/react-core';

import { CatalogItemCategory, type CatalogItemSpec, CatalogItemType } from '@flightctl/types/alpha';
import { useTranslation } from '../../hooks/useTranslation';

const getCatalogItemBadge = (itemType: CatalogItemType | undefined, t: TFunction) => {
  switch (itemType) {
    case CatalogItemType.CatalogItemTypeCompose: {
      return t('Compose');
    }
    case CatalogItemType.CatalogItemTypeContainer: {
      return t('Container');
    }
    case CatalogItemType.CatalogItemTypeData: {
      return t('Data');
    }
    case CatalogItemType.CatalogItemTypeHelm: {
      return t('Helm');
    }
    case CatalogItemType.CatalogItemTypeQuadlet: {
      return t('Quadlet');
    }
    case CatalogItemType.CatalogItemTypeOS: {
      return t('OS image');
    }
    default: {
      return t('Unknown');
    }
  }
};

export const CatalogItemTypeBadge = ({ itemSpec }: { itemSpec: CatalogItemSpec }) => {
  const { t } = useTranslation();
  return (
    <Label
      variant="filled"
      color={itemSpec.category === CatalogItemCategory.CatalogItemCategorySystem ? 'teal' : 'purple'}
    >
      {getCatalogItemBadge(itemSpec.type, t)}
    </Label>
  );
};

const CatalogItemBadges = ({
  itemSpec,
  hasUpdates,
}: {
  itemSpec: CatalogItemSpec | undefined;
  hasUpdates: boolean;
}) => {
  const { t } = useTranslation();
  return (
    <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
      <FlexItem>
        <Label isCompact variant="outline">
          {t('Software Catalog')}
        </Label>
      </FlexItem>
      {itemSpec ? (
        <FlexItem>
          <CatalogItemTypeBadge itemSpec={itemSpec} />
        </FlexItem>
      ) : (
        <FlexItem>
          <Label isCompact variant="outline" color="blue">
            {t('Loading')}
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
};

export default CatalogItemBadges;
