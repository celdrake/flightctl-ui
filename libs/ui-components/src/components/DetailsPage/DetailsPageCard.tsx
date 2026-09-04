import * as React from 'react';
import { Card, CardTitle, Flex, FlexItem, Icon, type CardProps } from '@patternfly/react-core';

export const DetailsPageCardTitle = ({ icon, children }: React.PropsWithChildren<{ icon: React.ReactNode }>) => (
  <CardTitle>
    <Flex spaceItems={{ default: 'spaceItemsSm' }} alignItems={{ default: 'alignItemsCenter' }}>
      <FlexItem>
        <Icon>{icon}</Icon>
      </FlexItem>
      <FlexItem>{children}</FlexItem>
    </Flex>
  </CardTitle>
);

const DetailsPageCard = (props: CardProps) => <Card isFullHeight {...props} ref={undefined} />;

export default DetailsPageCard;
