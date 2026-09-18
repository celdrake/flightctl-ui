import * as React from 'react';

import DeviceSpecReviewCards from '../../../Device/EditDeviceWizard/DeviceSpecReviewCards';

export const reviewStepId = 'review';

const ReviewStep = ({ error, showUpdateStatus }: { error?: unknown; showUpdateStatus?: boolean }) => (
  <DeviceSpecReviewCards variant="fleet" showUpdateStatus={showUpdateStatus} error={error} />
);

export default ReviewStep;
