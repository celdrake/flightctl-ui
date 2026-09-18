import * as React from 'react';
import { Alert, StackItem } from '@patternfly/react-core';

import { useTranslation } from '../../hooks/useTranslation';
import CheckboxField from '../form/CheckboxField';
import CatalogApplicationNameField from './CatalogApplicationNameField';

export type CatalogConfigureFieldsProps = {
  requiresAdvancedConfig: boolean;
};

/** Shared name + optional advanced-settings controls for catalog configure steps. */
const CatalogDefinitionFields = ({
  requiresAdvancedConfig,
  children,
}: React.PropsWithChildren<CatalogConfigureFieldsProps>) => {
  const { t } = useTranslation();

  return (
    <>
      <StackItem>
        <CatalogApplicationNameField />
      </StackItem>
      {children}
      {requiresAdvancedConfig ? (
        <StackItem>
          <Alert isInline variant="info" title={t('Additional information required')}>
            {t(
              'This version needs required configuration before it can be added to the template. Continue to provide those values.',
            )}
          </Alert>
        </StackItem>
      ) : (
        <StackItem>
          <CheckboxField
            name="wantAdvancedConfig"
            label={t('Configure advanced settings')}
            description={t('Optionally override catalog defaults or provide additional settings for this application.')}
          />
        </StackItem>
      )}
    </>
  );
};

export default CatalogDefinitionFields;
