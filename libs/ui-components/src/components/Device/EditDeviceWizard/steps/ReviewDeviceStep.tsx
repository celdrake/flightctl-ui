import * as React from 'react';

import DeviceSpecReviewCards from '../DeviceSpecReviewCards';

export const reviewDeviceStepId = 'review-device';

const ReviewDeviceStep = ({ error, showUpdateStatus }: { error?: string; showUpdateStatus?: boolean }) => (
  <DeviceSpecReviewCards variant="device" showUpdateStatus={showUpdateStatus} error={error} />
);

export default ReviewDeviceStep;
