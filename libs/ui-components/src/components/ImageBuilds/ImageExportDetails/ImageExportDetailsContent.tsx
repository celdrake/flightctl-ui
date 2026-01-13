import * as React from 'react';
import {
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

import FlightControlDescriptionList from '../../common/FlightCtlDescriptionList';
import { getDateTimeDisplay } from '../../../utils/dates';
import { getExportFormatLabel } from '../../../utils/imageBuilds';
import { useTranslation } from '../../../hooks/useTranslation';
import DetailsPageCard, { DetailsPageCardBody } from '../../DetailsPage/DetailsPageCard';
import { ExportFormatType, ImageExport } from '@flightctl/types/imagebuilder';

const ImageExportDetailsContent = ({ imageExports }: { imageExports: Record<ExportFormatType, ImageExport> }) => {
  const { t } = useTranslation();

  // Get the first available export (or handle multiple formats as needed)
  const imageExport = Object.values(imageExports)[0];

  if (!imageExport) {
    return <div>{t('No image exports available')}</div>;
  }

  const { destination, format, tagSuffix } = imageExport.spec;

  return (
    <Stack hasGutter>
      <StackItem>
        <Grid hasGutter>
          <GridItem span={12}>
            <DetailsPageCard>
              <CardTitle>{t('Export information')}</CardTitle>
              <DetailsPageCardBody>
                <FlightControlDescriptionList isCompact isHorizontal isFluid>
                  <DescriptionListGroup>
                    <DescriptionListTerm>{t('Created')}</DescriptionListTerm>
                    <DescriptionListDescription>
                      {getDateTimeDisplay(imageExport.metadata.creationTimestamp)}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>{t('Format')}</DescriptionListTerm>
                    <DescriptionListDescription>
                      <Label color="blue">{getExportFormatLabel(t, format)}</Label>
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  {tagSuffix && (
                    <DescriptionListGroup>
                      <DescriptionListTerm>{t('Tag suffix')}</DescriptionListTerm>
                      <DescriptionListDescription>{tagSuffix}</DescriptionListDescription>
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
          <GridItem span={6}>
            <DetailsPageCard>
              <CardTitle>{t('Destination')}</CardTitle>
              <DetailsPageCardBody>
                <FlightControlDescriptionList isCompact isHorizontal isFluid>
                  <DescriptionListGroup>
                    <DescriptionListTerm>{t('Registry')}</DescriptionListTerm>
                    <DescriptionListDescription>{destination.repository}</DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>{t('Name')}</DescriptionListTerm>
                    <DescriptionListDescription>{destination.imageName}</DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>{t('Tag')}</DescriptionListTerm>
                    <DescriptionListDescription>
                      {destination.tag}
                      {tagSuffix && `-${tagSuffix}`}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                </FlightControlDescriptionList>
              </DetailsPageCardBody>
            </DetailsPageCard>
          </GridItem>
          <GridItem span={6}>
            <DetailsPageCard>
              <CardTitle>{t('Status')}</CardTitle>
              <DetailsPageCardBody>
                <FlightControlDescriptionList isCompact isHorizontal isFluid>
                  {imageExport.status?.manifestDigest && (
                    <DescriptionListGroup>
                      <DescriptionListTerm>{t('Manifest digest')}</DescriptionListTerm>
                      <DescriptionListDescription>{imageExport.status.manifestDigest}</DescriptionListDescription>
                    </DescriptionListGroup>
                  )}
                  {imageExport.status?.lastSeen && (
                    <DescriptionListGroup>
                      <DescriptionListTerm>{t('Last seen')}</DescriptionListTerm>
                      <DescriptionListDescription>
                        {getDateTimeDisplay(imageExport.status.lastSeen)}
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                  )}
                  {!imageExport.status?.manifestDigest && !imageExport.status?.lastSeen && (
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

export default ImageExportDetailsContent;
