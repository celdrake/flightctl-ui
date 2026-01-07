/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ImageBuild } from './ImageBuild';
import type { ImageExport } from './ImageExport';
/**
 * Response containing the created ImagePipeline resources (ImageBuild and optionally ImageExport).
 */
export type ImagePipelineResponse = {
  imageBuild: ImageBuild;
  imageExport?: ImageExport;
};

