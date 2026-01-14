import * as React from 'react';
import { TFunction } from 'react-i18next';
import { Card, CardBody, CardHeader, CardTitle, Icon, Stack, StackItem } from '@patternfly/react-core';
import { VirtualMachineIcon } from '@patternfly/react-icons/dist/js/icons/virtual-machine-icon';
import { CloudSecurityIcon } from '@patternfly/react-icons/dist/js/icons/cloud-security-icon';
import { ServerGroupIcon } from '@patternfly/react-icons/dist/js/icons/server-group-icon';

import { ExportFormatType } from '@flightctl/types/imagebuilder';
import { useTranslation } from '../../../hooks/useTranslation';
import { getExportFormatLabel } from '../../../utils/imageBuilds';

const iconMap: Record<string, React.ReactElement> = {
  vmdk: <VirtualMachineIcon />,
  qcow2: <CloudSecurityIcon />,
  iso: <ServerGroupIcon />,
};

type SelectImageBuildExportCardProps = {
  format: ExportFormatType;
  isChecked: boolean;
  onToggle: (format: ExportFormatType, isChecked: boolean) => void;
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

// CELIA-WIP: REvisit for PF6

const SelectImageBuildExportCard = ({ format, isChecked, onToggle }: SelectImageBuildExportCardProps) => {
  const { t } = useTranslation();

  const texts = React.useMemo(
    () => ({
      title: getExportFormatLabel(t, format),
      description: getDescription(t, format),
    }),
    [t, format],
  );

  const id = `export-format-${format}`;
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
          <StackItem style={{ fontWeight: 'bold' }}>{texts.title}</StackItem>
          <StackItem style={{ color: 'var(--pf-global--Color--200)' }}>{texts.description}</StackItem>
        </Stack>
      </CardBody>
    </Card>
  );
};

export default SelectImageBuildExportCard;
