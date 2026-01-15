import * as React from 'react';
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Content,
  ContentVariants,
  Flex,
  FlexItem,
  Gallery,
  Icon,
} from '@patternfly/react-core';
import { VirtualMachineIcon } from '@patternfly/react-icons/dist/js/icons/virtual-machine-icon';
import { CloudSecurityIcon } from '@patternfly/react-icons/dist/js/icons/cloud-security-icon';
import { ServerGroupIcon } from '@patternfly/react-icons/dist/js/icons/server-group-icon';

import { Repository } from '@flightctl/types';
import { ExportFormatType, ImageExport } from '@flightctl/types/imagebuilder';
import { getExportFormatDescription, getExportFormatLabel, getImageReference } from '../../utils/imageBuilds';
import { useTranslation } from '../../hooks/useTranslation';
import { isImageExportFailed } from './CreateImageBuildWizard/utils';
import ImageBuildAndExportStatus from './ImageBuildAndExportStatus';

import './ImageExportCards.css';

const iconMap: Record<string, React.ReactElement> = {
  vmdk: <VirtualMachineIcon />,
  qcow2: <CloudSecurityIcon />,
  iso: <ServerGroupIcon />,
};

export type ImageExportFormatCardProps = {
  repositories: Repository[];
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

  const title = getExportFormatLabel(format);
  const description = getExportFormatDescription(t, format);

  const id = `export-format-${format}`;
  return (
    <Card id={id} isSelectable isSelected={isChecked} className="fctl-imageexport-card">
      <CardHeader
        selectableActions={{
          selectableActionId: format,
          selectableActionAriaLabelledby: id,
          name: format,
          onChange: () => onToggle(format, !isChecked),
        }}
      >
        <Flex direction={{ default: 'column' }} alignItems={{ default: 'alignItemsFlexStart' }}>
          <FlexItem>
            <Icon size="xl">{iconMap[format]}</Icon>
          </FlexItem>
          <FlexItem>
            <Content>
              <Content component={ContentVariants.h2}>{title}</Content>
            </Content>
          </FlexItem>
        </Flex>
      </CardHeader>
      <CardBody>{description}</CardBody>
    </Card>
  );
};

export const ViewImageBuildExportCard = ({
  repositories,
  format,
  imageExport,
  onExportImage,
  onRetry,
  isCreating = false,
}: ImageExportFormatCardProps) => {
  const { t } = useTranslation();
  const exists = !!imageExport;
  const failedExport = exists && isImageExportFailed(imageExport);

  const imageReference = React.useMemo(() => {
    const ref = imageExport ? getImageReference(imageExport.spec.destination, repositories) : '';
    return ref || '';
  }, [imageExport, repositories]);

  const title = getExportFormatLabel(format);
  const description = getExportFormatDescription(t, format);

  return (
    <Card isLarge className="fctl-imageexport-card">
      <CardHeader>
        <Flex direction={{ default: 'column' }} alignItems={{ default: 'alignItemsFlexStart' }}>
          <FlexItem style={{ width: '100%' }}>
            <Flex
              justifyContent={{ default: 'justifyContentSpaceBetween' }}
              alignItems={{ default: 'alignItemsCenter' }}
            >
              <FlexItem>
                <Icon size="xl">{iconMap[format]}</Icon>
              </FlexItem>
              {exists && (
                <FlexItem className="fctl-imageexport-card__status">
                  <ImageBuildAndExportStatus imageStatus={imageExport?.status} imageReference={imageReference} />
                </FlexItem>
              )}
            </Flex>
          </FlexItem>
          <FlexItem>
            <Content>
              <Content component={ContentVariants.h2}>{title}</Content>
            </Content>
          </FlexItem>
        </Flex>
      </CardHeader>
      <CardBody>{description}</CardBody>
      <CardFooter>
        <Flex>
          {failedExport && (
            <FlexItem>
              <Button variant="primary" onClick={() => onRetry(format)} isDisabled={isCreating} isLoading={isCreating}>
                {t('Retry')}
              </Button>
            </FlexItem>
          )}
          {exists && (
            <FlexItem>
              <Button variant="secondary">{t('View logs')}</Button>
            </FlexItem>
          )}
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
      </CardFooter>
    </Card>
  );
};

export const ImageExportCardsGallery = ({
  inWizard = false,
  children,
}: React.PropsWithChildren<{ inWizard?: boolean }>) => {
  return (
    <Gallery hasGutter minWidths={{ default: inWizard ? undefined : '320px' }}>
      {children}
    </Gallery>
  );
};
