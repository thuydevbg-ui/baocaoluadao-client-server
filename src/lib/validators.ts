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