import * as React from 'react';
import { FieldArray } from 'formik';
import { Button, FormGroup, Grid, Split, SplitItem } from '@patternfly/react-core';
import { MinusCircleIcon } from '@patternfly/react-icons/dist/js/icons/minus-circle-icon';
import { PlusCircleIcon } from '@patternfly/react-icons/dist/js/icons/plus-circle-icon';

import { FormGroupWithHelperText } from '../../../common/WithHelperText';
import TextField from '../../../form/TextField';
import LearnMoreLink from '../../../common/LearnMoreLink';
import { useTranslation } from '../../../../hooks/useTranslation';
import { useAppLinks } from '../../../../hooks/useAppLinks';
import { SingleContainerAppForm } from '../../../../types/deviceSpec';
import ExpandableFormSection from '../../../form/ExpandableFormSection';

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
  const createAppLink = useAppLinks('createApp');
  const appFieldName = `applications[${index}]`;

  return (
    <Grid hasGutter>
      <FormGroupWithHelperText
        label={t('Image')}
        content={
          <span>
            {t('The container image. Learn how to create one')} <LearnMoreLink text={t('here')} link={createAppLink} />
          </span>
        }
        isRequired
      >
        <TextField
          aria-label={t('Image')}
          name={`${appFieldName}.image`}
          value={app.image || ''}
          isDisabled={isReadOnly}
        />
      </FormGroupWithHelperText>

      <ExpandableFormSection
        title={t('Port mappings')}
        fieldName={`${appFieldName}.ports`}
        description={t('Optional port mappings in format "hostPort:containerPort"')}
      >
        <FieldArray name={`${appFieldName}.ports`}>
          {({ push, remove }) => (
            <>
              {app.ports?.map((port, portIndex) => (
                <Split hasGutter key={portIndex}>
                  <SplitItem isFilled>
                    <FormGroupWithHelperText
                      label={t('Port mapping {{ number }}', { number: portIndex + 1 })}
                      content={t('Format: "hostPort:containerPort" (e.g., "8080:80")')}
                    >
                      <TextField
                        aria-label={t('Port mapping')}
                        name={`${appFieldName}.ports.${portIndex}`}
                        value={port}
                        placeholder="8080:80"
                        isDisabled={isReadOnly}
                      />
                    </FormGroupWithHelperText>
                  </SplitItem>
                  {!isReadOnly && (
                    <SplitItem>
                      <FormGroup label=" ">
                        <Button
                          aria-label={t('Delete port mapping')}
                          variant="link"
                          icon={<MinusCircleIcon />}
                          iconPosition="end"
                          onClick={() => remove(portIndex)}
                        />
                      </FormGroup>
                    </SplitItem>
                  )}
                </Split>
              ))}
              {!isReadOnly && (
                <FormGroup>
                  <Button
                    variant="link"
                    icon={<PlusCircleIcon />}
                    iconPosition="start"
                    onClick={() => {
                      push('');
                    }}
                  >
                    {t('Add port mapping')}
                  </Button>
                </FormGroup>
              )}
            </>
          )}
        </FieldArray>
      </ExpandableFormSection>

      <ExpandableFormSection
        title={t('Resource limits')}
        fieldName={`${appFieldName}.resources`}
        description={t('Optional CPU and memory limits for the container')}
      >
        <Grid hasGutter>
          <FormGroupWithHelperText label={t('CPU limit')} content={t('CPU limit in cores (e.g., "1", "0.75")')}>
            <TextField
              aria-label={t('CPU limit')}
              name={`${appFieldName}.resources.limits.cpu`}
              value={app.resources?.limits?.cpu || ''}
              placeholder="0.75"
              isDisabled={isReadOnly}
            />
          </FormGroupWithHelperText>
          <FormGroupWithHelperText
            label={t('Memory limit')}
            content={t('Memory limit with unit (e.g., "256m", "2g") using Podman format')}
          >
            <TextField
              aria-label={t('Memory limit')}
              name={`${appFieldName}.resources.limits.memory`}
              value={app.resources?.limits?.memory || ''}
              placeholder="256m"
              isDisabled={isReadOnly}
            />
          </FormGroupWithHelperText>
        </Grid>
      </ExpandableFormSection>
    </Grid>
  );
};

export default ApplicationContainerForm;
