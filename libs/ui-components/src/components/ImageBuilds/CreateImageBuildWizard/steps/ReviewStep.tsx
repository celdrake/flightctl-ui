import * as React from 'react';
import { Alert, Stack, StackItem } from '@patternfly/react-core';

import { Repository } from '@flightctl/types';
import { useTranslation } from '../../../../hooks/useTranslation';
import { getErrorMessage } from '../../../../utils/error';

export const reviewStepId = 'review';

type ReviewStepProps = {
  error?: unknown;
  repositories: Repository[];
};

const ReviewStep = ({ error }: ReviewStepProps) => {
  const { t } = useTranslation();

  return (
    <Stack hasGutter>
      <StackItem isFilled>
        <div>{t('TBD - Review step')}</div>
      </StackItem>
      {!!error && (
        <StackItem>
          <Alert isInline variant="danger" title={t('An error occurred')}>
            {getErrorMessage(error)}
          </Alert>
        </StackItem>
      )}
    </Stack>
  );
};

export default ReviewStep;
