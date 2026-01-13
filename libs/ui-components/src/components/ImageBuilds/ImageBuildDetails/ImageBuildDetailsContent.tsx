import * as React from 'react';
import {
  Alert,
  Button,
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

import { BindingType, ExportFormatType, ImageBuild } from '@flightctl/types/imagebuilder';
import FlightControlDescriptionList from '../../common/FlightCtlDescriptionList';
import { getDateTimeDisplay } from '../../../utils/dates';
import { getExportFormatLabel } from '../../../utils/imageBuilds';
import { useTranslation } from '../../../hooks/useTranslation';
import DetailsPageCard, { DetailsPageCardBody } from '../../DetailsPage/DetailsPageCard';
import ImageBuildStatus from '../ImageBuildStatus';
import { CopyIcon } from '@patternfly/react-icons/dist/js/icons/copy-icon';
import CopyButton from '../../common/CopyButton';

// CELIA-WIP: DEtermine if there will be events for image builds

const ImageBuildDetailsContent = ({ imageBuild }: { imageBuild: ImageBuild }) => {
  const { t } = useTranslation();

  // CELIA-WIP: Get the repository URL from the repository name
  const srcRepositoryUrl = imageBuild.spec.source.repository;
  const dstRepositoryUrl = imageBuild.spec.destination.repository;
  const { binding } = imageBuild.spec;

  // CELIA-WIP: Get the export formats associated with the image build
  const exportFormats = [
    ExportFormatType.ExportFormatTypeVMDK,
    ExportFormatType.ExportFormatTypeQCOW2,
    ExportFormatType.ExportFormatTypeISO,
  ];

  return (
    <Stack hasGutter>
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
                      {exportFormats.length > 0
                        ? exportFormats.map((format, idx) => (
                            <Label key={idx} color="blue" className="pf-v5-u-mr-sm">
                              {getExportFormatLabel(t, format)}
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
      <StackItem>
        <Grid hasGutter>
          <GridItem span={12}>
            <DetailsPageCard>
              <CardTitle>{t('Status')}</CardTitle>
              <DetailsPageCardBody>
                <FlightControlDescriptionList isCompact isHorizontal isFluid>
                  <DescriptionListGroup>
                    <DescriptionListTerm>{t('Build status')}</DescriptionListTerm>
                    <DescriptionListDescription>
                      <ImageBuildStatus buildStatus={imageBuild.status} />
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
              </DetailsPageCardBody>
            </DetailsPageCard>
          </GridItem>
        </Grid>
      </StackItem>
    </Stack>
  );
};

export default ImageBuildDetailsContent;
