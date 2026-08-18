import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ShieldCheck, ArrowRight, RefreshCw, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { verifyOtpSchema } from '../validations/authSchema';

export default function VerifyOtpPage() {
  const { verifyOtp, sendEmailOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const initialEmail = location.state?.email || '';
  const devOtp = location.state?.devOtp || null;

  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState(devOtp || '');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    const result = verifyOtpSchema.safeParse({ email, otp });
    if (!result.success) {
      const formatted = {};
      result.error.issues.forEach((issue) => {
        formatted[issue.path[0]] = issue.message;
      });
      setErrors(formatted);
      return;
    }

    setSubmitting(true);
    const response = await verifyOtp(email, otp);
    setSubmitting(false);

    if (response.success) {
      navigate('/sign-in', { state: { message: 'Verification successful! Please log in.' } });
    }
  };

  const handleResend = async () => {
    if (!email) {
      setErrors({ email: 'Please enter your email to resend OTP' });
      return;
    }
    setResending(true);
    await sendEmailOtp(email);
    setResending(false);
  };

  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center p-6 bg-wagh-bg">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-xl border border-gray-100 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto border border-teal-100">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="font-editorial text-2xl font-bold text-gray-900">Verify Your Email</h2>
          <p className="text-xs text-gray-500">
            Enter the 6-digit verification code sent to your email address.
          </p>
        </div>

        {devOtp && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 text-xs p-3 rounded-2xl text-center">
            <strong>Development Code:</strong> <span className="font-mono font-bold tracking-widest">{devOtp}</span>
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
            <label className="block text-xs font-bold text-gray-700 mb-1">6-Digit Verification Code</label>
            <input
              type="text"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-center font-mono text-xl font-bold tracking-widest text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 bg-gray-50/40"
            />
            {errors.otp && <p className="text-xs text-rose-600 mt-1 font-medium">{errors.otp}</p>}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-4 bg-wagh-teal hover:bg-teal-700 text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {submitting ? 'Verifying...' : 'Verify Code'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="flex items-center justify-between text-xs border-t border-gray-100 pt-4">
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="text-teal-600 font-bold hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
            <span>Resend Code</span>
          </button>

          <Link to="/sign-in" className="text-gray-500 hover:text-gray-900 font-semibold">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
