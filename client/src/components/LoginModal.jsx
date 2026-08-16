import React, { useState } from 'react';
import { X, ShieldCheck, UserPlus, LogIn, Info, Lock } from 'lucide-react';
import { Show, SignIn, SignUp, UserButton } from '@clerk/react';
import './auth-modal.css';

const clerkAppearance = {
  elements: {
    card: 'shadow-none bg-transparent border-none p-0 w-full max-w-none m-0',
    rootBox: 'w-full flex justify-center',
    headerTitle: 'hidden',
    headerSubtitle: 'hidden',
    socialButtonsBlockButton:
      'rounded-xl border border-gray-200 hover:bg-gray-50/80 text-xs font-semibold py-2.5 transition-all shadow-xs flex items-center justify-center gap-2 text-gray-700 w-full',
    socialButtonsBlockButtonText: 'text-xs font-semibold text-gray-700',
    socialButtonsIconButton: 'rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 py-2.5',
    dividerLine: 'bg-gray-200',
    dividerText: 'text-[11px] text-gray-400 font-medium uppercase px-2 bg-white',
    formFieldLabel: 'text-xs font-bold text-gray-700 mb-1',
    formFieldInput:
      'w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all bg-gray-50/40 focus:bg-white box-border',
    formButtonPrimary:
      'w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.99] cursor-pointer mt-2',
    footerActionLink: 'text-teal-600 font-bold hover:underline text-xs cursor-pointer',
    footerActionText: 'text-xs text-gray-500',
    footer: 'text-center text-xs text-gray-400 mt-2',
    identityPreviewText: 'text-xs font-medium text-gray-700',
    identityPreviewEditButtonIcon: 'text-teal-600',
    formHeaderTitle: 'text-lg font-bold text-gray-900',
    formHeaderSubtitle: 'text-xs text-gray-500',
    badge: 'bg-teal-50 text-teal-700 border-teal-200 text-[10px] font-bold px-2 py-0.5 rounded-full',
    formFieldRow: 'w-full gap-3',
  },
  variables: {
    colorPrimary: '#0d9488',
    colorText: '#0f172a',
    colorBackground: 'transparent',
    borderRadius: '0.75rem',
  },
};

export function LoginModal({ isOpen, onClose }) {
  const [authMode, setAuthMode] = useState('sign-in'); // 'sign-in' | 'sign-up'

  if (!isOpen) return null;

  // Clerk renders its "Already have an account? Sign in" switcher inside the
  // footer action row, and that link is the ONLY control this modal takes over.
  // Matching every descendant button by its label instead used to preventDefault
  // the click on Clerk's own submit and "Sign in with Google" buttons — the form
  // never submitted and OAuth never started, so signing in did nothing at all.
  const handleModalContentClick = (e) => {
    const target = e.target instanceof Element ? e.target : null;
    if (!target) return;

    const switcher = target.closest('.cl-footerActionLink, .cl-footerAction a, .cl-footerAction button');
    if (!switcher) return;

    const href = switcher.getAttribute('href') || '';
    const text = (switcher.textContent || '').trim().toLowerCase();
    const wantsSignUp = href.includes('sign-up') || text.includes('sign up');
    const wantsSignIn = href.includes('sign-in') || text.includes('sign in');
    if (!wantsSignUp && !wantsSignIn) return;

    e.preventDefault();
    setAuthMode(wantsSignUp ? 'sign-up' : 'sign-in');
  };

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div
        className="auth-modal-container relative flex flex-col bg-white rounded-3xl shadow-2xl max-w-[490px] w-full mx-4 my-auto max-h-[92vh] overflow-hidden"
        onClick={(e) => {
          e.stopPropagation();
          handleModalContentClick(e);
        }}
      >
        {/* Fixed Top Header (Includes Title & Segmented Mode Switcher) */}
        <div className="flex flex-col bg-white shrink-0 z-10 border-b border-gray-100 p-5 sm:p-6 pb-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600 font-bold border border-teal-100 shadow-xs shrink-0">
                <Lock className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <h3 className="font-editorial text-xl font-bold text-gray-900 leading-tight">
                  {authMode === 'sign-in' ? 'Welcome Back' : 'Create Account'}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {authMode === 'sign-in'
                    ? 'Sign in to access your WAGH account'
                    : 'Join WAGH Accessories for exclusive perks'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all cursor-pointer shrink-0"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <Show when="signed-out">
            {/* Segmented Mode Selector Bar */}
            <div className="flex bg-gray-100/80 p-1 rounded-2xl w-full border border-gray-200/50">
              <button
                type="button"
                onClick={() => setAuthMode('sign-in')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  authMode === 'sign-in'
                    ? 'bg-white text-teal-700 shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('sign-up')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  authMode === 'sign-up'
                    ? 'bg-white text-teal-700 shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Sign Up</span>
              </button>
            </div>
          </Show>
        </div>

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto px-6 sm:px-8 py-5 space-y-4 max-h-[calc(92vh-170px)] custom-scrollbar">
          <Show when="signed-out">
            <div className="w-full flex flex-col space-y-4">
              {/* Quick info tip for new users */}
              <div className="w-full bg-amber-50/80 border border-amber-200/70 text-amber-900 text-[11px] p-3 rounded-2xl flex items-start gap-2.5 shadow-xs">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  <strong>New user?</strong> If you see <em>"External account not found"</em>, switch to the <strong>Sign Up</strong> tab to register first.
                </span>
              </div>

              {/* Clerk Sign In / Sign Up component */}
              <div className="w-full flex justify-center pt-1 px-1">
                {authMode === 'sign-in' ? (
                  <SignIn
                    routing="hash"
                    signUpUrl="#sign-up"
                    fallbackRedirectUrl="/"
                    appearance={clerkAppearance}
                  />
                ) : (
                  <SignUp
                    routing="hash"
                    signInUrl="#sign-in"
                    fallbackRedirectUrl="/"
                    appearance={clerkAppearance}
                  />
                )}
              </div>
            </div>
          </Show>

          <Show when="signed-in">
            <div className="w-full flex flex-col items-center text-center py-6 space-y-4">
              <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 font-bold mb-1">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-editorial text-xl font-bold text-gray-900">You are signed in</h3>
              <p className="text-xs text-gray-500">Welcome to your WAGH Accessories profile.</p>
              <UserButton showName />
              <button
                onClick={onClose}
                className="mt-4 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all text-sm cursor-pointer"
              >
                Continue Shopping
              </button>
            </div>
          </Show>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-gray-50/80 text-center text-[11px] text-gray-400 flex items-center justify-center gap-1.5 border-t border-gray-100 w-full shrink-0">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
          <span>Secured with 256-bit SSL encryption & Clerk</span>
        </div>
      </div>
    </div>
  );
}

export default LoginModal;



