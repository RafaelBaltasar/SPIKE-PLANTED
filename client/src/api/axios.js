
import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getFileUrl = (filePath) => {
  if (!filePath) return '';

  if (/^https?:\/\//i.test(filePath)) {
    return filePath;
  }

  const serverUrl = (api.defaults.baseURL || '/api').replace(/\/api\/?$/, '');

  return `${serverUrl}${filePath.startsWith('/') ? '' : '/'}${filePath}`;
};

// Automatically attach the logged-in user's token.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('spikeToken');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Automatically log out inactive students.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message;

    if (
      status === 403 &&
      message === 'Your student account is inactive. Please contact the OJT Coordinator.'
    ) {
      localStorage.removeItem('spikeToken');
      localStorage.removeItem('spikeUser');

      sessionStorage.setItem('spikeAuthMessage', message);
      window.location.href = '/login';
    } else if (status === 401) {
      localStorage.removeItem('spikeToken');
      localStorage.removeItem('spikeUser');

      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);
