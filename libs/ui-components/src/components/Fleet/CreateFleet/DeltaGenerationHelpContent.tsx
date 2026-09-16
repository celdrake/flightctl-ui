import * as React from 'react';
import { Content } from '@patternfly/react-core';

import { useTranslation } from '../../../hooks/useTranslation';

const DeltaGenerationHelpContent = () => {
  const { t } = useTranslation();
  return (
    <Content>
      <Content component="p">
        {t(
          'Delta updates are smaller incremental OS artifacts generated before rollout. Devices download only what changed instead of a full system image.',
        )}
      </Content>
      <Content component="p">{t('This saves bandwidth across large fleets and constrained networks.')}</Content>
      <Content component="p">
        {t(
          'Devices must have the OCI delta package installed on their OS image. Without it, they download full system images even when delta generation is enabled.',
        )}
      </Content>
    </Content>
  );
};

export default DeltaGenerationHelpContent;
