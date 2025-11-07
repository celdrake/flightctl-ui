import * as React from 'react';
import { Label, LabelGroup } from '@patternfly/react-core';

import { AuthRoleAssignment } from '@flightctl/types';
import { getAssignmentTypeLabel } from '../CreateAuthProvider/utils';
import { useTranslation } from '../../../hooks/useTranslation';
import { DEFAULT_ROLE_CLAIM, isRoleAssignmentDynamic, isRoleAssignmentStatic } from '../CreateAuthProvider/types';

const RoleAssigmentDetails = ({ roleAssignment }: { roleAssignment: AuthRoleAssignment }) => {
  const { t } = useTranslation();

  let values: string[] = [];
  if (isRoleAssignmentStatic(roleAssignment)) {
    values = roleAssignment.roles;
  } else if (isRoleAssignmentDynamic(roleAssignment)) {
    values = roleAssignment.claimPath;
  } else {
    values = [`"${DEFAULT_ROLE_CLAIM}" - (${t('Default')})`];
  }

  return (
    <>
      <Label color="purple">{getAssignmentTypeLabel(roleAssignment.type, t)}</Label>
      <LabelGroup className="pf-v5-u-mt-sm">
        {values.map((role, index) => (
          <Label key={`${role}-${index}`}>{role}</Label>
        ))}
      </LabelGroup>
    </>
  );
};

export default RoleAssigmentDetails;
