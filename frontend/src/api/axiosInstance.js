import axios from 'axios';
import useAuthStore from '../store/authStore';

// ==========================================
// 1. AXIOS INSTANCE CONFIGURATION
// ==========================================
// We create a global axios instance with a predefined base URL.
// The baseURL is fetched from environment variables (VITE_API_URL).
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// ==========================================
// 2. REQUEST INTERCEPTOR (JWT ATTACHMENT)
// ==========================================
// Every time an API call is made, this interceptor runs automatically.
// It grabs the JWT token from the Zustand store and injects it into the 
// Authorization header as a 'Bearer' token. This handles stateless auth.
axiosInstance.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ==========================================
// 3. RESPONSE INTERCEPTOR (ERROR HANDLING)
// ==========================================
// If the backend returns a 401 Unauthorized (e.g. token expired),
// we automatically logout the user and redirect them to the login page.
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log('API Error:', error.response?.status, error.response?.data);
    if (error.response?.status === 401) {
      console.log('401 received, logging out');
      useAuthStore.getState().logout();
      // Use window.location for now, but this causes full reload
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
