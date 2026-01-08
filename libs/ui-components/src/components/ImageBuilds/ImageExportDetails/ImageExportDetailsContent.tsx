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
import { mockImageExportWithImageBuildSource } from './mockImageExport';

const ImageExportDetailsContent = () => {
  const { t } = useTranslation();

  const imageExport = mockImageExportWithImageBuildSource;

  const { destination, format, tagSuffix } = imageExport.spec;

  return (
    <Stack hasGutter>
      {/* Row 1: Source Information | Export Information */}
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

      {/* Row 2: Destination Information | Status */}
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
