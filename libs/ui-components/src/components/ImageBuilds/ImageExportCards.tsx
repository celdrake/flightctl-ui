import * as React from 'react';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Flex,
  FlexItem,
  Gallery,
  Icon,
  Stack,
  StackItem,
} from '@patternfly/react-core';
import { VirtualMachineIcon } from '@patternfly/react-icons/dist/js/icons/virtual-machine-icon';
import { CloudSecurityIcon } from '@patternfly/react-icons/dist/js/icons/cloud-security-icon';
import { ServerGroupIcon } from '@patternfly/react-icons/dist/js/icons/server-group-icon';

import { getExportFormatDescription, getExportFormatLabel } from '../../utils/imageBuilds';
import { useTranslation } from '../../hooks/useTranslation';
import { ExportFormatType, ImageExport } from '@flightctl/types/imagebuilder';
import { isImageExportFailed } from './CreateImageBuildWizard/utils';

const iconMap: Record<string, React.ReactElement> = {
  vmdk: <VirtualMachineIcon />,
  qcow2: <CloudSecurityIcon />,
  iso: <ServerGroupIcon />,
};

export type ImageExportFormatCardProps = {
  format: ExportFormatType;
  imageExport?: ImageExport;
  onExportImage: (format: ExportFormatType) => void;
  onRetry: (format: ExportFormatType) => void;
  isCreating: boolean;
};

type SelectImageBuildExportCardProps = {
  format: ExportFormatType;
  isChecked: boolean;
  onToggle: (format: ExportFormatType, isChecked: boolean) => void;
};

export const SelectImageBuildExportCard = ({ format, isChecked, onToggle }: SelectImageBuildExportCardProps) => {
  const { t } = useTranslation();

  const texts = React.useMemo(
    () => ({
      title: getExportFormatLabel(format),
      description: getExportFormatDescription(t, format),
    }),
    [t, format],
  );

  const id = `export-format-${format}`;
  // CELIA-WIP: Review for PF6
  return (
    <Card id={id} isSelectable isSelected={isChecked}>
      <CardHeader
        selectableActions={{
          selectableActionId: format,
          selectableActionAriaLabelledby: id,
          name: format,
          onChange: () => onToggle(format, !isChecked),
        }}
      >
        <CardTitle>
          <Icon size="lg">{iconMap[format]}</Icon>
        </CardTitle>
      </CardHeader>
      <CardBody>
        <Stack hasGutter>
          <StackItem>{texts.title}</StackItem>
          <StackItem style={{ color: 'red' }}>{texts.description}</StackItem>
        </Stack>
      </CardBody>
    </Card>
  );
};

export const ViewImageBuildExportCard = ({
  format,
  imageExport,
  onExportImage,
  onRetry,
  isCreating = false,
}: ImageExportFormatCardProps) => {
  const { t } = useTranslation();
  const exists = !!imageExport;
  const failedExport = exists && isImageExportFailed(imageExport);

  return (
    <Card isLarge>
      <CardHeader style={{ '--pf-v6-c-card__title-text--FontWeight': 'normal' } as React.CSSProperties}>
        <CardTitle>
          <Stack hasGutter>
            <StackItem>
              <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }}>
                <FlexItem>
                  <Icon size="xl">{iconMap[format]}</Icon>
                </FlexItem>
                <FlexItem>Failed TBD</FlexItem>
              </Flex>
            </StackItem>
            <StackItem>{getExportFormatLabel(format)}</StackItem>
          </Stack>
        </CardTitle>
      </CardHeader>
      <CardBody>
        <Stack hasGutter>
          <StackItem style={{ color: 'red' }}>{getExportFormatDescription(t, format)}</StackItem>
          <StackItem>
            <Flex>
              {failedExport && (
                <FlexItem>
                  <Button
                    variant="primary"
                    onClick={() => onRetry(format)}
                    isDisabled={isCreating}
                    isLoading={isCreating}
                  >
                    {t('Retry')}
                  </Button>
                </FlexItem>
              )}
              <FlexItem>
                <Button variant="secondary">{t('View logs')}</Button>
              </FlexItem>
              {!exists && (
                <FlexItem>
                  <Button
                    variant="secondary"
                    onClick={() => onExportImage(format)}
                    isDisabled={isCreating}
                    isLoading={isCreating}
                  >
                    {t('Export image')}
                  </Button>
                </FlexItem>
              )}
            </Flex>
          </StackItem>
        </Stack>
      </CardBody>
    </Card>
  );
};

export const ImageExportCardsGallery = ({ children }: React.PropsWithChildren) => {
  return (
    <Gallery hasGutter minWidths={{ default: '320px' }}>
      {children}
    </Gallery>
  );
};
