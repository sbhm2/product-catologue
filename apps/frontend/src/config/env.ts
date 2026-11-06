/**
 * Build-time configuration. Docker injects `VITE_API_BASE_URL` as a build arg;
 * local development falls back to the backend's default port.
 */
const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;

export const env = {
  apiBaseUrl: (rawApiBaseUrl?.trim() || 'http://localhost:4000').replace(/\/+$/, ''),
} as const;
