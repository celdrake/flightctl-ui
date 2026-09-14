import * as React from 'react';
import { Alert, FormGroup, Stack, StackItem, Title } from '@patternfly/react-core';
import { useFormikContext } from 'formik';

import { useTranslation } from '../../../../hooks/useTranslation';
import type { DeltaGenerationForm, FleetFormValues } from '../../../../types/deviceSpec';
import { DEFAULT_DELTA_GENERATION_MAX_WAIT, DEFAULT_DELTA_GENERATION_TIMEOUT } from '../fleetSpecUtils';
import SwitchField from '../../../form/SwitchField';
import RadioField from '../../../form/RadioField';
import TextField from '../../../form/TextField';
import ErrorHelperText, { DefaultHelperText } from '../../../form/FieldHelperText';

const DeltaGenerationSettings = ({ isReadOnly }: { isReadOnly: boolean }) => {
  const { t } = useTranslation();

  return (
    <Stack hasGutter>
      <StackItem>
        <FormGroup label={t('Rollout hold deadline')}>
          <TextField
            name="deltaGeneration.maxWaitForDelta"
            label={t('Rollout hold deadline')}
            placeholder={DEFAULT_DELTA_GENERATION_MAX_WAIT}
            helperText={t(
              'How long rollout waits on the server for delta generation to finish. If this deadline is reached, rollout continues without deltas for any unfinished pairs. Consider your maintenance window — if generation takes longer than the window allows, devices may miss the update. Leave empty to use the deployment default ({{ default }}).',
              { default: DEFAULT_DELTA_GENERATION_MAX_WAIT },
            )}
            isDisabled={isReadOnly}
          />
        </FormGroup>
      </StackItem>
      <StackItem>
        <FormGroup label={t('Per-job generation timeout')}>
          <TextField
            name="deltaGeneration.deltaGenerationTimeout"
            label={t('Per-job generation timeout')}
            placeholder={DEFAULT_DELTA_GENERATION_TIMEOUT}
            helperText={t(
              'Maximum time allowed for each individual delta generation job on the server. Jobs that exceed this deadline are cancelled and marked failed. Leave empty to use the deployment default ({{ default }}).',
              { default: DEFAULT_DELTA_GENERATION_TIMEOUT },
            )}
            isDisabled={isReadOnly}
          />
        </FormGroup>
      </StackItem>
      <StackItem>
        <DefaultHelperText
          helperText={t(
            'Duration format: a positive number followed by s (seconds), m (minutes), or h (hours). Examples: 30m, 1h, 45s.',
          )}
        />
      </StackItem>
    </Stack>
  );
};

// Show an error to indicate that the user needs to fill one of the two fields for delta settings.
// This avoids having to show an error in the untouched fields before the user has had a chance to fill in one of those fields.
const needsGlobalCustomDeltaError = (deltaGeneration: DeltaGenerationForm, touched: DeltaGenerationForm) => {
  if (touched?.maxWaitForDelta || touched?.deltaGenerationTimeout) {
    return false;
  }
  return (
    deltaGeneration.isCustomized &&
    deltaGeneration.generateDelta &&
    !deltaGeneration.maxWaitForDelta &&
    !deltaGeneration.deltaGenerationTimeout
  );
};

const UpdateStepDeltaGeneration = ({ isReadOnly }: { isReadOnly: boolean }) => {
  const { t } = useTranslation();

  const {
    values: { deltaGeneration },
    touched,
  } = useFormikContext<FleetFormValues>();

  const [hasCustomFieldsError, setHasCustomFieldsError] = React.useState(false);

  React.useEffect(() => {
    setHasCustomFieldsError(needsGlobalCustomDeltaError(deltaGeneration, touched as DeltaGenerationForm));
  }, [deltaGeneration, touched]);

  return (
    <Stack hasGutter>
      <StackItem>
        <Title headingLevel="h2">{t('Delta generation')}</Title>
        <DefaultHelperText
          helperText={t('Generate smaller incremental updates during fleet rollouts. Enabled by default.')}
        />
      </StackItem>

      <StackItem>
        <SwitchField
          name="deltaGeneration.generateDelta"
          label={t('Generate deltas for this fleet')}
          isDisabled={isReadOnly}
        />
      </StackItem>

      {deltaGeneration.generateDelta ? (
        <StackItem>
          <FormGroup label={t('Timing')} role="radiogroup" isStack>
            <RadioField
              id="delta-settings-default"
              name="deltaGeneration.isCustomized"
              label={t('Default settings')}
              description={t('Use system defaults for rollout hold and per-job generation timeout.')}
              checkedValue={false}
              isDisabled={isReadOnly}
            />
            <RadioField
              id="delta-settings-customize"
              name="deltaGeneration.isCustomized"
              label={t('Customize delta generation settings')}
              description={t('Set custom rollout hold and per-job generation timeouts.')}
              checkedValue={true}
              isDisabled={isReadOnly}
              body={deltaGeneration.isCustomized ? <DeltaGenerationSettings isReadOnly={isReadOnly} /> : undefined}
            />
            {hasCustomFieldsError && (
              <div className="pf-v6-u-ml-md">
                <ErrorHelperText
                  error={t(
                    'To use custom settings, enter at least one of rollout hold deadline or per-job generation timeout.',
                  )}
                />
              </div>
            )}
          </FormGroup>
        </StackItem>
      ) : (
        <StackItem>
          <Alert isInline isPlain variant="info" title={t('Delta generation disabled for this fleet')}>
            {t(
              'Rollout will not wait for server-generated deltas. Devices may still apply CI-published deltas when available.',
            )}
          </Alert>
        </StackItem>
      )}
    </Stack>
  );
};

export default UpdateStepDeltaGeneration;
