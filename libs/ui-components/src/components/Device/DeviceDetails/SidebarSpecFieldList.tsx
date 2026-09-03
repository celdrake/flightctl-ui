import * as React from 'react';
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from '@patternfly/react-core';

export type SidebarSpecField = {
  key: string;
  term: React.ReactNode;
  description: React.ReactNode;
};

const SidebarSpecFieldList = ({ fields, className }: { fields: SidebarSpecField[]; className?: string }) => (
  <DescriptionList
    isHorizontal
    isCompact
    horizontalTermWidthModifier={{ default: '12ch' }}
    className={className}
  >
    {fields.map((field) => (
      <DescriptionListGroup key={field.key}>
        <DescriptionListTerm>{field.term}</DescriptionListTerm>
        <DescriptionListDescription>{field.description}</DescriptionListDescription>
      </DescriptionListGroup>
    ))}
  </DescriptionList>
);

export default SidebarSpecFieldList;
