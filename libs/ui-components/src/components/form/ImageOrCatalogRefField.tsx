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
}

// Field for an OCI image or catalog item reference
// Currently the Form only allows editing the image field.
// If the value is set with a catalog item reference, the field is read-only and its value is displayed.
const ImageOrCatalogRefField = ({ name, helperText, ...props }: ImageOrCatalogRefFieldProps) => {
  const { t } = useTranslation();
  const [field, meta] = useField<ImageOrCatalogItemRefSpec>({
    name,
  });

  const catalogRef = field.value?.catalogItemRef;
  const displayValue = catalogRef
    ? t('Catalog item {{ catalogItemRef }}', { catalogItemRef: formatCatalogItemRef(catalogRef) })
    : field.value?.image;

  const fieldId = `textfield-${name}`;
  const hasError = meta.touched && !!meta.error;

  return (
    <FormGroup id={`form-control__${fieldId}`} label={t('Image')} fieldId={fieldId} isRequired>
      <TextInput
        {...field}
        {...props}
        label={t('Image')}
        value={displayValue}
        onChange={(_event, value) => field.onChange({ image: value })}
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
