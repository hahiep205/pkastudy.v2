function isLocalhostHost(hostname) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
}

function isLocalhostUrl(url) {
  return /^(https?:\/\/)?(localhost|127\.0\.0\.1|::1)(:\d+)?(\/|$)/i.test(url);
}

function resolveApiBaseUrl() {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/$/, '');
  if (configuredBaseUrl) {
    if (import.meta.env.PROD && isLocalhostUrl(configuredBaseUrl)) {
      return undefined;
    }

    return configuredBaseUrl;
  }

  if (typeof window !== 'undefined') {
    const { hostname, origin } = window.location;
    if (isLocalhostHost(hostname)) {
      return 'http://localhost:4000';
    }

    return `${origin}/api`;
  }

  return '/api';
}

const API_BASE_URL = resolveApiBaseUrl() || '/api';

function normalizeBaseUrl(url) {
  return url.replace(/\/+$/, '');
}

function normalizePath(path) {
  return path.replace(/^\/+/, '');
}

function buildApiUrl(path) {
  const base = normalizeBaseUrl(API_BASE_URL);
  const normalizedPath = normalizePath(path);

  if (base.endsWith('/api')) {
    const pathWithoutApi = normalizedPath.replace(/^api\/?/i, '');
    return `${base}/${pathWithoutApi}`;
  }

  return `${base}/${normalizedPath}`;
}

export { API_BASE_URL, buildApiUrl };
