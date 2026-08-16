import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth as useClerkAuth } from '@clerk/react';
import { useToast } from '../context/ToastContext';
import { Zap } from 'lucide-react';

export function AdminGateway({ children }) {
  const { isLoaded, isSignedIn } = useClerkAuth();
  const { addToast } = useToast();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      addToast('Please sign out of your customer account to access the admin portal.', 'info');
    }
  }, [isLoaded, isSignedIn, addToast]);

  // Neutral loading state while Clerk initializes
  if (!isLoaded) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center p-6 space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-wagh-teal border-t-transparent animate-spin flex items-center justify-center">
          <Zap className="w-5 h-5 text-wagh-gold animate-bounce" />
        </div>
        <p className="font-mono-tag text-xs text-wagh-muted uppercase tracking-wider">
          Checking Security Gateway Status...
        </p>
      </div>
    );
  }

  // If customer is signed in in this browser, redirect to "/"
  if (isSignedIn) {
    return <Navigate to="/" replace />;
  }

  // Signed-out visitor: render Admin page normally
  return children;
}

export default AdminGateway;
