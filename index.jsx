import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { API_BASE_URL } from './src/config/env';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

// Global fetch wrapper: prefix relative "/api" calls with API_BASE_URL when configured
if (typeof window !== 'undefined' && window.fetch && API_BASE_URL) {
  const originalFetch = window.fetch.bind(window);

  window.fetch = (input, init) => {
    try {
      if (typeof input === 'string') {
        if (input.startsWith('/api')) {
          return originalFetch(`${API_BASE_URL}${input}`, init);
        }
        return originalFetch(input, init);
      }

      if (input instanceof Request) {
        const url = input.url || '';
        if (url.startsWith('/api')) {
          const updatedRequest = new Request(`${API_BASE_URL}${url}`, input);
          return originalFetch(updatedRequest, init);
        }
        return originalFetch(input, init);
      }
    } catch (e) {
      // If anything goes wrong, fall back to the original fetch
      return originalFetch(input, init);
    }

    return originalFetch(input, init);
  };
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

