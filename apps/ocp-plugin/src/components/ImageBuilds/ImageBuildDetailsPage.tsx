import * as React from 'react';
import ImageBuildDetails from '@flightctl/ui-components/src/components/ImageBuild/ImageBuildDetails/ImageBuildDetailsPage';
import WithPageLayout from '../common/WithPageLayout';

const ImageBuildDetailsPage = () => {
  return (
    <WithPageLayout>
      <ImageBuildDetails />
    </WithPageLayout>
  );
};

export default ImageBuildDetailsPage;
