// Centralized environment-based URLs for the LahoreLink Logistics frontend
// NOTE: Only this module should read from import.meta.env for base URLs.

const normalizeUrl = (value) => {
  if (!value || typeof value !== 'string') return '';
  return value.replace(/\/$/, '');
};

// Public app base URL (e.g. https://lahorelinklogistics.com)
const RAW_APP_BASE_URL =
  import.meta.env.VITE_APP_BASE_URL ||
  (typeof window !== 'undefined' ? window.location.origin : '');

// API base URL (e.g. https://api.lahorelinklogistics.com)
let RAW_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// In development, if no explicit API base URL is configured, derive it from the
// current frontend origin by shifting the port (e.g. 3000 -> 5000) so that it
// targets the Node backend running on a higher port on the same host.
if (!RAW_API_BASE_URL && import.meta.env.DEV && typeof window !== 'undefined') {
  try {
    const current = new URL(window.location.href);
    if (current.port) {
      const portNum = Number(current.port);
      if (Number.isFinite(portNum)) {
        current.port = String(portNum + 2000);
      }
    }
    RAW_API_BASE_URL = current.origin;
  } catch (e) {
    RAW_API_BASE_URL = '';
  }
}

export const APP_BASE_URL = normalizeUrl(RAW_APP_BASE_URL);
export const API_BASE_URL = normalizeUrl(RAW_API_BASE_URL);

export const getAppBaseUrl = () => APP_BASE_URL;
export const getApiBaseUrl = () => API_BASE_URL;
