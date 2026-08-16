import { z } from 'zod';

// Basic XSS Sanitizer helper (strips HTML and script tags while keeping all safe characters like #, /, comma, etc.)
export const sanitizeText = (val) => {
  if (typeof val !== 'string') return '';
  return val
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();
};

// Profile Details Validation Schema
export const profileDetailsSchema = z.object({
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

  phone: z
    .string()
    .transform((val) => val.replace(/\D/g, ''))
    .pipe(
      z
        .string()
        .min(1, 'Mobile number is required')
        .regex(/^[6-9]\d{9}$/, 'Mobile number must be a valid 10-digit Indian number starting with 6-9')
    ),

  birthdate: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine((val) => {
      if (!val) return true;
      const date = new Date(val);
      if (isNaN(date.getTime())) return false;
      return date <= new Date();
    }, 'Date of birth cannot be in the future')
    .refine((val) => {
      if (!val) return true;
      const dob = new Date(val);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      return age >= 13 && age <= 120;
    }, 'Age derived from birthdate must be between 13 and 120 years'),

  age: z
    .number()
    .int('Age must be an integer')
    .min(13, 'Age must be at least 13 years')
    .max(120, 'Age cannot exceed 120 years')
    .nullable()
    .optional(),

  gender: z
    .enum(['male', 'female', 'other', 'prefer_not_to_say'])
    .optional()
    .default('prefer_not_to_say'),
});

// Address Item Validation Schema
export const addressSchema = z.object({
  label: z
    .string()
    .transform((val) => sanitizeText(val))
    .pipe(
      z
        .string()
        .min(1, 'Address label is required (e.g., Home, Work)')
        .max(30, 'Label cannot exceed 30 characters')
    ),

  line1: z
    .string()
    .transform((val) => sanitizeText(val))
    .pipe(
      z
        .string()
        .min(5, 'Address Line 1 must be at least 5 characters')
        .max(200, 'Address Line 1 cannot exceed 200 characters')
    ),

  line2: z
    .string()
    .transform((val) => sanitizeText(val))
    .pipe(
      z
        .string()
        .max(200, 'Address Line 2 cannot exceed 200 characters')
        .optional()
        .or(z.literal(''))
    ),

  city: z
    .string()
    .transform((val) => sanitizeText(val))
    .pipe(
      z
        .string()
        .min(2, 'City name must be at least 2 characters')
        .max(50, 'City name cannot exceed 50 characters')
    ),

  state: z
    .string()
    .transform((val) => sanitizeText(val))
    .pipe(
      z
        .string()
        .min(2, 'State name must be at least 2 characters')
        .max(50, 'State name cannot exceed 50 characters')
    ),

  pincode: z
    .string()
    .transform((val) => val.replace(/\D/g, ''))
    .pipe(
      z
        .string()
        .regex(/^\d{6}$/, 'Pincode must be exactly 6 digits')
    ),

  isDefault: z.boolean().optional().default(false),
});

// Checkout Shipping Address Validation Schema
export const checkoutShippingAddressSchema = z.object({
  name: z
    .string()
    .transform((val) => sanitizeText(val))
    .pipe(
      z
        .string()
        .min(2, 'Full Name must be at least 2 characters long')
        .max(60, 'Full Name cannot exceed 60 characters')
        .regex(/^[a-zA-Z\s'’\-]+$/, 'Full Name can only contain letters, spaces, apostrophes, and hyphens')
    ),

  phone: z
    .string()
    .transform((val) => val.replace(/\D/g, ''))
    .pipe(
      z
        .string()
        .min(1, 'Phone Number is required')
        .regex(/^[6-9]\d{9}$/, 'Phone Number must be a valid 10-digit Indian mobile number starting with 6-9')
    ),

  line1: z
    .string()
    .transform((val) => sanitizeText(val))
    .pipe(
      z
        .string()
        .min(5, 'Address Line 1 must be at least 5 characters')
        .max(200, 'Address Line 1 cannot exceed 200 characters')
    ),

  line2: z
    .string()
    .transform((val) => sanitizeText(val))
    .pipe(
      z
        .string()
        .max(200, 'Address Line 2 cannot exceed 200 characters')
        .optional()
        .or(z.literal(''))
    ),

  city: z
    .string()
    .transform((val) => sanitizeText(val))
    .pipe(
      z
        .string()
        .min(2, 'City name must be at least 2 characters')
        .max(50, 'City name cannot exceed 50 characters')
    ),

  state: z
    .string()
    .transform((val) => sanitizeText(val))
    .pipe(
      z
        .string()
        .min(2, 'State name must be at least 2 characters')
        .max(50, 'State name cannot exceed 50 characters')
    ),

  pincode: z
    .string()
    .transform((val) => val.replace(/\D/g, ''))
    .pipe(
      z
        .string()
        .regex(/^\d{6}$/, 'Pincode must be exactly 6 digits')
    ),
});

