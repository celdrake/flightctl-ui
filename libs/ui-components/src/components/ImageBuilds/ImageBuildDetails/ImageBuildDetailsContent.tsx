import * as React from 'react';
import {
  Alert,
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

import { BindingType, ImagePipelineResponse } from '@flightctl/types/imagebuilder';
import FlightControlDescriptionList from '../../common/FlightCtlDescriptionList';
import { getDateTimeDisplay } from '../../../utils/dates';
import { getExportFormatLabel } from '../../../utils/imageBuilds';
import { useTranslation } from '../../../hooks/useTranslation';
import DetailsPageCard, { DetailsPageCardBody } from '../../DetailsPage/DetailsPageCard';

// CELIA-WIP: DEtermine if there will be events for image builds

const ImageBuildDetailsContent = ({ imagePipeline }: { imagePipeline: ImagePipelineResponse }) => {
  const { t } = useTranslation();
  const imageBuild = imagePipeline.imageBuild;

  // CELIA-WIP: Get the repository URL from the repository name
  const srcRepositoryUrl = imageBuild.spec.source.repository;
  const dstRepositoryUrl = imageBuild.spec.destination.repository;
  const { binding } = imageBuild.spec;

  return (
    <Stack hasGutter>
      {/* Row 1: Image Details | Build Information */}
      <StackItem>
        <Grid hasGutter>
          <GridItem span={6}>
            <DetailsPageCard>
              <CardTitle>{t('Base image')}</CardTitle>
              <DetailsPageCardBody>
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
              </DetailsPageCardBody>
            </DetailsPageCard>
          </GridItem>
          <GridItem span={6}>
            <DetailsPageCard>
              <CardTitle>{t('Build information')}</CardTitle>
              <DetailsPageCardBody>
                <FlightControlDescriptionList isCompact isHorizontal isFluid>
                  <DescriptionListGroup>
                    <DescriptionListTerm>{t('Created')}</DescriptionListTerm>
                    <DescriptionListDescription>
                      {getDateTimeDisplay(imageBuild.metadata.creationTimestamp)}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                </FlightControlDescriptionList>
              </DetailsPageCardBody>
            </DetailsPageCard>
          </GridItem>
        </Grid>
      </StackItem>

      {/* Row 2: Image Output | Registration */}
      <StackItem>
        <Grid hasGutter>
          <GridItem span={6}>
            <DetailsPageCard>
              <CardTitle>{t('Image output')}</CardTitle>
              <DetailsPageCardBody>
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
                      {imagePipeline.imageExports
                        ? imagePipeline.imageExports.map((imageExport, idx) => (
                            <Label key={idx} color="blue">
                              {getExportFormatLabel(t, imageExport.spec.format)}
                            </Label>
                          ))
                        : t('None')}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                </FlightControlDescriptionList>
              </DetailsPageCardBody>
            </DetailsPageCard>
          </GridItem>
          <GridItem span={6}>
            <DetailsPageCard>
              <CardTitle>{t('Registration')}</CardTitle>
              <DetailsPageCardBody>
                <FlightControlDescriptionList isCompact isHorizontal isFluid>
                  <DescriptionListGroup>
                    <DescriptionListTerm>{t('Binding')}</DescriptionListTerm>
                    <DescriptionListDescription>
                      {imageBuild.spec.binding.type === BindingType.BindingTypeEarly
                        ? t('Early binding')
                        : t('Late binding')}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  {binding.type === BindingType.BindingTypeEarly && (
                    <>
                      <DescriptionListGroup>
                        <DescriptionListTerm>{t('Certificate name')}</DescriptionListTerm>
                        <DescriptionListDescription>{binding.certName}</DescriptionListDescription>
                      </DescriptionListGroup>
                    </>
                  )}
                  {binding.type === BindingType.BindingTypeLate && (
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
              </DetailsPageCardBody>
            </DetailsPageCard>
          </GridItem>
        </Grid>
      </StackItem>
    </Stack>
  );
};

export default ImageBuildDetailsContent;
