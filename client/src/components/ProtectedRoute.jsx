import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Zap } from 'lucide-react';

export function ProtectedRoute({ children }) {
  const { isLoaded, isSignedIn } = useAuth();
  const location = useLocation();

  // Custom JWT session resolution on initial app load
  if (!isLoaded) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-wagh-teal border-t-transparent animate-spin flex items-center justify-center">
          <Zap className="w-5 h-5 text-wagh-gold animate-bounce" />
        </div>
        <p className="font-mono-tag text-xs text-wagh-muted uppercase tracking-wider">
          Verifying WAGH Account Security...
        </p>
      </div>
    );
  }

  if (!isSignedIn) {
    const returnTo = `${location.pathname}${location.search}`;
    return <Navigate to={`/sign-in?redirect_url=${encodeURIComponent(returnTo)}`} replace />;
  }

  return children;
}

export default ProtectedRoute;
