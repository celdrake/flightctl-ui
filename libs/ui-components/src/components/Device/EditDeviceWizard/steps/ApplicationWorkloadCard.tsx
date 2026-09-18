import * as React from 'react';
import {
  Button,
  Card,
  CardBody,
  Divider,
  Flex,
  FlexItem,
  Stack,
  StackItem,
  Title,
} from '@patternfly/react-core';
import { AngleDownIcon } from '@patternfly/react-icons/dist/js/icons/angle-down-icon';
import { AngleRightIcon } from '@patternfly/react-icons/dist/js/icons/angle-right-icon';
import { ExclamationCircleIcon } from '@patternfly/react-icons/dist/js/icons/exclamation-circle-icon';

import { useTranslation } from '../../../../hooks/useTranslation';
import WithTooltip from '../../../common/WithTooltip';

type ApplicationWorkloadCardProps = {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  headerActions?: React.ReactNode;
  leadingContent?: React.ReactNode;
  hasError?: boolean;
  errorLabel?: string;
  children: React.ReactNode;
};

const ApplicationWorkloadCard = ({
  title,
  isExpanded,
  onToggle,
  headerActions,
  leadingContent,
  hasError,
  errorLabel,
  children,
}: ApplicationWorkloadCardProps) => {
  const { t } = useTranslation();

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
                      onClick={onToggle}
                      aria-expanded={isExpanded}
                      aria-label={isExpanded ? t('Collapse application') : t('Expand application')}
                    >
                      {isExpanded ? <AngleDownIcon /> : <AngleRightIcon />}
                    </Button>
                  </FlexItem>
                  {leadingContent && <FlexItem>{leadingContent}</FlexItem>}
                  <FlexItem>
                    <Title headingLevel="h3" size="md">
                      {title}
                    </Title>
                  </FlexItem>
                  {hasError && (
                    <FlexItem>
                      <WithTooltip
                        showTooltip
                        content={t('Invalid {{ itemType }}', { itemType: errorLabel || title })}
                      >
                        <ExclamationCircleIcon
                          style={{ color: 'var(--pf-t--global--icon--color--status--danger--default)' }}
                        />
                      </WithTooltip>
                    </FlexItem>
                  )}
                </Flex>
              </FlexItem>
              {headerActions && (
                <FlexItem shrink={{ default: 'shrink' }}>
                  <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
                    {headerActions}
                  </Flex>
                </FlexItem>
              )}
            </Flex>
          </StackItem>

          {isExpanded && (
            <>
              <StackItem>
                <Divider component="div" />
              </StackItem>
              <StackItem>{children}</StackItem>
            </>
          )}
        </Stack>
      </CardBody>
    </Card>
  );
};

export default ApplicationWorkloadCard;
