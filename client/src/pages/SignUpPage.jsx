import React from 'react';
import { SignUp } from '@clerk/react';
import { Link } from 'react-router-dom';

export default function SignUpPage() {
  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center p-6 bg-wagh-bg">
      <div className="w-full max-w-md space-y-4">
        <SignUp
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          fallbackRedirectUrl="/"
        />
        <div className="text-center text-xs text-wagh-muted font-mono-tag">
          Already have an account?{' '}
          <Link to="/sign-in" className="text-wagh-teal font-bold hover:underline">
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
}
