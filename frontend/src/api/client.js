import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem('cms_auth');
    if (raw) {
      const { token } = JSON.parse(raw);
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    /* ignore */
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status;
    const message =
      error.response?.data?.error ||
      (status === 404 ? 'Resource not found' : null) ||
      (status === 401 ? 'Please sign in again' : null) ||
      (status === 403 ? 'You do not have permission' : null) ||
      (status >= 500 ? 'Server error — try again later' : null) ||
      error.message ||
      'Request failed';
    error.userMessage = message;
    if (status === 401 && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('cms_auth');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export function getErrorMessage(err) {
  return err?.userMessage || err?.response?.data?.error || err?.message || 'Something went wrong';
}

export default api;
