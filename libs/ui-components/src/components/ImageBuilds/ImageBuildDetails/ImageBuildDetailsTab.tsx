import * as React from 'react';
import {
  Alert,
  CardBody,
  CardTitle,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Grid,
  GridItem,
  Label,
  Stack,
  StackItem,
} from '@patternfly/react-core';

import { BindingType, ImageExport } from '@flightctl/types/imagebuilder';
import FlightControlDescriptionList from '../../common/FlightCtlDescriptionList';
import { getDateTimeDisplay } from '../../../utils/dates';
import { getExportFormatLabel } from '../../../utils/imageBuilds';
import { useTranslation } from '../../../hooks/useTranslation';
import DetailsPageCard from '../../DetailsPage/DetailsPageCard';
import ImageBuildAndExportStatus from '../ImageBuildAndExportStatus';
import CopyButton from '../../common/CopyButton';
import { CERTIFICATE_VALIDITY_IN_DAYS } from '../../../constants';
import { ImageBuildWithExports } from '../../../types/extraTypes';

const ImageBuildDetailsTab = ({ imageBuild }: { imageBuild: ImageBuildWithExports }) => {
  const { t } = useTranslation();
  const srcRepositoryUrl = imageBuild.spec.source.repository;
  const dstRepositoryUrl = imageBuild.spec.destination.repository;
  const isEarlyBinding = imageBuild.spec.binding.type === BindingType.BindingTypeEarly;

  const hasExports = imageBuild.exportsCount > 0;
  const existingImageExports = imageBuild.imageExports.filter(
    (imageExport) => imageExport !== undefined,
  ) as ImageExport[];

  return (
    <Stack hasGutter>
      <StackItem>
        <Grid hasGutter>
          <GridItem span={6}>
            <DetailsPageCard>
              <CardTitle>{t('Base image')}</CardTitle>
              <CardBody>
                <FlightControlDescriptionList isCompact isHorizontal isFluid>
                  <DescriptionListGroup>
                    <DescriptionListTerm>{t('Registry')}</DescriptionListTerm>
                    <DescriptionListDescription>{srcRepositoryUrl}</DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>{t('Name')}</DescriptionListTerm>
                    <DescriptionListDescription>{imageBuild.spec.source.imageName}</DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>{t('Tag')}</DescriptionListTerm>
                    <DescriptionListDescription>{imageBuild.spec.source.imageTag}</DescriptionListDescription>
                  </DescriptionListGroup>
                </FlightControlDescriptionList>
              </CardBody>
            </DetailsPageCard>
          </GridItem>
          <GridItem span={6}>
            <DetailsPageCard>
              <CardTitle>{t('Build information')}</CardTitle>
              <CardBody>
                <FlightControlDescriptionList isCompact isHorizontal isFluid>
                  <DescriptionListGroup>
                    <DescriptionListTerm>{t('Created')}</DescriptionListTerm>
                    <DescriptionListDescription>
                      {getDateTimeDisplay(imageBuild.metadata.creationTimestamp)}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                </FlightControlDescriptionList>
              </CardBody>
            </DetailsPageCard>
          </GridItem>
        </Grid>
      </StackItem>
      <StackItem>
        <Grid hasGutter>
          <GridItem span={6}>
            <DetailsPageCard>
              <CardTitle>{t('Image output')}</CardTitle>
              <CardBody>
                <FlightControlDescriptionList isCompact isHorizontal isFluid>
                  <DescriptionListGroup>
                    <DescriptionListTerm>{t('Registry')}</DescriptionListTerm>
                    <DescriptionListDescription>{dstRepositoryUrl}</DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>{t('Name')}</DescriptionListTerm>
                    <DescriptionListDescription>{imageBuild.spec.destination.imageName}</DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>{t('Tag')}</DescriptionListTerm>
                    <DescriptionListDescription>{imageBuild.spec.destination.tag}</DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>{t('Image export formats')}</DescriptionListTerm>
                    <DescriptionListDescription>
                      {hasExports
                        ? existingImageExports.map((imageExport) => (
                            <Label key={imageExport.spec.format} color="blue" className="pf-v6-u-mr-sm">
                              {getExportFormatLabel(imageExport.spec.format)}
                            </Label>
                          ))
                        : t('None')}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                </FlightControlDescriptionList>
              </CardBody>
            </DetailsPageCard>
          </GridItem>
          <GridItem span={6}>
            <DetailsPageCard>
              <CardTitle>{t('Registration')}</CardTitle>
              <CardBody>
                <FlightControlDescriptionList isCompact isHorizontal isFluid>
                  <DescriptionListGroup>
                    <DescriptionListTerm>{t('Binding')}</DescriptionListTerm>
                    <DescriptionListDescription>
                      {isEarlyBinding ? t('Early binding') : t('Late binding')}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  {isEarlyBinding && (
                    <DescriptionListGroup>
                      <DescriptionListTerm>&nbsp;</DescriptionListTerm>
                      <DescriptionListDescription>
                        <Alert variant="info" isInline title={t('Certificate auto-created')}>
                          {t(
                            'A certificate with {{ validity }} days of validity is automatically created and embedded in the image for early binding.',
                            { validity: CERTIFICATE_VALIDITY_IN_DAYS },
                          )}
                        </Alert>
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                  )}
                  {!isEarlyBinding && (
                    <DescriptionListGroup>
                      <DescriptionListTerm>&nbsp;</DescriptionListTerm>
                      <DescriptionListDescription>
                        <Alert variant="info" isInline title={t('Cloud-init and Ignition enabled')}>
                          {t('Cloud-init and Ignition are automatically enabled for late binding.')}
                        </Alert>
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                  )}
                </FlightControlDescriptionList>
              </CardBody>
            </DetailsPageCard>
          </GridItem>
        </Grid>
      </StackItem>
      <StackItem>
        <Grid hasGutter>
          <GridItem span={12}>
            <DetailsPageCard>
              <CardTitle>{t('Status')}</CardTitle>
              <CardBody>
                <FlightControlDescriptionList isCompact isHorizontal isFluid>
                  <DescriptionListGroup>
                    <DescriptionListTerm>{t('Build status')}</DescriptionListTerm>
                    <DescriptionListDescription>
                      <ImageBuildAndExportStatus imageStatus={imageBuild.status} />
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  {imageBuild.status?.imageReference && (
                    <DescriptionListGroup>
                      <DescriptionListTerm>{t('Image reference')}</DescriptionListTerm>
                      <DescriptionListDescription>
                        {imageBuild.status.imageReference}
                        <CopyButton text={imageBuild.status.imageReference} ariaLabel={t('Copy image reference')} />
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                  )}
                  {imageBuild.status?.lastSeen && (
                    <DescriptionListGroup>
                      <DescriptionListTerm>{t('Last seen')}</DescriptionListTerm>
                      <DescriptionListDescription>
                        {getDateTimeDisplay(imageBuild.status.lastSeen)}
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                  )}
                  {!imageBuild.status && (
                    <DescriptionListGroup>
                      <DescriptionListTerm>&nbsp;</DescriptionListTerm>
                      <DescriptionListDescription>{t('No status information available')}</DescriptionListDescription>
                    </DescriptionListGroup>
                  )}
                </FlightControlDescriptionList>
              </CardBody>
            </DetailsPageCard>
          </GridItem>
        </Grid>
      </StackItem>
    </Stack>
  );
};

export default ImageBuildDetailsTab;
