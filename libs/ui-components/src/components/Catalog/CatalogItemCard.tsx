import * as React from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Flex,
  FlexItem,
  Icon,
  Split,
  SplitItem,
  Stack,
  StackItem,
  Truncate,
} from '@patternfly/react-core';
import { ExclamationTriangleIcon } from '@patternfly/react-icons/dist/js/icons/exclamation-triangle-icon';

import { type CatalogItem } from '@flightctl/types/alpha';
import WithTooltip from '../common/WithTooltip';
import { useTranslation } from '../../hooks/useTranslation';
import CatalogItemIcon from './CatalogItemIcon';
import { CatalogItemDeprecationBadge, CatalogItemTypeBadge } from './CatalogItemBadges';

import './CatalogItemCard.css';

export type CatalogItemCardProps = {
  catalogItem: CatalogItem;
  onSelect: VoidFunction;
};

const CatalogItemCard = ({ catalogItem, onSelect }: CatalogItemCardProps) => {
  const { t } = useTranslation();

  const { spec, metadata } = catalogItem;
  const fullTitle = spec.displayName || metadata.name || '';
  const shortDescription = spec.shortDescription || '';
  const provider = spec.provider;
  const hasProvider = !!provider;

  return (
    <Card
      isCompact
      isClickable
      className={`fctl-catalog-item-card${hasProvider ? ' fctl-catalog-item-card--reduced' : ''}`}
    >
      <CardHeader
        selectableActions={{
          onClickAction: onSelect,
          onChange: onSelect,
          selectableActionAriaLabel: t('Select {{ name }}', {
            name: fullTitle,
          }),
        }}
      >
        <Split hasGutter>
          <SplitItem isFilled>
            <CatalogItemIcon catalogItem={catalogItem} size="xs" />
          </SplitItem>
          <SplitItem>
            <Flex gap={{ default: 'gapXs' }}>
              <FlexItem>
                <CatalogItemTypeBadge itemSpec={spec} />
              </FlexItem>
              {spec.deprecation && (
                <FlexItem>
                  <CatalogItemDeprecationBadge />
                </FlexItem>
              )}
            </Flex>
          </SplitItem>
        </Split>
      </CardHeader>
      <CardBody>
        <Stack>
          <StackItem className="fctl-catalog-item-card__title">
            <Truncate content={fullTitle} position="middle" />
          </StackItem>
          {hasProvider && (
            <StackItem className="fctl-catalog-item-card__provider">
              {t('Provided by {{provider}}', { provider })}
            </StackItem>
          )}
          {shortDescription && (
            <StackItem className="fctl-catalog-item-card__description">{shortDescription}</StackItem>
          )}
        </Stack>
      </CardBody>
    </Card>
  );
};

export default CatalogItemCard;
