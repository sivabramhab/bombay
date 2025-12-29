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
        if (currentUser?.isSeller && currentUser?.userType === 'user') {
          // Show dialog to choose page
          setShowDialog(true);
        } else if (currentUser?.isSeller || currentUser?.userType === 'seller') {
          // Only seller, go to seller page
          router.push('/seller/add-product');
        } else {
          // Only user, go to home
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

