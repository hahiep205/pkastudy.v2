import axios from 'axios';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Interceptor for Request
axiosClient.interceptors.request.use(
  (config) => {
    // Lấy token từ localStorage (phù hợp với login API hiện tại)
    let token = localStorage.getItem('token');
    if (!token) {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const userObj = JSON.parse(userStr);
          token = userObj?.token || userObj?.stsTokenManager?.accessToken;
        } catch (e) {
          console.error('Error parsing user object from localStorage:', e);
        }
      }
    }
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor for Response
axiosClient.interceptors.response.use(
  (response) => {
    if (response && response.data) {
      // API của bạn thường trả về { data: ... }
      return response.data.data !== undefined ? response.data.data : response.data;
    }
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('Unauthorized! Xóa token và điều hướng về trang đăng nhập.');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Có thể thêm code auto redirect: window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
