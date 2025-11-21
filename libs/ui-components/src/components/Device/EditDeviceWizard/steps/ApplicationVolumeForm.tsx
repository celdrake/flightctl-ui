import * as React from 'react';
import { FieldArray, useField } from 'formik';
import { Button, FormGroup, FormSection, Grid, Split, SplitItem } from '@patternfly/react-core';
import { MinusCircleIcon } from '@patternfly/react-icons/dist/js/icons/minus-circle-icon';
import { PlusCircleIcon } from '@patternfly/react-icons/dist/js/icons/plus-circle-icon';

import { ImagePullPolicy } from '@flightctl/types';
import { ApplicationVolumeForm as VolumeFormType } from '../../../../types/deviceSpec';
import { useTranslation } from '../../../../hooks/useTranslation';
import TextField from '../../../form/TextField';
import FormSelect from '../../../form/FormSelect';
import ErrorHelperText from '../../../form/FieldHelperText';
import { FormGroupWithHelperText } from '../../../common/WithHelperText';

type ApplicationVolumeFormProps = {
  appFieldName: string;
  volumes: VolumeFormType[];
  isReadOnly?: boolean;
};

const ApplicationVolumeForm = ({ appFieldName, volumes, isReadOnly }: ApplicationVolumeFormProps) => {
  const { t } = useTranslation();
  const [, { error }] = useField<VolumeFormType[]>(`${appFieldName}.volumes`);

  const pullPolicyOptions = {
    [ImagePullPolicy.PullIfNotPresent]: t('IfNotPresent'),
    [ImagePullPolicy.PullAlways]: t('Always'),
    [ImagePullPolicy.PullNever]: t('Never'),
  };

  const volumesError = typeof error === 'string' ? error : undefined;

  return (
    <FormGroup label={t('Volumes')}>
      <small>
        {t(
          'Configure persistent volumes for your application. Volumes can be populated from OCI artifacts or mounted at specific paths.',
        )}
      </small>
      <FieldArray name={`${appFieldName}.volumes`}>
        {({ push, remove }) => (
          <>
            {volumes.map((volume, volumeIndex) => {
              const volumeFieldName = `${appFieldName}.volumes[${volumeIndex}]`;
              return (
                <FormSection key={volumeIndex} className="pf-v5-u-mt-md">
                  <Grid hasGutter>
                    <FormGroup label={t('Volume {{ number }}', { number: volumeIndex + 1 })}>
                      <Split hasGutter>
                        <SplitItem isFilled>
                          <FormGroup label={t('Name')} isRequired>
                            <TextField
                              aria-label={t('Volume name')}
                              name={`${volumeFieldName}.name`}
                              value={volume.name || ''}
                              isDisabled={isReadOnly}
                              helperText={t('Unique name for this volume within the application')}
                            />
                          </FormGroup>
                        </SplitItem>
                        {!isReadOnly && (
                          <SplitItem>
                            <Button
                              aria-label={t('Delete volume')}
                              variant="link"
                              icon={<MinusCircleIcon />}
                              iconPosition="end"
                              onClick={() => remove(volumeIndex)}
                            />
                          </SplitItem>
                        )}
                      </Split>
                    </FormGroup>

                    <FormGroupWithHelperText
                      label={t('Image reference')}
                      content={t(
                        'Optional: OCI artifact reference containing the volume contents. This allows delivering large datasets (such as ML models or static assets) as part of the application deployment.',
                      )}
                    >
                      <TextField
                        aria-label={t('Image reference')}
                        name={`${volumeFieldName}.imageRef`}
                        value={volume.imageRef || ''}
                        placeholder={t('e.g., registry.example.com/data:latest')}
                        isDisabled={isReadOnly}
                        helperText={t('Fully qualified OCI artifact reference')}
                      />
                    </FormGroupWithHelperText>

                    {volume.imageRef && (
                      <FormGroupWithHelperText
                        label={t('Pull policy')}
                        content={t(
                          'Defines pull behavior: Always pulls every time, IfNotPresent only pulls if not already present, Never requires the image to already exist on the device.',
                        )}
                      >
                        <FormSelect
                          name={`${volumeFieldName}.imagePullPolicy`}
                          items={pullPolicyOptions}
                          placeholderText={t('Select pull policy')}
                          helperText={t('Defaults to IfNotPresent if not specified')}
                        />
                      </FormGroupWithHelperText>
                    )}

                    <FormGroupWithHelperText
                      label={t('Mount path')}
                      content={t(
                        'Optional: Mount path in the container. Can include options like ":ro" for read-only (e.g., "/data:ro").',
                      )}
                    >
                      <TextField
                        aria-label={t('Mount path')}
                        name={`${volumeFieldName}.mountPath`}
                        value={volume.mountPath || ''}
                        placeholder={t('e.g., /data or /data:ro')}
                        isDisabled={isReadOnly}
                        helperText={t('Path where the volume will be mounted in the container')}
                      />
                    </FormGroupWithHelperText>
                  </Grid>
                </FormSection>
              );
            })}
            <ErrorHelperText error={volumesError} />
            {!isReadOnly && (
              <FormGroup className="pf-v5-u-mt-md">
                <Button
                  variant="link"
                  icon={<PlusCircleIcon />}
                  iconPosition="start"
                  onClick={() => {
                    push({
                      name: '',
                    });
                  }}
                >
                  {t('Add volume')}
                </Button>
              </FormGroup>
            )}
          </>
        )}
      </FieldArray>
    </FormGroup>
  );
};

export default ApplicationVolumeForm;
