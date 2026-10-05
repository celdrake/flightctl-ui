/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Information about a GPU device discovered on the device.
 */
export type DeviceGpu = {
  /**
   * The index of the GPU device on the system.
   */
  index?: number;
  /**
   * The GPU vendor name.
   */
  vendor?: string;
  /**
   * The GPU model name.
   */
  model?: string;
  /**
   * The PCI device ID of the GPU.
   */
  deviceId?: string;
  /**
   * The PCI bus address of the GPU.
   */
  pciAddress?: string;
  /**
   * The PCI revision ID of the GPU.
   */
  revisionId?: string;
  /**
   * The PCI vendor ID of the GPU.
   */
  vendorId?: string;
  /**
   * The amount of GPU memory in bytes.
   */
  memoryBytes?: number;
  /**
   * The GPU architecture.
   */
  arch?: string;
  /**
   * The list of supported GPU features.
   */
  features?: Array<string>;
};

