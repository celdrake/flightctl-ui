import * as React from 'react';
import {
  Alert,
  Card,
  CardBody,
  CardTitle,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Label,
  Stack,
  StackItem,
} from '@patternfly/react-core';
import { useFormikContext } from 'formik';

import { Repository } from '@flightctl/types';
import { BindingType, EarlyBinding } from '@flightctl/types/imagebuilder';
import { useTranslation } from '../../../../hooks/useTranslation';
import { getErrorMessage } from '../../../../utils/error';
import FlightCtlDescriptionList from '../../../common/FlightCtlDescriptionList';
import { ImageBuildFormValues, ImageBuildWizardError } from '../types';
import { getImageReference } from '../../../../utils/imageBuilds';
import { getExportFormatLabel } from '../../../../utils/imageBuilds';
import { getDateDisplay } from '../../../../utils/dates';
import { timeUntilText } from '../../../../utils/dates';

export const reviewStepId = 'review';

type ReviewStepProps = {
  error?: ImageBuildWizardError;
  repositories: Repository[];
};

const ReviewStep = ({ error, repositories }: ReviewStepProps) => {
  const { t } = useTranslation();
  const { values } = useFormikContext<ImageBuildFormValues>();

  const srcImageReference = React.useMemo(
    () => getImageReference(values.source, repositories),
    [repositories, values.source],
  );

  const dstImageReference = React.useMemo(
    () => getImageReference(values.destination, repositories),
    [repositories, values.destination],
  );

  const isEarlyBinding = values.binding.type === BindingType.BindingTypeEarly;
  const earlyBinding = values.binding as EarlyBinding;
  const fakeExpirationDate = '2026-01-27';

  return (
    <Stack hasGutter>
      <StackItem>
        <Alert isInline variant="info" title={t('Ready to build')}>
          {t(
            'Your image configuration is complete and ready to build. The build process may take several minutes depending on the size and complexity of your image.',
          )}
        </Alert>
      </StackItem>
      <StackItem>
        <Card>
          <CardTitle>{t('Base image')}</CardTitle>
          <CardBody>
            <FlightCtlDescriptionList isHorizontal columnModifier={{ default: '2Col' }}>
              <DescriptionListGroup>
                <DescriptionListTerm>{t('Registry')}</DescriptionListTerm>
                <DescriptionListDescription>{values.source.repository}</DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>{t('Image name')}</DescriptionListTerm>
                <DescriptionListDescription>{values.source.imageName}</DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>{t('Image tag')}</DescriptionListTerm>
                <DescriptionListDescription>{values.source.imageTag}</DescriptionListDescription>
              </DescriptionListGroup>
              {srcImageReference && (
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Image reference')}</DescriptionListTerm>
                  <DescriptionListDescription>{srcImageReference}</DescriptionListDescription>
                </DescriptionListGroup>
              )}
            </FlightCtlDescriptionList>
          </CardBody>
        </Card>
      </StackItem>
      <StackItem>
        <Card>
          <CardTitle>{t('Image output')}</CardTitle>
          <CardBody>
            <FlightCtlDescriptionList isHorizontal columnModifier={{ default: '2Col' }}>
              <DescriptionListGroup>
                <DescriptionListTerm>{t('Target registry')}</DescriptionListTerm>
                <DescriptionListDescription>{values.destination.repository}</DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>{t('Image name')}</DescriptionListTerm>
                <DescriptionListDescription>{values.destination.imageName}</DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>{t('Image tag')}</DescriptionListTerm>
                <DescriptionListDescription>{values.destination.tag}</DescriptionListDescription>
              </DescriptionListGroup>
              {dstImageReference && (
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Image reference')}</DescriptionListTerm>
                  <DescriptionListDescription>{dstImageReference}</DescriptionListDescription>
                </DescriptionListGroup>
              )}
              {values.exportFormats.length > 0 && (
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Export formats')}</DescriptionListTerm>
                  <DescriptionListDescription>
                    {values.exportFormats.map((format) => (
                      <Label key={format} color="blue" className="pf-v5-u-mr-sm">
                        {getExportFormatLabel(t, format)}
                      </Label>
                    ))}
                  </DescriptionListDescription>
                </DescriptionListGroup>
              )}
            </FlightCtlDescriptionList>
          </CardBody>
        </Card>
      </StackItem>
      <StackItem>
        <Card>
          <CardTitle>{t('Registration')}</CardTitle>
          <CardBody>
            <FlightCtlDescriptionList isHorizontal columnModifier={{ default: '2Col' }}>
              <DescriptionListGroup>
                <DescriptionListTerm>{t('Binding type')}</DescriptionListTerm>
                <DescriptionListDescription>
                  {isEarlyBinding ? t('Early binding') : t('Late binding')}
                </DescriptionListDescription>
              </DescriptionListGroup>
              {earlyBinding.certName && (
                <>
                  <DescriptionListGroup>
                    <DescriptionListTerm>{t('Certificate')}</DescriptionListTerm>
                    <DescriptionListDescription>{earlyBinding.certName}</DescriptionListDescription>
                  </DescriptionListGroup>
                </>
              )}
              {isEarlyBinding && !earlyBinding.certName && (
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Auto-create certificate')}</DescriptionListTerm>
                  <DescriptionListDescription>{t('Yes')}</DescriptionListDescription>
                </DescriptionListGroup>
              )}
              {isEarlyBinding && (
                <>
                  <DescriptionListGroup>
                    <DescriptionListTerm>{t('Certificate expiration date')}</DescriptionListTerm>
                    <DescriptionListDescription>
                      {getDateDisplay(fakeExpirationDate)} ({timeUntilText(t, fakeExpirationDate)})
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                </>
              )}
            </FlightCtlDescriptionList>
          </CardBody>
        </Card>
      </StackItem>
      {!!error && (
        <StackItem>
          {error.type === 'build' ? (
            <Alert isInline variant="danger" title={t('Failed to create image build')}>
              {getErrorMessage(error.error)}
            </Alert>
          ) : (
            <Alert isInline variant="warning" title={t('Image build created, but some exports failed')}>
              <div>
                <p>
                  {t('The image build "{{buildName}}" was created successfully, but the following export(s) failed:', {
                    buildName: error.buildName,
                  })}
                </p>
                <ul>
                  {error.errors.map(({ format, error: exportError }, index) => (
                    <li key={index}>
                      <strong>{getExportFormatLabel(t, format)}:</strong> {getErrorMessage(exportError)}
                    </li>
                  ))}
                </ul>
              </div>
            </Alert>
          )}
        </StackItem>
      )}
    </Stack>
  );
};

export default ReviewStep;
