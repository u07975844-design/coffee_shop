import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';

const axiosClient = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
  },
});

export function extractErrorMessage(err, fallback = 'Something went wrong. Please try again.') {
  if (err?.response?.data?.message) {
    return err.response.data.message;
  }
  if (err?.code === 'ERR_NETWORK') {
    return 'Unable to reach the backend server. Ensure Express and MySQL are running.';
  }
  return err?.message || fallback;
}

export function resolveMediaUrl(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/src/')) {
    return url;
  }
  if (url.startsWith('/uploads/')) {
    const apiBase = import.meta.env.VITE_API_BASE_URL || '';
    if (apiBase.startsWith('http')) {
      const origin = apiBase.replace(/\/api\/?$/, '');
      return `${origin}${url}`;
    }
    return url;
  }
  return url;
}

export default axiosClient;
