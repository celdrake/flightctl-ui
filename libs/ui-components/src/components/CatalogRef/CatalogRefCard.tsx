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
  Stack,
  StackItem,
} from '@patternfly/react-core';
import { AngleDownIcon } from '@patternfly/react-icons/dist/js/icons/angle-down-icon';
import { AngleRightIcon } from '@patternfly/react-icons/dist/js/icons/angle-right-icon';

import { useTranslation } from '../../hooks/useTranslation';

// CELIA-WIP: Visual parity without ported CSS — spacing and density may differ from design.
type CatalogRefTitleProps = {
  title: string;
  icon?: React.ReactNode;
  subtitle?: string;
};

export const CatalogRefTitle = ({ title, icon, subtitle }: CatalogRefTitleProps) => {
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

type CatalogRefCardProps = {
  title: React.ReactNode;
  headerBadges?: React.ReactNode;
  footer?: React.ReactNode;
};

/** Shared collapsible card shell for catalog OS and application refs in the template wizard. */
const CatalogRefCard = ({
  title,
  headerBadges,
  children,
  footer,
}: React.PropsWithChildren<CatalogRefCardProps>) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = React.useState(true);

  return (
    <Card isCompact>
      <CardBody>
        <Stack hasGutter={isExpanded && Boolean(children)}>
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
                  <FlexItem>{title}</FlexItem>
                </Flex>
              </FlexItem>
              {headerBadges && (
                <FlexItem shrink={{ default: 'shrink' }}>
                  <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
                    {headerBadges}
                  </Flex>
                </FlexItem>
              )}
            </Flex>
          </StackItem>

          {isExpanded && children && (
            <>
              <StackItem>
                <Divider component="div" />
              </StackItem>
              <StackItem>{children}</StackItem>
            </>
          )}

          {isExpanded && footer && <StackItem>{footer}</StackItem>}
        </Stack>
      </CardBody>
    </Card>
  );
};

export default CatalogRefCard;
