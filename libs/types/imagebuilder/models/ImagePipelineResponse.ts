/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ImageBuild } from './ImageBuild';
import type { ImageExport } from './ImageExport';
/**
 * Response containing the created ImagePipeline resources (ImageBuild and optionally a list of ImageExports).
 */
export type ImagePipelineResponse = {
  imageBuild: ImageBuild;
  /**
   * List of created ImageExport resources.
   */
  imageExports?: Array<ImageExport>;
};

