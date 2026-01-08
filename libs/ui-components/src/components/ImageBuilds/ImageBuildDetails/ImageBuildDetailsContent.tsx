import * as React from 'react';

import {
  Alert,
  Card,
  CardBody,
  CardTitle,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Grid,
  GridItem,
  Icon,
  Label,
  Stack,
  StackItem,
} from '@patternfly/react-core';

import { ImagePipelineResponse } from '@flightctl/types/imagebuilder';
import FlightControlDescriptionList from '../../common/FlightCtlDescriptionList';
import { getDateDisplay, getDateTimeDisplay } from '../../../utils/dates';
import { useTranslation } from '../../../hooks/useTranslation';
import { getImageBuildDestinationImage, getImageBuildSourceImage } from '../../../utils/imageBuilds';
import ImageBuildStatus from '../ImageBuildStatus';
import { CheckCircleIcon } from '@patternfly/react-icons';

// CELIA-WIP: DEtermine if there will be events for image builds

const mockImageBuild = {
  id: 'build-5',
  name: 'production-edge-v1-0-0',
  inputImage: 'rhel9/rhel-bootc:9.4',
  outputImage: 'my-edge-image:v1.0.0',
  status: 'queued',
  binding: 'early',
  created: '2025-12-29 14:30',
  description: 'AAAProduction edge image build for v1.0.0 release',
  buildDuration: 'Pending',
  exportFormats: ['vmdk', 'qcow2', 'iso'],
  registryUrl: 'quay.io/myorg/my-edge-image:v1.0.0',
  uuid: 'd4e8f2a6-3c7b-4d9f-8e1c-5f3a7b9d2e4c',
  architecture: 'x86_64',
  sharedWith: '1234567',
};

const getExportFormatLabel = (format: string): string => {
  const formatLower = format.toLowerCase();
  switch (formatLower) {
    case 'vmdk':
      return 'Virtualization (VMDK)';
    case 'qcow2':
      return 'Openstack/KVM (QCOW2)';
    case 'iso':
      return 'Bare metal installer (ISO)';
    default:
      return format.toUpperCase();
  }
};

const ImageBuildDetailsContent = ({ imagePipeline }: { imagePipeline: ImagePipelineResponse }) => {
  const { t } = useTranslation();
  const imageBuild = imagePipeline.imageBuild;
  const sourceImage = getImageBuildSourceImage(imageBuild);
  const destinationImage = getImageBuildDestinationImage(imageBuild);
  const exportImagesCount = imagePipeline.imageExports?.length || 0;
  const imageReference = imageBuild.status?.imageReference;
  const architecture = imageBuild.status?.architecture;
  const manifestDigest = imageBuild.status?.manifestDigest;

  const build = mockImageBuild;

  return (
    <Stack hasGutter>
      {/* Row 1: Image Details | Build Information */}
      <StackItem>
        <Grid hasGutter style={{ border: '2px solid lime !important' }}>
          <GridItem span={6}>
            <Card style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardTitle>Base image aaa</CardTitle>
              <CardBody style={{ flex: 1 }}>
                <Stack hasGutter>
                  <StackItem>
                    <div>
                      <strong>Base image:</strong>{' '}
                      {(() => {
                        if (!build.inputImage) return 'Not set';
                        const imageWithoutTag = build.inputImage.split(':')[0];
                        const parts = imageWithoutTag.split('/');
                        if (parts.length > 1) {
                          const firstPart = parts[0];
                          if (
                            firstPart.includes('.') ||
                            firstPart === 'quay.io' ||
                            firstPart === 'docker.io' ||
                            firstPart.startsWith('registry.')
                          ) {
                            return parts.slice(1).join('/');
                          }
                          return imageWithoutTag;
                        }
                        return imageWithoutTag;
                      })()}
                    </div>
                  </StackItem>
                  <StackItem>
                    <div>
                      <strong>Name:</strong>{' '}
                      {(() => {
                        if (!build.inputImage) return 'Not set';
                        const imageWithoutTag = build.inputImage.split(':')[0];
                        const parts = imageWithoutTag.split('/');
                        if (parts.length > 1) {
                          const firstPart = parts[0];
                          if (
                            firstPart.includes('.') ||
                            firstPart === 'quay.io' ||
                            firstPart === 'docker.io' ||
                            firstPart.startsWith('registry.')
                          ) {
                            return parts.slice(1).join('/');
                          }
                          return imageWithoutTag;
                        }
                        return imageWithoutTag;
                      })()}
                    </div>
                  </StackItem>
                  <StackItem>
                    <div>
                      <strong>Tag:</strong>{' '}
                      {(() => {
                        if (!build.inputImage) return 'Not set';
                        if (build.inputImage.includes(':')) {
                          return build.inputImage.split(':')[1];
                        }
                        return 'latest';
                      })()}
                    </div>
                  </StackItem>
                  <StackItem>
                    <div>
                      <strong>Registry:</strong>{' '}
                      {(() => {
                        if (build.registryUrl) {
                          try {
                            const urlStr = build.registryUrl.startsWith('http')
                              ? build.registryUrl
                              : `https://${build.registryUrl}`;
                            const url = new URL(urlStr);
                            return url.hostname;
                          } catch {
                            const parts = build.registryUrl.split('/');
                            return parts[0];
                          }
                        }
                        if (!build.inputImage) return 'Not set';
                        const imageWithoutTag = build.inputImage.split(':')[0];
                        const parts = imageWithoutTag.split('/');
                        if (parts.length > 1) {
                          const firstPart = parts[0];
                          if (
                            firstPart.includes('.') ||
                            firstPart === 'quay.io' ||
                            firstPart === 'docker.io' ||
                            firstPart.startsWith('registry.')
                          ) {
                            return firstPart;
                          }
                        }
                        if (build.inputImage.includes('rhel')) {
                          return 'registry.redhat.io';
                        }
                        return 'Not set';
                      })()}
                    </div>
                  </StackItem>
                  <StackItem>
                    <div>
                      <strong>Credentials:</strong>{' '}
                      {build.inputImage && build.inputImage.includes('rhel')
                        ? 'redhat-registry-credentials'
                        : 'Not set'}
                    </div>
                  </StackItem>
                  <StackItem>
                    <div>
                      <strong>Compatibility:</strong>{' '}
                      <Icon
                        status="success"
                        style={{ marginLeft: 'var(--pf-t--global--spacer--xs)', verticalAlign: 'middle' }}
                      >
                        <CheckCircleIcon />
                      </Icon>{' '}
                      Valid
                    </div>
                  </StackItem>
                </Stack>
              </CardBody>
            </Card>
          </GridItem>
          <GridItem span={6}>
            <Card style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardTitle>Build information</CardTitle>
              <CardBody style={{ flex: 1 }}>
                <div>
                  <strong>Created:</strong> {getDateDisplay(imageBuild.metadata.creationTimestamp)}
                </div>
              </CardBody>
            </Card>
          </GridItem>
        </Grid>
      </StackItem>

      {/* Row 2: Image Output | Registration */}
      <StackItem>
        <Grid hasGutter>
          <GridItem span={6}>
            <Card style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardTitle>Image output</CardTitle>
              <CardBody style={{ flex: 1 }}>
                <Stack hasGutter>
                  <StackItem>
                    <div>
                      <strong>Registry:</strong>{' '}
                      {(() => {
                        if (!build.registryUrl) return 'Not set';
                        try {
                          const url = new URL(
                            build.registryUrl.startsWith('http') ? build.registryUrl : `https://${build.registryUrl}`,
                          );
                          return url.hostname + (url.port ? `:${url.port}` : '');
                        } catch {
                          return build.registryUrl.split('/')[0].replace(/^https?:\/\//, '');
                        }
                      })()}
                    </div>
                  </StackItem>
                  <StackItem>
                    <div>
                      <strong>Name:</strong>{' '}
                      {build.outputImage
                        ? build.outputImage.includes(':')
                          ? build.outputImage.split(':')[0].split('/').pop()
                          : build.outputImage
                        : 'Not set'}
                    </div>
                  </StackItem>
                  <StackItem>
                    <div>
                      <strong>Version tag:</strong>{' '}
                      {build.outputImage && build.outputImage.includes(':')
                        ? build.outputImage.split(':')[1]
                        : build.outputImage
                          ? 'latest'
                          : 'Not set'}
                    </div>
                  </StackItem>
                  <StackItem>
                    <div>
                      <strong>Image export formats:</strong>{' '}
                      {build.exportFormats && build.exportFormats.length > 0
                        ? build.exportFormats.map((format, idx) => (
                            <Label key={idx} color="blue" style={{ marginLeft: '8px', marginBottom: '4px' }}>
                              {getExportFormatLabel(format)}
                            </Label>
                          ))
                        : 'None'}
                    </div>
                  </StackItem>
                  <StackItem>
                    <div>
                      <strong>Included packages:</strong> flight-control-agent (system default)
                    </div>
                  </StackItem>
                </Stack>
              </CardBody>
            </Card>
          </GridItem>
          <GridItem span={6}>
            <Card style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardTitle>Registration</CardTitle>
              <CardBody style={{ flex: 1 }}>
                <Stack hasGutter>
                  <StackItem>
                    <div>
                      <strong>Binding:</strong> {build.binding === 'early' ? 'Early binding' : 'Late binding'}
                    </div>
                  </StackItem>
                  {build.binding === 'early' && (
                    <>
                      <StackItem>
                        <div>
                          <strong>Auto-create certificate:</strong> Yes
                        </div>
                      </StackItem>
                      <StackItem>
                        <div>
                          <strong>Registration window:</strong> 90 days
                        </div>
                      </StackItem>
                    </>
                  )}
                  {build.binding === 'late' && (
                    <StackItem>
                      <Alert variant="info" isInline title="Cloud-init and Ignition enabled">
                        Cloud-init and Ignition are automatically enabled for late binding.
                      </Alert>
                    </StackItem>
                  )}
                </Stack>
              </CardBody>
            </Card>
          </GridItem>
        </Grid>
      </StackItem>
    </Stack>
  );
};

export default ImageBuildDetailsContent;
