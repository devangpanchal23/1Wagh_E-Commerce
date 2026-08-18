import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useToast } from './ToastContext';
import { fetchApi, setAccessToken, getAccessToken } from '../api';

const AuthContext = createContext();

const normalizeBirthdate = (value) => {
  if (!value) return '';
  const str = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  const parsed = new Date(str);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().slice(0, 10);
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessTokenState, setAccessTokenState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const { addToast } = useToast();

  const updateTokenState = useCallback((token) => {
    setAccessToken(token);
    setAccessTokenState(token);
  }, []);

  // Silent session refresh on mount using httpOnly cookie
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await fetchApi('/auth/refresh', { method: 'POST' });
        if (isMounted && res && res.success && res.accessToken) {
          updateTokenState(res.accessToken);
          setUser(res.user);
        }
      } catch (_) {
        if (isMounted) {
          updateTokenState(null);
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [updateTokenState]);

  const login = async (email, password) => {
    try {
      const res = await fetchApi('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (res && res.success && res.accessToken) {
        updateTokenState(res.accessToken);
        setUser(res.user);
        addToast('Logged in successfully!', 'success');
        return { success: true, user: res.user };
      }
      return { success: false, message: res?.message || 'Login failed' };
    } catch (err) {
      addToast(err.message || 'Invalid credentials', 'error');
      return { success: false, message: err.message };
    }
  };

  const register = async (name, email, password) => {
    try {
      const res = await fetchApi('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });

      if (res && res.success) {
        addToast(res.message || 'Registration successful! Please check your email for the OTP.', 'success');
        return { success: true, email: res.email, devOtp: res.devOtp };
      }
      return { success: false, message: res?.message || 'Registration failed' };
    } catch (err) {
      addToast(err.message || 'Registration failed', 'error');
      return { success: false, message: err.message };
    }
  };

  const verifyOtp = async (email, otp) => {
    try {
      const res = await fetchApi('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ email, otp }),
      });

      if (res && res.success) {
        addToast(res.message || 'Email verified successfully! You can now log in.', 'success');
        return { success: true };
      }
      return { success: false, message: res?.message || 'OTP verification failed' };
    } catch (err) {
      addToast(err.message || 'Verification failed', 'error');
      return { success: false, message: err.message };
    }
  };

  const forgotPassword = async (email) => {
    try {
      const res = await fetchApi('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });

      if (res && res.success) {
        addToast(res.message || 'Password reset OTP sent to your email.', 'success');
        return { success: true, devOtp: res.devOtp };
      }
      return { success: false, message: res?.message || 'Failed to send reset code' };
    } catch (err) {
      addToast(err.message || 'Request failed', 'error');
      return { success: false, message: err.message };
    }
  };

  const resetPassword = async (email, otp, newPassword) => {
    try {
      const res = await fetchApi('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email, otp, newPassword }),
      });

      if (res && res.success) {
        addToast('Password reset successful! You can now log in.', 'success');
        return { success: true };
      }
      return { success: false, message: res?.message || 'Failed to reset password' };
    } catch (err) {
      addToast(err.message || 'Password reset failed', 'error');
      return { success: false, message: err.message };
    }
  };

  const logout = async () => {
    try {
      await fetchApi('/auth/logout', { method: 'POST' }).catch(() => {});
      updateTokenState(null);
      setUser(null);
      addToast('Logged out successfully', 'info');
    } catch (err) {
      updateTokenState(null);
      setUser(null);
    }
  };

  const refreshProfile = useCallback(async () => {
    if (!getAccessToken()) return { success: false };
    setProfileLoading(true);
    try {
      const res = await fetchApi('/auth/profile');
      if (res && res.success && res.data) {
        setUser((prev) => ({ ...prev, ...res.data }));
        setProfileError(null);
        return { success: true, data: res.data };
      }
      return { success: false };
    } catch (err) {
      setProfileError(err.message);
      return { success: false, message: err.message };
    } finally {
      setProfileLoading(false);
    }
  }, []);

  const updateUserProfile = async (updatedData) => {
    try {
      const res = await fetchApi('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({
          name: updatedData.displayName || updatedData.name,
          email: updatedData.email,
          mobileNumber: updatedData.phone || updatedData.mobileNumber || updatedData.phoneNumber,
          birthdate: updatedData.birthdate,
          age: updatedData.age,
          gender: updatedData.gender,
          addresses: updatedData.addresses,
        }),
      });

      if (res && res.success && res.data) {
        setUser((prev) => ({ ...prev, ...res.data }));
        addToast('Profile updated successfully!', 'success');
        return { success: true, data: res.data };
      }
      return { success: false, message: res?.message || 'Failed to update profile' };
    } catch (err) {
      addToast(err.message || 'Update failed', 'error');
      return { success: false, message: err.message };
    }
  };

  const sendPhoneOtp = async (phoneNum) => {
    try {
      const res = await fetchApi('/auth/phone/send-otp', {
        method: 'POST',
        body: JSON.stringify({ phone: phoneNum }),
      });
      return res;
    } catch (err) {
      return { success: false, message: err.message || 'Failed to send OTP' };
    }
  };

  const verifyPhoneOtp = async (otpCode) => {
    try {
      const res = await fetchApi('/auth/phone/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ otp: otpCode }),
      });
      if (res && res.success) {
        setUser((prev) => prev ? { ...prev, phoneVerified: true, mobileNumber: res.data?.mobileNumber || prev.mobileNumber } : prev);
      }
      return res;
    } catch (err) {
      return { success: false, message: err.message || 'Failed to verify OTP' };
    }
  };

  const sendEmailOtp = async (targetEmail) => {
    try {
      const res = await fetchApi('/auth/email/send-otp', {
        method: 'POST',
        body: JSON.stringify({ email: targetEmail }),
      });
      return res;
    } catch (err) {
      return { success: false, message: err.message || 'Failed to send OTP email' };
    }
  };

  const verifyEmailOtp = async (otpCode) => {
    try {
      const res = await fetchApi('/auth/email/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ otp: otpCode }),
      });
      if (res && res.success) {
        setUser((prev) => prev ? { ...prev, emailVerified: true, isVerified: true } : prev);
      }
      return res;
    } catch (err) {
      return { success: false, message: err.message || 'Failed to verify email OTP' };
    }
  };

  const resendEmailVerification = async () => {
    if (!user?.email) return;
    try {
      const res = await sendEmailOtp(user.email);
      if (res?.success) {
        addToast(`Verification code sent to ${user.email}`, 'info');
      }
    } catch (err) {
      addToast(err.message || 'Failed to resend code', 'error');
    }
  };

  const userProfile = user
    ? {
        ...user,
        uid: user._id,
        id: user._id,
        displayName: user.name,
        phoneNumber: user.mobileNumber || '',
        phone: user.mobileNumber || '',
        birthdate: normalizeBirthdate(user.birthdate),
        emailVerified: !!(user.emailVerified || user.isVerified),
      }
    : null;

  return (
    <AuthContext.Provider
      value={{
        user: userProfile,
        role: userProfile?.role || 'customer',
        isLoaded: !isLoading,
        isSignedIn: !!userProfile,
        isAuthenticated: !!userProfile,
        isAdmin: userProfile?.role === 'admin',
        loading: isLoading,
        profileLoading,
        profileError,
        accessToken: accessTokenState,
        login,
        register,
        verifyOtp,
        forgotPassword,
        resetPassword,
        logout,
        refreshProfile,
        updateUserProfile,
        updateProfile: updateUserProfile,
        sendPhoneOtp,
        verifyPhoneOtp,
        sendEmailOtp,
        verifyEmailOtp,
        resendEmailVerification,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
