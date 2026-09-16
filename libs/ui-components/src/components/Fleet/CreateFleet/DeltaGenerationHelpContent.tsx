import * as React from 'react';
import { Content } from '@patternfly/react-core';

import { useTranslation } from '../../../hooks/useTranslation';

const DeltaGenerationHelpContent = () => {
  const { t } = useTranslation();
  // CELIA-WIP: Repositories link
  return (
    <Content>
      <Content component="p">
        {t(
          'Delta updates create smaller incremental artifacts for operating system and application rollouts. Your devices download only what changed instead of full images.',
        )}
      </Content>
      <Content component="p">{t('This reduces bandwidth use across large fleets and constrained networks.')}</Content>
      <Content component="p">
        {t(
          'Deltas are stored in an OCI registry marked as a delta repository. Your administrator may have configured one at deployment. If not, mark an existing OCI registry in Repositories.',
        )}
      </Content>
    </Content>
  );
};

export default DeltaGenerationHelpContent;
