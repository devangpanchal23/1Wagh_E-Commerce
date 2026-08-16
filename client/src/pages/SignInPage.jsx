import React from 'react';
import { SignIn } from '@clerk/react';
import { Link } from 'react-router-dom';
import { Info } from 'lucide-react';

export default function SignInPage() {
  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center p-6 bg-wagh-bg">
      <div className="w-full max-w-md space-y-4">
        <div className="bg-amber-50 border border-amber-200 text-amber-900 text-xs p-3 rounded-2xl flex items-center gap-2">
          <Info className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            New to WAGH Accessories? If you don't have an account yet,{' '}
            <Link to="/sign-up" className="font-bold underline text-amber-900 hover:text-wagh-teal">
              Click here to Sign Up
            </Link>
          </span>
        </div>
        <SignIn
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          fallbackRedirectUrl="/"
        />
        <div className="text-center text-xs text-wagh-muted font-mono-tag">
          Don't have an account?{' '}
          <Link to="/sign-up" className="text-wagh-teal font-bold hover:underline">
            Create an Account (Sign Up)
          </Link>
        </div>
      </div>
    </div>
  );
}
