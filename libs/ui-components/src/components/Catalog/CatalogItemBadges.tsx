import * as React from 'react';
import type { TFunction } from 'react-i18next';
import { Button, Flex, FlexItem, Icon, Label } from '@patternfly/react-core';
import { ArrowCircleUpIcon } from '@patternfly/react-icons/dist/js/icons/arrow-circle-up-icon';
import { ExclamationTriangleIcon } from '@patternfly/react-icons/dist/js/icons/exclamation-triangle-icon';

import { CatalogItemCategory, type CatalogItemSpec, CatalogItemType } from '@flightctl/types/alpha';
import { useTranslation } from '../../hooks/useTranslation';
import WithTooltip from '../common/WithTooltip';

export const getCatalogItemBadge = (itemType: CatalogItemType | undefined, t: TFunction) => {
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

export const CatalogItemDeprecationBadge = () => {
  const { t } = useTranslation();
  return (
    <WithTooltip showTooltip content={t('This item is deprecated')}>
      <Icon status="warning" size="sm">
        <ExclamationTriangleIcon />
      </Icon>
    </WithTooltip>
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
    <WithTooltip
      showTooltip
      content={t(
        'A newer catalog version is available. Update this item from the Software Catalog tab on this fleet or device.',
      )}
    >
      <span tabIndex={0}>
        <Label isCompact variant="outline" color="blue" icon={<ArrowCircleUpIcon />}>
          {t('Update available')}
        </Label>
      </span>
    </WithTooltip>
  );
};

const CatalogItemViewBadges = ({
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
      {itemSpec?.deprecation && (
        <FlexItem>
          <CatalogItemDeprecationBadge />
        </FlexItem>
      )}
    </Flex>
  );
};

export default CatalogItemViewBadges;
