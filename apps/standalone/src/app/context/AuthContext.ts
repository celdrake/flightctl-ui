import * as React from 'react';
import { loginAPI, redirectToLogin } from '../utils/apiCalls';
import { ORGANIZATION_STORAGE_KEY } from '@flightctl/ui-components/src/utils/organizationStorage';
import { useTranslation } from '@flightctl/ui-components/src/hooks/useTranslation';

const EXPIRATION = 'expiration';
export let lastRefresh = 0;

// max value for setTimeout
const maxTimeout = 2 ** 31 - 1;

const nowInSeconds = () => Math.round(Date.now() / 1000);

type AuthContextProps = {
  username: string;
  loading: boolean;
  error: string | undefined;
};

export const AuthContext = React.createContext<AuthContextProps>({
  username: '',
  loading: false,
  error: undefined,
});

export const useAuthContext = () => {
  const [username, setUsername] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string>();
  const refreshRef = React.useRef<NodeJS.Timeout>();
  const { t } = useTranslation();

  React.useEffect(() => {
    const getUserInfo = async () => {
      // Skip auth check if we're on the login page
      if (window.location.pathname === '/login') {
        setLoading(false);
        return;
      }

      let callbackErr: string | null = null;
      if (window.location.pathname === '/callback') {
        localStorage.removeItem(EXPIRATION);
        localStorage.removeItem(ORGANIZATION_STORAGE_KEY);
        const searchParams = new URLSearchParams(window.location.search);
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        callbackErr = searchParams.get('error');
        if (code && state) {
          const resp = await fetch(`${loginAPI}?state=${encodeURIComponent(state)}`, {
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            method: 'POST',
            body: JSON.stringify({
              code: code,
            }),
          });

          if (!resp.ok) {
            let errorMessage = t('Authentication failed');
            try {
              const contentType = resp.headers.get('content-type');
              if (contentType && contentType.includes('application/json')) {
                const errorData = (await resp.json()) as { error?: string };
                errorMessage = errorData.error || errorMessage;
              } else {
                const text = await resp.text();
                if (text) {
                  errorMessage = text;
                }
              }
            } catch (parseErr) {
              // If parsing fails, use default error message
              errorMessage = 'Authentication failed';
            }
            setError(errorMessage);
            setLoading(false);
            return;
          }

          const expiration = (await resp.json()) as { expiresIn: number };
          if (expiration.expiresIn) {
            const now = nowInSeconds();
            localStorage.setItem(EXPIRATION, `${now + expiration.expiresIn}`);
            lastRefresh = now;
            console.log(`[AuthContext] Initial login successful, token expires in ${expiration.expiresIn}s`);
          } else {
            console.warn('[AuthContext] Initial login response missing expiresIn');
          }
        } else if (callbackErr) {
          setError(callbackErr);
          setLoading(false);
          return;
        }
      }
      if (!callbackErr) {
        try {
          const resp = await fetch(`${loginAPI}/info`, {
            credentials: 'include',
          });

          if (resp.status === 401) {
            const isOnAuthPage = ['/login', '/callback'].includes(window.location.pathname);
            if (!isOnAuthPage) {
              // The user is not authenticated - start the login process, and do not show any authentication errors yet
              setLoading(false);
              redirectToLogin();
              return;
            }

            let errorMessage = t('Authentication failed. Please try logging in again.');
            try {
              const contentType = resp.headers.get('content-type');
              if (contentType && contentType.includes('application/json')) {
                const errorData = (await resp.json()) as { error?: string };
                errorMessage = errorData.error || errorMessage;
              } else {
                const text = await resp.text();
                if (text) {
                  errorMessage = text;
                }
              }
            } catch (parseErr) {
              // If parsing fails, use default error message
            }
            setError(errorMessage);
            setLoading(false);
            return;
          }
          if (resp.status !== 200) {
            // Extract error message from response if available
            let errorMessage = t('Failed to get user info');
            try {
              const contentType = resp.headers.get('content-type');
              if (contentType && contentType.includes('application/json')) {
                const errorData = (await resp.json()) as { error?: string };
                errorMessage = errorData.error || errorMessage;
              } else {
                const text = await resp.text();
                if (text) {
                  errorMessage = text;
                }
              }
            } catch (parseErr) {
              // If parsing fails, use default error message
            }
            setError(errorMessage);
            setLoading(false);
            return;
          }
          const info = (await resp.json()) as { username: string };
          setUsername(info.username);
          setLoading(false);
        } catch (err) {
          // eslint-disable-next-line
          console.log(err);
          const errorMessage = err instanceof Error ? err.message : t('Failed to get user info');
          setError(errorMessage);
          setLoading(false);
        }
      }
    };

    getUserInfo();
  }, [t]);

  React.useEffect(() => {
    if (!loading) {
      // Don't schedule refresh if we're on login page
      if (window.location.pathname === '/login') {
        return;
      }

      const scheduleRefresh = () => {
        const expiresAt = parseInt(localStorage.getItem(EXPIRATION) || '0', 10);
        if (expiresAt > 0) {
          const now = nowInSeconds();
          // refresh 15s before expiration
          const expiresIn = expiresAt - now - 15;
          const timeout = Math.min(maxTimeout, expiresIn * 1000);
          if (timeout > 0) {
            console.log(
              `[AuthContext] Scheduling token refresh in ${Math.round(timeout / 1000)}s (expires in ${expiresIn}s)`,
            );
            refreshRef.current = setTimeout(refreshToken, timeout);
          } else {
            console.warn('[AuthContext] Token already expired or expires very soon, scheduling immediate refresh');
            refreshRef.current = setTimeout(refreshToken, 0);
          }
        } else {
          console.warn('[AuthContext] No expiration time found, cannot schedule token refresh');
        }
      };

      const refreshToken = async () => {
        const now = nowInSeconds();
        console.log(
          `[AuthContext] Attempting to refresh token (last refresh: ${lastRefresh > 0 ? `${now - lastRefresh}s ago` : 'never'})`,
        );
        try {
          const resp = await fetch(`${loginAPI}/refresh`, {
            credentials: 'include',
            method: 'GET',
          });

          if (!resp.ok) {
            console.error(`[AuthContext] Token refresh failed with status ${resp.status}`);
            throw new Error(`Token refresh failed: ${resp.status}`);
          }

          const expiration = (await resp.json()) as { expiresIn: number };
          if (expiration.expiresIn) {
            localStorage.setItem(EXPIRATION, `${now + expiration.expiresIn}`);
            console.log(`[AuthContext] Token refresh successful, new expiration in ${expiration.expiresIn}s`);
          } else {
            localStorage.removeItem(EXPIRATION);
            console.warn('[AuthContext] Token refresh response missing expiresIn, cleared expiration');
          }
          lastRefresh = now;
        } catch (err) {
          // eslint-disable-next-line
          console.error('[AuthContext] Failed to refresh token:', err);
        } finally {
          scheduleRefresh();
        }
      };

      scheduleRefresh();
    }
    return () => clearTimeout(refreshRef.current);
  }, [loading]);

  return { username, loading, error };
};
