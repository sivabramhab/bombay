'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

export default function AuthCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { loadUser } = useAuthStore();

  useEffect(() => {
    const token = searchParams.get('token');
    const mobileVerified = searchParams.get('mobileVerified');

    if (token) {
      // Store token
      localStorage.setItem('token', token);
      
      // Load user data
      loadUser().then(() => {
        if (mobileVerified === 'true') {
          toast.success('Login successful!');
          router.push('/');
        } else {
          toast.success('Login successful! Please verify your mobile number.');
          router.push('/');
        }
      }).catch(() => {
        toast.error('Failed to load user data');
        router.push('/login');
      });
    } else {
      toast.error('Authentication failed');
      router.push('/login');
    }
  }, [searchParams, router, loadUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Completing authentication...</p>
      </div>
    </div>
  );
}

