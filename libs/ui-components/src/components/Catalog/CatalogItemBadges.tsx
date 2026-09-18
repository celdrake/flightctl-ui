import * as React from 'react';
import type { TFunction } from 'react-i18next';
import { Button, Flex, FlexItem, Label } from '@patternfly/react-core';

import { CatalogItemCategory, type CatalogItemSpec, CatalogItemType } from '@flightctl/types/alpha';
import { useTranslation } from '../../hooks/useTranslation';
import ArrowCircleUpIcon from '@patternfly/react-icons/dist/js/icons/arrow-circle-up-icon';

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

export const CatalogItemTypeBadge = ({
  itemSpec,
  isCompact = true,
}: {
  itemSpec: CatalogItemSpec;
  isCompact?: boolean;
}) => {
  const { t } = useTranslation();
  return (
    <Label
      variant="filled"
      isCompact={isCompact}
      color={itemSpec.category === CatalogItemCategory.CatalogItemCategorySystem ? 'teal' : 'purple'}
    >
      {getCatalogItemBadge(itemSpec.type, t)}
    </Label>
  );
};

export const CatalogItemUpdateBadge = ({ hasUpdates, onUpdate }: { hasUpdates: boolean; onUpdate?: VoidFunction }) => {
  const { t } = useTranslation();
  if (!hasUpdates) {
    return null;
  }
  if (onUpdate) {
    return (
      <Button variant="link" isInline onClick={onUpdate} icon={<ArrowCircleUpIcon />}>
        {t('Update available')}
      </Button>
    );
  }
  return (
    <Label isCompact variant="outline" color="blue">
      {t('Update available')}
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
          <CatalogItemUpdateBadge hasUpdates={hasUpdates} />
        </FlexItem>
      )}
    </Flex>
  );
};

export default CatalogItemBadges;
