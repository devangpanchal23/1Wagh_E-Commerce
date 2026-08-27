import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Key, Eye, EyeOff, AlertCircle, ArrowLeft } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { fetchAdminApi } from '../api';

export function AdminLoginForm({ onLoginSuccess }) {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ username: '', password: '' });
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const newErrors = { username: '', password: '' };
    let isValid = true;

    if (!username.trim()) {
      newErrors.username = 'Admin username is required';
      isValid = false;
    } else if (username.trim().length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
      isValid = false;
    }

    if (!password) {
      newErrors.password = 'Admin password is required';
      isValid = false;
    } else if (password.length < 4) {
      newErrors.password = 'Password must be at least 4 characters';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const res = await fetchAdminApi('/admin/login', {
        method: 'POST',
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
        }),
      });

      if (res && res.success && res.token) {
        localStorage.setItem('wagh_admin_token', res.token);
        addToast('Admin authenticated successfully!', 'success');
        if (onLoginSuccess) {
          onLoginSuccess(res.token);
        }
      } else {
        setServerError(res?.message || 'Invalid admin username or password');
      }
    } catch (err) {
      setServerError(err.message || 'Invalid admin credentials');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12 bg-wagh-bg">
      <div className="w-full max-w-md bg-white rounded-3xl border border-wagh-border shadow-soft p-8 space-y-6 transition-all">
        {/* Portal Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-wagh-teal/10 border border-wagh-teal/20 text-wagh-teal flex items-center justify-center mx-auto shadow-xs">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="font-editorial text-2xl font-bold text-wagh-dark">Admin Access Portal</h2>
          <p className="text-xs text-wagh-muted font-mono-tag">
            Enter your Administrator credentials to sign into the store dashboard
          </p>
        </div>

        {/* Server Error Alert */}
        {serverError && (
          <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-mono-tag flex items-center gap-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Username Field Component */}
          <div>
            <label className="block text-xs font-mono-tag font-bold text-wagh-dark mb-1">
              Admin Username <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <ShieldCheck className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoComplete="username"
                placeholder="username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (errors.username) setErrors((prev) => ({ ...prev, username: '' }));
                }}
                className={`w-full pl-10 pr-3 py-3 rounded-xl border text-sm font-mono-tag focus:outline-none focus:ring-2 transition-all bg-white ${
                  errors.username
                    ? 'border-red-400 focus:ring-red-500 bg-red-50/20'
                    : 'border-wagh-border focus:ring-wagh-teal'
                }`}
              />
            </div>
            {errors.username && (
              <p className="text-[11px] text-red-600 font-mono-tag mt-1 pl-1">
                {errors.username}
              </p>
            )}
          </div>

          {/* Password Field Component with Visibility Toggle */}
          <div>
            <label className="block text-xs font-mono-tag font-bold text-wagh-dark mb-1">
              Admin Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
                }}
                className={`w-full pl-10 pr-10 py-3 rounded-xl border text-sm font-mono-tag focus:outline-none focus:ring-2 transition-all bg-white ${
                  errors.password
                    ? 'border-red-400 focus:ring-red-500 bg-red-50/20'
                    : 'border-wagh-border focus:ring-wagh-teal'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-wagh-dark transition-colors p-1"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-[11px] text-red-600 font-mono-tag mt-1 pl-1">
                {errors.password}
              </p>
            )}
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-full bg-wagh-teal text-white font-extrabold text-xs hover:bg-wagh-teal-dark transition-all duration-200 shadow-md flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Authenticating Admin...</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Sign In to Admin Portal</span>
              </>
            )}
          </button>
        </form>

        {/* Storefront Navigation */}
        <div className="pt-2 text-center border-t border-wagh-border/60">
          <button
            onClick={() => navigate('/')}
            className="text-xs text-wagh-muted hover:text-wagh-teal font-mono-tag transition-colors inline-flex items-center gap-1.5 hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Storefront</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminLoginForm;
