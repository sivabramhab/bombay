import axios from 'axios';

// Use EC2 server URL if available, otherwise localhost for development
const getAPIUrl = () => {
  // First check environment variable (this works both server-side and client-side)
  if (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_API_URL) {
    console.log('Using NEXT_PUBLIC_API_URL from env:', process.env.NEXT_PUBLIC_API_URL);
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // If on EC2 domain, always use HTTPS (via Nginx reverse proxy)
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    console.log('Current hostname:', hostname);
    
    if (hostname.includes('ec2-') || hostname.includes('compute-1.amazonaws.com')) {
      const url = `https://${hostname}/api`;
      console.log('Using EC2 HTTPS URL:', url);
      return url;
    }
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      // For other domains, use HTTPS if page is HTTPS, otherwise HTTP
      const url = window.location.protocol === 'https:' 
        ? `https://${hostname}/api`
        : `http://${hostname}:5000/api`;
      console.log('Using non-localhost URL:', url);
      return url;
    }
    
    // For localhost, always use localhost:5000
    const url = 'http://localhost:5000/api';
    console.log('Using localhost URL:', url);
    return url;
  }
  
  // Default to localhost for development (server-side rendering)
  const url = 'http://localhost:5000/api';
  console.log('Using default localhost URL:', url);
  return url;
};

const API_URL = getAPIUrl();

console.log('API URL:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

// Add token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle token expiry - only redirect if not during initial auth check
let isInitialAuthCheck = true;

// Set initial auth check flag to false after a short delay (allows loadUser to complete)
if (typeof window !== 'undefined') {
  setTimeout(() => {
    isInitialAuthCheck = false;
  }, 2000);
}

api.interceptors.response.use(
  (response) => {
    // After first successful response, we're past initial check
    if (isInitialAuthCheck) {
      isInitialAuthCheck = false;
    }
    return response;
  },
  (error) => {
    // Handle network errors (no response from server)
    if (!error.response) {
      console.error('Network Error - No response from server:', {
        message: error.message,
        code: error.code,
        config: {
          url: error.config?.url,
          baseURL: error.config?.baseURL,
          method: error.config?.method,
        },
      });
      
      // Create a more informative error
      const networkError = new Error(
        error.code === 'ECONNREFUSED'
          ? 'Cannot connect to server. Please ensure the server is running.'
          : error.code === 'ETIMEDOUT'
          ? 'Request timed out. Please check your internet connection.'
          : 'Network error. Please check your connection and try again.'
      );
      (networkError as any).isNetworkError = true;
      (networkError as any).originalError = error;
      return Promise.reject(networkError);
    }
    
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        // Only redirect to login if:
        // 1. Not during initial auth check (page load/refresh)
        // 2. The request was NOT to /auth/me (initial user load)
        const isAuthMeRequest = error.config?.url?.includes('/auth/me');
        
        if (!isInitialAuthCheck && !isAuthMeRequest) {
          // Token expired during active session - redirect to login
          localStorage.removeItem('token');
          window.location.href = '/login';
        } else if (isAuthMeRequest) {
          // Failed to load user during initial check - just clear token, don't redirect
          localStorage.removeItem('token');
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;

