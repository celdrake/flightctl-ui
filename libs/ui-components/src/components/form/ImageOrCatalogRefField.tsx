import * as React from 'react';
import { useField } from 'formik';
import { FormGroup, TextInput, type TextInputProps } from '@patternfly/react-core';

import type { ImageOrCatalogItemRefSpec } from '@flightctl/types';
import { useTranslation } from '../../hooks/useTranslation';
import { DefaultHelperText } from './FieldHelperText';
import { formatCatalogItemRef } from '../../utils/catalog';

export interface ImageOrCatalogRefFieldProps extends TextInputProps {
  name: string;
  helperText?: React.ReactNode;
  label?: string;
}

// Field for an OCI image or catalog item reference
// Currently the Form only allows editing the image field.
// If the value is set with a catalog item reference, the field is read-only and its value is displayed.
const ImageOrCatalogRefField = ({
  name,
  helperText,
  label,
  isRequired = true,
  ...props
}: ImageOrCatalogRefFieldProps) => {
  const { t } = useTranslation();
  const [field, meta, { setValue }] = useField<ImageOrCatalogItemRefSpec>({
    name,
  });

  const fieldLabel = label || t('Image');
  const catalogRef = field.value?.catalogItemRef;
  const displayValue = catalogRef
    ? t('Catalog item {{ catalogItemRef }}', { catalogItemRef: formatCatalogItemRef(catalogRef) })
    : field.value?.image;

  const fieldId = `textfield-${name}`;
  const hasError = meta.touched && !!meta.error;

  return (
    <FormGroup id={`form-control__${fieldId}`} label={fieldLabel} fieldId={fieldId} isRequired={isRequired}>
      <TextInput
        {...field}
        {...props}
        label={fieldLabel}
        value={displayValue || ''}
        onChange={(_event, value) => void setValue({ image: value })}
        isDisabled={props.isDisabled || !!catalogRef}
        id={fieldId}
        data-testid={fieldId}
        validated={hasError ? 'error' : 'default'}
      />

      <DefaultHelperText helperText={helperText} />
    </FormGroup>
  );
};

export default ImageOrCatalogRefField;
