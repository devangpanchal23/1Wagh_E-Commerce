import { z } from 'zod';
import { sanitizeText } from './profileSchema';

export const loginSchema = z.object({
  email: z
    .string()
    .transform((val) => sanitizeText(val.trim().toLowerCase()))
    .pipe(
      z
        .string()
        .min(1, 'Email address is required')
        .email('Please enter a valid email address')
    ),

  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters long'),
});

export const registerSchema = z
  .object({
    name: z
      .string()
      .transform((val) => sanitizeText(val))
      .pipe(
        z
          .string()
          .min(2, 'Name must be at least 2 characters long')
          .max(60, 'Name cannot exceed 60 characters')
          .regex(/^[a-zA-Z\s'’\-]+$/, 'Name can only contain letters, spaces, apostrophes, and hyphens')
      ),

    email: z
      .string()
      .transform((val) => sanitizeText(val.trim().toLowerCase()))
      .pipe(
        z
          .string()
          .min(1, 'Email address is required')
          .email('Please enter a valid email address')
      ),

    password: z
      .string()
      .min(1, 'Password is required')
      .min(6, 'Password must be at least 6 characters long'),

    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const verifyOtpSchema = z.object({
  email: z
    .string()
    .transform((val) => sanitizeText(val.trim().toLowerCase()))
    .pipe(z.string().email('Please enter a valid email address')),

  otp: z
    .string()
    .transform((val) => val.trim().replace(/\D/g, ''))
    .pipe(z.string().length(6, 'Verification code must be exactly 6 digits')),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .transform((val) => sanitizeText(val.trim().toLowerCase()))
    .pipe(
      z
        .string()
        .min(1, 'Email address is required')
        .email('Please enter a valid email address')
    ),
});

export const resetPasswordSchema = z
  .object({
    email: z
      .string()
      .transform((val) => sanitizeText(val.trim().toLowerCase()))
      .pipe(z.string().email('Please enter a valid email address')),

    otp: z
      .string()
      .transform((val) => val.trim().replace(/\D/g, ''))
      .pipe(z.string().length(6, 'Verification code must be exactly 6 digits')),

    newPassword: z
      .string()
      .min(1, 'New password is required')
      .min(6, 'Password must be at least 6 characters long'),

    confirmNewPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Passwords do not match',
    path: ['confirmNewPassword'],
  });
