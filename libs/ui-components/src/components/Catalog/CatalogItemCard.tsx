import {
  Card,
  CardBody,
  CardHeader,
  Content,
  ContentVariants,
  Label,
  Split,
  SplitItem,
  Stack,
  StackItem,
  Title,
} from '@patternfly/react-core';
import * as React from 'react';
import { type CatalogItem } from '@flightctl/types/alpha';

import { useTranslation } from '../../hooks/useTranslation';
import CatalogItemIcon from './CatalogItemIcon';
import { CatalogItemTypeBadge } from './CatalogItemBadges';

export type CatalogItemCardProps = {
  catalogItem: CatalogItem;
  onSelect: VoidFunction;
};

const CatalogItemCard: React.FC<CatalogItemCardProps> = ({ catalogItem, onSelect }) => {
  const { t } = useTranslation();
  return (
    <Card isCompact isClickable>
      <CardHeader
        selectableActions={{
          onClickAction: onSelect,
          onChange: onSelect,
          selectableActionAriaLabel: t('Select {{ name }}', {
            name: catalogItem.spec.displayName || catalogItem.metadata.name,
          }),
        }}
      >
        <Split>
          <SplitItem isFilled>
            <CatalogItemIcon catalogItem={catalogItem} />
          </SplitItem>
          <SplitItem>
            <CatalogItemTypeBadge itemSpec={catalogItem.spec} isCompact={false} />
          </SplitItem>
        </Split>
      </CardHeader>
      <CardBody>
        <Stack hasGutter>
          <StackItem>
            <Stack>
              <StackItem>
                <Title headingLevel="h3">{catalogItem.spec.displayName || catalogItem.metadata.name}</Title>
              </StackItem>
              {catalogItem.spec.provider && (
                <StackItem>
                  <Content component={ContentVariants.small}>
                    {t('Provided by {{provider}}', { provider: catalogItem.spec.provider })}
                  </Content>
                </StackItem>
              )}
            </Stack>
          </StackItem>
          {catalogItem.spec.shortDescription && <StackItem>{catalogItem.spec.shortDescription}</StackItem>}
          {catalogItem.spec.deprecation && (
            <StackItem>
              <Label variant="outline" status="warning">
                {t('Deprecated')}
              </Label>
            </StackItem>
          )}
        </Stack>
      </CardBody>
    </Card>
  );
};

export default CatalogItemCard;
