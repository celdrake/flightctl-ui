import * as React from 'react';
import { Badge } from '@patternfly/react-core';

import { EnrollmentRequestList } from '@flightctl/types';

import { useTranslation } from '../../hooks/useTranslation';
import { useFetchPeriodically } from '../../hooks/useFetchPeriodically';
import { getApiListCount } from '../../utils/api';

import './PendingEnrollmentRequestsBadge.css';

const PendingEnrollmentRequestsBadge = () => {
  const { t } = useTranslation();
  const [erList] = useFetchPeriodically<EnrollmentRequestList>({
    endpoint: 'enrollmentrequests?fieldSelector=!status.approval.approved&limit=1',
  });

  const count = getApiListCount(erList) || 0;
  return (
    <Badge className="fctl-separator--left" screenReaderText={t('{{ num }} devices pending approval', { num: count })}>
      {count}
    </Badge>
  );
};

export default PendingEnrollmentRequestsBadge;
