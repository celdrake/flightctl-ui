import * as React from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Flex,
  FlexItem,
  FormGroup,
  FormSection,
  Gallery,
  Grid,
  Icon,
  Radio,
  Stack,
  StackItem,
  Text,
  TextContent,
} from '@patternfly/react-core';
import { CheckCircleIcon } from '@patternfly/react-icons/dist/js/icons/check-circle-icon';
import { FormikErrors, useFormikContext } from 'formik';

import { BindingType, EarlyBinding, LateBinding } from '@flightctl/types/imagebuilder';
import { ImageBuildFormValues } from '../types';
import { useTranslation } from '../../../../hooks/useTranslation';
import FlightCtlForm from '../../../form/FlightCtlForm';
import TextField from '../../../form/TextField';

export const registrationStepId = 'registration';

export const isRegistrationStepValid = (errors: FormikErrors<ImageBuildFormValues>) => {
  const { binding } = errors;
  if (!binding) {
    return true;
  }
  if (binding.type === BindingType.BindingTypeEarly) {
    const earlyBinding = binding as EarlyBinding;
    return !earlyBinding.certName;
  }
  return true;
};

const RegistrationStep = () => {
  const { t } = useTranslation();
  const { values, setFieldValue } = useFormikContext<ImageBuildFormValues>();

  const isEarlyBindingSelected = values.binding.type === BindingType.BindingTypeEarly;

  // Determine certificate option based on whether certName is set
  const initialCertificateOption = React.useMemo(() => {
    const earlyBinding = values.binding as EarlyBinding | undefined;
    if (earlyBinding?.certName) {
      return 'existing' as const;
    }
    return 'auto-create' as const;
  }, []);

  const [certificateOption, setCertificateOption] = React.useState<'existing' | 'auto-create'>(
    initialCertificateOption,
  );

  // Update certificate option when binding changes
  React.useEffect(() => {
    const earlyBinding = values.binding as EarlyBinding;
    if (earlyBinding.certName) {
      setCertificateOption('existing');
    } else if (isEarlyBindingSelected) {
      setCertificateOption('auto-create');
    }
  }, [values.binding, isEarlyBindingSelected]);

  const handleEarlyBindingSelect = () => {
    if (values.binding.type !== BindingType.BindingTypeEarly) {
      setFieldValue('binding', {
        type: BindingType.BindingTypeEarly,
        certName: '',
      } as EarlyBinding);
      setCertificateOption('auto-create');
    }
  };

  const handleLateBindingSelect = () => {
    if (values.binding.type !== BindingType.BindingTypeLate) {
      setFieldValue('binding', {
        type: BindingType.BindingTypeLate,
      } as LateBinding);
    }
  };

  const handleCertificateOptionChange = (option: 'existing' | 'auto-create') => {
    setCertificateOption(option);
    if (option === 'auto-create') {
      setFieldValue('binding.certName', '');
    }
    // For 'existing', we'll let the user fill in the certName field
  };

  // CELIA-WIP: MOdify for PF6
  return (
    <FlightCtlForm>
      <Grid lg={5} span={8}>
        <FormSection>
          <Gallery hasGutter minWidths={{ default: '300px' }}>
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
                <TextContent>
                  <Text>{t('Configure enrollment certificate settings during image build')}</Text>
                </TextContent>

                <FormSection>
                  <FormGroup label={t('Certificate option')} fieldId="certificate-option">
                    <Stack hasGutter>
                      <StackItem>
                        <Radio
                          id="choose-existing-cert"
                          name="certificateOption"
                          label={t('Choose from existing certificates')}
                          isChecked={certificateOption === 'existing'}
                          onChange={() => handleCertificateOptionChange('existing')}
                        />
                      </StackItem>
                      <StackItem>
                        <Radio
                          id="auto-create-cert"
                          name="certificateOption"
                          label={t('Auto-create certificate')}
                          isChecked={certificateOption === 'auto-create'}
                          onChange={() => handleCertificateOptionChange('auto-create')}
                        />
                      </StackItem>
                    </Stack>
                  </FormGroup>

                  {certificateOption === 'existing' && (
                    <FormGroup label={t('Certificate name')} fieldId="cert-name" isRequired>
                      <TextField
                        name="binding.certName"
                        aria-label={t('Certificate name')}
                        helperText={t('Name of the enrollment certificate resource to embed in the image')}
                      />
                    </FormGroup>
                  )}
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
                <TextContent>
                  <Text>
                    {t('No additional user input required (cloud-int and ignition are enabled automatically).')}
                  </Text>
                </TextContent>
              </CardBody>
            </Card>
          </Gallery>
        </FormSection>
      </Grid>
    </FlightCtlForm>
  );
};

export default RegistrationStep;
