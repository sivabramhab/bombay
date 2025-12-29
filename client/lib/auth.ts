import api from './api';

export interface User {
  isSeller?: boolean;
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: string;
  userType?: string;
  mobileVerified: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export const authService = {
  register: async (data: { email: string; password: string; name: string; mobile: string; userType?: string }) => {
    const response = await api.post<AuthResponse>('/auth/register', data);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },

  login: async (data: { email: string; password: string }) => {
    const response = await api.post<AuthResponse>('/auth/login', data);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },

  verifyOTP: async (data: { mobile: string; otp: string }) => {
    const response = await api.post<AuthResponse>('/auth/verify-otp', data);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },

  resendOTP: async (mobile: string) => {
    const response = await api.post('/auth/resend-otp', { mobile });
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  },
};

