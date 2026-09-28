import * as React from 'react';
import { FormGroup, MenuToggle, Select, SelectList, SelectOption } from '@patternfly/react-core';
import type { RJSFSchema } from '@rjsf/utils';

import type { ImagePullPolicy } from '@flightctl/types';

import { useTranslation } from '../../hooks/useTranslation';

type VolumeImagePullPolicyProps = {
  id: string;
  schema: RJSFSchema;
  value: ImagePullPolicy | string | undefined;
  isRequired?: boolean;
  isDisabled?: boolean;
  onChange: (value: ImagePullPolicy) => void;
};

export const getPullPolicySchema = (imageSchema: RJSFSchema): RJSFSchema | undefined => {
  const pullPolicy = imageSchema.properties?.pullPolicy;
  return pullPolicy && typeof pullPolicy === 'object' ? pullPolicy : undefined;
};

const VolumeImagePullPolicy = ({ id, schema, value, isRequired, isDisabled, onChange }: VolumeImagePullPolicyProps) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = React.useState(false);

  const options = Array.isArray(schema.enum)
    ? schema.enum.filter((option): option is string => typeof option === 'string')
    : [];
  if (options.length === 0) {
    return null;
  }

  const label = (typeof schema.title === 'string' && schema.title) || t('Pull policy');
  const selected = value || options[0] || '';

  return (
    <FormGroup fieldId={id} label={label} isRequired={isRequired}>
      <Select
        id={id}
        isOpen={isOpen}
        selected={selected}
        onSelect={(_event, nextValue) => {
          onChange(String(nextValue) as ImagePullPolicy);
          setIsOpen(false);
        }}
        onOpenChange={setIsOpen}
        toggle={(toggleRef) => (
          <MenuToggle
            ref={toggleRef}
            onClick={() => setIsOpen(!isOpen)}
            isExpanded={isOpen}
            isDisabled={isDisabled}
            style={{ width: '100%' }}
          >
            {selected}
          </MenuToggle>
        )}
        shouldFocusToggleOnSelect
      >
        <SelectList>
          {options.map((option) => (
            <SelectOption key={option} value={option}>
              {option}
            </SelectOption>
          ))}
        </SelectList>
      </Select>
    </FormGroup>
  );
};

export default VolumeImagePullPolicy;
