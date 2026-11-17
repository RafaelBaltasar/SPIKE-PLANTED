
import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

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
    const message = error.response?.data?.message;

    if (
      error.response?.status === 403 &&
      message === 'Your student account is inactive. Please contact the OJT Coordinator.'
    ) {
      localStorage.removeItem('spikeToken');
      localStorage.removeItem('spikeUser');

      sessionStorage.setItem('spikeAuthMessage', message);

      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);
