import * as React from 'react';
import { Button, Card, CardBody, CardHeader, CardTitle, Icon, Stack, StackItem } from '@patternfly/react-core';
import { VirtualMachineIcon } from '@patternfly/react-icons/dist/js/icons/virtual-machine-icon';
import { CloudSecurityIcon } from '@patternfly/react-icons/dist/js/icons/cloud-security-icon';
import { ServerGroupIcon } from '@patternfly/react-icons/dist/js/icons/server-group-icon';
import { TFunction } from 'react-i18next';

import { getExportFormatLabel } from '../../../utils/imageBuilds';
import { useTranslation } from '../../../hooks/useTranslation';
import { ExportFormatType, ImageExport } from '@flightctl/types/imagebuilder';
import { isImageExportFailed } from '../CreateImageBuildWizard/utils';

const iconMap: Record<string, React.ReactElement> = {
  vmdk: <VirtualMachineIcon />,
  qcow2: <CloudSecurityIcon />,
  iso: <ServerGroupIcon />,
};

const getDescription = (t: TFunction, format: ExportFormatType) => {
  switch (format) {
    case ExportFormatType.ExportFormatTypeVMDK:
      return t('For VMware vSphere and enterprise hypervisors');
    case ExportFormatType.ExportFormatTypeQCOW2:
      return t('For OpenStack and KVM-based cloud environments');
    case ExportFormatType.ExportFormatTypeISO:
      return t('Bootable image for physical hardware installation');
  }
};

export type ImageExportFormatCardProps = {
  format: ExportFormatType;
  imageExport?: ImageExport;
  onExportImage: (format: ExportFormatType) => void;
  onRetry: (format: ExportFormatType) => void;
  isCreating: boolean;
};

const ViewImageBuildExportCard = ({
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
    <Card>
      <CardHeader>
        <CardTitle>
          <Icon size="lg">{iconMap[format]}</Icon>
        </CardTitle>
      </CardHeader>
      <CardBody>
        <Stack hasGutter>
          <StackItem style={{ fontWeight: 'bold' }}>{getExportFormatLabel(t, format)}</StackItem>
          <StackItem style={{ color: 'var(--pf-global--Color--200)' }}>{getDescription(t, format)}</StackItem>
          <StackItem>
            <Stack>
              {failedExport && (
                <StackItem>
                  <Button
                    variant="primary"
                    onClick={() => onRetry(format)}
                    isDisabled={isCreating}
                    isLoading={isCreating}
                  >
                    {t('Retry')}
                  </Button>
                </StackItem>
              )}
              <StackItem>
                <Button variant="secondary">{t('View logs')}</Button>
              </StackItem>
              {!exists && (
                <StackItem>
                  <Button
                    variant="secondary"
                    onClick={() => onExportImage(format)}
                    isDisabled={isCreating}
                    isLoading={isCreating}
                  >
                    {t('Export image')}
                  </Button>
                </StackItem>
              )}
            </Stack>
          </StackItem>
        </Stack>
      </CardBody>
    </Card>
  );
};

export default ViewImageBuildExportCard;
