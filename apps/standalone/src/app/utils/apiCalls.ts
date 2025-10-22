/* eslint-disable no-console */
import { PatchRequest } from '@flightctl/types';
import {
  getErrorMsgFromAlertsApiResponse,
  getErrorMsgFromApiResponse,
} from '@flightctl/ui-components/src/utils/apiCalls';
import { ORGANIZATION_STORAGE_KEY } from '@flightctl/ui-components/src/utils/organizationStorage';
import { rateLimiter, DEFAULT_RATE_LIMIT } from '@flightctl/ui-components/src/utils/rateLimiter';
import { RateLimitErrorResponse, DuplicateRequestError } from '@flightctl/ui-components/src/types/rateLimit';

import { lastRefresh } from '../context/AuthContext';

const apiPort = window.API_PORT || window.location.port;
const apiServer = `${window.location.hostname}${apiPort ? `:${apiPort}` : ''}`;

const flightCtlAPI = `${window.location.protocol}//${apiServer}/api/flightctl`;
const uiProxyAPI = `${window.location.protocol}//${apiServer}/api`;

export const loginAPI = `${window.location.protocol}//${apiServer}/api/login`;
export const wsEndpoint = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${apiServer}`;

// Helper function to add organization header to request options
const addOrganizationHeader = (options: RequestInit): RequestInit => {
  const orgId = localStorage.getItem(ORGANIZATION_STORAGE_KEY);
  if (orgId) {
    const headers = new Headers(options.headers || {});
    headers.set('X-FlightCtl-Organization-ID', orgId);
    return {
      ...options,
      headers,
    };
  }
  return options;
};

export const fetchUiProxy = async (endpoint: string, requestInit: RequestInit): Promise<Response> => {
  const baseOptions = {
    credentials: 'include',
    ...requestInit,
  } as RequestInit;

  const options = addOrganizationHeader(baseOptions);

  return await fetch(`${uiProxyAPI}/${endpoint}`, options);
};

const getFullApiUrl = (path: string) => {
  if (path.startsWith('alerts')) {
    return { api: 'alerts', url: `${uiProxyAPI}/alerts/api/v2/${path}` };
  }
  return { api: 'flightctl', url: `${flightCtlAPI}/api/v1/${path}` };
};

export const logout = async () => {
  const response = await fetch(`${uiProxyAPI}/logout`, { credentials: 'include' });
  const { url } = (await response.json()) as { url: string };
  url ? (window.location.href = url) : window.location.reload();
};

export const redirectToLogin = async () => {
  const response = await fetch(loginAPI);
  const { url } = (await response.json()) as { url: string };
  window.location.href = url;
};

const handleApiJSONResponse = async <R>(response: Response): Promise<R> => {
  if (response.ok) {
    const data = (await response.json()) as R;
    // Notify rate limiter of successful request
    rateLimiter.notifySuccess();
    return data;
  }

  if (response.status === 404) {
    // We skip the response message for 404 errors, which is { message: '' }
    throw new Error(`Error ${response.status}: ${response.statusText}`);
  }

  if (response.status === 401) {
    await redirectToLogin();
  }

  // Handle 429 rate limit errors
  if (response.status === 429) {
    let rateLimitInfo = DEFAULT_RATE_LIMIT;
    let errorMessage = 'Rate limit exceeded. Please try again later.';

    try {
      const errorData = (await response.json()) as RateLimitErrorResponse;
      if (errorData.rateLimit) {
        rateLimitInfo = errorData.rateLimit;
      }
      if (errorData.message) {
        errorMessage = errorData.message;
      }
    } catch {
      // Failed to parse response, use defaults
    }

    rateLimiter.notify429(rateLimitInfo);
    throw new Error(errorMessage);
  }

  throw new Error(await getErrorMsgFromApiResponse(response));
};

const handleAlertsJSONResponse = async <R>(response: Response): Promise<R> => {
  if (response.ok) {
    const data = (await response.json()) as R;
    // Notify rate limiter of successful request
    rateLimiter.notifySuccess();
    return data;
  }

  if (response.status === 404) {
    throw new Error(`Error ${response.status}: ${response.statusText}`);
  }

  if (response.status === 401) {
    await redirectToLogin();
  }

  // Handle 429 rate limit errors
  if (response.status === 429) {
    let rateLimitInfo = DEFAULT_RATE_LIMIT;
    let errorMessage = 'Rate limit exceeded. Please try again later.';

    try {
      const errorData = (await response.json()) as RateLimitErrorResponse;
      if (errorData.rateLimit) {
        rateLimitInfo = errorData.rateLimit;
      }
      if (errorData.message) {
        errorMessage = errorData.message;
      }
    } catch {
      // Failed to parse response, use defaults
    }

    rateLimiter.notify429(rateLimitInfo);
    throw new Error(errorMessage);
  }

  // For 500/501 errors, return the status code for detection
  if (response.status === 500 || response.status === 501) {
    throw new Error(`${response.status}`);
  }

  throw new Error(await getErrorMsgFromAlertsApiResponse(response));
};

const fetchWithRetry = async <R>(path: string, init?: RequestInit): Promise<R> => {
  // If we're throttled, enqueue the request
  if (rateLimiter.isThrottled()) {
    const method = init?.method || 'GET';
    try {
      return await rateLimiter.enqueueRequest(() => executeFetch<R>(path, init), {
        method,
        path,
      });
    } catch (error) {
      // If this is a duplicate GET request, silently ignore and keep existing data
      if (error instanceof DuplicateRequestError) {
        console.log(`[API] ${error.message} - keeping existing state`);
        // Re-throw to let the component handle it (it won't update state)
        throw error;
      }
      throw error;
    }
  }

  return executeFetch<R>(path, init);
};

const executeFetch = async <R>(path: string, init?: RequestInit): Promise<R> => {
  const { api, url } = getFullApiUrl(path);

  // Add organization header if available
  const options = addOrganizationHeader({ ...init });

  const prevRefresh = lastRefresh;
  let response = await fetch(url, options);
  //if token refresh occured, lets try again
  if (response.status === 401 && prevRefresh != lastRefresh) {
    response = await fetch(url, options);
  }
  if (api === 'alerts') {
    return handleAlertsJSONResponse(response);
  }
  return handleApiJSONResponse(response);
};

const putOrPostData = async <TRequest, TResponse = TRequest>(
  kind: string,
  data: TRequest,
  method: 'PUT' | 'POST',
): Promise<TResponse> => {
  try {
    const init: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      method,
      body: JSON.stringify(data),
    };
    return await fetchWithRetry<TResponse>(kind, init);
  } catch (error) {
    console.error(`Error making ${method} request for ${kind}:`, error);
    throw error;
  }
};

export const postData = async <TRequest, TResponse = TRequest>(kind: string, data: TRequest): Promise<TResponse> =>
  putOrPostData<TRequest, TResponse>(kind, data, 'POST');

export const putData = async <TRequest>(kind: string, data: TRequest): Promise<TRequest> =>
  putOrPostData<TRequest, TRequest>(kind, data, 'PUT');

export const deleteData = async <R>(kind: string, abortSignal?: AbortSignal): Promise<R> => {
  try {
    const init: RequestInit = {
      method: 'DELETE',
      credentials: 'include',
      signal: abortSignal,
    };
    return fetchWithRetry<R>(kind, init);
  } catch (error) {
    console.error('Error making DELETE request:', error);
    throw error;
  }
};

export const patchData = async <R>(kind: string, data: PatchRequest, abortSignal?: AbortSignal): Promise<R> => {
  try {
    const init: RequestInit = {
      headers: {
        'Content-Type': 'application/json-patch+json',
      },
      method: 'PATCH',
      credentials: 'include',
      body: JSON.stringify(data),
      signal: abortSignal,
    };
    return fetchWithRetry<R>(kind, init);
  } catch (error) {
    console.error('Error making PATCH request:', error);
    throw error;
  }
};

export const fetchData = async <R>(path: string, abortSignal?: AbortSignal): Promise<R> => {
  try {
    const init: RequestInit = {
      method: 'GET',
      credentials: 'include',
      signal: abortSignal,
    };
    return fetchWithRetry<R>(path, init);
  } catch (error) {
    // Ignore duplicate request errors - component keeps existing state
    if (error instanceof DuplicateRequestError) {
      console.log(`[fetchData] ${error.message} - keeping existing state`);
      throw error; // Re-throw for component to handle
    }
    console.error('Error making GET request:', error);
    throw error;
  }
};
