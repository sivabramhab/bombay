'use client';

import { useEffect, Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import UserSellerDialog from '@/components/UserSellerDialog';

function AuthCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { loadUser, user } = useAuthStore();
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    const token = searchParams.get('token');
    const mobileVerified = searchParams.get('mobileVerified');

    if (token) {
      // Store token
      localStorage.setItem('token', token);
      
      // Load user data
      loadUser().then(() => {
        toast.success('Login successful!');
        
        // Check if user has both user and seller capabilities
        const currentUser = useAuthStore.getState().user;
        
        // Priority: 1. If userType is 'seller' -> go to seller page
        //           2. If isSeller is true AND userType is 'user' -> show dialog
        //           3. Otherwise -> go to home
        
        if (currentUser?.userType === 'seller') {
          // User is a seller - go directly to seller page
          router.push('/seller/add-product');
        } else if (currentUser?.isSeller && currentUser?.userType === 'user') {
          // User has both capabilities - show dialog to choose
          setShowDialog(true);
        } else {
          // Only user - go to home
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Completing authentication...</p>
        </div>
      </div>
    </>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}

