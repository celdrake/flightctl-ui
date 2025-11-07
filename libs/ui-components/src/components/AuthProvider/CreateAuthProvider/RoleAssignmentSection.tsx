import * as React from 'react';
import { FormGroup, FormSection, Split, SplitItem } from '@patternfly/react-core';
import { useFormikContext } from 'formik';

import { useTranslation } from '../../../hooks/useTranslation';
import RadioField from '../../form/RadioField';
import ListItemField from '../../form/ListItemField';
import { AuthProviderFormValues, RoleAssignmentType } from './types';
import { FormGroupWithHelperText } from '../../common/WithHelperText';
import { RoleClaimHelperText } from './AuthProviderHelperText';

const RoleAssignmentSection = () => {
  const { t } = useTranslation();
  const { values } = useFormikContext<AuthProviderFormValues>();

  return (
    <FormSection title={t('Role assignment')} className="pf-v5-u-mt-md">
      <Split hasGutter>
        <SplitItem>
          <RadioField
            id="roleAssignmentStatic"
            name="roleAssignmentType"
            label={t('Static')}
            checkedValue={RoleAssignmentType.Static}
          />
        </SplitItem>
        <SplitItem>
          <RadioField
            id="roleAssignmentDynamic"
            name="roleAssignmentType"
            label={t('Dynamic')}
            checkedValue={RoleAssignmentType.Dynamic}
          />
        </SplitItem>
      </Split>

      {values.roleAssignmentType === RoleAssignmentType.Static && (
        <FormGroup label={t('Roles')} isRequired>
          <ListItemField
            name="staticRoles"
            helperText={t('List of roles to assign to all users from this provider')}
            addButtonText={t('Add role')}
          />
        </FormGroup>
      )}

      {values.roleAssignmentType === RoleAssignmentType.Dynamic && (
        <FormGroupWithHelperText label={t('Role claim path')} content={<RoleClaimHelperText />}>
          <ListItemField
            name="roleClaimPath"
            helperText={t(
              'JSON path segments to the role/group claim (e.g., ["groups"], ["roles"], ["realm_access", "roles"])',
            )}
            addButtonText={t('Add path segment')}
          />
        </FormGroupWithHelperText>
      )}
    </FormSection>
  );
};

export default RoleAssignmentSection;
