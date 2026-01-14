import * as React from 'react';
import { Card, CardBody, CardTitle } from '@patternfly/react-core';
import { useTranslation } from '../../hooks/useTranslation';
import { getImageUrl } from '../../utils/imageBuilds';
import LearnMoreLink from '../common/LearnMoreLink';

const ImageUrlCard = ({ title, imageReference }: { title: string; imageReference: string | null }) => {
  const { t } = useTranslation();

  const imageUrl = imageReference ? getImageUrl(imageReference) : null;

  let content: React.ReactNode;
  if (imageUrl) {
    content = <LearnMoreLink link={imageUrl} text={imageUrl} />;
  } else {
    content = t('Enter the image details to view the full URL');
  }

  return (
    <Card>
      <CardTitle>{title}</CardTitle>
      <CardBody>{content}</CardBody>
    </Card>
  );
};

export default ImageUrlCard;
