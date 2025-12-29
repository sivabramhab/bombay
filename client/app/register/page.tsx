'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import toast from 'react-hot-toast';
import UserSellerDialog from '@/components/UserSellerDialog';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    mobile: '',
    userType: 'user', // 'user' or 'seller'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const { register } = useAuthStore();
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log('Registration attempt:', { ...formData, userType: formData.userType });
      const response: any = await register({ ...formData, userType: formData.userType });
      console.log('Registration response:', response);
      
      // Check if response indicates success (success field can be true, undefined, or missing, but not false)
      if (!response || response.success === false || !response.token || !response.user) {
        const errorMessage = response?.message || 'Registration failed - invalid response';
        throw new Error(errorMessage);
      }
      
      toast.success(response.message || 'Registration successful!');
      
      // Get user data from registration response
      const currentUser = response?.user || useAuthStore.getState().user;
      
      // Check routing based on userType and isSeller
      // Priority: 1. If userType is 'seller' -> go to seller page
      //           2. If isSeller is true AND userType is 'user' -> show dialog
      //           3. Otherwise -> go to home
      
      if (currentUser?.userType === 'seller') {
        // User registered as seller - go directly to seller page
        router.push('/seller/add-product');
      } else if (currentUser?.isSeller && currentUser?.userType === 'user') {
        // User has both capabilities - show dialog to choose
        setShowDialog(true);
      } else {
        // Only user - go to home
        router.push('/');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      console.error('Error response:', error.response);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        isNetworkError: error.isNetworkError,
        config: error.config,
      });
      
      // Handle network errors specifically
      if (error.isNetworkError || !error.response) {
        const networkMessage = error.message || 'Cannot connect to server. Please ensure the server is running on port 5000.';
        toast.error(networkMessage);
        console.error('Network Error Details:', {
          API_URL: typeof window !== 'undefined' ? (window as any).API_URL : 'N/A',
          error: error.originalError || error,
        });
        return;
      }
      
      const errorMessage = error.response?.data?.message 
        || error.response?.data?.error 
        || error.message 
        || 'Registration failed. Please check your details and try again.';
      toast.error(errorMessage);
      
      // Also show validation errors if present
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        error.response.data.errors.forEach((err: any) => {
          if (typeof err === 'string') {
            toast.error(err);
          } else if (err.message) {
            toast.error(err.message);
          }
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDialogSelect = (choice: 'user' | 'seller') => {
    setShowDialog(false);
    if (choice === 'seller') {
      router.push('/seller/add-product');
    } else {
      router.push('/');
    }
  };

  return (
    <>
      {showDialog && <UserSellerDialog onSelect={handleDialogSelect} />}
      <div className="min-h-screen flex items-center justify-center" style={{ 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '40px 16px'
    }}>
      <div className="max-w-md w-full space-y-8" style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '40px 32px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <div>
          <h2 style={{ 
            marginTop: '0',
            marginBottom: '8px',
            textAlign: 'center',
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#1f2937'
          }}>
            Create Your Account
          </h2>
          <p style={{
            textAlign: 'center',
            fontSize: '14px',
            color: '#6b7280',
            marginBottom: '24px'
          }}>
            Join us and start saving today
          </p>
          
          {/* User Type Toggle */}
          <div style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '24px',
            padding: '8px',
            backgroundColor: '#f3f4f6',
            borderRadius: '8px'
          }}>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, userType: 'user' })}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '6px',
                border: 'none',
                fontWeight: '600',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: formData.userType === 'user' ? '#2874f0' : 'transparent',
                color: formData.userType === 'user' ? 'white' : '#6b7280',
                boxShadow: formData.userType === 'user' ? '0 2px 4px rgba(40,116,240,0.3)' : 'none'
              }}
            >
              👤 User
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, userType: 'seller' })}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '6px',
                border: 'none',
                fontWeight: '600',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: formData.userType === 'seller' ? '#2874f0' : 'transparent',
                color: formData.userType === 'seller' ? 'white' : '#6b7280',
                boxShadow: formData.userType === 'seller' ? '0 2px 4px rgba(40,116,240,0.3)' : 'none'
              }}
            >
              🏪 Seller
            </button>
          </div>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleRegister}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="sr-only">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Full Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Email address"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="mobile" className="sr-only">
                Mobile Number
              </label>
              <input
                id="mobile"
                name="mobile"
                type="tel"
                required
                maxLength={10}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Mobile Number"
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, '') })}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Password (min 6 characters)"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '12px 24px',
                background: isLoading 
                  ? '#9ca3af' 
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '14px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                boxShadow: isLoading ? 'none' : '0 4px 12px rgba(102,126,234,0.4)'
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(102,126,234,0.5)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(102,126,234,0.4)';
                }
              }}
            >
              {isLoading ? 'Creating account...' : 'Sign up'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
    </>
  );
}

