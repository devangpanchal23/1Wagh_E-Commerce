import React, { useState } from 'react';
import { X, ShieldCheck, UserPlus, LogIn, Lock, User, Mail, ArrowRight, LogOut, Eye, EyeOff } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginSchema, registerSchema } from '../validations/authSchema';
import './auth-modal.css';

export function LoginModal({ isOpen, onClose }) {
  const { user, isSignedIn, login, register, logout } = useAuth();
  const navigate = useNavigate();

  const [authMode, setAuthMode] = useState('sign-in'); // 'sign-in' | 'sign-up'

  // Sign In state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginErrors, setLoginErrors] = useState({});

  // Sign Up state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [regErrors, setRegErrors] = useState({});

  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginErrors({});

    const result = loginSchema.safeParse({ email: loginEmail, password: loginPassword });
    if (!result.success) {
      const formatted = {};
      result.error.issues.forEach((issue) => {
        formatted[issue.path[0]] = issue.message;
      });
      setLoginErrors(formatted);
      return;
    }

    setSubmitting(true);
    const response = await login(loginEmail, loginPassword);
    setSubmitting(false);

    if (response.success) {
      onClose();
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegErrors({});

    const result = registerSchema.safeParse({
      name: regName,
      email: regEmail,
      password: regPassword,
      confirmPassword: regConfirmPassword,
    });
    if (!result.success) {
      const formatted = {};
      result.error.issues.forEach((issue) => {
        formatted[issue.path[0]] = issue.message;
      });
      setRegErrors(formatted);
      return;
    }

    setSubmitting(true);
    const response = await register(regName, regEmail, regPassword);
    setSubmitting(false);

    if (response.success) {
      onClose();
      navigate('/verify-otp', { state: { email: response.email } });
    }
  };

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div
        className="auth-modal-container relative flex flex-col bg-white rounded-3xl shadow-2xl max-w-[460px] w-full mx-4 my-auto max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex flex-col bg-white shrink-0 z-10 border-b border-gray-100 p-5 sm:p-6 pb-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600 font-bold border border-teal-100 shadow-xs shrink-0">
                <Lock className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <h3 className="font-editorial text-xl font-bold text-gray-900 leading-tight">
                  {isSignedIn ? 'My Account' : authMode === 'sign-in' ? 'Welcome Back' : 'Create Account'}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {isSignedIn
                    ? `Signed in as ${user?.email}`
                    : authMode === 'sign-in'
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

          {!isSignedIn && (
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
          )}
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto px-6 sm:px-8 py-5 space-y-4 max-h-[calc(92vh-170px)] custom-scrollbar">
          {isSignedIn ? (
            <div className="w-full flex flex-col items-center text-center py-4 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600 font-bold border border-teal-100">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <h4 className="font-editorial text-lg font-bold text-gray-900">{user?.displayName || user?.name}</h4>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <div className="flex items-center gap-3 w-full pt-2">
                <button
                  onClick={() => {
                    onClose();
                    navigate('/profile');
                  }}
                  className="flex-1 py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-xs transition-all text-xs cursor-pointer"
                >
                  My Profile & Orders
                </button>
                <button
                  onClick={() => {
                    logout();
                    onClose();
                  }}
                  className="py-2.5 px-4 bg-gray-100 hover:bg-rose-50 hover:text-rose-600 text-gray-700 font-bold rounded-xl transition-all text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          ) : authMode === 'sign-in' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 bg-gray-50/40"
                  />
                </div>
                {loginErrors.email && <p className="text-xs text-rose-600 mt-1 font-medium">{loginErrors.email}</p>}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-gray-700">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      navigate('/forgot-password');
                    }}
                    className="text-xs text-teal-600 hover:underline font-semibold"
                  >
                    Forgot?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 bg-gray-50/40"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-wagh-dark transition-colors p-1 cursor-pointer"
                    aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {loginErrors.password && <p className="text-xs text-rose-600 mt-1 font-medium">{loginErrors.password}</p>}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Signing In...' : 'Sign In'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 bg-gray-50/40"
                  />
                </div>
                {regErrors.name && <p className="text-xs text-rose-600 mt-1 font-medium">{regErrors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 bg-gray-50/40"
                  />
                </div>
                {regErrors.email && <p className="text-xs text-rose-600 mt-1 font-medium">{regErrors.email}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 bg-gray-50/40"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-wagh-dark transition-colors p-1 cursor-pointer"
                    aria-label={showRegPassword ? 'Hide password' : 'Show password'}
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {regErrors.password && <p className="text-xs text-rose-600 mt-1 font-medium">{regErrors.password}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Confirm Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type={showRegConfirmPassword ? 'text' : 'password'}
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 bg-gray-50/40"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-wagh-dark transition-colors p-1 cursor-pointer"
                    aria-label={showRegConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showRegConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {regErrors.confirmPassword && <p className="text-xs text-rose-600 mt-1 font-medium">{regErrors.confirmPassword}</p>}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Creating Account...' : 'Create Account'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-gray-50/80 text-center text-[11px] text-gray-400 flex items-center justify-center gap-1.5 border-t border-gray-100 w-full shrink-0">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
          <span>Secured with 256-bit SSL encryption</span>
        </div>
      </div>
    </div>
  );
}

export default LoginModal;
