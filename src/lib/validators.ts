/**
 * Zod Validation Schemas
 * Production-grade input validation for baocaoluadao.com
 */

import { z } from 'zod';

/**
 * Report types
 */
export const ReportTypeSchema = z.enum(['website', 'phone', 'email', 'social', 'sms', 'bank']);
export type ReportType = z.infer<typeof ReportTypeSchema>;

/**
 * Report sources
 */
export const ReportSourceSchema = z.enum(['community', 'auto_scan', 'manual']);
export type ReportSource = z.infer<typeof ReportSourceSchema>;

/**
 * Report status
 */
export const ReportStatusSchema = z.enum(['pending', 'processing', 'verified', 'rejected', 'completed']);
export type ReportStatus = z.infer<typeof ReportStatusSchema>;

/**
 * Report submission schema
 */
export const ReportSubmissionSchema = z.object({
  type: ReportTypeSchema,
  target: z.string()
    .min(3, 'Mục tiêu phải có ít nhất 3 ký tự')
    .max(500, 'Mục tiêu không được quá 500 ký tự'),
  description: z.string()
    .min(10, 'Mô tả phải có ít nhất 10 ký tự')
    .max(2000, 'Mô tả không được quá 2000 ký tự'),
  name: z.string()
    .max(80, 'Tên không được quá 80 ký tự')
    .optional()
    .nullable(),
  email: z.string()
    .email('Định chỉ email không hợp lệ')
    .max(120, 'Email không được quá 120 ký tự')
    .optional()
    .nullable(),
  phone: z.string()
    .regex(/^[\d\s+().-]{7,20}$/, 'Số điện thoại không hợp lệ')
    .optional()
    .nullable(),
});

export type ReportSubmission = z.infer<typeof ReportSubmissionSchema>;

/**
 * Report query params schema
 */
export const ReportQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  status: ReportStatusSchema.optional(),
  type: ReportTypeSchema.optional(),
  search: z.string().optional(),
});

export type ReportQuery = z.infer<typeof ReportQuerySchema>;

/**
 * Report update schema (admin)
 */
export const ReportUpdateSchema = z.object({
  status: ReportStatusSchema.optional(),
  adminNotes: z.string()
    .max(1000, 'Ghi chú không được quá 1000 ký tự')
    .optional()
    .nullable(),
});

export type ReportUpdate = z.infer<typeof ReportUpdateSchema>;

/**
 * Sanitize string input - remove potentially dangerous characters
 */
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
}

/**
 * Normalize website URL
 */
export function normalizeWebsiteUrl(url: string): string {
  let normalized = url.trim().toLowerCase();
  
  // Add protocol if missing
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = 'https://' + normalized;
  }
  
  // Remove trailing slash
  normalized = normalized.replace(/\/$/, '');
  
  return normalized;
}

/**
 * Normalize phone number
 */
export function normalizePhone(phone: string): string {
  return phone
    .replace(/[^0-9+()-\s]/g, '') // Keep only valid phone characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Normalize email
 */
export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

// ============================================
// AUTH VALIDATION SCHEMAS
// ============================================

/**
 * Password validation schema
 * Requirements: min 8 chars, uppercase, number, special char
 */
export const PasswordSchema = z.string()
  .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
  .max(128, 'Mật khẩu không được quá 128 ký tự')
  .refine(
    (password) => /[A-Z]/.test(password),
    'Mật khẩu phải chứa ít nhất một chữ cái in hoa'
  )
  .refine(
    (password) => /[0-9]/.test(password),
    'Mật khẩu phải chứa ít nhất một số'
  )
  .refine(
    (password) => /[!@#$%^&*(),.?":{}|<>]/.test(password),
    'Mật khẩu nên chứa ít nhất một ký tự đặc biệt'
  );

export type Password = z.infer<typeof PasswordSchema>;

/**
 * Login request schema
 */
export const LoginSchema = z.object({
  email: z.string()
    .email('Địa chỉ email không hợp lệ')
    .max(254, 'Email không được quá 254 ký tự'),
  password: z.string()
    .min(1, 'Mật khẩu là bắt buộc')
    .max(128, 'Mật khẩu không được quá 128 ký tự'),
  rememberMe: z.boolean().optional(),
});

export type LoginRequest = z.infer<typeof LoginSchema>;

/**
 * Registration request schema
 */
export const RegisterSchema = z.object({
  name: z.string()
    .min(2, 'Tên phải có ít nhất 2 ký tự')
    .max(80, 'Tên không được quá 80 ký tự'),
  email: z.string()
    .email('Địa chỉ email không hợp lệ')
    .max(254, 'Email không được quá 254 ký tự'),
  password: PasswordSchema,
  confirmPassword: z.string(),
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  }
);

export type RegisterRequest = z.infer<typeof RegisterSchema>;

/**
 * Validate password strength and return result
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (password.length < 8) {
    errors.push('Mật khẩu phải có ít nhất 8 ký tự');
  } else if (password.length < 12) {
    warnings.push('Mật khẩu nên có ít nhất 12 ký tự để tăng cường bảo mật');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Mật khẩu phải chứa ít nhất một chữ cái thường');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Mật khẩu phải chứa ít nhất một chữ cái in hoa');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Mật khẩu phải chứa ít nhất một số');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    warnings.push('Mật khẩu nên chứa ít nhất một ký tự đặc biệt (!@#$%^&*...)');
  }
  
  // Check for common patterns
  const commonPatterns = [
    /^[a-zA-Z]+$/,
    /^[0-9]+$/,
    /(.)\1{2,}/,
    /^(password|123456|qwerty)/i,
  ];
  
  for (const pattern of commonPatterns) {
    if (pattern.test(password)) {
      warnings.push('Tránh sử dụng các mẫu phổ biến trong mật khẩu');
      break;
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate and normalize report target based on type
 */
export function normalizeTarget(type: ReportType, target: string): string {
  switch (type) {
    case 'website':
      return normalizeWebsiteUrl(target);
    case 'phone':
      return normalizePhone(target);
    case 'email':
      return normalizeEmail(target);
    default:
      return target.trim();
  }
}