import { ImageBuildBinding, ImageBuildDestination, ImageBuildSource } from '@flightctl/types/imagebuilder';

export type ImageBuildFormValues = {
  // name is autogenereated by us
  source: ImageBuildSource;
  destination: ImageBuildDestination;
  binding: ImageBuildBinding;
};
