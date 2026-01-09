import { ImageBuildBinding, ImageBuildDestination, ImageBuildSource } from '@flightctl/types/imagebuilder';

export type ImageBuildFormValues = {
  name: string;
  source: ImageBuildSource;
  destination: ImageBuildDestination;
  binding: ImageBuildBinding;
};
