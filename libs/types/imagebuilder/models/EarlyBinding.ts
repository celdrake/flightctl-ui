/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Early binding configuration - embeds certificate in the image.
 */
export type EarlyBinding = {
  /**
   * The type of binding.
   */
  type: 'early';
  /**
   * Name of the enrollment certificate resource to embed in the image for device binding.
   */
  certName: string;
};

