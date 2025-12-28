import axios from 'axios';

// Use EC2 server URL if available, otherwise localhost for development
const getAPIUrl = () => {
  // First check environment variable
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // If on EC2 domain, always use HTTPS (via Nginx reverse proxy)
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname.includes('ec2-') || hostname.includes('compute-1.amazonaws.com')) {
      return `https://${hostname}/api`;
    }
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      // For other domains, use HTTPS if page is HTTPS, otherwise HTTP
      return window.location.protocol === 'https:' 
        ? `https://${hostname}/api`
        : `http://${hostname}:5000/api`;
    }
  }
  
  // Default to localhost for development
  return 'http://localhost:5000/api';
};

const API_URL = getAPIUrl();

console.log('API URL:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
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

// Handle token expiry
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

