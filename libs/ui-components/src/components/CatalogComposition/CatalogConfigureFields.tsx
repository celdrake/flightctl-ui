import * as React from 'react';
import { Alert, StackItem } from '@patternfly/react-core';

import { useTranslation } from '../../hooks/useTranslation';
import CheckboxField from '../form/CheckboxField';
import CatalogApplicationNameField from './CatalogApplicationNameField';

export type CatalogConfigureFieldsProps = {
  requiresAdvancedConfig: boolean;
  /**
   * How to present required advanced config:
   * - `disabled-checkbox`: checkbox checked/disabled (edit existing app)
   * - `info-alert`: show an info alert; checkbox stays enabled (add from catalog)
   */
  requiredConfigPresentation: 'disabled-checkbox' | 'info-alert';
  checkboxDescription: string;
  /** Extra fields between the application name and the advanced-config controls (e.g. channel/version). */
  children?: React.ReactNode;
};

/** Shared name + optional advanced-settings controls for catalog configure steps. */
const CatalogConfigureFields = ({
  requiresAdvancedConfig,
  requiredConfigPresentation,
  checkboxDescription,
  children,
}: CatalogConfigureFieldsProps) => {
  const { t } = useTranslation();
  const showRequiredAlert = requiresAdvancedConfig && requiredConfigPresentation === 'info-alert';
  const disableCheckbox = requiresAdvancedConfig && requiredConfigPresentation === 'disabled-checkbox';

  return (
    <>
      <StackItem>
        <CatalogApplicationNameField />
      </StackItem>
      {children}
      {showRequiredAlert && (
        <StackItem>
          <Alert isInline variant="info" title={t('Additional information required')}>
            {t(
              'This version needs required configuration before it can be added to the template. Continue to provide those values.',
            )}
          </Alert>
        </StackItem>
      )}
      <StackItem>
        <CheckboxField
          name="wantAdvancedConfig"
          label={t('Configure advanced settings')}
          description={checkboxDescription}
          isDisabled={disableCheckbox}
        />
      </StackItem>
    </>
  );
};

export default CatalogConfigureFields;
