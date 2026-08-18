import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { resetPasswordSchema } from '../validations/authSchema';

export default function ResetPasswordPage() {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const initialEmail = location.state?.email || '';

  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setServerError('');

    const result = resetPasswordSchema.safeParse({ email, otp, newPassword, confirmNewPassword });
    if (!result.success) {
      const formatted = {};
      result.error.issues.forEach((issue) => {
        formatted[issue.path[0]] = issue.message;
      });
      setErrors(formatted);
      return;
    }

    setSubmitting(true);
    const response = await resetPassword(email, otp, newPassword);
    setSubmitting(false);

    if (response.success) {
      navigate('/sign-in', { state: { message: 'Password reset successful! Please log in.' } });
    } else {
      setServerError(response.message || 'Failed to reset password. Please try again.');
    }
  };

  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center p-6 bg-wagh-bg">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-xl border border-gray-100 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto border border-teal-100">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="font-editorial text-2xl font-bold text-gray-900">Reset Your Password</h2>
          <p className="text-xs text-gray-500">
            Enter your reset code and choose a new password.
          </p>
        </div>

        {serverError && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3.5 rounded-2xl flex items-center gap-2">
            <span>⚠️ {serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 bg-gray-50/40"
              />
            </div>
            {errors.email && <p className="text-xs text-rose-600 mt-1 font-medium">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">6-Digit Reset Code</label>
            <input
              type="text"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-center font-mono text-lg font-bold tracking-widest text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 bg-gray-50/40"
            />
            {errors.otp && <p className="text-xs text-rose-600 mt-1 font-medium">{errors.otp}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">New Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 bg-gray-50/40"
              />
            </div>
            {errors.newPassword && <p className="text-xs text-rose-600 mt-1 font-medium">{errors.newPassword}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Confirm New Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 bg-gray-50/40"
              />
            </div>
            {errors.confirmNewPassword && <p className="text-xs text-rose-600 mt-1 font-medium">{errors.confirmNewPassword}</p>}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-4 bg-wagh-teal hover:bg-teal-700 text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {submitting ? 'Resetting Password...' : 'Reset Password'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs text-gray-500 border-t border-gray-100 pt-4">
          Back to{' '}
          <Link to="/sign-in" className="text-teal-600 font-bold hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
