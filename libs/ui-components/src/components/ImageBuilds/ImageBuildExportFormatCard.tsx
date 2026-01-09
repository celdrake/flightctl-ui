import * as React from 'react';
import { Card, CardBody, Checkbox } from '@patternfly/react-core';
import { VirtualMachineIcon } from '@patternfly/react-icons/dist/js/icons/virtual-machine-icon';
import { CloudSecurityIcon } from '@patternfly/react-icons/dist/js/icons/cloud-security-icon';
import { ServerGroupIcon } from '@patternfly/react-icons/dist/js/icons/server-group-icon';

import { ExportFormatType } from '@flightctl/types/imagebuilder';
import { getExportFormatLabel } from '../../utils/imageBuilds';
import { useTranslation } from '../../hooks/useTranslation';

const iconMap: Record<string, React.ReactElement> = {
  vmdk: <VirtualMachineIcon />,
  qcow2: <CloudSecurityIcon />,
  iso: <ServerGroupIcon />,
};

type ExportFormatCardProps = {
  format: ExportFormatType;
  isChecked: boolean;
  onToggle: (format: ExportFormatType, isChecked: boolean) => void;
};

const ImageBuildExportFormatCard = ({ format, isChecked, onToggle }: ExportFormatCardProps) => {
  const { t } = useTranslation();
  const icon = iconMap[format];
  const label = getExportFormatLabel(t, format);

  return (
    <Card
      isSelectable
      isSelected={isChecked}
      style={{ minWidth: '120px', cursor: 'pointer' }}
      onClick={() => onToggle(format, !isChecked)}
    >
      <CardBody>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Checkbox
            id={`export-format-${format}`}
            isChecked={isChecked}
            onChange={(_, checked) => onToggle(format, checked)}
            onClick={(e) => e.stopPropagation()}
            aria-label={label}
          />
          {icon}
          <span>{label}</span>
        </div>
      </CardBody>
    </Card>
  );
};

export default ImageBuildExportFormatCard;
