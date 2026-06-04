import axios from 'axios';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

axiosClient.interceptors.request.use(
  (config) => {
    let token = localStorage.getItem('token');

    if (!token) {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const userObj = JSON.parse(userStr);
          token = userObj?.token || userObj?.stsTokenManager?.accessToken;
        } catch (error) {
          console.error('Error parsing user object from localStorage:', error);
        }
      }
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

axiosClient.interceptors.response.use(
  (response) => {
    if (response && response.data) {
      return response.data.data !== undefined ? response.data.data : response.data;
    }

    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('Unauthorized request. Clearing local session and redirecting to login.');
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth:unauthorized'));

        if (window.location.pathname !== '/login') {
          window.location.assign('/login');
        }
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
