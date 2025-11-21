import * as React from 'react';
import { useField } from 'formik';
import { Button, FormGroup, Grid, Label, LabelGroup, Split, SplitItem, TextInput } from '@patternfly/react-core';
import { ArrowRightIcon } from '@patternfly/react-icons/dist/js/icons/arrow-right-icon';

import { FormGroupWithHelperText } from '../../../common/WithHelperText';
import TextField from '../../../form/TextField';
import ExpandableFormSection from '../../../form/ExpandableFormSection';
import { useTranslation } from '../../../../hooks/useTranslation';
import { SingleContainerAppForm, PortMapping } from '../../../../types/deviceSpec';

const ApplicationContainerForm = ({
  app,
  index,
  isReadOnly,
}: {
  app: SingleContainerAppForm;
  index: number;
  isReadOnly?: boolean;
}) => {
  const { t } = useTranslation();
  const appFieldName = `applications[${index}]`;
  const [{ value: ports }, , { setValue: setPorts, setTouched }] = useField<PortMapping[]>(`${appFieldName}.ports`);
  const [hostPort, setHostPort] = React.useState('');
  const [containerPort, setContainerPort] = React.useState('');

  const updatePorts = async (newPorts: PortMapping[]) => {
    await setPorts(newPorts, true);
    setTouched(true);
  };

  const onAddPort = () => {
    if (hostPort.trim() && containerPort.trim()) {
      updatePorts([...(ports || []), { hostPort: hostPort.trim(), containerPort: containerPort.trim() }]);
      setHostPort('');
      setContainerPort('');
    }
  };

  const onDeletePort = async (index: number) => {
    const newPorts = [...(ports || [])];
    newPorts.splice(index, 1);
    await updatePorts(newPorts);
  };

  const onEditPort = async (index: number, newText: string) => {
    const [newHostPort, newContainerPort] = newText.split(':');
    if (newHostPort && newContainerPort) {
      const newPorts = [...(ports || [])];
      newPorts[index] = { hostPort: newHostPort.trim(), containerPort: newContainerPort.trim() };
      await updatePorts(newPorts);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onAddPort();
    }
  };

  return (
    <Grid hasGutter>
      <FormGroup label={t('Image')} isRequired>
        <TextField
          aria-label={t('Image')}
          name={`${appFieldName}.image`}
          value={app.image || ''}
          isDisabled={isReadOnly}
          helperText={t('Provide a valid image reference')}
        />
      </FormGroup>

      <FormGroup label={t('Ports')}>
        <small>{t('Provide a list of ports to map to the container')}</small>
        {!isReadOnly && (
          <Split hasGutter className="pf-v5-u-mt-sm">
            <SplitItem isFilled>
              <FormGroupWithHelperText
                label={t('Host port')}
                content={t('The port on the host machine (e.g., "8080")')}
              >
                <TextInput
                  aria-label={t('Host port')}
                  value={hostPort}
                  onChange={(_, value) => setHostPort(value)}
                  onKeyDown={handleKeyDown}
                  isDisabled={isReadOnly}
                />
              </FormGroupWithHelperText>
            </SplitItem>
            <SplitItem isFilled>
              <FormGroupWithHelperText
                label={t('Container port')}
                content={t('The port inside the container (e.g., "80")')}
              >
                <TextInput
                  aria-label={t('Container port')}
                  value={containerPort}
                  onChange={(_, value) => setContainerPort(value)}
                  onKeyDown={handleKeyDown}
                  isDisabled={isReadOnly}
                />
              </FormGroupWithHelperText>
            </SplitItem>
            <SplitItem style={{ alignSelf: 'flex-end' }}>
              <Button
                aria-label={t('Add port mapping')}
                variant="control"
                icon={<ArrowRightIcon />}
                iconPosition="end"
                onClick={onAddPort}
                isDisabled={!hostPort.trim() || !containerPort.trim() || isReadOnly}
              >
                {t('Add')}
              </Button>
            </SplitItem>
          </Split>
        )}
        {ports && ports.length > 0 && (
          <LabelGroup numLabels={5} categoryName={t('Added ports')} isEditable={!isReadOnly} className="pf-v5-u-mt-md">
            {ports.map((port, portIndex) => {
              const portText = `${port.hostPort}:${port.containerPort}`;
              return (
                <Label
                  key={`${port.hostPort}_${port.containerPort}_${portIndex}`}
                  textMaxWidth="16ch"
                  onClose={!isReadOnly ? () => onDeletePort(portIndex) : undefined}
                  onEditComplete={!isReadOnly ? (_, newText) => onEditPort(portIndex, newText) : undefined}
                  title={portText}
                  isEditable={!isReadOnly}
                >
                  {portText}
                </Label>
              );
            })}
          </LabelGroup>
        )}
      </FormGroup>
      <FormGroup label={t('Resources')}>
        <Grid hasGutter>
          <FormGroupWithHelperText
            label={t('CPU limit')}
            content={t('Provide a valid CPU value (e.g., "500m" or "2").')}
          >
            <TextField
              aria-label={t('CPU limit')}
              name={`${appFieldName}.limits.cpu`}
              value={app.limits?.cpu || ''}
              placeholder=""
              isDisabled={isReadOnly}
            />
          </FormGroupWithHelperText>
          <FormGroupWithHelperText
            label={t('Memory limit')}
            content={t('Memory limit with unit (e.g., "256m", "2g") using Podman format')}
          >
            <TextField
              aria-label={t('Memory limit')}
              name={`${appFieldName}.limits.memory`}
              value={app.limits?.memory || ''}
              placeholder="256m"
              isDisabled={isReadOnly}
            />
          </FormGroupWithHelperText>
        </Grid>
      </FormGroup>
    </Grid>
  );
};

export default ApplicationContainerForm;
