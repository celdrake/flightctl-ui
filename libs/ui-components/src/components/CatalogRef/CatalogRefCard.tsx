import * as React from 'react';
import {
  Button,
  Card,
  CardBody,
  Content,
  ContentVariants,
  Divider,
  Flex,
  FlexItem,
  Spinner,
  Stack,
  StackItem,
} from '@patternfly/react-core';
import type { CatalogItemRefSpec } from '@flightctl/types';
import { PencilAltIcon } from '@patternfly/react-icons/dist/js/icons/pencil-alt-icon';

import type { CatalogItem } from '@flightctl/types/alpha';
import { useTranslation } from '../../hooks/useTranslation';
import { getCatalogRefDisplayName, getUpdates } from '../../utils/catalog';
import { useResolvedCatalogRef } from '../Catalog/useResolvedCatalogRef';
import CatalogRefCardDetails from './CatalogRefCardDetails';
import CatalogItemIcon from '../Catalog/CatalogItemIcon';
import CatalogItemViewBadges from '../Catalog/CatalogItemBadges';
import AngleDownIcon from '@patternfly/react-icons/dist/js/icons/angle-down-icon';
import AngleRightIcon from '@patternfly/react-icons/dist/js/icons/angle-right-icon';

type CatalogRefCardProps = {
  catalogItemRef: CatalogItemRefSpec;
  headerTitle?: string;
  showUpdateStatus: boolean;
  // CELIA-WIP REVIEW
  onEdit?: VoidFunction;
};

const CatalogRefTitle = ({ item, title, isLoading }: { item?: CatalogItem; title: string; isLoading: boolean }) => {
  const { t } = useTranslation();
  const icon = item ? <CatalogItemIcon catalogItem={item} size="sm" /> : isLoading ? <Spinner size="md" /> : null;

  const provider = item?.spec.provider;
  const subtitle = provider ? t('Provided by {{provider}}', { provider }) : undefined;

  return (
    <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
      {icon && <FlexItem>{icon}</FlexItem>}
      <FlexItem>
        <Stack>
          <StackItem>
            <Content component={ContentVariants.h3}>{title}</Content>
          </StackItem>
          {subtitle && (
            <StackItem>
              <Content component={ContentVariants.small}>{subtitle}</Content>
            </StackItem>
          )}
        </Stack>
      </FlexItem>
    </Flex>
  );
};

const CatalogRefCard = ({ catalogItemRef, headerTitle, showUpdateStatus, onEdit }: CatalogRefCardProps) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = React.useState(false);

  const resolved = useResolvedCatalogRef(catalogItemRef);
  const item = resolved?.item;
  const isLoading = resolved?.isLoading;
  const version = resolved?.version;
  const channel = catalogItemRef.channel || resolved?.channel || '';
  const displayName = headerTitle || getCatalogRefDisplayName(catalogItemRef, item);

  const hasUpdates = Boolean(
    showUpdateStatus && item && version && channel && getUpdates(item, channel, version.version).length > 0,
  );

  return (
    <Card isCompact>
      <CardBody>
        <Stack hasGutter={isExpanded}>
          <StackItem>
            <Flex
              alignItems={{ default: 'alignItemsCenter' }}
              justifyContent={{ default: 'justifyContentSpaceBetween' }}
              gap={{ default: 'gapMd' }}
            >
              <FlexItem grow={{ default: 'grow' }}>
                <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
                  <FlexItem>
                    <Button
                      variant="plain"
                      onClick={() => setIsExpanded((expanded) => !expanded)}
                      aria-expanded={isExpanded}
                      aria-label={isExpanded ? t('Collapse') : t('Expand')}
                    >
                      {isExpanded ? <AngleDownIcon /> : <AngleRightIcon />}
                    </Button>
                  </FlexItem>
                  <FlexItem>
                    <CatalogRefTitle item={item} isLoading={isLoading || false} title={displayName} />
                  </FlexItem>
                </Flex>
              </FlexItem>
              <FlexItem shrink={{ default: 'shrink' }}>
                <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
                  <CatalogItemViewBadges itemSpec={item?.spec} hasUpdates={hasUpdates} />
                  {onEdit && (
                    <FlexItem>
                      <Button variant="plain" icon={<PencilAltIcon />} onClick={onEdit} aria-label={t('Edit')} />
                    </FlexItem>
                  )}
                </Flex>
              </FlexItem>
            </Flex>
          </StackItem>

          {isExpanded && !isLoading && (
            <>
              <StackItem>
                <Divider component="div" />
              </StackItem>
              <StackItem>
                <CatalogRefCardDetails catalogItemRef={catalogItemRef} resolvedRef={resolved} />
              </StackItem>
            </>
          )}
        </Stack>
      </CardBody>
    </Card>
  );
};

export default CatalogRefCard;
