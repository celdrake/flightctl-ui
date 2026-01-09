export type ImageBuildFormValues = {
  name: string;
  sourceRepository: string;
  sourceImageName: string;
  sourceImageTag: string;
  destinationRepository: string;
  destinationImageName: string;
  destinationTag: string;
  bindingType: 'early' | 'late';
  certName?: string;
  // Image export formats will be added later
};
