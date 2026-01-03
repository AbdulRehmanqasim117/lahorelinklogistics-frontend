// Centralized API client for browser fetch calls
// Uses API_BASE_URL from src/config/env when provided, otherwise falls back to same-origin relative paths.
import { getToken } from './auth';
import { API_BASE_URL } from '../config/env';

/**
 * Wrapper around fetch with:
 * - optional base URL (VITE_API_BASE_URL)
 * - optional automatic Authorization header from local storage
 * - lightweight structured logging in development
 */
export const apiFetch = async (path, options = {}) => {
  const {
    method = 'GET',
    headers = {},
    body,
    auth = true,
    token: explicitToken,
    ...rest
  } = options;

  const finalHeaders = { ...headers };

  let effectiveToken = explicitToken;
  if (auth && !effectiveToken) {
    try {
      effectiveToken = getToken();
    } catch (e) {
      // If auth utils are unavailable for some reason, ignore
      effectiveToken = null;
    }
  }

  if (auth && effectiveToken && !finalHeaders.Authorization) {
    finalHeaders.Authorization = `Bearer ${effectiveToken}`;
  }

  let finalBody = body;
  if (
    body &&
    typeof body === 'object' &&
    !(body instanceof FormData) &&
    !finalHeaders['Content-Type']
  ) {
    finalHeaders['Content-Type'] = 'application/json';
    finalBody = JSON.stringify(body);
  }

  const isAbsolute = /^https?:\/\//i.test(path);
  const base = isAbsolute || !API_BASE_URL ? '' : API_BASE_URL;
  const url = `${base}${path}`;

  if (import.meta.env.DEV) {
    // Avoid logging full token
    const { Authorization, ...restHeaders } = finalHeaders;
    console.log('[apiFetch] Request', {
      method,
      path,
      url,
      hasBaseUrl: !!API_BASE_URL,
      tokenPresent: !!effectiveToken,
      headers: {
        ...restHeaders,
        Authorization: Authorization ? 'Bearer ***' : undefined,
      },
    });
  }

  try {
    const response = await fetch(url, {
      method,
      headers: finalHeaders,
      body: finalBody,
      ...rest,
    });

    const contentType = response.headers.get('content-type') || '';
    let data;

    if (contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch (e) {
        if (import.meta.env.DEV) {
          console.error('[apiFetch] Failed to parse JSON response', e);
        }
        throw new Error('Failed to parse JSON response');
      }
    } else {
      data = await response.text();
    }

    if (import.meta.env.DEV) {
      let preview;
      try {
        preview =
          typeof data === 'string'
            ? data.slice(0, 200)
            : JSON.stringify(data).slice(0, 200);
      } catch (e) {
        preview = '[unserializable body]';
      }
      console.log('[apiFetch] Response', {
        method,
        path,
        status: response.status,
        ok: response.ok,
        url: response.url,
        preview,
      });
    }

    if (!response.ok) {
      const message =
        data && typeof data === 'object' && data.message
          ? data.message
          : `Request failed with status ${response.status}`;
      const error = new Error(message);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[apiFetch] Network or unexpected error', {
        message: error?.message,
        name: error?.name,
      });
    }
    throw error;
  }
};
