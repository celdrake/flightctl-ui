import * as React from 'react';
import {
  Alert,
  Content,
  ContentVariants,
  FormGroup,
  List,
  ListItem,
  Split,
  SplitItem,
  Stack,
  StackItem,
  Title,
} from '@patternfly/react-core';
import { type RJSFValidationError } from '@rjsf/utils';
import { useFormikContext } from 'formik';
import type * as monacoEditor from 'monaco-editor/esm/vs/editor/editor.api';

import { useTranslation } from '../../hooks/useTranslation';
import type { VolumeCatalogSelection } from '../../utils/catalog';
import DynamicForm from '../DynamicForm/DynamicForm';
import YamlEditorBase from '../common/CodeEditor/YamlEditorBase';
import RadioField from '../form/RadioField';
import FlightCtlForm from '../form/FlightCtlForm';
import type { DynamicFormConfigFormik } from '../Catalog/InstallWizard/types';

import '../Catalog/InstallWizard/steps/AppConfigStep.css';

type CatalogAdvancedConfigStepProps = {
  schemaErrors?: RJSFValidationError[];
};

const CatalogAdvancedConfigStep = ({ schemaErrors }: CatalogAdvancedConfigStepProps) => {
  const editorRef = React.useRef<monacoEditor.editor.IStandaloneCodeEditor | null>(null);
  const { t } = useTranslation();
  const { values, setFieldValue, setFieldTouched } = useFormikContext<DynamicFormConfigFormik>();

  const formContext = React.useMemo(() => {
    const onVolumeSelected = (selection: VolumeCatalogSelection) => {
      const existing = values.volumeSelection.findIndex((entry) => entry.volumeIndex === selection.volumeIndex);
      let newVolumeSelection: VolumeCatalogSelection[];
      if (existing >= 0) {
        const updated = [...values.volumeSelection];
        updated[existing] = selection;
        newVolumeSelection = updated;
      } else {
        newVolumeSelection = [...values.volumeSelection, selection];
      }
      void setFieldValue('volumeSelection', newVolumeSelection);
    };

    const onBeforeArrayItemRemoved = (arrayId: string, removedIndex: number) => {
      if (arrayId === 'root_volumes') {
        const newVolumeSelection = values.volumeSelection
          .filter((entry) => entry.volumeIndex !== removedIndex)
          .map((entry) =>
            entry.volumeIndex > removedIndex ? { ...entry, volumeIndex: entry.volumeIndex - 1 } : entry,
          );
        void setFieldValue('volumeSelection', newVolumeSelection);
      }
    };

    const onVolumeSelectionCleared = (volumeIndex: number) => {
      const newVolumeSelection = values.volumeSelection.filter((entry) => entry.volumeIndex !== volumeIndex);
      void setFieldValue('volumeSelection', newVolumeSelection);
    };

    return {
      onVolumeSelected,
      onBeforeArrayItemRemoved,
      onVolumeCleared: onVolumeSelectionCleared,
      volumeSelection: values.volumeSelection,
    };
  }, [values.volumeSelection, setFieldValue]);

  return (
    <FlightCtlForm>
      <Stack hasGutter>
        <StackItem>
          <Title headingLevel="h3" size="md">
            {t('Advanced configuration')}
          </Title>
          <Alert
            variant="info"
            isInline
            isPlain
            className="pf-v6-u-mt-sm"
            title={t('Provide any required values and optional overrides for this catalog application.')}
          />
        </StackItem>
        <StackItem>
          <FormGroup label={t('Application configuration')}>
            {values.configSchema && values.configureVia === 'form' ? (
              <Content component={ContentVariants.small} className="pf-v6-u-mb-sm">
                {t('Some fields may not be represented in this form view. Select YAML view for full control.')}
              </Content>
            ) : null}
            <Split hasGutter>
              <SplitItem>{t('Configure via:')}</SplitItem>
              <SplitItem>
                <RadioField
                  name="configureVia"
                  checkedValue="form"
                  id="catalog-composition-configure-form"
                  label={t('Form view')}
                  isDisabled={!values.configSchema}
                />
              </SplitItem>
              <SplitItem>
                <RadioField
                  name="configureVia"
                  checkedValue="editor"
                  id="catalog-composition-configure-editor"
                  label={t('YAML view')}
                />
              </SplitItem>
            </Split>
          </FormGroup>
        </StackItem>
        <StackItem>
          {values.configSchema && values.configureVia === 'form' ? (
            <DynamicForm
              valuesSchema={values.configSchema}
              formData={values.formValues}
              onChange={async (val) => {
                await setFieldValue('formValues', val);
                await setFieldTouched('formValues', true);
              }}
              onValidate={(valid) => {
                void setFieldValue('dynamicFormValid', valid);
              }}
              formContext={formContext}
            />
          ) : (
            <div className="fctl-yaml-editor">
              <YamlEditorBase
                showActions={false}
                isSaving={false}
                onCancel={() => {}}
                code={values.editorContent}
                editorRef={editorRef}
                onChange={async (val) => {
                  await setFieldValue('editorContent', val);
                  await setFieldTouched('editorContent', true);
                }}
              />
            </div>
          )}
        </StackItem>
        {schemaErrors?.length ? (
          <StackItem>
            <Alert variant="danger" title={t('Configuration is not valid')} isInline>
              <List>
                {schemaErrors.map((error, index) => (
                  <ListItem key={index}>
                    {error.property}: {error.message}
                  </ListItem>
                ))}
              </List>
            </Alert>
          </StackItem>
        ) : null}
      </Stack>
    </FlightCtlForm>
  );
};

export default CatalogAdvancedConfigStep;
