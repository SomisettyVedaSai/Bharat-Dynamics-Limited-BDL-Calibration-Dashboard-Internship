export function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString();
}

export function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

export const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

export function assetUrl(path) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
}
