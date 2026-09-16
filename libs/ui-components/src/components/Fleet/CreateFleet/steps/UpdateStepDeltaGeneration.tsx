import * as React from 'react';
import { Alert, Content, ContentVariants, FormGroup, Stack, StackItem } from '@patternfly/react-core';
import { useFormikContext } from 'formik';

import { useTranslation } from '../../../../hooks/useTranslation';
import type { DeltaGenerationForm, FleetFormValues } from '../../../../types/deviceSpec';
import SwitchField from '../../../form/SwitchField';
import RadioField from '../../../form/RadioField';
import TextField from '../../../form/TextField';
import ErrorHelperText from '../../../form/FieldHelperText';
import { FormGroupWithHelperText } from '../../../common/WithHelperText';
import LearnMoreLink from '../../../common/LearnMoreLink';
import { useAppLinks } from '../../../../hooks/useAppLinks';
import DeltaGenerationHelpContent from '../DeltaGenerationHelpContent';

const DeltaGenerationSettings = ({ isReadOnly }: { isReadOnly: boolean }) => {
  const { t } = useTranslation();

  return (
    <Stack hasGutter>
      <StackItem>
        <FormGroup label={t('Rollout hold deadline')}>
          <TextField
            name="deltaGeneration.maxWaitForDelta"
            label={t('Rollout hold deadline')}
            placeholder={t('e.g. 30m, 1h, 5h')}
            helperText={t(
              'How long rollout waits on the server for delta generation to finish. If this deadline is reached, rollout continues without deltas for any unfinished artifacts. Leave empty to use the deployment default.',
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
            placeholder={t('e.g. 30m, 1h, 5h')}
            helperText={t(
              'Maximum time allowed for each individual delta generation job on the server. Jobs that exceed this deadline are cancelled. Leave empty to use the deployment default.',
            )}
            isDisabled={isReadOnly}
          />
        </FormGroup>
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

  const deltaUpdatesDocLink = useAppLinks('deltaGeneration');

  const [hasCustomFieldsError, setHasCustomFieldsError] = React.useState(false);

  React.useEffect(() => {
    setHasCustomFieldsError(needsGlobalCustomDeltaError(deltaGeneration, touched as DeltaGenerationForm));
  }, [deltaGeneration, touched]);

  return (
    <FormGroupWithHelperText label={t('Delta generation')} content={<DeltaGenerationHelpContent />}>
      <Stack hasGutter>
        <StackItem>
          <SwitchField
            name="deltaGeneration.generateDelta"
            label={t('Generate deltas for this fleet')}
            helperText={
              <Content component={ContentVariants.small}>
                {t('Reduce download size during rollouts by generating incremental update artifacts on the server.')}{' '}
                {deltaUpdatesDocLink && <LearnMoreLink text={t('View documentation')} link={deltaUpdatesDocLink} />}
              </Content>
            }
            isDisabled={isReadOnly}
          />
        </StackItem>

        <StackItem>
          {deltaGeneration.generateDelta ? (
            <FormGroup
              label={t('Delta generation timing')}
              role="radiogroup"
              className="fctl-update-policy--customize-options"
              isStack
            >
              <RadioField
                id="delta-settings-default"
                name="deltaGeneration.isCustomized"
                label={t('Use default settings')}
                description={t('Apply deployment defaults for rollout hold and generation timeout.')}
                checkedValue={false}
                isDisabled={isReadOnly}
              />
              <RadioField
                id="delta-settings-customize"
                name="deltaGeneration.isCustomized"
                label={t('Customize timing')}
                description={t('Set fleet-specific rollout hold and per-job generation timeout values.')}
                checkedValue={true}
                isDisabled={isReadOnly}
                body={deltaGeneration.isCustomized ? <DeltaGenerationSettings isReadOnly={isReadOnly} /> : undefined}
              />
              {hasCustomFieldsError && (
                <ErrorHelperText
                  error={t(
                    'To use custom settings, enter at least one of rollout hold deadline or per-job generation timeout.',
                  )}
                />
              )}
            </FormGroup>
          ) : (
            <Alert
              isInline
              variant="info"
              className="fctl-update-delta-generation__opt-out-alert"
              title={t('Delta generation disabled for this fleet')}
            >
              {t(
                'You chose to disable server-side delta generation for this fleet. Devices may still apply deltas published in container images when available.',
              )}
            </Alert>
          )}
        </StackItem>
      </Stack>
    </FormGroupWithHelperText>
  );
};

export default UpdateStepDeltaGeneration;
