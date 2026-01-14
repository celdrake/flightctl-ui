import * as React from 'react';
import {
  Alert,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Content,
  Flex,
  FlexItem,
  FormSection,
  Icon,
} from '@patternfly/react-core';
import { CheckCircleIcon } from '@patternfly/react-icons/dist/js/icons/check-circle-icon';
import { FormikErrors, useFormikContext } from 'formik';

import { BindingType } from '@flightctl/types/imagebuilder';
import { ImageBuildFormValues } from '../types';
import { useTranslation } from '../../../../hooks/useTranslation';
import FlightCtlForm from '../../../form/FlightCtlForm';
import { CERTIFICATE_VALIDITY_IN_DAYS } from '../../../../constants';

export const registrationStepId = 'registration';

export const isRegistrationStepValid = (errors: FormikErrors<ImageBuildFormValues>) => !errors.bindingType;

const RegistrationStep = () => {
  const { t } = useTranslation();
  const { values, setFieldValue } = useFormikContext<ImageBuildFormValues>();

  const isEarlyBindingSelected = values.bindingType === BindingType.BindingTypeEarly;

  const handleEarlyBindingSelect = () => {
    if (values.bindingType !== BindingType.BindingTypeEarly) {
      setFieldValue('bindingType', BindingType.BindingTypeEarly);
    }
  };

  const handleLateBindingSelect = () => {
    if (values.bindingType !== BindingType.BindingTypeLate) {
      setFieldValue('bindingType', BindingType.BindingTypeLate);
    }
  };

  // CELIA-WIP: MOdify for PF6
  return (
    <FlightCtlForm>
      <FormSection>
        <Card id="early-binding-card" isSelectable isSelected={isEarlyBindingSelected}>
          <CardHeader
            selectableActions={{
              selectableActionId: 'early-binding',
              selectableActionAriaLabelledby: 'early-binding-card',
              name: 'early-binding',
              onChange: handleEarlyBindingSelect,
            }}
          >
            <CardTitle>
              <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapMd' }}>
                {isEarlyBindingSelected && (
                  <FlexItem>
                    <Icon status="success" size="sm">
                      <CheckCircleIcon />
                    </Icon>
                  </FlexItem>
                )}
                <FlexItem style={{ fontWeight: 'bold' }}>{t('Early binding')}</FlexItem>
              </Flex>
            </CardTitle>
          </CardHeader>
          <CardBody>
            <Content component="p">{t('Configure enrollment certificate settings during image build')}</Content>

            <FormSection>
              <Alert isInline variant="info" title={t('Certificate will be automatically created')}>
                {t(
                  'A certificate with {{ validity }} days of validity will be automatically created and embedded in the image. The device must connect to the management service before this registration window expires.',
                  { validity: CERTIFICATE_VALIDITY_IN_DAYS },
                )}
              </Alert>
            </FormSection>
          </CardBody>
        </Card>

        <Card id="late-binding-card" isSelectable isSelected={!isEarlyBindingSelected}>
          <CardHeader
            selectableActions={{
              selectableActionId: 'late-binding',
              selectableActionAriaLabelledby: 'late-binding-card',
              name: 'late-binding',
              onChange: handleLateBindingSelect,
            }}
          >
            <CardTitle>
              <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapMd' }}>
                {!isEarlyBindingSelected && (
                  <FlexItem>
                    <Icon status="success" size="sm">
                      <CheckCircleIcon />
                    </Icon>
                  </FlexItem>
                )}
                <FlexItem style={{ fontWeight: 'bold' }}>{t('Late binding')}</FlexItem>
              </Flex>
            </CardTitle>
          </CardHeader>
          <CardBody>
            <Content component="p">
              {t('No additional user input required (cloud-int and ignition are enabled automatically).')}
            </Content>
          </CardBody>
        </Card>
      </FormSection>
    </FlightCtlForm>
  );
};

export default RegistrationStep;
