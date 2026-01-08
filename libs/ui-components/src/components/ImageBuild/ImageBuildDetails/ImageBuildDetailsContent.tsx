import * as React from 'react';

import {
  Card,
  CardBody,
  CardTitle,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Grid,
  GridItem,
} from '@patternfly/react-core';

import { ImageBuild } from '@flightctl/types/imagebuilder';
import { ResourceKind } from '@flightctl/types';
import FlightControlDescriptionList from '../../common/FlightCtlDescriptionList';
import { getDateTimeDisplay } from '../../../utils/dates';
import { useTranslation } from '../../../hooks/useTranslation';
import { getImageBuildDestinationImage, getImageBuildSourceImage } from '../../../utils/imageBuilds';
import ImageBuildStatus from '../ImageBuildStatus';
import EventsCard from '../../Events/EventsCard';

// CELIA-WIP: DEtermine if there will be events for image builds

const ImageBuildDetailsContent = ({ imageBuild }: { imageBuild: ImageBuild }) => {
  const { t } = useTranslation();
  const imageBuildId = imageBuild.metadata.name as string;
  const sourceImage = getImageBuildSourceImage(imageBuild);
  const destinationImage = getImageBuildDestinationImage(imageBuild);
  const exportImagesCount = imageBuild.status?.exportImages?.length || 0;
  const imageReference = imageBuild.status?.imageReference;
  const architecture = imageBuild.status?.architecture;
  const manifestDigest = imageBuild.status?.manifestDigest;

  return (
    <Grid hasGutter>
      <GridItem md={9}>
        <Card>
          <CardTitle>{t('Details')}</CardTitle>
          <CardBody>
            <FlightControlDescriptionList columnModifier={{ lg: '3Col' }}>
              <DescriptionListGroup>
                <DescriptionListTerm>{t('Created')}</DescriptionListTerm>
                <DescriptionListDescription>
                  {getDateTimeDisplay(imageBuild.metadata.creationTimestamp || '')}
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>{t('Status')}</DescriptionListTerm>
                <DescriptionListDescription>
                  <ImageBuildStatus buildStatus={imageBuild.status} />
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>{t('Base image')}</DescriptionListTerm>
                <DescriptionListDescription>{sourceImage}</DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>{t('Output image')}</DescriptionListTerm>
                <DescriptionListDescription>{destinationImage}</DescriptionListDescription>
              </DescriptionListGroup>
              {imageReference && (
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Image reference')}</DescriptionListTerm>
                  <DescriptionListDescription>{imageReference}</DescriptionListDescription>
                </DescriptionListGroup>
              )}
              {architecture && (
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Architecture')}</DescriptionListTerm>
                  <DescriptionListDescription>{architecture}</DescriptionListDescription>
                </DescriptionListGroup>
              )}
              {manifestDigest && (
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Manifest digest')}</DescriptionListTerm>
                  <DescriptionListDescription>{manifestDigest}</DescriptionListDescription>
                </DescriptionListGroup>
              )}
              <DescriptionListGroup>
                <DescriptionListTerm>{t('Export images')}</DescriptionListTerm>
                <DescriptionListDescription>{exportImagesCount}</DescriptionListDescription>
              </DescriptionListGroup>
            </FlightControlDescriptionList>
          </CardBody>
        </Card>
      </GridItem>
      <GridItem md={3}>
        <EventsCard kind={'ImageBuild' as ResourceKind} objId={imageBuildId} />
      </GridItem>
    </Grid>
  );
};

export default ImageBuildDetailsContent;
