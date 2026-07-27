import * as React from 'react';
import { useField } from 'formik';
import { FormGroup, TextInput, TextInputProps } from '@patternfly/react-core';

import { ImageOrCatalogRef, formatImageRef, isCatalogImageRef } from '../../types/deviceSpec';
import { useTranslation } from '../../hooks/useTranslation';
import { DefaultHelperText } from './FieldHelperText';
import { useResolvedCatalogRef } from '../Catalog/useResolvedCatalogRef';

export interface ImageOrCatalogRefFieldProps extends TextInputProps {
  name: string;
  helperText?: React.ReactNode;
}

const ImageOrCatalogRefField = ({ name, helperText, ...props }: ImageOrCatalogRefFieldProps) => {
  const { t } = useTranslation();
  const [field, meta] = useField({
    name,
  });

  const value = field.value as ImageOrCatalogRef;
  const catalogRef = isCatalogImageRef(value) ? value : undefined;
  const { label } = useResolvedCatalogRef(catalogRef);
  const displayValue = catalogRef
    ? t('Catalog item {{ catalogItemRef }}', { catalogItemRef: label })
    : formatImageRef(value);

  const fieldId = `textfield-${name}`;
  const hasError = meta.touched && !!meta.error;

  return (
    <FormGroup id={`form-control__${fieldId}`} label={t('Image')} fieldId={fieldId} isRequired>
      <TextInput
        {...field}
        {...props}
        label={t('Image')}
        value={displayValue}
        isDisabled={!!catalogRef}
        id={fieldId}
        data-testid={fieldId}
        validated={hasError ? 'error' : 'default'}
      />

      <DefaultHelperText helperText={helperText} />
    </FormGroup>
  );
};

export default ImageOrCatalogRefField;
