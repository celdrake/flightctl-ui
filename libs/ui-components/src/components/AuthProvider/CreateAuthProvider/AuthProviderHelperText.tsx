import * as React from 'react';
import { useTranslation } from '../../../hooks/useTranslation';

// CELIA-WIP TRANSLATE AND FIX display according to design

export const ScopesHelperText = () => {
  const { t } = useTranslation();
  return (
    <div>
      <p>
        <strong>{t('Purpose')}:</strong>
        {t('Scopes define the permissions your application requests from the provider.')}
      </p>
      <p>
        <strong>{t('Configuration')}:</strong> {t("Check your provider's documentation for required scopes.")}
      </p>
      <p>
        <strong>{t('Common examples')}:</strong> {t('openid, profile, email, groups.')}
      </p>
    </div>
  );
};

export const UsernameClaimHelperText = () => {
  const { t } = useTranslation();
  return (
    <div>
      <p>
        <strong>{t('Purpose')}:</strong> {t('The claim field that contains the username.')}
      </p>
      <p>
        <strong>{t('Format')}:</strong>{' '}
        {t(
          'Use an array of path segments to access nested fields (e.g., ["preferred_username"], ["email"], ["custom_claims", "user_id"]).',
        )}
      </p>
      <p>
        <strong>{t('Requirements')}:</strong>
        {t('Each segment must start with a letter or underscore and contain only letters, numbers, or underscores.')}
      </p>
    </div>
  );
};

export const RoleClaimHelperText = () => {
  const { t } = useTranslation();
  return (
    <div>
      <p>
        <strong>{t('Purpose')}:</strong>
        {t('The claim field that contains user roles or group memberships for authorization.')}
      </p>
      <p>
        <strong>{t('Configuration')}:</strong> {t("Refer to your provider's documentation for the correct claim path.")}
      </p>
      <p>
        <strong>{t('Format')}:</strong>{' '}
        {t('Use an array of path segments (e.g., ["groups"], ["roles"], ["realm_access", "roles"]).')}
      </p>
      <p>
        <strong>{t('Common examples')}:</strong> {t('["groups"], ["roles"], ["authorities"]')}
      </p>
    </div>
  );
};
