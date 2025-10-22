import * as React from 'react';
import OrganizationGuard from '@flightctl/ui-components/src/components/common/OrganizationGuard';
import SystemNotifications from '@flightctl/ui-components/src/components/SystemNotifications/SystemNotifications';

// Restore WithPageLayoutContent when organizations are enabled for OCP plugin
// The context is still needed since "useOrganizationGuardContext" is used in common components
/*
const WithPageLayoutContent = ({ children }: React.PropsWithChildren) => {
  const { isOrganizationSelectionRequired } = useOrganizationGuardContext();

  return isOrganizationSelectionRequired ? (
    <OrganizationSelector isFirstLogin />
  ) : (
    <>
      <PageNavigation />
      {children}
    </>
  );
};
*/

const WithPageLayout = ({ children }: React.PropsWithChildren) => {
  return (
    <OrganizationGuard>
      <>
        <SystemNotifications />
        {children}
      </>
    </OrganizationGuard>
  );
};

export default WithPageLayout;
