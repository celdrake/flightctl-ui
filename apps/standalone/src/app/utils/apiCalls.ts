/* eslint-disable no-console */
import { PatchRequest } from '@flightctl/types';

const apiServer = `${window.location.hostname}${window.API_PORT ? `:${window.API_PORT}` : ''}`;

const flightCtlAPI = `${window.location.protocol}//${apiServer}/api/flightctl`;
const metricsAPI = `${window.location.protocol}//${apiServer}/api/metrics`;
export const wsEndpoint = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${apiServer}`;
const deviceImagesAPI = `${window.location.protocol}//${apiServer}/api/device-images`;

const handleApiJSONResponse = async <R>(response: Response): Promise<R> => {
  if (response.ok) {
    const data = (await response.json()) as R;
    return data;
  }

  if (response.status === 404) {
    // We skip the response message for 404 errors, which is { message: '' }
    throw new Error(`Error ${response.status}: ${response.statusText}`);
  }

  let errorText = '';
  try {
    const json = (await response.json()) as { message: string } | string;
    errorText = ` - ${typeof json === 'object' ? json.message : json}`;
  } catch (e) {
    // ignore
  }
  throw new Error(`Error ${response.status}: ${response.statusText}${errorText}`);
};

export const fetchMetrics = async <R>(
  metricQuery: string,
  token: string | undefined,
  abortSignal?: AbortSignal,
): Promise<R> => {
  try {
    const response = await fetch(`${metricsAPI}/api/v1/query_range?${metricQuery}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      signal: abortSignal,
    });
    return handleApiJSONResponse(response);
  } catch (error) {
    console.error('Error making request:', error);
    throw error;
  }
};

export const postData = async <R>(kind: string, token: string | undefined, data: R): Promise<R> => {
  try {
    const response = await fetch(`${flightCtlAPI}/api/v1/${kind}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify(data),
    });
    return handleApiJSONResponse(response);
  } catch (error) {
    console.error('Error making request:', error);
    throw error;
  }
};

export const deleteData = async <R>(kind: string, token: string | undefined, abortSignal?: AbortSignal): Promise<R> => {
  try {
    const response = await fetch(`${flightCtlAPI}/api/v1/${kind}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      method: 'DELETE',
      signal: abortSignal,
    });
    return handleApiJSONResponse(response);
  } catch (error) {
    console.error('Error making request:', error);
    throw error;
  }
};

export const patchData = async <R>(
  kind: string,
  token: string | undefined,
  data: PatchRequest,
  abortSignal?: AbortSignal,
): Promise<R> => {
  try {
    const response = await fetch(`${flightCtlAPI}/api/v1/${kind}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json-patch+json',
      },
      method: 'PATCH',
      body: JSON.stringify(data),
      signal: abortSignal,
    });
    return handleApiJSONResponse(response);
  } catch (error) {
    console.error('Error making request:', error);
    throw error;
  }
};

export const fetchData = async <R>(kind: string, token: string | undefined, abortSignal?: AbortSignal): Promise<R> => {
  try {
    const response = await fetch(`${flightCtlAPI}/api/v1/${kind}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      signal: abortSignal,
    });
    return handleApiJSONResponse(response);
  } catch (error) {
    console.error('Error making request:', error);
    throw error;
  }
};

export type DeviceImages = {
  bootc: string;
  qcow2: string;
};

export const fetchImages = async () => {
  try {
    const response = await fetch(deviceImagesAPI);
    return handleApiJSONResponse<DeviceImages>(response);
  } catch (error) {
    console.error('Error making request:', error);
    throw error;
  }
};
