import {
  ImageExport,
  ExportFormatType,
  ImageExportConditionType,
  ImageExportConditionReason,
  ResourceKind,
} from '@flightctl/types/imagebuilder';
import { ConditionStatus } from '@flightctl/types';
import { API_VERSION } from '../../../constants';

// Mock ImageExport with ImageBuild reference source
export const mockImageExportWithImageBuildSource: ImageExport = {
  apiVersion: API_VERSION,
  kind: ResourceKind.IMAGE_EXPORT,
  metadata: {
    name: 'my-image-export-1',
    creationTimestamp: '2024-01-15T10:30:00Z',
    resourceVersion: '12345',
    generation: 1,
  },
  spec: {
    source: {
      type: 'imageBuild',
      imageBuildRef: 'my-image-build-1',
    },
    destination: {
      repository: 'quay.io/my-org',
      imageName: 'exported-image',
      tag: 'v1.0.0',
    },
    format: ExportFormatType.ExportFormatTypeQCOW2,
    tagSuffix: 'qcow2',
  },
  status: {
    manifestDigest: 'sha256:abc123def456...',
    lastSeen: '2024-01-15T11:45:00Z',
    conditions: [
      {
        type: ImageExportConditionType.ImageExportConditionTypeReady,
        status: ConditionStatus.ConditionStatusTrue,
        reason: ImageExportConditionReason.ImageExportConditionReasonCompleted,
        message: 'Export completed successfully',
        lastTransitionTime: '2024-01-15T11:45:00Z',
      },
    ],
  },
};

// Mock ImageExport with ImageReference source
export const mockImageExportWithImageReferenceSource: ImageExport = {
  apiVersion: API_VERSION,
  kind: ResourceKind.IMAGE_EXPORT,
  metadata: {
    name: 'my-image-export-2',
    creationTimestamp: '2024-01-16T09:15:00Z',
    resourceVersion: '12346',
    generation: 1,
  },
  spec: {
    source: {
      type: 'imageReference',
      repository: 'quay.io/my-org',
      imageName: 'source-image',
      imageTag: 'latest',
    },
    destination: {
      repository: 'quay.io/my-org',
      imageName: 'exported-image',
      tag: 'v2.0.0',
    },
    format: ExportFormatType.ExportFormatTypeVMDK,
    tagSuffix: 'vmdk',
  },
  status: {
    manifestDigest: 'sha256:def789ghi012...',
    lastSeen: '2024-01-16T10:20:00Z',
    conditions: [
      {
        type: ImageExportConditionType.ImageExportConditionTypeReady,
        status: ConditionStatus.ConditionStatusTrue,
        reason: ImageExportConditionReason.ImageExportConditionReasonCompleted,
        message: 'Export completed successfully',
        lastTransitionTime: '2024-01-16T10:20:00Z',
      },
    ],
  },
};

// Mock ImageExport with ISO format and no tag suffix
export const mockImageExportISO: ImageExport = {
  apiVersion: API_VERSION,
  kind: 'ImageExport',
  metadata: {
    name: 'my-image-export-iso',
    creationTimestamp: '2024-01-17T14:00:00Z',
    resourceVersion: '12347',
    generation: 1,
  },
  spec: {
    source: {
      type: 'imageBuild',
      imageBuildRef: 'my-image-build-2',
    },
    destination: {
      repository: 'quay.io/my-org',
      imageName: 'exported-iso',
      tag: 'v1.0.0',
    },
    format: ExportFormatType.ExportFormatTypeISO,
  },
  status: {
    lastSeen: '2024-01-17T15:30:00Z',
  },
};

// Default mock (using ImageBuild source)
export const mockImageExport = mockImageExportWithImageBuildSource;
