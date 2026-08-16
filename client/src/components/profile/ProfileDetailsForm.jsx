import React, { useState, useEffect } from 'react';
import { Phone, Calendar, UserCheck, Save, AlertCircle, CheckCircle2, Mail, Hash, ShieldCheck, RefreshCw, X, Check } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { profileDetailsSchema, sanitizeText } from '../../validations/profileSchema';

// Client-side age calculation helper
const calculateAge = (dobStr) => {
  if (!dobStr) return null;
  const dob = new Date(dobStr);
  if (isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age >= 0 ? age : 0;
};

const normalizeBirthdate = (value) => {
  if (!value) return '';
  const str = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  const parsed = new Date(str);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().slice(0, 10);
};

export function ProfileDetailsForm({ profile, onSaveDetails }) {
  const { sendEmailOtp, verifyEmailOtp } = useAuth();
  const { addToast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [gender, setGender] = useState('prefer_not_to_say');
  
  // Email Verification & OTP States (SMTP via Resend)
  const [emailVerified, setEmailVerified] = useState(false);
  const [showOtpBox, setShowOtpBox] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [countdown, setCountdown] = useState(0);

  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.displayName || profile.name || '');
      setEmail(profile.email || '');
      setPhone(profile.phone || profile.phoneNumber || profile.mobileNumber || '');
      setBirthdate(normalizeBirthdate(profile.birthdate || profile.dob || ''));
      setGender(profile.gender || 'prefer_not_to_say');
      setEmailVerified(!!profile.emailVerified);
    }
  }, [profile]);

  // Countdown timer effect for OTP resend
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const originalName = profile?.displayName || profile?.name || '';
  const originalEmail = profile?.email || '';
  const originalPhone = profile?.phone || profile?.phoneNumber || profile?.mobileNumber || '';
  const originalBirthdate = normalizeBirthdate(profile?.birthdate || profile?.dob || '');
  const originalGender = profile?.gender || 'prefer_not_to_say';

  const isDirty =
    name.trim() !== originalName.trim() ||
    email.trim().toLowerCase() !== originalEmail.trim().toLowerCase() ||
    phone.trim() !== originalPhone ||
    birthdate !== originalBirthdate ||
    gender !== originalGender;

  const currentAge = birthdate ? calculateAge(birthdate) : (profile?.age ?? null);
  const isValidEmail = /^\S+@\S+\.\S+$/.test(email.trim());

  // Validate entire form against Zod schema
  const validateForm = (dataToValidate) => {
    const parseResult = profileDetailsSchema.safeParse(dataToValidate);
    if (!parseResult.success) {
      const formattedErrors = {};
      parseResult.error.issues.forEach((issue) => {
        const fieldName = issue.path[0];
        if (!formattedErrors[fieldName]) {
          formattedErrors[fieldName] = issue.message;
        }
      });
      setFieldErrors(formattedErrors);
      return false;
    }
    setFieldErrors({});
    return true;
  };

  // Trigger Send Email OTP flow via Resend SMTP directly to recipient email
  const handleSendEmailOtp = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !isValidEmail) {
      setFieldErrors((prev) => ({
        ...prev,
        email: 'Please enter a valid email address',
      }));
      return;
    }

    setSendingOtp(true);
    setOtpError('');

    try {
      const res = await sendEmailOtp(cleanEmail);
      if (res && res.success) {
        setShowOtpBox(true);
        setCountdown(30);
        addToast(res.message || `Verification OTP code sent to ${cleanEmail}!`, 'success');
      } else {
        setOtpError(res?.message || 'Failed to send OTP code.');
        addToast(res?.message || 'Failed to send OTP code.', 'error');
      }
    } catch (err) {
      console.error('Send Email OTP error:', err);
      setOtpError(err.message || 'Error sending OTP code.');
      addToast(err.message || 'Error sending OTP code.', 'error');
    } finally {
      setSendingOtp(false);
    }
  };

  // Trigger Verify Email OTP flow
  const handleVerifyEmailOtp = async (e) => {
    e?.preventDefault();
    const cleanOtp = otpInput.trim();
    if (!cleanOtp || cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
      setOtpError('Please enter a valid 6-digit OTP code');
      return;
    }

    setVerifyingOtp(true);
    setOtpError('');

    try {
      const res = await verifyEmailOtp(cleanOtp);
      if (res && res.success) {
        setEmailVerified(true);
        setShowOtpBox(false);
        setOtpInput('');
        addToast('Email address verified successfully! ✓', 'success');
      } else {
        setOtpError(res?.message || 'Invalid OTP code');
        addToast(res?.message || 'Verification failed', 'error');
      }
    } catch (err) {
      console.error('Verify Email OTP error:', err);
      setOtpError(err.message || 'Verification failed');
      addToast(err.message || 'Verification failed', 'error');
    } finally {
      setVerifyingOtp(false);
    }
  };

  // Save profile changes handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSavedSuccess(false);

    const formDataToValidate = {
      name,
      email,
      phone,
      birthdate,
      age: currentAge,
      gender,
    };

    if (!validateForm(formDataToValidate)) {
      addToast('Please fix the validation errors in the form before saving.', 'error');
      return;
    }

    setSaving(true);
    try {
      const res = await onSaveDetails({
        name: sanitizeText(name),
        displayName: sanitizeText(name),
        email: email.trim().toLowerCase(),
        emailVerified: email.trim().toLowerCase() === originalEmail.trim().toLowerCase() ? emailVerified : false,
        phone: phone.trim(),
        phoneNumber: phone.trim(),
        mobileNumber: phone.trim(),
        birthdate,
        age: currentAge,
        gender,
      });

      if (res && res.success) {
        setSavedSuccess(true);
        addToast('Account profile saved permanently!', 'success');
        setTimeout(() => setSavedSuccess(false), 4000);
      } else {
        addToast(res?.message || 'Failed to update profile details', 'error');
      }
    } catch (err) {
      console.error('Update profile form error:', err);
      addToast(err.message || 'Error updating profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-wagh-border p-6 sm:p-8 shadow-soft space-y-6">
      <div className="border-b border-wagh-border pb-4 flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
        <div>
          <h3 className="font-editorial text-xl font-bold text-wagh-dark">Account Profile</h3>
          <p className="text-xs text-wagh-muted font-mono-tag">Personal information linked to your account ID</p>
        </div>
        {currentAge !== null && (
          <span className="px-3 py-1.5 rounded-full bg-wagh-teal/10 text-wagh-teal font-mono-tag font-bold text-xs border border-wagh-teal/20 whitespace-nowrap shrink-0 inline-flex items-center shadow-2xs">
            Age: {currentAge} yrs old
          </span>
        )}
      </div>

      {savedSuccess && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl animate-fade-in font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Your profile details have been updated successfully!</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {/* Full Name */}
          <div className="min-w-0">
            <label className="block text-xs font-mono-tag font-bold text-wagh-dark mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <UserCheck className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 shrink-0" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: null }));
                }}
                placeholder="Enter full name"
                className={`w-full min-w-0 pl-9 pr-3 py-2.5 sm:py-3 rounded-xl border text-xs sm:text-sm focus:outline-none focus:ring-2 transition-all ${
                  fieldErrors.name
                    ? 'border-red-500 ring-1 ring-red-500 bg-red-50/20'
                    : 'border-wagh-border focus:ring-wagh-teal'
                }`}
              />
            </div>
            {fieldErrors.name ? (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1 font-mono-tag">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{fieldErrors.name}</span>
              </p>
            ) : (
              <p className="text-[11px] text-wagh-muted mt-1">First & last name (2-60 letters)</p>
            )}
          </div>

          {/* Email Address & Resend SMTP Verification */}
          <div className="min-w-0 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label className="block text-xs font-mono-tag font-bold text-wagh-dark">
                Email Address <span className="text-red-500">*</span>
              </label>

              {/* Status Badge or Verify Button */}
              {isValidEmail && (
                emailVerified ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-mono-tag font-bold inline-flex items-center gap-1 border border-emerald-300 shadow-2xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Verified ✓</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendEmailOtp}
                    disabled={sendingOtp || showOtpBox}
                    className="px-3 py-1 rounded-full bg-wagh-teal text-white text-[11px] font-mono-tag font-bold hover:bg-wagh-teal-dark transition-all shadow-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{sendingOtp ? 'Sending...' : 'Verify Email'}</span>
                  </button>
                )
              )}
            </div>

            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 shrink-0" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  const val = e.target.value;
                  setEmail(val);
                  if (val.trim().toLowerCase() !== originalEmail.trim().toLowerCase() && emailVerified) {
                    setEmailVerified(false);
                  }
                  if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: null }));
                }}
                placeholder="customer@example.com"
                className={`w-full min-w-0 pl-9 pr-3 py-2.5 sm:py-3 rounded-xl border text-xs sm:text-sm focus:outline-none focus:ring-2 transition-all ${
                  fieldErrors.email
                    ? 'border-red-500 ring-1 ring-red-500 bg-red-50/20'
                    : emailVerified
                    ? 'border-emerald-500 ring-1 ring-emerald-500/30 bg-emerald-50/10'
                    : 'border-wagh-border focus:ring-wagh-teal'
                }`}
              />
            </div>

            {fieldErrors.email ? (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1 font-mono-tag">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{fieldErrors.email}</span>
              </p>
            ) : (
              <p className="text-[11px] text-wagh-muted mt-1">
                {emailVerified
                  ? 'Email is verified (Valid for 5 months)'
                  : 'Click Verify Email to receive a 6-digit OTP code via email'}
              </p>
            )}

            {/* Inline Email OTP Input Drawer */}
            {showOtpBox && !emailVerified && (
              <div className="mt-3 p-4 rounded-2xl bg-slate-50 border border-wagh-teal/30 space-y-3 animate-fade-in shadow-inner">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono-tag font-bold text-wagh-dark">
                    Enter 6-Digit OTP sent to {email}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowOtpBox(false);
                      setOtpInput('');
                      setOtpError('');
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded-full"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={otpInput}
                    onChange={(e) => {
                      setOtpInput(e.target.value.replace(/\D/g, ''));
                      if (otpError) setOtpError('');
                    }}
                    placeholder="123456"
                    className="flex-1 px-3 py-2 rounded-xl border border-wagh-border font-mono-tag text-center text-base tracking-widest font-extrabold focus:ring-2 focus:ring-wagh-teal focus:outline-none bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyEmailOtp}
                    disabled={verifyingOtp || otpInput.length !== 6}
                    className="px-4 py-2 rounded-xl bg-wagh-teal text-white text-xs font-bold hover:bg-wagh-teal-dark transition-all disabled:opacity-50 flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>{verifyingOtp ? 'Verifying...' : 'Verify'}</span>
                  </button>
                </div>

                {otpError && (
                  <p className="text-xs text-red-500 flex items-center gap-1 font-mono-tag">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{otpError}</span>
                  </p>
                )}

                <div className="flex items-center justify-between text-[11px] text-wagh-muted pt-1">
                  {countdown > 0 ? (
                    <span>Resend code in <strong>{countdown}s</strong></span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendEmailOtp}
                      disabled={sendingOtp}
                      className="text-wagh-teal hover:underline font-bold font-mono-tag flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Resend Email OTP</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setShowOtpBox(false);
                      setOtpInput('');
                    }}
                    className="hover:underline font-mono-tag text-gray-500 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {/* Mobile Number */}
          <div className="min-w-0 space-y-1">
            <label className="block text-xs font-mono-tag font-bold text-wagh-dark mb-1">
              Mobile Number (10 Digits)
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 shrink-0" />
              <input
                type="tel"
                maxLength={10}
                value={phone}
                onChange={(e) => {
                  const cleanVal = e.target.value.replace(/\D/g, '');
                  setPhone(cleanVal);
                  if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: null }));
                }}
                placeholder="10-digit Indian mobile number"
                className={`w-full min-w-0 pl-9 pr-3 py-2.5 sm:py-3 rounded-xl border text-xs sm:text-sm font-mono-tag focus:outline-none focus:ring-2 transition-all ${
                  fieldErrors.phone
                    ? 'border-red-500 ring-1 ring-red-500 bg-red-50/20'
                    : 'border-wagh-border focus:ring-wagh-teal'
                }`}
              />
            </div>
            {fieldErrors.phone ? (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1 font-mono-tag">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{fieldErrors.phone}</span>
              </p>
            ) : (
              <p className="text-[11px] text-wagh-muted mt-1">Mobile contact number for order updates</p>
            )}
          </div>

          {/* Date of Birth */}
          <div className="min-w-0 space-y-1">
            <label className="block text-xs font-mono-tag font-bold text-wagh-dark mb-1">
              Date of Birth
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 shrink-0" />
              <input
                type="date"
                value={birthdate}
                max={new Date().toISOString().split('T')[0]}
                onChange={(e) => {
                  setBirthdate(e.target.value);
                  if (fieldErrors.birthdate) setFieldErrors((prev) => ({ ...prev, birthdate: null }));
                }}
                className={`w-full min-w-0 pl-9 pr-3 py-2.5 sm:py-3 rounded-xl border text-xs sm:text-sm font-mono-tag focus:outline-none focus:ring-2 transition-all bg-white ${
                  fieldErrors.birthdate
                    ? 'border-red-500 ring-1 ring-red-500 bg-red-50/20'
                    : 'border-wagh-border focus:ring-wagh-teal'
                }`}
              />
            </div>
            {fieldErrors.birthdate ? (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1 font-mono-tag">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{fieldErrors.birthdate}</span>
              </p>
            ) : (
              <p className="text-[11px] text-wagh-muted mt-1">Select date of birth (must be 13+ yrs)</p>
            )}
          </div>
        </div>

        {/* Calculated Age & Gender Identity Section */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center bg-gray-50/70 p-4 sm:p-5 rounded-2xl border border-wagh-border/80">
          {/* Calculated Age */}
          <div className="min-w-0">
            <label className="block text-xs font-mono-tag font-bold text-wagh-dark mb-1">
              Calculated Age
            </label>
            <div className="relative flex items-center min-w-0">
              <Hash className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none shrink-0" />
              <input
                type="text"
                readOnly
                value={currentAge !== null && currentAge !== undefined ? `${currentAge} years old` : 'N/A (Select DOB)'}
                className="w-full min-w-0 pl-9 pr-3 py-2.5 rounded-xl border border-wagh-border text-xs font-mono-tag bg-white text-wagh-dark font-bold cursor-not-allowed truncate"
              />
            </div>
          </div>

          {/* Gender Selector Pills */}
          <div className="sm:col-span-2 space-y-1 min-w-0">
            <label className="block text-xs font-mono-tag font-bold text-wagh-dark mb-1">
              Gender Identity
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'prefer_not_to_say', label: 'Unspecified' },
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
                { value: 'other', label: 'Other' },
              ].map((g) => (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => setGender(g.value)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    gender === g.value
                      ? 'bg-wagh-teal text-white shadow-sm font-bold ring-2 ring-wagh-teal/30'
                      : 'bg-white border border-wagh-border text-wagh-dark hover:bg-gray-100'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-3 border-t border-gray-100">
          <button
            type="submit"
            disabled={!isDirty || saving || Object.keys(fieldErrors).some((k) => fieldErrors[k])}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-wagh-teal text-white font-extrabold text-xs sm:text-sm hover:bg-wagh-teal-dark transition-all duration-200 shadow-md whitespace-nowrap shrink-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Save className="w-4 h-4 shrink-0" />
            <span>{saving ? 'Saving Profile...' : 'Save Profile Changes'}</span>
          </button>

          {!isDirty && (
            <span className="text-xs text-wagh-muted italic text-center sm:text-left">No unsaved changes</span>
          )}
        </div>
      </form>
    </div>
  );
}

export default ProfileDetailsForm;
