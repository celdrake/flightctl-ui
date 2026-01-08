/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ImageBuild } from './ImageBuild';
import type { ImageExport } from './ImageExport';
/**
 * Request to create an ImagePipeline consisting of an ImageBuild and optionally a list of ImageExports atomically. If imageExports are provided, the server will override their source to reference the created ImageBuild.
 */
export type ImagePipelineRequest = {
  imageBuild: ImageBuild;
  /**
   * List of ImageExport resources to create.
   */
  imageExports?: Array<ImageExport>;
};

