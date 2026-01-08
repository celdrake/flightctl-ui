import { ImageBuild } from '@flightctl/types/imagebuilder';

// CELIA-WIP: DO we need to show the repository URL?

export const getImageBuildSourceImage = (imageBuild: ImageBuild | undefined) => {
  if (!imageBuild) {
    return '-';
  }
  const { source } = imageBuild.spec;
  return `${source.imageName}:${source.imageTag}`;
};

export const getImageBuildDestinationImage = (imageBuild: ImageBuild | undefined) => {
  if (!imageBuild) {
    return '-';
  }
  const { destination } = imageBuild.spec;
  return `${destination.imageName}:${destination.tag}`;
};
